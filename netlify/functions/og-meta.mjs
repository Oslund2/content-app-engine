// Netlify Function — Dynamic OpenGraph meta tags for social sharing
// Serves server-rendered HTML with og:title, og:description, og:image for social crawlers
// GET /api/og?story=slug or /api/og?topic=slug

export default async (request) => {
  var url = new URL(request.url)
  var storyId = url.searchParams.get('story')
  var topicSlug = url.searchParams.get('topic')
  var headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' }

  if (!storyId && !topicSlug) {
    return new Response('Missing ?story= or ?topic= parameter', { status: 400, headers })
  }

  var supabaseUrl = process.env.VITE_SUPABASE_URL
  var supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  var title = 'WCPO 9 News | Interactive Stories'
  var description = 'Explore interactive news stories from WCPO Cincinnati.'
  var image = ''
  var canonical = 'https://content-app-engine.netlify.app/'

  if (supabaseUrl && supabaseKey && storyId) {
    canonical += '?story=' + encodeURIComponent(storyId)
    try {
      var res = await fetch(
        supabaseUrl + '/rest/v1/generated_stories?story_id=eq.' + encodeURIComponent(storyId) + '&select=headline,subhead,image_url,category&limit=1',
        { headers: { apikey: supabaseKey, Authorization: 'Bearer ' + supabaseKey } }
      )
      if (res.ok) {
        var rows = await res.json()
        if (rows.length > 0) {
          title = rows[0].headline || title
          description = rows[0].subhead || ('Interactive ' + (rows[0].category || 'news') + ' story from WCPO Cincinnati')
          image = rows[0].image_url || ''
        }
      }
    } catch (e) {
      console.error('OG meta fetch error:', e)
    }
  }

  if (supabaseUrl && supabaseKey && topicSlug && !storyId) {
    canonical += '?topic=' + encodeURIComponent(topicSlug)
    try {
      var res2 = await fetch(
        supabaseUrl + '/rest/v1/topics?slug=eq.' + encodeURIComponent(topicSlug) + '&select=title,subtitle&limit=1',
        { headers: { apikey: supabaseKey, Authorization: 'Bearer ' + supabaseKey } }
      )
      if (res2.ok) {
        var rows2 = await res2.json()
        if (rows2.length > 0) {
          title = rows2[0].title || title
          description = rows2[0].subtitle || description
        }
      }
    } catch (e) {
      console.error('OG topic fetch error:', e)
    }
  }

  var safeTitle = escapeHtml(title)
  var safeDesc = escapeHtml(description)

  var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n'
    + '<meta charset="UTF-8">\n'
    + '<title>' + safeTitle + ' | WCPO Interactive</title>\n'
    + '<meta name="description" content="' + safeDesc + '">\n'
    + '<meta property="og:type" content="article">\n'
    + '<meta property="og:title" content="' + safeTitle + '">\n'
    + '<meta property="og:description" content="' + safeDesc + '">\n'
    + '<meta property="og:url" content="' + escapeHtml(canonical) + '">\n'
    + '<meta property="og:site_name" content="WCPO 9 News Interactive">\n'
    + (image ? '<meta property="og:image" content="' + escapeHtml(image) + '">\n' : '')
    + '<meta name="twitter:card" content="' + (image ? 'summary_large_image' : 'summary') + '">\n'
    + '<meta name="twitter:title" content="' + safeTitle + '">\n'
    + '<meta name="twitter:description" content="' + safeDesc + '">\n'
    + (image ? '<meta name="twitter:image" content="' + escapeHtml(image) + '">\n' : '')
    + '<link rel="canonical" href="' + escapeHtml(canonical) + '">\n'
    + '<meta http-equiv="refresh" content="0;url=' + escapeHtml(canonical) + '">\n'
    + '</head>\n<body>\n'
    + '<h1>' + safeTitle + '</h1>\n'
    + '<p>' + safeDesc + '</p>\n'
    + '<p><a href="' + escapeHtml(canonical) + '">View this interactive story</a></p>\n'
    + '</body>\n</html>'

  return new Response(html, { headers })
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export var config = { path: '/api/og' }
