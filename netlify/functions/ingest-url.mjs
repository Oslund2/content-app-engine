// Netlify function — Ingest an external URL and generate a Story-App
// POST /api/ingest-url { url, topic_slug? }

import { sbQuery, processItem, stripHtml, extractFirstImage, extractArticleMeta } from './lib/pipeline.mjs'

export default async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), {
      status: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    var body = await req.json()
    var url = body.url
    var topicSlug = body.topic_slug || null

    if (!url || !url.startsWith('http')) {
      return new Response(JSON.stringify({ error: 'Valid URL required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    console.log('Ingesting external URL: ' + url)

    // 1. Fetch HTML
    var fetchRes = await fetch(url, {
      headers: { 'User-Agent': 'WCPO-ContentAppEngine/1.0' },
    })
    if (!fetchRes.ok) {
      throw new Error('Failed to fetch URL: HTTP ' + fetchRes.status)
    }
    var html = await fetchRes.text()
    console.log('Fetched ' + html.length + ' chars')

    // 2. Extract article metadata
    var meta = extractArticleMeta(html)
    console.log('Extracted: title="' + meta.title.slice(0, 50) + '", author="' + meta.author + '"')

    var articleText = stripHtml(meta.content || html)
    if (articleText.length < 100) {
      return new Response(JSON.stringify({ error: 'Article too short to process (' + articleText.length + ' chars)' }), {
        status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // 3. Insert into rss_items as external source
    var rssItem = {
      guid: url,
      feed_name: 'external',
      title: meta.title || 'External Article',
      link: url,
      description: meta.description || articleText.slice(0, 300),
      content_encoded: meta.content || html,
      author: meta.author || '',
      pub_date: new Date().toISOString(),
      source_type: 'external',
      processed: false,
    }

    var inserted
    try {
      inserted = await sbQuery(supabaseUrl, supabaseKey, 'rss_items', 'POST', rssItem)
      if (Array.isArray(inserted) && inserted.length > 0) {
        inserted = inserted[0]
      }
    } catch (err) {
      // May fail on duplicate guid — try fetching existing
      console.log('Insert failed (likely duplicate): ' + err.message)
      var existing = await sbQuery(supabaseUrl, supabaseKey,
        'rss_items?guid=eq.' + encodeURIComponent(url) + '&limit=1', 'GET')
      if (existing && existing.length > 0) {
        inserted = existing[0]
      } else {
        throw new Error('Could not insert or find rss_item for URL')
      }
    }

    console.log('RSS item ID: ' + inserted.id)

    // 4. Enrich the item with source metadata for processItem
    inserted.source_url = url
    inserted.source_name = meta.siteName || new URL(url).hostname.replace('www.', '')
    inserted.source_author = meta.author || null
    inserted.topic_slug = topicSlug

    // 5. Process through the AI pipeline
    var result = await processItem(inserted, apiKey, supabaseUrl, supabaseKey, { skipSensitivity: false })
    console.log('Pipeline result: ' + JSON.stringify(result))

    // 6. Mark as processed
    await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + inserted.id, 'PATCH', { processed: true })

    // 7. If topic_slug was provided and story was created, ensure it's set on generated_stories
    if (topicSlug && result.storyId && !result.skipped) {
      await sbQuery(supabaseUrl, supabaseKey,
        'generated_stories?story_id=eq.' + encodeURIComponent(result.storyId), 'PATCH',
        { topic_slug: topicSlug }
      ).catch(function (err) { console.error('Topic assign error:', err.message) })
    }

    return new Response(JSON.stringify({
      success: !result.skipped,
      storyId: result.storyId || null,
      appType: result.appType || null,
      worthiness: result.worthiness || null,
      skipped: result.skipped || false,
      reason: result.reason || null,
      sourceUrl: url,
      sourceName: inserted.source_name,
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  } catch (err) {
    console.error('Ingest error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

export const config = {
  path: '/api/ingest-url',
}
