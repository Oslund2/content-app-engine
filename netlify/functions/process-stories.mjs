// Netlify scheduled function — AI story processing pipeline (trickle mode)
// Runs every hour, processes 1 item, auto-publishes high-scoring stories,
// and archives stories older than 7 days

import { sbQuery, processItem } from './lib/pipeline.mjs'

var AUTO_PUBLISH_THRESHOLD = 75
var EXPIRY_DAYS = 7

export default async (req) => {
  console.log('Trickle story processing starting...')

  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing required environment variables')
    return
  }

  // ── Expiry sweep: archive published stories older than EXPIRY_DAYS ──
  try {
    var expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() - EXPIRY_DAYS)
    var expiryStr = expiryDate.toISOString().split('T')[0]

    var expired = await sbQuery(supabaseUrl, supabaseKey,
      'generated_stories?status=eq.published&publish_date=lt.' + expiryStr + '&select=story_id,publish_date',
      'GET')

    if (expired && expired.length > 0) {
      console.log('Archiving ' + expired.length + ' stories older than ' + expiryStr)
      await sbQuery(supabaseUrl, supabaseKey,
        'generated_stories?status=eq.published&publish_date=lt.' + expiryStr, 'PATCH',
        { status: 'archived' })
    }
  } catch (err) {
    console.error('Expiry sweep failed: ' + err.message)
  }

  // ── Fetch 1 unprocessed item (trickle: one at a time) ──
  var items
  try {
    items = await sbQuery(supabaseUrl, supabaseKey,
      'rss_items?processed=eq.false&order=worthiness_score.desc.nullslast&limit=1', 'GET')
  } catch (err) {
    console.error('Failed to fetch unprocessed items:', err.message)
    return
  }

  if (!items || items.length === 0) {
    console.log('No unprocessed items')
    return
  }

  var item = items[0]
  console.log('Processing: ' + item.title.slice(0, 60))

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

    // Auto-publish high-scoring stories
    if (!result.skipped && result.worthiness >= AUTO_PUBLISH_THRESHOLD) {
      await sbQuery(supabaseUrl, supabaseKey,
        'generated_stories?story_id=eq.' + result.storyId, 'PATCH',
        { status: 'published' })
      console.log('Auto-published: ' + result.storyId + ' (score ' + result.worthiness + ')')
    } else if (!result.skipped) {
      console.log('Draft: ' + result.storyId + ' (score ' + result.worthiness + ' < threshold ' + AUTO_PUBLISH_THRESHOLD + ')')
    }

    // Only mark processed after successful processing
    await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true })
  } catch (err) {
    console.error('FAILED: ' + err.message)
    // Do NOT mark as processed on failure — let it retry
  }

  console.log('Trickle processing complete')
}

export const config = {
  schedule: '0 * * * *',
}
