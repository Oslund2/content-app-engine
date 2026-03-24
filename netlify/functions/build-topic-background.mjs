// Background function — Full topic build pipeline (15-min timeout)
// Triggered by build-topic.mjs
//
// Stage 1: Topic design (Claude)
// Stage 2: Source discovery (Google News + RSS)
// Stage 3: Article selection (Claude)
// Stage 4: Story-app generation for each selected article
// Stage 5: Topic assembly + confidence-based auto-publish

import { callAnthropic, parseJson, sbQuery, slugify, stripHtml, processItem } from './lib/pipeline.mjs'
import { discoverArticles, fetchArticle } from './lib/web-search.mjs'

var AUTO_PUBLISH_THRESHOLD = 72

// ─── Stage 1: Topic Design ──────────────────────────────────────────────────

var TOPIC_DESIGN_SYSTEM = `You are an editorial strategist at WCPO Cincinnati. You design Deep Dive topic pages — curated collections of interactive Story-Apps that explore a topic from every angle.

Given a topic description, produce a topic page design. Be specific to Cincinnati when possible.

Respond with ONLY a JSON object:
{
  "title": "Compelling 3-8 word title",
  "subtitle": "1-2 sentence description of why this matters to Cincinnati readers",
  "accent_color": "#hex (choose a color that fits the topic mood — red for crisis, blue for policy, green for environment, etc.)",
  "hero_stats": [
    {"value": "stat", "label": "Label", "sub": "context"}
  ],
  "search_keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "story_angles": [
    {"angle": "The personal cost angle", "search_query": "housing costs Cincinnati families"},
    {"angle": "The policy angle", "search_query": "Cincinnati housing policy zoning"},
    {"angle": "The data/comparison angle", "search_query": "Cincinnati rent prices vs national average"},
    {"angle": "The human story angle", "search_query": "Cincinnati neighborhood gentrification residents"},
    {"angle": "The future/solutions angle", "search_query": "Cincinnati affordable housing solutions"}
  ],
  "poll_question": "Community poll question for readers",
  "timeline_events": [
    {"date": "2024-01", "label": "Key event", "description": "Brief context"}
  ]
}`

// ─── Stage 3: Article Selection ─────────────────────────────────────────────

var SELECTION_SYSTEM = `You are an editorial curator at WCPO Cincinnati. You select articles for a Deep Dive topic page.

RULES:
1. Pick 4-6 articles that cover DIFFERENT angles of the topic. No two should tell the same story.
2. Prefer articles with data, numbers, or personal stories (these make the best interactive Story-Apps).
3. Prefer articles with a Cincinnati/Ohio connection, but national stories are fine if locally relevant.
4. Pick from DIFFERENT sources when possible (don't pick 3 from NPR).
5. Every article must have strong interactive potential — it should be possible to build a calculator, quiz, planner, or explorer from it.

Respond with ONLY a JSON object:
{
  "selected": [
    {
      "index": 1,
      "title": "article title",
      "source": "source name",
      "angle": "What unique angle does this article bring?",
      "interactive_idea": "What interactive Story-App would you build from this?",
      "app_type": "safety-assessment|impact-calculator|event-planner|data-explorer|eligibility-checker|tracker|investigation",
      "confidence": 0-100
    }
  ],
  "topic_insights": "1-2 sentences on what the articles collectively reveal about this topic"
}`

// ─── Main Handler ───────────────────────────────────────────────────────────

export default async (req) => {
  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    return
  }

  var payload
  try {
    payload = await req.json()
  } catch {
    console.error('Invalid JSON payload')
    return
  }

  var topicDescription = payload.topic
  var topicSlug = payload.topicSlug
  var design = payload.topicDesign

  if (!topicDescription) {
    // Legacy format: already has selectedArticles
    if (topicSlug && payload.selectedArticles) {
      await processSelectedArticles(payload, apiKey, supabaseUrl, supabaseKey)
      return
    }
    console.error('No topic description provided')
    return
  }

  console.log('=== BUILD TOPIC BACKGROUND: "' + topicDescription + '" (slug: ' + topicSlug + ') ===')

  try {
    // If design wasn't passed, generate it
    if (!design) {
      console.log('Stage 1: Designing topic...')
      var designText = await callAnthropic(apiKey, 'claude-sonnet-4-6',
        TOPIC_DESIGN_SYSTEM,
        'Design a Deep Dive topic page for WCPO Cincinnati on:\n\n' + topicDescription,
        1500)
      design = parseJson(designText)
    }
    console.log('Topic: "' + design.title + '" — ' + (design.story_angles || []).length + ' angles')

    // If topicSlug wasn't passed, create the topic
    if (!topicSlug) {
      topicSlug = slugify(design.title)
      var topicRow = {
        slug: topicSlug,
        title: design.title,
        subtitle: design.subtitle,
        accent_color: design.accent_color || '#dc2626',
        hero_stats: design.hero_stats || [],
        poll_question: design.poll_question || null,
        timeline_events: design.timeline_events || [],
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      await sbQuery(supabaseUrl, supabaseKey, 'topics', 'POST', topicRow)
      console.log('Topic created: ' + topicSlug)
    }

    // Stage 2: Source Discovery
    console.log('Stage 2: Discovering sources...')
    var allArticles = await discoverArticles(topicDescription, design.search_keywords || [])

    // Also search specific angles
    var searchQueries = (design.story_angles || []).map(function(a) { return a.search_query })
    var angleResults = await Promise.all(
      searchQueries.slice(0, 3).map(function(q) {
        return discoverArticles(q, [])
      })
    )
    var seen = new Set(allArticles.map(function(a) { return a.url }))
    angleResults.flat().forEach(function(a) {
      if (!seen.has(a.url)) {
        seen.add(a.url)
        allArticles.push(a)
      }
    })
    console.log('Total unique articles discovered: ' + allArticles.length)

    if (allArticles.length === 0) {
      console.error('No articles found for topic')
      return
    }

    // Stage 3: Article Selection
    console.log('Stage 3: Selecting articles...')
    var articleList = allArticles.map(function(a, i) {
      return (i + 1) + '. [' + a.source + '] ' + a.title +
        (a.description ? ' — ' + a.description.slice(0, 100) : '') +
        ' (URL: ' + a.url + ')'
    }).join('\n')

    var selPrompt = 'TOPIC: ' + design.title + '\n' +
      'SUBTITLE: ' + (design.subtitle || '') + '\n' +
      'DESIRED ANGLES:\n' + (design.story_angles || []).map(function(a) { return '- ' + a.angle }).join('\n') + '\n\n' +
      'AVAILABLE ARTICLES (' + allArticles.length + '):\n' + articleList

    var selText = await callAnthropic(apiKey, 'claude-sonnet-4-6', SELECTION_SYSTEM, selPrompt, 1500)
    var selection = parseJson(selText)
    console.log('Selected ' + selection.selected.length + ' articles')

    // Resolve URLs
    var selectedWithUrls = selection.selected.map(function(sel) {
      var idx = (sel.index || 1) - 1
      if (idx < 0 || idx >= allArticles.length) idx = 0
      var article = allArticles[idx]
      return {
        ...sel,
        url: article.url,
        domain: article.domain,
        source: sel.source || article.source,
      }
    }).filter(function(sel) { return sel.url })

    // Stage 4: Process each selected article into a story-app
    await processSelectedArticles({
      topicSlug: topicSlug,
      topicDesign: design,
      selectedArticles: selectedWithUrls,
      topicInsights: selection.topic_insights,
    }, apiKey, supabaseUrl, supabaseKey)

  } catch (err) {
    console.error('build-topic-background error:', err)
  }
}

// ─── Stage 4 & 5: Generate story-apps and assemble topic ────────────────────

async function processSelectedArticles(payload, apiKey, supabaseUrl, supabaseKey) {
  var topicSlug = payload.topicSlug
  var selectedArticles = payload.selectedArticles || []

  console.log('\n=== GENERATING ' + selectedArticles.length + ' STORY-APPS for "' + topicSlug + '" ===')

  var results = []
  var publishedCount = 0

  for (var i = 0; i < selectedArticles.length; i++) {
    var selected = selectedArticles[i]
    console.log('\n--- Article ' + (i + 1) + '/' + selectedArticles.length + ': ' + (selected.title || '').slice(0, 60) + ' ---')

    try {
      // Fetch article
      console.log('Fetching: ' + selected.url)
      var article = await fetchArticle(selected.url)

      if (!article || article.content.length < 100) {
        console.log('SKIP: Article too short or failed to fetch')
        results.push({ title: selected.title, error: 'Failed to fetch', url: selected.url })
        continue
      }

      // Insert rss_item
      var rssItem = {
        guid: article.finalUrl || selected.url,
        feed_name: 'topic-builder',
        title: article.title || selected.title,
        link: article.finalUrl || selected.url,
        description: article.description || article.content.slice(0, 300),
        content_encoded: article.rawHtml || article.content,
        author: article.author || '',
        pub_date: new Date().toISOString(),
        source_type: 'external',
        processed: false,
        worthiness_score: selected.confidence || 75,
        source_url: article.finalUrl || selected.url,
        source_name: article.siteName || selected.source,
        source_author: article.author || null,
        topic_slug: topicSlug,
      }

      var inserted
      try {
        inserted = await sbQuery(supabaseUrl, supabaseKey, 'rss_items', 'POST', rssItem)
        if (Array.isArray(inserted) && inserted.length > 0) inserted = inserted[0]
      } catch (err) {
        var existing = await sbQuery(supabaseUrl, supabaseKey,
          'rss_items?guid=eq.' + encodeURIComponent(rssItem.guid) + '&limit=1', 'GET')
        if (existing && existing.length > 0) {
          inserted = existing[0]
          await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + inserted.id, 'PATCH', {
            topic_slug: topicSlug, processed: false,
          }).catch(function() {})
        } else {
          console.error('DB insert failed: ' + err.message)
          results.push({ title: selected.title, error: 'DB error' })
          continue
        }
      }

      // Process through pipeline
      inserted.source_url = rssItem.source_url
      inserted.source_name = rssItem.source_name
      inserted.source_author = rssItem.source_author
      inserted.topic_slug = topicSlug

      console.log('Processing through pipeline...')
      var result = await processItem(inserted, apiKey, supabaseUrl, supabaseKey, { skipSensitivity: false })

      await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + inserted.id, 'PATCH', { processed: true }).catch(function() {})

      if (result.skipped) {
        console.log('SKIP: ' + (result.reason || 'Score too low'))
        results.push({ title: selected.title, skipped: true, reason: result.reason })
        continue
      }

      // Confidence threshold for auto-publish
      var confidence = selected.confidence || 50
      if (confidence >= AUTO_PUBLISH_THRESHOLD) {
        await sbQuery(supabaseUrl, supabaseKey,
          'generated_stories?story_id=eq.' + result.storyId, 'PATCH',
          { status: 'published', publish_date: new Date().toISOString().split('T')[0] }
        ).catch(function(err) { console.error('Auto-publish failed:', err.message) })
        publishedCount++
        console.log('AUTO-PUBLISHED (confidence: ' + confidence + ')')
      } else {
        console.log('DRAFT (confidence: ' + confidence + ')')
      }

      results.push({
        title: selected.title,
        storyId: result.storyId,
        appType: result.appType,
        confidence: confidence,
        autoPublished: confidence >= AUTO_PUBLISH_THRESHOLD,
      })

    } catch (err) {
      console.error('FAILED: ' + err.message)
      results.push({ title: selected.title, error: err.message })
    }
  }

  // Auto-publish topic if 3+ stories published
  if (publishedCount >= 3) {
    await sbQuery(supabaseUrl, supabaseKey, 'topics?slug=eq.' + topicSlug, 'PATCH', {
      status: 'published', updated_at: new Date().toISOString(),
    }).catch(function() {})
    console.log('\nTOPIC AUTO-PUBLISHED (' + publishedCount + ' stories)')
  } else {
    console.log('\nTopic stays draft (' + publishedCount + ' published, need 3+)')
  }

  console.log('\n=== RESULTS ===')
  results.forEach(function(r) {
    if (r.error) console.log('  FAIL: ' + r.title + ' — ' + r.error)
    else if (r.skipped) console.log('  SKIP: ' + r.title)
    else console.log('  OK: ' + r.storyId + ' [' + r.appType + '] ' + (r.autoPublished ? 'PUBLISHED' : 'draft'))
  })
  console.log('=== BUILD TOPIC COMPLETE ===')
}
