// Background function — processes selected articles into story-apps for a topic
// Triggered by build-topic.mjs after article selection
// Has 15-minute timeout (Netlify background functions)

import { sbQuery, processItem, stripHtml, extractArticleMeta, slugify } from './lib/pipeline.mjs'
import { fetchArticle } from './lib/web-search.mjs'

// Confidence threshold: stories above this score auto-publish
var AUTO_PUBLISH_THRESHOLD = 72

export default async (req) => {
  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    return
  }

  var payload
  try {
    payload = await req.json()
  } catch {
    console.error('Invalid JSON payload')
    return
  }

  var topicSlug = payload.topicSlug
  var topicDesign = payload.topicDesign
  var selectedArticles = payload.selectedArticles || []

  console.log('=== BACKGROUND: Building topic "' + topicSlug + '" with ' + selectedArticles.length + ' articles ===')

  var results = []
  var publishedCount = 0

  for (var i = 0; i < selectedArticles.length; i++) {
    var selected = selectedArticles[i]
    console.log('\n--- Article ' + (i + 1) + '/' + selectedArticles.length + ': ' + (selected.title || '').slice(0, 60) + ' ---')

    try {
      // 1. Fetch the full article
      console.log('Fetching: ' + selected.url)
      var article = await fetchArticle(selected.url)

      if (!article || article.content.length < 100) {
        console.log('SKIP: Article too short or failed to fetch')
        results.push({ title: selected.title, error: 'Failed to fetch or too short', url: selected.url })
        continue
      }

      console.log('Fetched: "' + (article.title || '').slice(0, 50) + '" (' + article.content.length + ' chars)')

      // 2. Insert into rss_items table (so the pipeline can track it)
      var rssItem = {
        guid: article.finalUrl || selected.url,
        feed_name: 'topic-builder',
        title: article.title || selected.title,
        link: article.finalUrl || selected.url,
        description: article.description || article.content.slice(0, 300),
        content_encoded: article.rawHtml || article.content,
        author: article.author || '',
        pub_date: new Date().toISOString(),
        source_type: 'external',
        processed: false,
        worthiness_score: selected.confidence || 75,
        // Source attribution fields
        source_url: article.finalUrl || selected.url,
        source_name: article.siteName || selected.source,
        source_author: article.author || null,
        topic_slug: topicSlug,
      }

      var inserted
      try {
        inserted = await sbQuery(supabaseUrl, supabaseKey, 'rss_items', 'POST', rssItem)
        if (Array.isArray(inserted) && inserted.length > 0) inserted = inserted[0]
      } catch (err) {
        // Duplicate — try to fetch existing
        var existing = await sbQuery(supabaseUrl, supabaseKey,
          'rss_items?guid=eq.' + encodeURIComponent(rssItem.guid) + '&limit=1', 'GET')
        if (existing && existing.length > 0) {
          inserted = existing[0]
          // Update topic_slug if not set
          if (!inserted.topic_slug) {
            await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + inserted.id, 'PATCH', {
              topic_slug: topicSlug,
              processed: false,
            }).catch(function() {})
          }
        } else {
          console.error('DB insert failed: ' + err.message)
          results.push({ title: selected.title, error: 'DB error: ' + err.message })
          continue
        }
      }

      // 3. Process through the story-app pipeline
      // Enrich the item with source attribution for the pipeline
      inserted.source_url = rssItem.source_url
      inserted.source_name = rssItem.source_name
      inserted.source_author = rssItem.source_author
      inserted.topic_slug = topicSlug

      console.log('Processing through pipeline...')
      var result = await processItem(inserted, apiKey, supabaseUrl, supabaseKey, { skipSensitivity: false })

      if (result.skipped) {
        console.log('SKIP: ' + (result.reason || 'Score too low'))
        results.push({ title: selected.title, skipped: true, reason: result.reason })
        // Mark as processed
        await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + inserted.id, 'PATCH', { processed: true }).catch(function() {})
        continue
      }

      // Mark RSS item as processed
      await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + inserted.id, 'PATCH', { processed: true }).catch(function() {})

      // 4. Apply confidence threshold for auto-publish
      var confidence = selected.confidence || 50
      var autoPublish = confidence >= AUTO_PUBLISH_THRESHOLD

      if (autoPublish) {
        // Auto-publish: update generated_story status
        await sbQuery(supabaseUrl, supabaseKey,
          'generated_stories?story_id=eq.' + result.storyId, 'PATCH',
          { status: 'published', publish_date: new Date().toISOString().split('T')[0] }
        ).catch(function(err) { console.error('Auto-publish failed:', err.message) })
        publishedCount++
        console.log('AUTO-PUBLISHED (confidence: ' + confidence + ')')
      } else {
        console.log('DRAFT (confidence: ' + confidence + ', threshold: ' + AUTO_PUBLISH_THRESHOLD + ')')
      }

      results.push({
        title: selected.title,
        storyId: result.storyId,
        appType: result.appType,
        confidence: confidence,
        autoPublished: autoPublish,
        source: selected.source,
      })

    } catch (err) {
      console.error('FAILED: ' + err.message)
      results.push({ title: selected.title, error: err.message, url: selected.url })
    }
  }

  // 5. Update topic status if enough stories were auto-published
  if (publishedCount >= 3) {
    // Enough confidence to auto-publish the topic itself
    await sbQuery(supabaseUrl, supabaseKey, 'topics?slug=eq.' + topicSlug, 'PATCH', {
      status: 'published',
      updated_at: new Date().toISOString(),
    }).catch(function(err) { console.error('Topic publish failed:', err.message) })
    console.log('\nTOPIC AUTO-PUBLISHED (' + publishedCount + ' stories published)')
  } else {
    console.log('\nTopic remains draft (' + publishedCount + ' published, need 3+)')
  }

  console.log('\n=== RESULTS ===')
  results.forEach(function(r) {
    if (r.error) console.log('  FAIL: ' + r.title + ' — ' + r.error)
    else if (r.skipped) console.log('  SKIP: ' + r.title + ' — ' + r.reason)
    else console.log('  OK: ' + r.storyId + ' [' + r.appType + '] ' + (r.autoPublished ? 'PUBLISHED' : 'draft'))
  })
  console.log('=== BUILD TOPIC COMPLETE ===')
}
