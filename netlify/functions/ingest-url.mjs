// Netlify function — Ingest an external URL and queue for Story-App generation
// POST /api/ingest-url { url, topic_slug? }
// Fast: fetches HTML + inserts rss_item + returns immediately
// The scheduled process-stories function picks it up for AI processing

import { sbQuery, stripHtml, extractArticleMeta } from './lib/pipeline.mjs'

export default async (req) => {
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

  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseKey) {
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

    // SSRF protection: block private/internal URLs
    try {
      var parsed = new URL(url)
      var hostname = parsed.hostname.toLowerCase()
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '0.0.0.0'
          || hostname.endsWith('.local') || hostname.endsWith('.internal')
          || /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)
          || parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return new Response(JSON.stringify({ error: 'URL not allowed' }), {
          status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    console.log('Ingesting: ' + url)

    // 1. Fetch HTML (this is the only slow external call)
    var fetchRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })
    var finalUrl = fetchRes.url || url
    if (!fetchRes.ok) throw new Error('HTTP ' + fetchRes.status + ' from ' + finalUrl)
    var html = await fetchRes.text()
    console.log('Fetched ' + html.length + ' chars')

    // 2. Extract metadata
    var meta = extractArticleMeta(html)
    var articleText = stripHtml(meta.content || html)
    if (articleText.length < 100) articleText = stripHtml(html)

    if (articleText.length < 100) {
      return new Response(JSON.stringify({
        error: 'Article too short (' + articleText.length + ' chars). Site may block scraping.',
        hint: 'Try NPR, PBS, or BBC URLs — they work reliably.',
      }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    console.log('Article: "' + (meta.title || '').slice(0, 50) + '" (' + articleText.length + ' chars)')

    // 3. Insert into rss_items (fast DB write)
    var rssItem = {
      guid: finalUrl,
      feed_name: 'external',
      title: meta.title || 'External Article',
      link: finalUrl,
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
      if (Array.isArray(inserted) && inserted.length > 0) inserted = inserted[0]
    } catch (err) {
      // Duplicate — fetch existing
      var existing = await sbQuery(supabaseUrl, supabaseKey,
        'rss_items?guid=eq.' + encodeURIComponent(finalUrl) + '&limit=1', 'GET')
      if (existing && existing.length > 0) {
        inserted = existing[0]
      } else {
        throw new Error('DB insert failed: ' + err.message)
      }
    }

    // 4. Store source metadata on the rss_item for the pipeline to pick up
    var sourceName = meta.siteName || new URL(finalUrl).hostname.replace('www.', '')
    await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + inserted.id, 'PATCH', {
      processed: false, // ensure pipeline picks it up
      worthiness_score: 80, // boost priority so it's processed next
    }).catch(function () {})

    // 5. Trigger the background processor (fire and forget)
    var bgUrl = (req.headers.get('origin') || 'https://content-app-engine.netlify.app') + '/.netlify/functions/process-invoke-background'
    fetch(bgUrl, { method: 'POST', signal: AbortSignal.timeout(2000) }).catch(function () {})

    // 6. Return immediately — story will appear in Drafts once pipeline finishes
    return new Response(JSON.stringify({
      success: true,
      queued: true,
      message: 'Article queued for processing. Check Drafts tab in 30-60 seconds.',
      title: meta.title,
      sourceName: sourceName,
      sourceUrl: finalUrl,
      rssItemId: inserted.id,
      topicSlug: topicSlug,
    }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })

  } catch (err) {
    console.error('Ingest error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

export const config = { path: '/api/ingest-url' }
