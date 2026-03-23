// Netlify scheduled function — AI story processing pipeline
// Runs every 30 minutes, picks unprocessed RSS items and runs the full pipeline

import { sbQuery, processItem } from './lib/pipeline.mjs'

export default async (req) => {
  console.log('Scheduled story processing starting...')

  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing required environment variables')
    return
  }

  var items
  try {
    items = await sbQuery(supabaseUrl, supabaseKey,
      'rss_items?processed=eq.false&order=worthiness_score.desc.nullslast&limit=5', 'GET')
  } catch (err) {
    console.error('Failed to fetch unprocessed items:', err.message)
    return
  }

  if (!items || items.length === 0) {
    console.log('No unprocessed items')
    return
  }

  console.log('Processing ' + items.length + ' items')

  for (var idx = 0; idx < items.length; idx++) {
    var item = items[idx]
    console.log('--- Item ' + (idx + 1) + ': ' + item.title.slice(0, 50))

    try {
      // Enrich external items with source attribution
      if (item.source_type === 'external' && item.link) {
        try {
          item.source_url = item.link
          item.source_name = new URL(item.link).hostname.replace('www.', '')
          item.source_author = item.author || null
        } catch {}
      }

      var result = await processItem(item, apiKey, supabaseUrl, supabaseKey)
      console.log('Result:', JSON.stringify(result))

      // Only mark processed after successful processing
      await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true })
    } catch (err) {
      console.error('FAILED: ' + err.message)
      // Do NOT mark as processed on failure — let it retry
    }
  }

  console.log('Scheduled processing complete')
}

export const config = {
  schedule: '*/30 * * * *',
}
