// Netlify scheduled function — RSS feed ingestion
// Polls 5 WCPO RSS feeds every 15 minutes, deduplicates by guid, stores in rss_items table

const FEEDS = [
  { name: 'news', url: 'https://www.wcpo.com/news.rss' },
  { name: 'local-news', url: 'https://www.wcpo.com/news/local-news.rss' },
  { name: 'sports', url: 'https://www.wcpo.com/sports.rss' },
  { name: 'entertainment', url: 'https://www.wcpo.com/entertainment.rss' },
  { name: 'lifestyle', url: 'https://www.wcpo.com/lifestyle.rss' },
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
  // Strip CDATA wrapper if present
  if (raw.startsWith('<![CDATA[') && raw.endsWith(']]>')) {
    raw = raw.substring(9, raw.length - 3)
  }
  return raw.trim()
}

function parseItems(xml) {
  var results = []
  var searchFrom = 0
  while (true) {
    var itemStart = xml.indexOf('<item>', searchFrom)
    if (itemStart === -1) break
    var itemEnd = xml.indexOf('</item>', itemStart)
    if (itemEnd === -1) break
    var block = xml.substring(itemStart + 6, itemEnd)
    results.push({
      title: getTagContent(block, 'title'),
      link: getTagContent(block, 'link'),
      description: getTagContent(block, 'description'),
      contentEncoded: getTagContent(block, 'content:encoded'),
      author: getTagContent(block, 'author') || getTagContent(block, 'dc:creator'),
      pubDate: getTagContent(block, 'pubDate'),
      guid: getTagContent(block, 'guid'),
    })
    searchFrom = itemEnd + 7
  }
  return results
}

function clean(str) {
  if (!str) return ''
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

async function fetchFeed(feed) {
  try {
    var res = await fetch(feed.url, {
      headers: { 'User-Agent': 'WCPO-ContentAppEngine/1.0' },
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    var xml = await res.text()
    var items = parseItems(xml)

    return items.map(function(item) {
      return {
        guid: item.guid || item.link || '',
        feed_name: feed.name,
        title: clean(item.title),
        link: item.link,
        description: clean(item.description),
        content_encoded: item.contentEncoded,
        author: clean(item.author),
        pub_date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      }
    })
  } catch (err) {
    console.error('Failed to fetch ' + feed.name + ': ' + err.message)
    return []
  }
}

async function upsertItems(items) {
  var supabaseUrl = process.env.VITE_SUPABASE_URL
  var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    return 0
  }

  var inserted = 0
  for (var i = 0; i < items.length; i += 25) {
    var batch = items.slice(i, i + 25)
    try {
      var res = await fetch(supabaseUrl + '/rest/v1/rss_items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey,
          'Prefer': 'resolution=ignore-duplicates,return=representation',
        },
        body: JSON.stringify(batch),
      })
      if (res.ok) {
        var data = await res.json()
        inserted += data.length
      } else {
        var errText = await res.text()
        console.error('Supabase upsert error: ' + errText)
      }
    } catch (err) {
      console.error('Upsert batch error: ' + err.message)
    }
  }
  return inserted
}

export default async (req) => {
  try {
    console.log('RSS ingestion starting...')
    var feedResults = await Promise.all(FEEDS.map(fetchFeed))
    var allItems = feedResults.flat()
    console.log('Fetched ' + allItems.length + ' items from ' + FEEDS.length + ' feeds')

    if (allItems.length === 0) {
      return new Response(JSON.stringify({ message: 'No items fetched', inserted: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    var seen = new Set()
    var unique = allItems.filter(function(item) {
      if (!item.guid || seen.has(item.guid)) return false
      seen.add(item.guid)
      return true
    })

    var inserted = await upsertItems(unique)
    console.log('Inserted ' + inserted + ' new items (' + unique.length + ' unique)')

    return new Response(JSON.stringify({
      message: 'RSS ingestion complete',
      fetched: allItems.length,
      unique: unique.length,
      inserted: inserted,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('RSS ingestion error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config = {
  path: '/.netlify/functions/rss-ingest',
  schedule: '*/15 * * * *',
}
