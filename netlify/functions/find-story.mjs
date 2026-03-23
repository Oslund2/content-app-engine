// Netlify function — AI-powered story finder
// Searches trending news, picks the best article for Cincinnati localization
// GET /api/find-story?topic=housing (optional topic filter)

import { callAnthropic, parseJson, stripHtml } from './lib/pipeline.mjs'

// News RSS feeds to scan for trending stories
const NEWS_FEEDS = [
  { name: 'AP Top News', url: 'https://feedx.net/rss/ap.xml' },
  { name: 'Reuters Top', url: 'https://feedx.net/rss/reuters.xml' },
  { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml' },
  { name: 'PBS NewsHour', url: 'https://www.pbs.org/newshour/feeds/rss/headlines' },
  { name: 'USA Today', url: 'https://rssfeeds.usatoday.com/usatoday-NewsTopStories' },
]

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
  if (raw.startsWith('<![CDATA[') && raw.endsWith(']]>')) {
    raw = raw.substring(9, raw.length - 3)
  }
  return raw.trim()
}

function parseRssItems(xml, feedName) {
  var results = []
  var searchFrom = 0
  while (results.length < 15) {
    var itemStart = xml.indexOf('<item>', searchFrom)
    if (itemStart === -1) itemStart = xml.indexOf('<item ', searchFrom)
    if (itemStart === -1) break
    var itemEnd = xml.indexOf('</item>', itemStart)
    if (itemEnd === -1) break
    var block = xml.substring(itemStart, itemEnd)
    var title = stripHtml(getTagContent(block, 'title'))
    var link = getTagContent(block, 'link')
    var description = stripHtml(getTagContent(block, 'description'))
    if (title && link) {
      results.push({ title, link, description: description.slice(0, 300), source: feedName })
    }
    searchFrom = itemEnd + 7
  }
  return results
}

async function fetchFeed(feed) {
  try {
    var res = await fetch(feed.url, {
      headers: { 'User-Agent': 'WCPO-ContentAppEngine/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    var xml = await res.text()
    return parseRssItems(xml, feed.name)
  } catch (err) {
    console.error('Feed error (' + feed.name + '): ' + err.message)
    return []
  }
}

const FINDER_PROMPT = `You are a senior editor at WCPO Cincinnati. You're scanning national/international news for stories that would make AMAZING localized interactive Story-Apps for Cincinnati readers.

A Story-App turns a news article into an interactive experience — calculators, quizzes, planners, explorers, assessments. The best candidates have:

1. DATA & NUMBERS that can drive calculations (costs, percentages, distances, timelines)
2. PERSONAL RELEVANCE — readers can see how it affects THEM specifically
3. LOCAL ANGLE — the national trend has a clear Cincinnati/Ohio/tri-state connection
4. MULTIPLE INTERACTIVE ANGLES — not just one chart, but 2-3 different tools
5. EMOTIONAL ENGAGEMENT — readers CARE about this topic

Think about what connects to Cincinnati:
- Cost of living, housing, rent burden
- Infrastructure (bridges, roads, water systems)
- Weather/climate impacts (Ohio River flooding, tornados, heat)
- Employment/economy (manufacturing, P&G, Kroger, GE Aviation)
- Education (CPS, University of Cincinnati, NKU)
- Sports (Bengals, Reds, FC Cincinnati)
- Health (Cincinnati Children's, UC Health)
- Food/culture (OTR restaurants, Findlay Market)
- Transportation (CVG airport, Metro bus, I-75 corridor)

From the articles below, pick the ONE story that would make the most engaging, unique interactive Story-App for Cincinnati readers.

ARTICLES:
{articles}

Respond with ONLY a JSON object:
{
  "chosen_url": "the article URL",
  "chosen_title": "the headline",
  "chosen_source": "source name",
  "localization_angle": "2-3 sentences explaining HOW this story connects to Cincinnati and what makes it personally relevant to local readers",
  "interactive_ideas": [
    "Specific interactive tool idea 1 (e.g., 'Slider: How much of your income goes to X?')",
    "Specific interactive tool idea 2",
    "Specific interactive tool idea 3"
  ],
  "why_this_story": "1 sentence on why this beats the other candidates",
  "suggested_app_type": "impact-calculator|safety-assessment|event-planner|data-explorer|eligibility-checker"
}`

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'Content-Type' },
    })
  }

  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    // Optional topic filter from query string
    var url = new URL(req.url)
    var topicFilter = url.searchParams.get('topic') || null

    console.log('Fetching news feeds...')

    // Fetch all feeds in parallel
    var feedResults = await Promise.all(NEWS_FEEDS.map(fetchFeed))
    var allArticles = feedResults.flat()

    if (allArticles.length === 0) {
      return new Response(JSON.stringify({ error: 'Could not fetch any news feeds' }), {
        status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    console.log('Found ' + allArticles.length + ' articles from ' + NEWS_FEEDS.length + ' feeds')

    // Build the article list for Claude
    var articleList = allArticles.map(function (a, i) {
      return (i + 1) + '. [' + a.source + '] ' + a.title + '\n   URL: ' + a.link + '\n   ' + a.description
    }).join('\n\n')

    var userPrompt = FINDER_PROMPT.replace('{articles}', articleList)
    if (topicFilter) {
      userPrompt += '\n\nIMPORTANT: Prefer articles related to the topic: "' + topicFilter + '"'
    }

    console.log('Asking Claude to pick the best story...')
    var responseText = await callAnthropic(apiKey, 'claude-sonnet-4-6',
      'You are a news editor selecting stories for localization. Respond with ONLY valid JSON.',
      userPrompt, 800)

    var recommendation = parseJson(responseText)
    console.log('Recommended: ' + recommendation.chosen_title)

    return new Response(JSON.stringify({
      recommendation,
      totalScanned: allArticles.length,
      feedsScanned: NEWS_FEEDS.length,
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  } catch (err) {
    console.error('Find story error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

export const config = {
  path: '/api/find-story',
}
