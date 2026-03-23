// Netlify function — AI-powered 3rd party story finder
// Fetches AP News + NPR RSS (direct URLs, no paywalls), asks Haiku to pick best for Cincinnati
// GET /api/find-story?topic=housing (optional)

import { callAnthropic, parseJson, stripHtml } from './lib/pipeline.mjs'

// Feeds with DIRECT article URLs (no JS redirects, no paywalls)
var FEEDS = [
  { name: 'AP News', url: 'https://apnews.com/feed' },
  { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml' },
]

function getTagContent(xml, tagName) {
  var re = new RegExp('<' + tagName + '[^>]*>([\\s\\S]*?)</' + tagName + '>', 'i')
  var m = xml.match(re)
  if (!m) return ''
  var raw = m[1].trim()
  if (raw.startsWith('<![CDATA[') && raw.endsWith(']]>')) raw = raw.substring(9, raw.length - 3)
  return raw.trim()
}

function parseItems(xml, feedName) {
  var results = []
  var pos = 0
  while (results.length < 15) {
    var s = xml.indexOf('<item', pos)
    if (s === -1) break
    var e = xml.indexOf('</item>', s)
    if (e === -1) break
    var block = xml.substring(s, e)
    var title = stripHtml(getTagContent(block, 'title'))
    // Try <link>, then <guid> for URL
    var link = getTagContent(block, 'link').trim()
    if (!link) link = getTagContent(block, 'guid').trim()
    // AP feed sometimes has link as text after <link/> self-close
    if (!link) {
      var linkMatch = block.match(/<link\s*\/?>\s*(https?:\/\/[^\s<]+)/i)
      if (linkMatch) link = linkMatch[1].trim()
    }
    var desc = stripHtml(getTagContent(block, 'description')).slice(0, 200)
    if (title && link && link.startsWith('http')) {
      results.push({ title: title, link: link, description: desc, source: feedName })
    }
    pos = e + 7
  }
  return results
}

async function fetchFeed(feed) {
  try {
    var res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WCPO/1.0)' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) { console.log(feed.name + ': HTTP ' + res.status); return [] }
    var xml = await res.text()
    var items = parseItems(xml, feed.name)
    console.log(feed.name + ': ' + items.length + ' articles')
    return items
  } catch (err) {
    console.log(feed.name + ' failed: ' + err.message)
    return []
  }
}

var PROMPT = 'Pick the ONE article that would make the best interactive Story-App for Cincinnati readers.\n\nGood: data/numbers, personal relevance, Cincinnati/Ohio angle, emotional engagement.\nCincinnati: housing, Brent Spence Bridge, Ohio River, P&G/Kroger, Bengals/Reds/FCC, health/obesity/GLP-1s, schools, cost of living, manufacturing, weather.\n\nARTICLES:\n{articles}\n\nRespond with ONLY a JSON object, no markdown:\n{"chosen_index":1,"chosen_title":"title","chosen_source":"source","localization_angle":"2 sentences on Cincinnati connection","interactive_ideas":["tool 1","tool 2","tool 3"],"why_this_story":"1 sentence"}'

export default async function handler(req) {
  var headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  if (req.method === 'OPTIONS') return new Response('', { headers })

  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return new Response(JSON.stringify({ error: 'No API key' }), { status: 500, headers })

  try {
    var topicFilter = new URL(req.url).searchParams.get('topic') || ''

    // Fetch feeds in parallel
    var results = await Promise.all(FEEDS.map(fetchFeed))
    var articles = results.flat()
    console.log('Total articles: ' + articles.length)

    if (articles.length === 0) {
      return new Response(JSON.stringify({ error: 'Could not fetch articles from any feed. Try again in a moment.' }), { headers })
    }

    // Build compact list
    var list = articles.map(function (a, i) {
      return (i + 1) + '. [' + a.source + '] ' + a.title + (a.description ? ' — ' + a.description.slice(0, 80) : '')
    }).join('\n')

    var prompt = PROMPT.replace('{articles}', list)
    if (topicFilter) prompt += '\nPrefer articles about: ' + topicFilter

    console.log('Calling Haiku...')
    var text = await callAnthropic(apiKey, 'claude-haiku-4-5-20251001',
      'Pick best news story for Cincinnati localization. Return ONLY a JSON object, never markdown.', prompt, 350)

    var rec = parseJson(text)
    var idx = (rec.chosen_index || 1) - 1
    if (idx < 0 || idx >= articles.length) idx = 0
    rec.chosen_url = articles[idx].link
    if (!rec.chosen_source) rec.chosen_source = articles[idx].source
    console.log('Picked #' + (idx + 1) + ': ' + articles[idx].title.slice(0, 50))

    return new Response(JSON.stringify({
      recommendation: rec,
      totalScanned: articles.length,
      feedsScanned: FEEDS.length,
    }), { headers })

  } catch (err) {
    console.error('find-story error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
}

export var config = { path: '/api/find-story' }
