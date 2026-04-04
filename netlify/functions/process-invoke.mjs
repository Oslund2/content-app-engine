// HTTP-callable trigger for AI story processing (manual/dashboard use)
// GET /api/process-invoke → processes top unprocessed RSS item
// GET /api/process-invoke?itemId=UUID → processes a specific RSS item
// Returns 202 immediately, delegates heavy work to process-item-worker via fetch

import { sbQuery } from './lib/pipeline.mjs'

export default async (req, context) => {
  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')
  var headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500, headers })
  }

  var url = new URL(req.url)
  var itemId = url.searchParams.get('itemId')

  var items
  try {
    if (itemId) {
      items = await sbQuery(supabaseUrl, supabaseKey,
        'rss_items?id=eq.' + encodeURIComponent(itemId), 'GET')
    } else {
      items = await sbQuery(supabaseUrl, supabaseKey,
        'rss_items?processed=eq.false&order=worthiness_score.desc.nullslast&limit=1', 'GET')
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch item: ' + err.message }), { status: 500, headers })
  }

  if (!items || items.length === 0) {
    return new Response(JSON.stringify({ message: itemId ? 'Item not found' : 'No unprocessed items', processed: 0 }), { headers })
  }

  var item = items[0]

  // Fire-and-forget: trigger worker function without awaiting its completion
  // The worker will process the item and update the DB independently
  var origin = url.origin || 'https://content-app-engine.netlify.app'
  fetch(origin + '/api/process-item-worker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId: item.id }),
  }).catch(function () {})

  return new Response(JSON.stringify({
    message: 'Processing started',
    item: { title: item.title, id: item.id },
  }), { status: 202, headers })
}

export const config = {
  path: '/api/process-invoke',
}
