// HTTP-callable trigger for AI story processing (manual/dashboard use)
// GET /api/process-invoke → queues 1 unprocessed RSS item for background processing
// Returns 202 immediately, processes via context.waitUntil()

import { sbQuery, processItem } from './lib/pipeline.mjs'

export default async (req, context) => {
  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')
  var headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500, headers })
  }

  var items
  try {
    items = await sbQuery(supabaseUrl, supabaseKey,
      'rss_items?processed=eq.false&order=worthiness_score.desc.nullslast&limit=1', 'GET')
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch queue: ' + err.message }), { status: 500, headers })
  }

  if (!items || items.length === 0) {
    return new Response(JSON.stringify({ message: 'No unprocessed items', processed: 0 }), { headers })
  }

  var item = items[0]

  // Process in the background — return immediately so the HTTP request doesn't timeout
  context.waitUntil(
    (async () => {
      try {
        var result = await processItem(item, apiKey, supabaseUrl, supabaseKey, { skipSensitivity: true })
        console.log('Processed: ' + item.title, JSON.stringify(result))
        await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true })
      } catch (err) {
        console.error('Error processing: ' + item.title, err)
        await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true }).catch(function () {})
      }
    })()
  )

  return new Response(JSON.stringify({
    message: 'Processing started',
    item: { title: item.title, id: item.id },
  }), { status: 202, headers })
}

export const config = {
  path: '/api/process-invoke',
}
