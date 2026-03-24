// Scheduled function — Topic refresh
// Runs every 6 hours. Checks published topics, searches for new articles,
// and generates additional story-apps to keep topics fresh.

import { callAnthropic, parseJson, sbQuery, slugify, stripHtml } from './lib/pipeline.mjs'
import { discoverArticles, fetchArticle } from './lib/web-search.mjs'
import { processItem } from './lib/pipeline.mjs'

var AUTO_PUBLISH_THRESHOLD = 72

// How many new stories to add per topic per refresh
var MAX_NEW_PER_TOPIC = 2
// Don't refresh topics that already have this many stories
var MAX_STORIES_PER_TOPIC = 8
// Only refresh topics that haven't been refreshed in this many hours
var REFRESH_INTERVAL_HOURS = 12

var RELEVANCE_SYSTEM = `You evaluate whether news articles are relevant and NEW additions to an existing topic page. An article is relevant if it covers a genuinely different angle that isn't already covered by existing stories.

Respond with ONLY a JSON object:
{
  "relevant": [
    {
      "index": 1,
      "title": "article title",
      "source": "source name",
      "new_angle": "What new angle does this bring that existing stories don't cover?",
      "app_type": "safety-assessment|impact-calculator|data-explorer|tracker|investigation",
      "confidence": 0-100
    }
  ]
}`

export default async () => {
  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    return
  }

  console.log('=== TOPIC REFRESH START ===')

  // 1. Fetch published topics
  var topics = await sbQuery(supabaseUrl, supabaseKey,
    'topics?status=eq.published&order=updated_at.asc&limit=5', 'GET')

  if (!topics || topics.length === 0) {
    console.log('No published topics to refresh')
    return
  }

  console.log('Found ' + topics.length + ' published topics')

  for (var ti = 0; ti < topics.length; ti++) {
    var topic = topics[ti]
    console.log('\n--- Topic: ' + topic.title + ' (' + topic.slug + ') ---')

    // Check refresh interval
    var lastUpdated = new Date(topic.updated_at || topic.created_at)
    var hoursSince = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60)
    if (hoursSince < REFRESH_INTERVAL_HOURS) {
      console.log('Skip: refreshed ' + Math.round(hoursSince) + 'h ago (need ' + REFRESH_INTERVAL_HOURS + 'h)')
      continue
    }

    // Count existing stories
    var existingStories = await sbQuery(supabaseUrl, supabaseKey,
      'generated_stories?topic_slug=eq.' + topic.slug + '&select=story_id,headline,app_type', 'GET')

    var storyCount = existingStories ? existingStories.length : 0
    if (storyCount >= MAX_STORIES_PER_TOPIC) {
      console.log('Skip: already has ' + storyCount + ' stories (max ' + MAX_STORIES_PER_TOPIC + ')')
      continue
    }

    // 2. Search for new articles
    console.log('Searching for new articles...')
    var articles = await discoverArticles(topic.title, [])

    if (articles.length === 0) {
      console.log('No articles found')
      // Update timestamp so we don't retry immediately
      await sbQuery(supabaseUrl, supabaseKey, 'topics?slug=eq.' + topic.slug, 'PATCH', {
        updated_at: new Date().toISOString()
      }).catch(function() {})
      continue
    }

    // Filter out articles we've already processed (by URL)
    var existingUrls = new Set()
    if (existingStories) {
      var rssItems = await sbQuery(supabaseUrl, supabaseKey,
        'rss_items?topic_slug=eq.' + topic.slug + '&select=guid,link', 'GET')
      if (rssItems) {
        rssItems.forEach(function(r) {
          if (r.guid) existingUrls.add(r.guid)
          if (r.link) existingUrls.add(r.link)
        })
      }
    }
    var newArticles = articles.filter(function(a) { return !existingUrls.has(a.url) })
    console.log(articles.length + ' found, ' + newArticles.length + ' are new')

    if (newArticles.length === 0) {
      await sbQuery(supabaseUrl, supabaseKey, 'topics?slug=eq.' + topic.slug, 'PATCH', {
        updated_at: new Date().toISOString()
      }).catch(function() {})
      continue
    }

    // 3. Ask Claude which new articles are relevant and different from existing
    var existingList = existingStories
      ? existingStories.map(function(s) { return '- [' + s.app_type + '] ' + s.headline }).join('\n')
      : '(none)'

    var newList = newArticles.slice(0, 15).map(function(a, i) {
      return (i + 1) + '. [' + a.source + '] ' + a.title + (a.description ? ' — ' + a.description.slice(0, 80) : '')
    }).join('\n')

    var selectionPrompt = 'TOPIC: ' + topic.title + '\n' +
      'EXISTING STORIES:\n' + existingList + '\n\n' +
      'NEW CANDIDATE ARTICLES:\n' + newList + '\n\n' +
      'Pick up to ' + MAX_NEW_PER_TOPIC + ' articles that bring genuinely NEW angles not covered by existing stories.'

    var selection
    try {
      var selText = await callAnthropic(apiKey, 'claude-haiku-4-5-20251001', RELEVANCE_SYSTEM, selectionPrompt, 800)
      selection = parseJson(selText)
    } catch (err) {
      console.error('Selection failed: ' + err.message)
      continue
    }

    if (!selection.relevant || selection.relevant.length === 0) {
      console.log('No new relevant articles found')
      await sbQuery(supabaseUrl, supabaseKey, 'topics?slug=eq.' + topic.slug, 'PATCH', {
        updated_at: new Date().toISOString()
      }).catch(function() {})
      continue
    }

    console.log('Selected ' + selection.relevant.length + ' new articles')

    // 4. Process selected articles
    for (var si = 0; si < Math.min(selection.relevant.length, MAX_NEW_PER_TOPIC); si++) {
      var sel = selection.relevant[si]
      var idx = (sel.index || 1) - 1
      if (idx < 0 || idx >= newArticles.length) continue
      var articleRef = newArticles[idx]

      try {
        console.log('Processing: ' + articleRef.title.slice(0, 50))
        var article = await fetchArticle(articleRef.url)
        if (!article || article.content.length < 100) {
          console.log('Skip: failed to fetch')
          continue
        }

        // Insert RSS item
        var rssItem = {
          guid: article.finalUrl || articleRef.url,
          feed_name: 'topic-refresh',
          title: article.title || articleRef.title,
          link: article.finalUrl || articleRef.url,
          description: article.description || article.content.slice(0, 300),
          content_encoded: article.rawHtml || article.content,
          author: article.author || '',
          pub_date: new Date().toISOString(),
          source_type: 'external',
          processed: false,
          worthiness_score: sel.confidence || 70,
          source_url: article.finalUrl || articleRef.url,
          source_name: article.siteName || articleRef.source,
          source_author: article.author || null,
          topic_slug: topic.slug,
        }

        var inserted
        try {
          inserted = await sbQuery(supabaseUrl, supabaseKey, 'rss_items', 'POST', rssItem)
          if (Array.isArray(inserted) && inserted.length > 0) inserted = inserted[0]
        } catch {
          console.log('Skip: duplicate')
          continue
        }

        inserted.source_url = rssItem.source_url
        inserted.source_name = rssItem.source_name
        inserted.source_author = rssItem.source_author
        inserted.topic_slug = topic.slug

        var result = await processItem(inserted, apiKey, supabaseUrl, supabaseKey, { skipSensitivity: true })
        await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + inserted.id, 'PATCH', { processed: true }).catch(function() {})

        if (!result.skipped) {
          var autoPublish = (sel.confidence || 50) >= AUTO_PUBLISH_THRESHOLD
          if (autoPublish) {
            await sbQuery(supabaseUrl, supabaseKey,
              'generated_stories?story_id=eq.' + result.storyId, 'PATCH',
              { status: 'published', publish_date: new Date().toISOString().split('T')[0] }
            ).catch(function() {})
            console.log('Published: ' + result.storyId)
          } else {
            console.log('Draft: ' + result.storyId)
          }
        }
      } catch (err) {
        console.error('Failed: ' + err.message)
      }
    }

    // Update topic timestamp
    await sbQuery(supabaseUrl, supabaseKey, 'topics?slug=eq.' + topic.slug, 'PATCH', {
      updated_at: new Date().toISOString()
    }).catch(function() {})
  }

  console.log('\n=== TOPIC REFRESH COMPLETE ===')
}

export var config = {
  schedule: '0 */6 * * *', // Every 6 hours
}
