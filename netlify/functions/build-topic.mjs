// Netlify function — Automated Topic Page Builder
// POST /api/build-topic { topic: "Cincinnati housing affordability" }
//
// Does stages 1-3 in this sync function (fast with Haiku):
//   1. Topic design
//   2. Source discovery (Google News + RSS)
//   3. Article selection
//   4. Insert selected articles as rss_items with topic_slug
//   5. Trigger existing process-invoke-background to generate story-apps
//
// The proven RSS pipeline handles the slow story generation.

import { callAnthropic, parseJson, sbQuery, slugify, stripHtml, extractArticleMeta } from './lib/pipeline.mjs'
import { discoverArticles, fetchArticle } from './lib/web-search.mjs'

// ─── Stage 1: Topic Design (Haiku — fast) ───────────────────────────────────

var TOPIC_DESIGN_SYSTEM = `You are an editorial strategist at WCPO Cincinnati. You design Deep Dive topic pages — curated collections of interactive Story-Apps that explore a topic from every angle.

Given a topic description, produce a topic page design. Be specific to Cincinnati when possible.

IMPORTANT: Do NOT include hero_stats. Statistics must come from verified source articles, not from your training data. Leave hero_stats as an empty array.

Respond with ONLY a JSON object:
{
  "title": "Compelling 3-8 word title",
  "subtitle": "1-2 sentence description of why this matters to Cincinnati readers",
  "accent_color": "#hex (choose a color that fits the topic mood — red for crisis, blue for policy, green for environment, etc.)",
  "hero_stats": [],
  "search_keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "story_angles": [
    {"angle": "angle description", "search_query": "search query for this angle"}
  ],
  "poll_question": "Community poll question for readers"
}`

// ─── Stage 3: Article Selection (Haiku — fast) ─────────────────────────────

var SELECTION_SYSTEM = `You are an editorial curator at WCPO Cincinnati. You select articles for a Deep Dive topic page.

RULES:
1. Pick 4-6 articles that cover DIFFERENT angles of the topic. No two should tell the same story.
2. Prefer articles with data, numbers, or personal stories (best for interactive Story-Apps).
3. Prefer articles with a Cincinnati/Ohio connection, but national stories are fine if locally relevant.
4. Pick from DIFFERENT sources when possible.
5. Every article must have strong interactive potential — calculators, quizzes, planners, or explorers.

Respond with ONLY a JSON object:
{
  "selected": [
    {
      "index": 1,
      "title": "article title",
      "source": "source name",
      "angle": "What unique angle does this bring?",
      "app_type": "safety-assessment|impact-calculator|event-planner|data-explorer|eligibility-checker|tracker|investigation",
      "confidence": 0-100
    }
  ]
}`

// ─── Main Handler ───────────────────────────────────────────────────────────

export default async (req) => {
  var headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' }
  if (req.method === 'OPTIONS') return new Response('', { headers })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'POST required' }), { status: 405, headers })

  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500, headers })
  }

  try {
    var body = await req.json()
    var topicDescription = body.topic
    if (!topicDescription || topicDescription.length < 5) {
      return new Response(JSON.stringify({ error: 'Provide a topic description (at least 5 chars)' }), { status: 400, headers })
    }

    console.log('=== BUILD TOPIC: "' + topicDescription + '" ===')

    // ── Stage 1: Topic Design (Haiku, ~2s) ──
    console.log('Stage 1: Designing topic...')
    var designText = await callAnthropic(apiKey, 'claude-haiku-4-5-20251001',
      TOPIC_DESIGN_SYSTEM,
      'Design a Deep Dive topic page for WCPO Cincinnati on:\n\n' + topicDescription,
      1200)
    var design = parseJson(designText)
    console.log('Designed: "' + design.title + '" with ' + (design.story_angles || []).length + ' angles')

    // ── Stage 2: Source Discovery (~3-5s) ──
    console.log('Stage 2: Discovering sources...')
    var allArticles = await discoverArticles(topicDescription, design.search_keywords || [])

    // Search one extra angle query for breadth
    if (design.story_angles && design.story_angles.length > 0) {
      try {
        var extraArticles = await discoverArticles(design.story_angles[0].search_query, [])
        var seen = new Set(allArticles.map(function(a) { return a.url }))
        extraArticles.forEach(function(a) {
          if (!seen.has(a.url)) { seen.add(a.url); allArticles.push(a) }
        })
      } catch (e) { console.log('Extra search failed: ' + e.message) }
    }

    console.log('Found ' + allArticles.length + ' articles')

    if (allArticles.length === 0) {
      return new Response(JSON.stringify({
        error: 'No scrapable articles found. Try a broader topic or different wording.',
      }), { status: 404, headers })
    }

    // ── Stage 3: Article Selection (Haiku, ~2s) ──
    console.log('Stage 3: Selecting articles...')
    var articleList = allArticles.slice(0, 25).map(function(a, i) {
      return (i + 1) + '. [' + a.source + '] ' + a.title +
        (a.description ? ' — ' + a.description.slice(0, 80) : '')
    }).join('\n')

    var selPrompt = 'TOPIC: ' + design.title + '\nANGLES:\n' +
      (design.story_angles || []).map(function(a) { return '- ' + a.angle }).join('\n') +
      '\n\nARTICLES (' + Math.min(allArticles.length, 25) + '):\n' + articleList

    var selText = await callAnthropic(apiKey, 'claude-haiku-4-5-20251001', SELECTION_SYSTEM, selPrompt, 1000)
    var selection = parseJson(selText)
    var selected = selection.selected || []
    console.log('Selected ' + selected.length + ' articles')

    // ── Stage 4: Create topic + insert rss_items ──
    var topicSlug = slugify(design.title)
    var now = new Date().toISOString()

    // Upsert topic — if slug exists, update it (replaces previous build)
    var topicBody = {
      slug: topicSlug,
      title: design.title,
      subtitle: design.subtitle,
      accent_color: design.accent_color || '#dc2626',
      hero_stats: design.hero_stats || [],
      poll_question: design.poll_question || null,
      timeline_events: [],
      status: 'draft',
      updated_at: now,
    }
    // Use on_conflict=slug so duplicate slugs update instead of error
    var topicRes = await fetch(supabaseUrl + '/rest/v1/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({ ...topicBody, created_at: now }),
    })
    if (!topicRes.ok) {
      var topicErr = await topicRes.text()
      console.error('Topic upsert error: ' + topicErr)
      // If it's a duplicate, that's fine — we'll reuse the existing topic
      if (!topicErr.includes('23505')) {
        throw new Error('Topic creation failed: ' + topicErr.slice(0, 200))
      }
      // Update existing topic
      await sbQuery(supabaseUrl, supabaseKey, 'topics?slug=eq.' + topicSlug, 'PATCH', topicBody)
    }
    console.log('Topic ready: ' + topicSlug)

    // Fetch each selected article and insert as rss_item
    var inserted = 0
    var errors = []
    for (var i = 0; i < selected.length; i++) {
      var sel = selected[i]
      var idx = (sel.index || 1) - 1
      if (idx < 0 || idx >= allArticles.length) idx = 0
      var articleRef = allArticles[idx]

      try {
        // Quick fetch of the article HTML
        var article = await fetchArticle(articleRef.url)
        if (!article || article.content.length < 100) {
          console.log('Skip (too short): ' + articleRef.title.slice(0, 40))
          errors.push(articleRef.title.slice(0, 40) + ': too short')
          continue
        }

        // Insert as rss_item (ignore duplicates — same URL may have been queued before)
        var rssRes = await fetch(supabaseUrl + '/rest/v1/rss_items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': 'Bearer ' + supabaseKey,
            'Prefer': 'resolution=ignore-duplicates,return=representation',
          },
          body: JSON.stringify({
          guid: article.finalUrl || articleRef.url,
          feed_name: 'topic-builder',
          title: article.title || articleRef.title,
          link: article.finalUrl || articleRef.url,
          description: article.description || article.content.slice(0, 300),
          content_encoded: article.rawHtml || article.content,
          author: article.author || '',
          pub_date: new Date().toISOString(),
          source_type: 'external',
          processed: false,
          worthiness_score: sel.confidence || 75,
          source_url: article.finalUrl || articleRef.url,
          source_name: article.siteName || articleRef.source || '',
          source_author: article.author || null,
          topic_slug: topicSlug,
        }),
        })
        // Count as inserted even if it was a duplicate (ignore-duplicates returns empty array)
        if (rssRes.ok) {
          // For duplicates, reset processed so pipeline picks it up again
          var guid = encodeURIComponent(article.finalUrl || articleRef.url)
          await fetch(supabaseUrl + '/rest/v1/rss_items?guid=eq.' + guid, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': 'Bearer ' + supabaseKey,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ processed: false, topic_slug: topicSlug, worthiness_score: sel.confidence || 75 }),
          })
          inserted++
          console.log('Queued (' + inserted + '): ' + (article.title || '').slice(0, 50))
        } else {
          console.log('RSS insert failed: ' + (await rssRes.text()).slice(0, 100))
        }
      } catch (err) {
        console.log('Insert error: ' + err.message)
        errors.push((articleRef.title || '').slice(0, 40) + ': ' + err.message.slice(0, 50))
      }
    }

    console.log('Inserted ' + inserted + ' rss_items for topic ' + topicSlug)

    // Return immediately — frontend will drive processing via /api/process-invoke calls
    return new Response(JSON.stringify({
      success: true,
      topicSlug: topicSlug,
      design: design,
      articlesQueued: inserted,
      errors: errors,
      message: 'Topic "' + design.title + '" created with ' + inserted + ' articles queued. Generating story-apps now...',
      topic: topicDescription,
    }), { headers })

  } catch (err) {
    console.error('build-topic error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
}

export var config = { path: '/api/build-topic' }
