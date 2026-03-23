// Netlify scheduled function — RSS feed ingestion
// Polls 5 WCPO RSS feeds every 15 minutes, deduplicates by guid, stores in rss_items table

import { XMLParser } from 'fast-xml-parser'

const FEEDS = [
  { name: 'news', url: 'https://www.wcpo.com/news.rss' },
  { name: 'local-news', url: 'https://www.wcpo.com/news/local-news.rss' },
  { name: 'sports', url: 'https://www.wcpo.com/sports.rss' },
  { name: 'entertainment', url: 'https://www.wcpo.com/entertainment.rss' },
  { name: 'lifestyle', url: 'https://www.wcpo.com/lifestyle.rss' },
]

const parser = new XMLParser({
  ignoreAttributes: false,
  cdataPropName: '__cdata',
  textNodeName: '__text',
})

function extractText(node) {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (node.__cdata) return node.__cdata
  if (node.__text) return node.__text
  return String(node)
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'WCPO-ContentAppEngine/1.0' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const parsed = parser.parse(xml)

    const channel = parsed?.rss?.channel
    if (!channel) return []

    const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean)

    return items.map(item => ({
      guid: extractText(item.guid) || item.link || '',
      feed_name: feed.name,
      title: extractText(item.title) || '',
      link: item.link || '',
      description: extractText(item.description) || '',
      content_encoded: extractText(item['content:encoded']) || '',
      author: extractText(item.author) || extractText(item['dc:creator']) || '',
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

export default async function handler(req) {
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
}

// Netlify scheduled function config
export const config = {
  schedule: '*/15 * * * *',
}
