// Netlify function — Automated Topic Page Builder (thin entry point)
// POST /api/build-topic { topic: "Cincinnati housing affordability" }
//
// Returns immediately after validation. Triggers build-topic-background
// which has a longer timeout for the heavy pipeline work.

import { sbQuery, slugify, callAnthropic, parseJson } from './lib/pipeline.mjs'

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
    {"angle": "angle description", "search_query": "search query for this angle"}
  ],
  "poll_question": "Community poll question for readers"
}`

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

    console.log('BUILD TOPIC: "' + topicDescription + '"')

    // Stage 1 runs here (fits in 26s) — design the topic so we can create the DB row
    var designText = await callAnthropic(apiKey, 'claude-haiku-4-5-20251001',
      TOPIC_DESIGN_SYSTEM,
      'Design a Deep Dive topic page for WCPO Cincinnati on:\n\n' + topicDescription,
      1200)
    var design = parseJson(designText)
    console.log('Designed: "' + design.title + '"')

    // Create topic in DB immediately
    var topicSlug = slugify(design.title)
    var topicRow = {
      slug: topicSlug,
      title: design.title,
      subtitle: design.subtitle,
      accent_color: design.accent_color || '#dc2626',
      hero_stats: design.hero_stats || [],
      poll_question: design.poll_question || null,
      timeline_events: [],
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await sbQuery(supabaseUrl, supabaseKey, 'topics', 'POST', topicRow)
    console.log('Topic created: ' + topicSlug)

    // Fire background function — do NOT use AbortSignal (let Netlify handle the connection)
    var origin = req.headers.get('origin') || req.headers.get('x-forwarded-host') || 'https://content-app-engine.netlify.app'
    if (!origin.startsWith('http')) origin = 'https://' + origin
    var bgUrl = origin + '/.netlify/functions/build-topic-background'
    console.log('Triggering background: ' + bgUrl)

    fetch(bgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topicDescription,
        topicSlug: topicSlug,
        topicDesign: design,
      }),
    }).then(function(res) {
      console.log('Background trigger response: ' + res.status)
    }).catch(function(err) {
      console.log('Background trigger fire-and-forget: ' + err.message)
    })

    return new Response(JSON.stringify({
      success: true,
      topicSlug: topicSlug,
      design: design,
      message: 'Topic "' + design.title + '" created. AI is now searching sources and generating 4-6 story-apps. Check back in 2-3 minutes.',
      topic: topicDescription,
    }), { headers })

  } catch (err) {
    console.error('build-topic error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
}

export var config = { path: '/api/build-topic' }
