// Web search utility for source discovery
// Uses Google News RSS (no API key needed) + curated non-paywall feeds

import { stripHtml } from './pipeline.mjs'
import { EXTENDED_NATIONAL_FEEDS, WCPO_FEEDS as WCPO_INGEST_FEEDS } from './feeds.mjs'

// ─── Curated sources known to be scrapable (no paywall, no JS-only rendering) ───

export const SCRAPABLE_SOURCES = new Set([
  'npr.org', 'pbs.org', 'bbc.co.uk', 'bbc.com', 'apnews.com', 'reuters.com',
  'abcnews.go.com', 'cbsnews.com', 'nbcnews.com', 'usatoday.com',
  'theguardian.com', 'vox.com', 'thehill.com', 'politico.com',
  'axios.com', 'propublica.org', 'theconversation.com',
  // Ohio / Cincinnati local (non-paywall or soft-paywall)
  'wcpo.com', 'wlwt.com', 'fox19.com', 'local12.com',
  'daytondailynews.com', 'statenews.org', 'ohiocapitaljournal.com',
  'news5cleveland.com', 'dispatch.com', 'wosu.org',
  // Health / Science / Environment
  'cdc.gov', 'nih.gov', 'weather.gov', 'epa.gov',
  'sciencedaily.com', 'phys.org',
])

// Domains that are always paywalled — skip these even if Google returns them
const PAYWALL_DOMAINS = new Set([
  'nytimes.com', 'washingtonpost.com', 'wsj.com', 'bloomberg.com',
  'economist.com', 'ft.com', 'latimes.com', 'bostonglobe.com',
  'theathletic.com', 'inquirer.com', 'chicagotribune.com',
  'cincinnati.com', // Cincinnati Enquirer is Gannett paywall
])

function getDomain(url) {
  try {
    var hostname = new URL(url).hostname.replace('www.', '')
    return hostname
  } catch {
    return ''
  }
}

function isScrapable(url) {
  var domain = getDomain(url)
  if (PAYWALL_DOMAINS.has(domain)) return false
  // If domain matches our known-good list, definitely scrapable
  if (SCRAPABLE_SOURCES.has(domain)) return true
  // For unknown domains, allow them but they may fail at fetch time
  // The pipeline handles fetch failures gracefully
  return true
}

// ─── Google News RSS Search ─────────────────────────────────────────────────

function getTagContent(xml, tagName) {
  var re = new RegExp('<' + tagName + '[^>]*>([\\s\\S]*?)</' + tagName + '>', 'i')
  var m = xml.match(re)
  if (!m) return ''
  var raw = m[1].trim()
  if (raw.startsWith('<![CDATA[') && raw.endsWith(']]>')) raw = raw.substring(9, raw.length - 3)
  return raw.trim()
}

function parseGoogleNewsItems(xml) {
  var results = []
  var pos = 0
  while (results.length < 20) {
    var s = xml.indexOf('<item', pos)
    if (s === -1) break
    var e = xml.indexOf('</item>', s)
    if (e === -1) break
    var block = xml.substring(s, e)

    var title = stripHtml(getTagContent(block, 'title'))
    var link = getTagContent(block, 'link').trim()
    var description = stripHtml(getTagContent(block, 'description')).slice(0, 300)
    var pubDate = getTagContent(block, 'pubDate')
    var source = getTagContent(block, 'source')

    // Google News wraps real URLs — the <link> is usually a redirect
    // Try to extract the actual URL from the redirect
    var realUrl = link
    if (link.includes('news.google.com')) {
      // Google News URLs contain the real URL in various formats
      var urlMatch = link.match(/url=([^&]+)/)
      if (urlMatch) {
        try { realUrl = decodeURIComponent(urlMatch[1]) } catch { realUrl = link }
      }
    }

    if (title && realUrl) {
      results.push({
        title: title,
        url: realUrl,
        description: description,
        source: stripHtml(source) || getDomain(realUrl),
        pubDate: pubDate,
        domain: getDomain(realUrl),
      })
    }
    pos = e + 7
  }
  return results
}

/**
 * Search Google News RSS for articles on a topic.
 * Returns articles from scrapable sources only.
 */
export async function searchGoogleNews(query, maxResults = 15) {
  var encoded = encodeURIComponent(query)
  var feedUrl = 'https://news.google.com/rss/search?q=' + encoded + '&hl=en-US&gl=US&ceid=US:en'

  try {
    var res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WCPO/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.log('Google News RSS error: HTTP ' + res.status)
      return []
    }
    var xml = await res.text()
    var items = parseGoogleNewsItems(xml)

    // Filter to scrapable sources
    var filtered = items.filter(function(item) { return isScrapable(item.url) })
    console.log('Google News: ' + items.length + ' total, ' + filtered.length + ' scrapable for "' + query + '"')
    return filtered.slice(0, maxResults)
  } catch (err) {
    console.log('Google News search failed: ' + err.message)
    return []
  }
}

// ─── Curated RSS Feeds ──────────────────────────────────────────────────────

var CURATED_FEEDS = EXTENDED_NATIONAL_FEEDS

var WCPO_FEEDS = WCPO_INGEST_FEEDS.slice(0, 2) // news + local-news only for source discovery

function parseFeedItems(xml, feedName) {
  var results = []
  var pos = 0
  while (results.length < 15) {
    var s = xml.indexOf('<item', pos)
    if (s === -1) break
    var e = xml.indexOf('</item>', s)
    if (e === -1) break
    var block = xml.substring(s, e)
    var title = stripHtml(getTagContent(block, 'title'))
    var link = getTagContent(block, 'link').trim()
    if (!link) {
      var linkMatch = block.match(/<link\s*\/?>\s*(https?:\/\/[^\s<]+)/i)
      if (linkMatch) link = linkMatch[1].trim()
    }
    var desc = stripHtml(getTagContent(block, 'description')).slice(0, 200)
    if (title && link && link.startsWith('http')) {
      results.push({
        title: title,
        url: link,
        description: desc,
        source: feedName,
        domain: getDomain(link),
      })
    }
    pos = e + 7
  }
  return results
}

async function fetchFeed(feed) {
  try {
    var res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WCPO/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    var xml = await res.text()
    return parseFeedItems(xml, feed.name)
  } catch {
    return []
  }
}

/**
 * Search all sources for articles on a topic.
 * Combines Google News search + curated RSS feeds + WCPO local feeds.
 * Returns deduplicated, scrapable articles sorted by relevance.
 */
export async function discoverArticles(topicQuery, keywords = []) {
  // Build search queries
  var queries = [
    topicQuery + ' Cincinnati',
    topicQuery + ' Ohio',
  ]
  if (keywords.length > 0) {
    queries.push(keywords.slice(0, 2).join(' ') + ' Cincinnati')
  }

  // Run all searches in parallel
  var results = await Promise.all([
    // Google News searches
    ...queries.map(function(q) { return searchGoogleNews(q, 10) }),
    // Curated feeds (we'll keyword-filter these)
    ...CURATED_FEEDS.map(fetchFeed),
    // WCPO local feeds
    ...WCPO_FEEDS.map(fetchFeed),
  ])

  var allArticles = results.flat()

  // Keyword-filter curated feed articles (they come in as full feeds, not topic-specific)
  var topicWords = topicQuery.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 3 })
  var keyWords = keywords.map(function(k) { return k.toLowerCase() })
  var allFilterWords = topicWords.concat(keyWords)

  var filtered = allArticles.filter(function(article) {
    var text = (article.title + ' ' + article.description).toLowerCase()
    // Google News results are already topic-filtered, keep them all
    if (article.source === 'Google News') return true
    // For RSS feeds, require at least one keyword match
    return allFilterWords.some(function(w) { return text.includes(w) })
  })

  // Deduplicate by domain + rough title match
  var seen = new Set()
  var unique = filtered.filter(function(article) {
    var key = article.domain + ':' + article.title.toLowerCase().slice(0, 40)
    if (seen.has(key)) return false
    // Also dedupe by URL
    if (seen.has(article.url)) return false
    seen.add(key)
    seen.add(article.url)
    return true
  })

  console.log('Discovery: ' + allArticles.length + ' total → ' + filtered.length + ' relevant → ' + unique.length + ' unique')
  return unique
}

/**
 * Fetch and extract article text from a URL.
 * Returns { title, author, description, content, ogImage, siteName } or null on failure.
 */
export async function fetchArticle(url) {
  try {
    var res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    var html = await res.text()
    if (html.length < 500) return null

    // Use extractArticleMeta from pipeline (imported dynamically to avoid circular deps)
    var { extractArticleMeta } = await import('./pipeline.mjs')
    var meta = extractArticleMeta(html)
    var text = stripHtml(meta.content || html)
    if (text.length < 100) text = stripHtml(html)
    if (text.length < 100) return null

    return {
      title: meta.title,
      author: meta.author,
      description: meta.description,
      content: text,
      rawHtml: meta.content || html,
      ogImage: meta.ogImage,
      siteName: meta.siteName || getDomain(url),
      finalUrl: res.url || url,
    }
  } catch (err) {
    console.log('Failed to fetch article: ' + url + ' — ' + err.message)
    return null
  }
}
