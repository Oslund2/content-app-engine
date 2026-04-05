// Netlify function — Rights-free image search for story hero images
// GET /api/image-search?q=search+terms&count=12
// Searches Unsplash, NASA Images, and Pixabay (if key configured)
// All results are rights-free / public domain

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders() })
  }

  var url = new URL(request.url)
  var query = url.searchParams.get('q')
  var count = Math.min(parseInt(url.searchParams.get('count') || '12'), 20)

  if (!query) {
    return json({ error: 'Missing ?q= parameter' }, 400)
  }

  try {
    var results = await searchRightsFree(query, count)
    return json({ query, results })
  } catch (err) {
    console.error('Image search error:', err)
    return json({ error: err.message }, 500)
  }
}

async function searchRightsFree(query, count) {
  // Search multiple rights-free sources in parallel
  var promises = [
    searchUnsplash(query, count).catch(function () { return [] }),
    searchNasaImages(query, Math.min(count, 6)).catch(function () { return [] }),
  ]

  // Pixabay if API key configured
  var pixabayKey = process.env.PIXABAY_API_KEY
  if (pixabayKey) {
    promises.push(searchPixabay(query, count, pixabayKey).catch(function () { return [] }))
  }

  var all = await Promise.all(promises)
  var combined = []
  // Interleave results from different sources for variety
  var maxLen = Math.max.apply(null, all.map(function (a) { return a.length }))
  for (var i = 0; i < maxLen; i++) {
    for (var j = 0; j < all.length; j++) {
      if (all[j][i] && combined.length < count) {
        combined.push(all[j][i])
      }
    }
  }
  return combined.slice(0, count)
}

// --- Unsplash (free, no API key needed for public endpoint) ---
async function searchUnsplash(query, count) {
  var res = await fetch(
    'https://unsplash.com/napi/search/photos?query=' + encodeURIComponent(query) + '&per_page=' + Math.min(count, 12),
    {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en-US',
      },
      signal: AbortSignal.timeout(5000),
    }
  )
  if (!res.ok) return []
  var data = await res.json()
  return (data.results || []).map(function (photo) {
    return {
      url: photo.urls?.regular || photo.urls?.full || '',
      thumbnail: photo.urls?.small || photo.urls?.thumb || '',
      width: photo.width || 0,
      height: photo.height || 0,
      title: photo.alt_description || photo.description || '',
      source: 'unsplash.com',
      license: 'unsplash',
      credit: photo.user?.name || '',
      contextUrl: photo.links?.html || '',
    }
  }).filter(function (r) { return r.url })
}

// --- NASA Images API (public domain, no key needed) ---
async function searchNasaImages(query, count) {
  var res = await fetch(
    'https://images-api.nasa.gov/search?q=' + encodeURIComponent(query) + '&media_type=image',
    { signal: AbortSignal.timeout(5000) }
  )
  if (!res.ok) return []
  var data = await res.json()
  var items = (data.collection?.items || []).slice(0, count)
  return items.map(function (item) {
    var meta = item.data && item.data[0] || {}
    var link = item.links && item.links[0] || {}
    // Build medium-size URL from the href pattern
    var thumb = link.href || ''
    var medium = thumb.replace('~thumb.', '~medium.').replace('~small.', '~medium.')
    return {
      url: medium || thumb,
      thumbnail: thumb,
      width: 0,
      height: 0,
      title: meta.title || '',
      source: 'nasa.gov',
      license: 'nasa',
      credit: meta.photographer || meta.center || 'NASA',
      contextUrl: '',
    }
  }).filter(function (r) { return r.url })
}

// --- Pixabay (requires API key) ---
async function searchPixabay(query, count, apiKey) {
  var res = await fetch(
    'https://pixabay.com/api/?key=' + apiKey
    + '&q=' + encodeURIComponent(query)
    + '&image_type=photo&per_page=' + Math.min(count, 12)
    + '&safesearch=true',
    { signal: AbortSignal.timeout(5000) }
  )
  if (!res.ok) return []
  var data = await res.json()
  return (data.hits || []).map(function (hit) {
    return {
      url: hit.largeImageURL || hit.webformatURL || '',
      thumbnail: hit.previewURL || hit.webformatURL || '',
      width: hit.imageWidth || 0,
      height: hit.imageHeight || 0,
      title: hit.tags || '',
      source: 'pixabay.com',
      license: 'pixabay',
      credit: hit.user || '',
      contextUrl: hit.pageURL || '',
    }
  }).filter(function (r) { return r.url })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

export var config = { path: '/api/image-search' }
