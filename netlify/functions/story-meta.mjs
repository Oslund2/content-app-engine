// Netlify Function — Story metadata JSON endpoint for CMS integration
// Returns headline, subhead, and image_url for a published story
// GET /api/story-meta?story=slug

export default async (request) => {
  var jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: jsonHeaders })
  }

  var url = new URL(request.url)
  var storyId = url.searchParams.get('story')

  if (!storyId) {
    return new Response(JSON.stringify({ error: 'Missing ?story= parameter' }), { status: 400, headers: jsonHeaders })
  }

  var supabaseUrl = process.env.VITE_SUPABASE_URL
  var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: jsonHeaders })
  }

  try {
    var res = await fetch(
      supabaseUrl + '/rest/v1/generated_stories?story_id=eq.' + encodeURIComponent(storyId) + '&status=eq.published&select=story_id,headline,subhead,image_url&limit=1',
      { headers: { apikey: supabaseKey, Authorization: 'Bearer ' + supabaseKey } }
    )

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Database error' }), { status: 502, headers: jsonHeaders })
    }

    var rows = await res.json()

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Story not found' }), { status: 404, headers: jsonHeaders })
    }

    var story = rows[0]
    var headline = story.headline || ''
    var subhead = story.subhead || ''

    return new Response(JSON.stringify({
      story_id: story.story_id,
      headline: headline,
      headline_length: headline.length,
      subhead: subhead,
      subhead_length: subhead.length,
      image_url: story.image_url || null,
    }), { status: 200, headers: jsonHeaders })

  } catch (e) {
    console.error('story-meta error:', e)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: jsonHeaders })
  }
}

export var config = { path: '/api/story-meta' }
