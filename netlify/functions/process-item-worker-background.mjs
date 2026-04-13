// Background function for processing a single RSS item into a story app
// The -background suffix gives this a 15-minute timeout on Netlify
// Uses handler export (Netlify v1 background function format)

import { sbQuery, processItem } from './lib/pipeline.mjs'

export async function handler(event) {
  var apiKey = process.env.ANTHROPIC_API_KEY
  var supabaseUrl = process.env.VITE_SUPABASE_URL
  var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing env vars:', { apiKey: !!apiKey, supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
    return { statusCode: 500 }
  }

  var body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    console.error('Invalid request body')
    return { statusCode: 400 }
  }

  var itemId = body.itemId
  var force = body.force === true
  if (!itemId) {
    console.error('No itemId provided')
    return { statusCode: 400 }
  }

  console.log('Background worker started for item: ' + itemId)

  var items
  try {
    items = await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + itemId, 'GET')
  } catch (err) {
    console.error('Failed to fetch item:', err.message)
    return { statusCode: 500 }
  }

  if (!items || items.length === 0) {
    console.error('Item not found: ' + itemId)
    return { statusCode: 404 }
  }

  var item = items[0]
  console.log('Processing: ' + item.title)

  // On a force-rebuild, clear the stale skip_reason up front so the dashboard
  // poller can't read a leftover value from an earlier triage and mistake the
  // in-progress build for a fresh skip.
  if (force) {
    await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', {
      skip_reason: null,
    }).catch(function (err) { console.error('Pre-clear skip_reason failed: ' + err.message) })
    item.skip_reason = null
  }

  try {
    if (item.source_type === 'external' && item.link) {
      try {
        item.source_url = item.source_url || item.link
        item.source_name = item.source_name || new URL(item.link).hostname.replace('www.', '')
        item.source_author = item.source_author || item.author || null
      } catch {}
    }

    var result = await processItem(item, apiKey, supabaseUrl, supabaseKey, { skipSensitivity: true, forceGenerate: force })
    console.log('Success: ' + item.title, JSON.stringify(result))
    // Clear skip_reason on success too — a successful build invalidates any
    // prior triage skip note.
    await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', {
      processed: true,
      skip_reason: null,
    })
    return { statusCode: 200 }
  } catch (err) {
    console.error('FAILED: ' + item.title, err.message)
    await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', {
      processed: true,
      skip_reason: 'Pipeline error: ' + (err.message || '').slice(0, 200),
    }).catch(function () {})
    return { statusCode: 500 }
  }
}
