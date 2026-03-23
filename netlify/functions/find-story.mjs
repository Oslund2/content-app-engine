// Netlify function — AI-powered 3rd party story finder
// Fetches Google News RSS, asks Haiku to pick the best one for Cincinnati.
// Writes recommendation to Supabase so frontend can poll for it.
// GET /api/find-story?topic=housing (optional)
// GET /api/find-story?check=true (poll for result)

import { callAnthropic, parseJson, stripHtml, sbQuery } from './lib/pipeline.mjs'

const GOOGLE_NEWS_URL = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en'

function getTagContent(xml, tagName) {
  var startTag = '<' + tagName
  var endTag = '</' + tagName + '>'
  var startIdx = xml.indexOf(startTag)
  if (startIdx === -1) return ''
  var afterTag = xml.indexOf('>', startIdx)
  if (afterTag === -1) return ''
  var contentStart = afterTag + 1
  var endIdx = xml.indexOf(endTag, contentStart)
  if (endIdx === -1) return ''
  var raw = xml.substring(contentStart, endIdx).trim()
  if (raw.startsWith('<![CDATA[') && raw.endsWith(']]>')) raw = raw.substring(9, raw.length - 3)
  return raw.trim()
}

// Resolve Google News redirect URLs to actual article URLs (follows up to 5 hops)
async function resolveGoogleLink(gnUrl) {
  var current = gnUrl
  for (var hop = 0; hop < 5; hop++) {
    try {
      var res = await fetch(current, {
        redirect: 'manual',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(3000),
      })
      var loc = res.headers.get('location')
      if (loc && loc.startsWith('http') && loc !== current) {
        current = loc
        continue
      }
      break
    } catch { break }
  }
  // If we ended up somewhere different from Google News, that's the real URL
  if (current !== gnUrl) return current
  return gnUrl
}

function parseRssItems(xml) {
  var results = []
  var searchFrom = 0
  while (results.length < 20) {
    var itemStart = xml.indexOf('<item>', searchFrom)
    if (itemStart === -1) itemStart = xml.indexOf('<item ', searchFrom)
    if (itemStart === -1) break
    var itemEnd = xml.indexOf('</item>', itemStart)
    if (itemEnd === -1) break
    var block = xml.substring(itemStart, itemEnd)
    var title = stripHtml(getTagContent(block, 'title'))
    var link = getTagContent(block, 'link')
    var source = stripHtml(getTagContent(block, 'source'))
    if (title && link) results.push({ title, link, source: source || 'News' })
    searchFrom = itemEnd + 7
  }
  return results
}

const PICKER_PROMPT = `Pick the ONE article best suited for an interactive Story-App localized for Cincinnati, Ohio.

Best candidates: data/numbers, personal relevance, Cincinnati/Ohio angle, emotional engagement.
Cincinnati: housing/rent crisis, Brent Spence Bridge, Ohio River, P&G/Kroger/GE Aviation, Bengals/Reds/FCC, Cincinnati Children's, UC Health, CVG airport, OTR, manufacturing, obesity/GLP-1s, school safety, cost of living.

ARTICLES:
{articles}

Respond with a raw JSON object (NO markdown, NO backticks):
{"chosen_index":1,"chosen_title":"title","chosen_source":"source","localization_angle":"How this connects to Cincinnati (2 sentences)","interactive_ideas":["idea 1","idea 2","idea 3"],"why_this_story":"1 sentence"}`

export default async (req) => {
  var headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (req.method === 'OPTIONS') {
    return new Response('', { headers: { ...headers, 'Access-Control-Allow-Methods': 'GET' } })
  }

  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return new Response(JSON.stringify({ error: 'No API key' }), { status: 500, headers })

  try {
    console.log('Fetching Google News...')
    var feedRes = await fetch(GOOGLE_NEWS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    })

    if (!feedRes.ok) {
      return new Response(JSON.stringify({ error: 'Google News feed returned ' + feedRes.status }), { status: 502, headers })
    }

    var xml = await feedRes.text()
    var articles = parseRssItems(xml)
    console.log('Parsed ' + articles.length + ' articles')

    if (articles.length === 0) {
      return new Response(JSON.stringify({ error: 'No articles found in feed' }), { status: 502, headers })
    }

    var topicFilter = new URL(req.url).searchParams.get('topic') || null

    var articleList = articles.map(function (a, i) {
      return (i + 1) + '. [' + a.source + '] ' + a.title + ' | ' + a.link
    }).join('\n')

    var prompt = PICKER_PROMPT.replace('{articles}', articleList)
    if (topicFilter) prompt += '\nPrefer: ' + topicFilter

    console.log('Calling Haiku...')
    var text = await callAnthropic(apiKey, 'claude-haiku-4-5-20251001',
      'Pick best story for Cincinnati. JSON only.', prompt, 350)

    var rec = parseJson(text)
    console.log('Picked index ' + rec.chosen_index + ': ' + (rec.chosen_title || '').slice(0, 40))

    // Resolve the actual article URL from the chosen index
    var chosenArticle = articles[(rec.chosen_index || 1) - 1] || articles[0]
    var resolvedUrl = await resolveGoogleLink(chosenArticle.link)
    rec.chosen_url = resolvedUrl

    return new Response(JSON.stringify({ recommendation: rec, totalScanned: articles.length, feedsScanned: 1 }), { headers })
  } catch (err) {
    console.error('Find-story error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
}

export const config = { path: '/api/find-story' }
