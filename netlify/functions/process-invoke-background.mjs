// Background function for AI story processing (15-min timeout)
// Same pipeline as the scheduled function, but triggered via HTTP

import { sbQuery, processItem } from './lib/pipeline.mjs'

export default async (req, context) => {
  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    return
  }

  console.log('Background processing starting...')

  var items = await sbQuery(supabaseUrl, supabaseKey,
    'rss_items?processed=eq.false&order=worthiness_score.desc.nullslast&limit=5', 'GET')

  if (!items || items.length === 0) {
    console.log('No unprocessed items')
    return
  }

  console.log('Processing ' + items.length + ' items')

  for (var idx = 0; idx < items.length; idx++) {
    var item = items[idx]
    console.log('--- Item ' + (idx + 1) + ': ' + item.title.slice(0, 50))

    try {
      // For external items, enrich with source attribution
      if (item.source_type === 'external' && item.link) {
        try {
          var hostname = new URL(item.link).hostname.replace('www.', '')
          item.source_url = item.source_url || item.link
          item.source_name = item.source_name || hostname
          item.source_author = item.source_author || item.author || null
        } catch {}
      }

      var result = await processItem(item, apiKey, supabaseUrl, supabaseKey)
      console.log('Result:', JSON.stringify(result))
      await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true })
    } catch (err) {
      console.error('FAILED: ' + err.message)
      // Do NOT mark as processed on failure
    }
  }

  console.log('Background processing complete')
}
