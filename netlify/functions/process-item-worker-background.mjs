// Background function for processing a single RSS item into a story app
// Netlify background functions get 15-minute timeout (vs 26s for regular)
// Triggered by process-invoke.mjs via internal fetch

import { sbQuery, processItem } from './lib/pipeline.mjs'

export default async (req) => {
  var apiKey = process.env.ANTHROPIC_API_KEY
  var supabaseUrl = process.env.VITE_SUPABASE_URL
  var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    return
  }

  var body
  try {
    body = await req.json()
  } catch {
    console.error('Invalid request body')
    return
  }

  var itemId = body.itemId
  if (!itemId) {
    console.error('No itemId provided')
    return
  }

  console.log('Background worker started for item: ' + itemId)

  var items
  try {
    items = await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + itemId, 'GET')
  } catch (err) {
    console.error('Failed to fetch item:', err.message)
    return
  }

  if (!items || items.length === 0) {
    console.error('Item not found: ' + itemId)
    return
  }

  var item = items[0]
  console.log('Processing: ' + item.title)

  try {
    // Enrich external items with source attribution
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
  } catch (err) {
    console.error('FAILED: ' + item.title, err.message, err.stack)
    // Mark as processed with error reason so we can debug
    await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', {
      processed: true,
      skip_reason: 'Pipeline error: ' + (err.message || '').slice(0, 200),
    }).catch(function () {})
  }

  console.log('Background worker finished for: ' + item.title)
}
