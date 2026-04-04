// Serverless function for processing a single RSS item into a story app
// Uses Netlify v2 function format for consistent runtime (same as other functions)
// Triggered by process-invoke.mjs via internal fetch

import { sbQuery, processItem } from './lib/pipeline.mjs'

export default async (req) => {
  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')
  var headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500, headers })
  }

  var body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers })
  }

  var itemId = body.itemId
  if (!itemId) {
    return new Response(JSON.stringify({ error: 'No itemId provided' }), { status: 400, headers })
  }

  console.log('Worker started for item: ' + itemId)

  var items
  try {
    items = await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + itemId, 'GET')
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch: ' + err.message }), { status: 500, headers })
  }

  if (!items || items.length === 0) {
    return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers })
  }

  var item = items[0]
  console.log('Processing: ' + item.title)

  try {
    if (item.source_type === 'external' && item.link) {
      try {
        item.source_url = item.source_url || item.link
        item.source_name = item.source_name || new URL(item.link).hostname.replace('www.', '')
        item.source_author = item.source_author || item.author || null
      } catch {}
    }

    var result = await processItem(item, apiKey, supabaseUrl, supabaseKey, { skipSensitivity: true })
    console.log('Success: ' + item.title, JSON.stringify(result))
    await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true })

    return new Response(JSON.stringify({ success: true, result }), { headers })
  } catch (err) {
    console.error('FAILED: ' + item.title, err.message)
    await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', {
      processed: true,
      skip_reason: 'Pipeline error: ' + (err.message || '').slice(0, 200),
    }).catch(function () {})

    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
}

export const config = {
  path: '/api/process-item-worker',
}
