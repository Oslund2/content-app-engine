// Minimal test: just call Sonnet and insert a generated story
export default async (req, context) => {
  try {
    var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
    var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
    var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Step 1: Call Sonnet with a simple prompt
    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: 'Output ONLY valid JSON. No markdown.',
        messages: [{ role: 'user', content: 'Generate a simple JSON config: {"appType":"test","hero":{"headline":"Test Story","subhead":"Testing the pipeline"},"inputs":[],"results":{}}' }],
      }),
    })

    var rawBody = await response.text()
    if (!response.ok) {
      return new Response(JSON.stringify({ step: 'anthropic', status: response.status, error: rawBody.slice(0, 500) }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    var data = JSON.parse(rawBody)
    var text = data.content && data.content[0] ? data.content[0].text : 'EMPTY'

    // Step 2: Parse the JSON
    var config
    try {
      config = JSON.parse(text)
    } catch(e) {
      var match = text.match(/\{[\s\S]*\}/)
      config = match ? JSON.parse(match[0]) : { raw: text.slice(0, 200) }
    }

    // Step 3: Insert into generated_stories
    var insertRes = await fetch(supabaseUrl + '/rest/v1/generated_stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        story_id: 'sonnet-test-' + Date.now(),
        app_type: 'data-explorer',
        status: 'draft',
        config: config,
        headline: 'Sonnet Test Story',
        category: 'NEWS',
        category_color: '#dc2626',
        publish_date: '2026-03-23',
        model_used: 'claude-sonnet-4-6',
      }),
    })

    var insertBody = await insertRes.text()

    return new Response(JSON.stringify({
      sonnet: { status: response.status, textLen: text.length, configKeys: Object.keys(config) },
      insert: { status: insertRes.status, body: insertBody.slice(0, 300) },
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

export const config = {
  path: '/.netlify/functions/test-sonnet',
}
