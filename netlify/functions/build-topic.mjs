// Netlify function — Automated Topic Page Builder
// POST /api/build-topic { topic: "Cincinnati housing affordability" }
//
// Stage 1: Topic design (Claude) — title, subtitle, angles, keywords
// Stage 2: Source discovery — Google News + RSS feeds + WCPO
// Stage 3: Article selection (Claude) — pick 4-6 best diverse articles
// Returns immediately with topic metadata + selected articles, triggers background processing

import { callAnthropic, parseJson, sbQuery, slugify } from './lib/pipeline.mjs'
import { discoverArticles } from './lib/web-search.mjs'

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

async function designTopic(apiKey, topicDescription) {
  var text = await callAnthropic(apiKey, 'claude-sonnet-4-6',
    TOPIC_DESIGN_SYSTEM,
    'Design a Deep Dive topic page for WCPO Cincinnati on:\n\n' + topicDescription,
    1500)
  return parseJson(text)
}

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

async function selectArticles(apiKey, topicDesign, articles) {
  var articleList = articles.map(function(a, i) {
    return (i + 1) + '. [' + a.source + '] ' + a.title +
      (a.description ? ' — ' + a.description.slice(0, 100) : '') +
      ' (URL: ' + a.url + ')'
  }).join('\n')

  var prompt = 'TOPIC: ' + topicDesign.title + '\n' +
    'SUBTITLE: ' + topicDesign.subtitle + '\n' +
    'DESIRED ANGLES:\n' + topicDesign.story_angles.map(function(a) { return '- ' + a.angle }).join('\n') + '\n\n' +
    'AVAILABLE ARTICLES (' + articles.length + '):\n' + articleList

  var text = await callAnthropic(apiKey, 'claude-sonnet-4-6', SELECTION_SYSTEM, prompt, 1500)
  return parseJson(text)
}

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

    // Stage 1: Topic Design
    console.log('Stage 1: Designing topic...')
    var design = await designTopic(apiKey, topicDescription)
    console.log('Topic: "' + design.title + '" — ' + design.story_angles.length + ' angles')

    // Stage 2: Source Discovery (parallel searches)
    console.log('Stage 2: Discovering sources...')
    var searchQueries = design.story_angles.map(function(a) { return a.search_query })
    var allArticles = await discoverArticles(topicDescription, design.search_keywords || [])

    // Also search each specific angle
    var angleResults = await Promise.all(
      searchQueries.slice(0, 3).map(function(q) {
        return discoverArticles(q, [])
      })
    )
    // Merge and deduplicate
    var seen = new Set(allArticles.map(function(a) { return a.url }))
    angleResults.flat().forEach(function(a) {
      if (!seen.has(a.url)) {
        seen.add(a.url)
        allArticles.push(a)
      }
    })

    console.log('Total unique articles discovered: ' + allArticles.length)

    if (allArticles.length === 0) {
      return new Response(JSON.stringify({
        error: 'No articles found for this topic. Try a broader description.',
        design: design,
      }), { status: 404, headers })
    }

    // Stage 3: Article Selection
    console.log('Stage 3: Selecting articles...')
    var selection = await selectArticles(apiKey, design, allArticles)
    console.log('Selected ' + selection.selected.length + ' articles')

    // Resolve selected articles with their URLs
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

    // Create topic slug
    var topicSlug = slugify(design.title)

    // Insert/update topic in DB (as draft)
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

    // Trigger background processor
    var bgPayload = {
      topicSlug: topicSlug,
      topicDesign: design,
      selectedArticles: selectedWithUrls,
      topicInsights: selection.topic_insights,
    }

    var bgUrl = (req.headers.get('origin') || 'https://content-app-engine.netlify.app') + '/api/build-topic-background'
    fetch(bgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bgPayload),
      signal: AbortSignal.timeout(3000),
    }).catch(function() { console.log('Background trigger sent (fire-and-forget)') })

    // Return immediately
    return new Response(JSON.stringify({
      success: true,
      topicSlug: topicSlug,
      design: design,
      selectedArticles: selectedWithUrls.map(function(a) {
        return { title: a.title, source: a.source, angle: a.angle, interactive_idea: a.interactive_idea, confidence: a.confidence, url: a.url }
      }),
      insights: selection.topic_insights,
      message: 'Topic created. ' + selectedWithUrls.length + ' stories are being generated. Check admin in 1-2 minutes.',
    }), { headers })

  } catch (err) {
    console.error('build-topic error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
}

export var config = { path: '/api/build-topic' }
