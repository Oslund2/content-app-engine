// Netlify function — Automated Topic Page Builder (thin entry point)
// POST /api/build-topic { topic: "Cincinnati housing affordability" }
//
// Returns immediately after validation. All heavy work happens in
// build-topic-background.mjs (15-min timeout) to avoid the 26s sync limit.

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

    // Fire off to background function immediately
    var bgUrl = (req.headers.get('origin') || 'https://content-app-engine.netlify.app') + '/.netlify/functions/build-topic-background'
    fetch(bgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topicDescription }),
      signal: AbortSignal.timeout(3000),
    }).catch(function() {})

    return new Response(JSON.stringify({
      success: true,
      message: 'Topic build started. AI is designing the page, searching sources, and generating story-apps. Check the Topics tab in 2-3 minutes.',
      topic: topicDescription,
    }), { headers })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
}

export var config = { path: '/api/build-topic' }
