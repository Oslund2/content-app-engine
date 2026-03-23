// Netlify scheduled function — RSS feed ingestion
// Polls 5 WCPO RSS feeds every 15 minutes, deduplicates by guid, stores in rss_items table
// Uses regex-based XML parsing (no external dependencies)

const FEEDS = [
  { name: 'news', url: 'https://www.wcpo.com/news.rss' },
  { name: 'local-news', url: 'https://www.wcpo.com/news/local-news.rss' },
  { name: 'sports', url: 'https://www.wcpo.com/sports.rss' },
  { name: 'entertainment', url: 'https://www.wcpo.com/entertainment.rss' },
  { name: 'lifestyle', url: 'https://www.wcpo.com/lifestyle.rss' },
]

// Simple RSS XML extraction helpers (no external deps)
function extractTag(xml, tag) {
  // Handle both <tag>text</tag> and <tag><![CDATA[text]]></tag>
  const regex = new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*</${tag}>`, 'i')
  const match = xml.match(regex)
  if (!match) return ''
  return (match[1] || match[2] || '').trim()
}

function extractItems(xml) {
  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    items.push({
      title: extractTag(block, 'title'),
      link: extractTag(block, 'link'),
      description: extractTag(block, 'description'),
      contentEncoded: extractTag(block, 'content:encoded'),
      author: extractTag(block, 'author') || extractTag(block, 'dc:creator'),
      pubDate: extractTag(block, 'pubDate'),
      guid: extractTag(block, 'guid'),
    })
  }
  return items
}

function decodeEntities(str) {
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
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'WCPO-ContentAppEngine/1.0' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const items = extractItems(xml)

    return items.map(item => ({
      guid: item.guid || item.link || '',
      feed_name: feed.name,
      title: decodeEntities(item.title),
      link: item.link,
      description: decodeEntities(item.description),
      content_encoded: item.contentEncoded,
      author: decodeEntities(item.author),
      pub_date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    }))
  } catch (err) {
    console.error(`Failed to fetch ${feed.name}:`, err.message)
    return []
  }
}

async function upsertItems(items) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    return 0
  }

  let inserted = 0
  // Batch upsert in chunks of 25 to stay within payload limits
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25)
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rss_items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'resolution=ignore-duplicates,return=representation',
        },
        body: JSON.stringify(batch),
      })
      if (res.ok) {
        const data = await res.json()
        inserted += data.length
      } else {
        const err = await res.text()
        console.error('Supabase upsert error:', err)
      }
    } catch (err) {
      console.error('Upsert batch error:', err.message)
    }
  }
  return inserted
}

export default async (req) => {
  try {
  console.log('RSS ingestion starting...')

  // Fetch all feeds in parallel
  const feedResults = await Promise.all(FEEDS.map(fetchFeed))
  const allItems = feedResults.flat()

  console.log(`Fetched ${allItems.length} items from ${FEEDS.length} feeds`)

  if (allItems.length === 0) {
    return new Response(JSON.stringify({ message: 'No items fetched', inserted: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Deduplicate within this batch by guid
  const seen = new Set()
  const unique = allItems.filter(item => {
    if (!item.guid || seen.has(item.guid)) return false
    seen.add(item.guid)
    return true
  })

  const inserted = await upsertItems(unique)

  console.log(`Inserted ${inserted} new items (${unique.length} unique in batch)`)

  return new Response(JSON.stringify({
    message: 'RSS ingestion complete',
    fetched: allItems.length,
    unique: unique.length,
    inserted,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
  } catch (err) {
    console.error('RSS ingestion error:', err)
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
