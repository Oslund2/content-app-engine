// Netlify scheduled function — RSS feed ingestion
// Polls 5 WCPO RSS feeds every 15 minutes, deduplicates by guid, stores in rss_items table

import { WCPO_FEEDS } from './lib/feeds.mjs'

function getFeeds() {
  return WCPO_FEEDS
}

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

// Pull a url="…" attribute out of a self-closing or paired tag like <media:content … />
function getAttrUrl(block, tagName) {
  var re = new RegExp('<' + tagName + '\\b[^>]*\\burl=["\']([^"\']+)["\']', 'i')
  var m = block.match(re)
  return m ? m[1] : ''
}

// Find the first <img src="…"> in a chunk of HTML/CDATA
function getFirstImgSrc(html) {
  if (!html) return ''
  var m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return m ? m[1] : ''
}

// Extract an image URL from an RSS item using the common feed conventions.
// Order: media:content > media:thumbnail > enclosure (image/*) >
//        <img> in content:encoded > <img> in description.
// Anything found is considered rights-cleared by the publisher.
function extractItemImage(block, contentEncoded, description) {
  var url = getAttrUrl(block, 'media:content')
    || getAttrUrl(block, 'media:thumbnail')
  if (url) return url

  // <enclosure url="…" type="image/jpeg" />
  var encMatch = block.match(/<enclosure\b[^>]*\burl=["']([^"']+)["'][^>]*\btype=["']image\/[^"']+["']/i)
    || block.match(/<enclosure\b[^>]*\btype=["']image\/[^"']+["'][^>]*\burl=["']([^"']+)["']/i)
  if (encMatch) return encMatch[1]

  return getFirstImgSrc(contentEncoded) || getFirstImgSrc(description) || ''
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
    var description = getTagContent(block, 'description')
    var contentEncoded = getTagContent(block, 'content:encoded')
    results.push({
      title: getTagContent(block, 'title'),
      link: getTagContent(block, 'link'),
      description: description,
      contentEncoded: contentEncoded,
      author: getTagContent(block, 'author') || getTagContent(block, 'dc:creator'),
      pubDate: getTagContent(block, 'pubDate'),
      guid: getTagContent(block, 'guid'),
      imageUrl: extractItemImage(block, contentEncoded, description),
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

// Scrape og:image from an article page (fast, single meta tag)
async function scrapeOgImage(url) {
  if (!url) return null
  try {
    var res = await fetch(url, {
      headers: { 'User-Agent': 'WCPO-ContentAppEngine/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    // Read first 200KB — WCPO pages have ~150KB of inline JS before og:image
    var reader = res.body.getReader()
    var chunks = []
    var totalLen = 0
    while (totalLen < 200000) {
      var result = await reader.read()
      if (result.done) break
      chunks.push(result.value)
      totalLen += result.value.length
    }
    reader.cancel().catch(function () {})
    var html = new TextDecoder().decode(Buffer.concat(chunks))
    var m = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    return m ? m[1] : null
  } catch (e) {
    return null
  }
}

async function fetchFeed(feed) {
  try {
    var res = await fetch(feed.url, {
      headers: { 'User-Agent': 'WCPO-ContentAppEngine/1.0' },
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    var xml = await res.text()
    var items = parseItems(xml)

    var rows = items.map(function(item) {
      return {
        guid: item.guid || item.link || '',
        feed_name: feed.name,
        title: clean(item.title),
        link: item.link,
        description: clean(item.description),
        content_encoded: item.contentEncoded,
        author: clean(item.author),
        pub_date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        image_url: item.imageUrl || null,
      }
    })

    // For items missing an image, scrape og:image from the article page
    // Process in parallel batches of 5 to stay fast
    var needImage = rows.filter(function (r) { return !r.image_url && r.link })
    for (var i = 0; i < needImage.length; i += 5) {
      var batch = needImage.slice(i, i + 5)
      var ogImages = await Promise.all(batch.map(function (r) { return scrapeOgImage(r.link) }))
      batch.forEach(function (r, j) {
        if (ogImages[j]) r.image_url = ogImages[j]
      })
    }

    return rows
  } catch (err) {
    console.error('Failed to fetch ' + feed.name + ': ' + err.message)
    return []
  }
}

async function upsertItems(items) {
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')
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
  console.log('RSS ingestion starting...')

  var feeds = getFeeds()
  var feedResults = await Promise.all(feeds.map(fetchFeed))
  var allItems = feedResults.flat()
  console.log('Fetched ' + allItems.length + ' items from ' + feeds.length + ' feeds')

  if (allItems.length === 0) {
    console.log('No items fetched')
    return
  }

  var seen = new Set()
  var unique = allItems.filter(function(item) {
    if (!item.guid || seen.has(item.guid)) return false
    seen.add(item.guid)
    return true
  })

  var inserted = await upsertItems(unique)
  console.log('Inserted ' + inserted + ' new items (' + unique.length + ' unique)')

  // Backfill: patch unprocessed items missing images by scraping og:image
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (supabaseUrl && supabaseKey) {
    try {
      var res = await fetch(supabaseUrl + '/rest/v1/rss_items?processed=eq.false&image_url=is.null&limit=10&order=pub_date.desc', {
        headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey },
      })
      var missing = res.ok ? await res.json() : []
      var patched = 0
      for (var i = 0; i < missing.length; i++) {
        var ogImg = await scrapeOgImage(missing[i].link)
        if (ogImg) {
          await fetch(supabaseUrl + '/rest/v1/rss_items?id=eq.' + missing[i].id, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': 'Bearer ' + supabaseKey,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ image_url: ogImg }),
          })
          patched++
        }
      }
      if (patched > 0) console.log('Backfilled ' + patched + ' images on existing items')
    } catch (err) {
      console.error('Backfill error: ' + err.message)
    }
  }
}

export const config = {
  schedule: '*/15 * * * *',
}
