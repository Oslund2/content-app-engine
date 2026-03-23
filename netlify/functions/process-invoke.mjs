// HTTP-callable trigger for AI story processing (manual/dashboard use)
// GET /api/process-invoke → processes 1 unprocessed RSS item

import { sbQuery, processItem } from './lib/pipeline.mjs'

export default async (req, context) => {
  try {
    var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
    var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
    var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!apiKey || !supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Missing env vars' }), {
        status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    var items = await sbQuery(supabaseUrl, supabaseKey,
      'rss_items?processed=eq.false&order=worthiness_score.desc.nullslast&limit=1', 'GET')

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ message: 'No unprocessed items', processed: 0 }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    var results = []
    for (var idx = 0; idx < items.length; idx++) {
      var item = items[idx]
      try {
        var result = await processItem(item, apiKey, supabaseUrl, supabaseKey, { skipSensitivity: true })
        results.push({ title: item.title, ...result })
        await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true })
      } catch (err) {
        console.error('Error processing: ' + item.title, err)
        results.push({ title: item.title, error: err.message })
        await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true }).catch(function () {})
      }
    }

    return new Response(JSON.stringify({ message: 'Processing complete', results: results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

export const config = {
  path: '/api/process-invoke',
}
