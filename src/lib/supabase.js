import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Get or create a persistent session ID (anonymous user tracking)
export function getSessionId() {
  let id = localStorage.getItem('wcpo_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('wcpo_session_id', id)
  }
  return id
}

// --- Analytics ---

export async function logPageView(storyId, eventType = 'view') {
  const sessionId = getSessionId()
  const referrer = document.referrer || null
  const { error } = await supabase
    .from('page_views')
    .insert({ story_id: storyId, session_id: sessionId, referrer, event_type: eventType })
  if (error) console.error('Analytics error:', error)
}

export async function fetchStoryViewCounts() {
  const { data, error } = await supabase
    .rpc('get_story_view_counts')
    .catch(() => ({ data: null, error: { message: 'RPC not available' } }))

  // Fallback: manual aggregation if RPC doesn't exist
  if (error || !data) {
    const { data: views, error: viewErr } = await supabase
      .from('page_views')
      .select('story_id')
      .eq('event_type', 'view')
    if (viewErr || !views) return {}
    const counts = {}
    views.forEach(v => { counts[v.story_id] = (counts[v.story_id] || 0) + 1 })
    return counts
  }
  return data
}

export async function fetchRecentViews(days = 7) {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const { data, error } = await supabase
    .from('page_views')
    .select('story_id, event_type, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) return []
  return data
}

// --- Stories ---

export async function fetchStories() {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('publish_date', { ascending: false })
  if (error) {
    console.error('Error fetching stories:', error)
    return []
  }
  return data
}

export async function fetchStoriesByDate(date) {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('publish_date', date)
    .order('featured', { ascending: false })
  if (error) {
    console.error('Error fetching stories by date:', error)
    return []
  }
  return data
}

export async function fetchStoryDates() {
  const { data, error } = await supabase
    .from('stories')
    .select('publish_date')
    .order('publish_date', { ascending: false })
  if (error) return []
  // Unique dates
  const seen = new Set()
  return data.filter(d => {
    if (seen.has(d.publish_date)) return false
    seen.add(d.publish_date)
    return true
  }).map(d => d.publish_date)
}

// --- Saved Profiles ---

export async function saveProfile(storyId, profileData) {
  const sessionId = getSessionId()
  const { data, error } = await supabase
    .from('saved_profiles')
    .insert({
      story_id: storyId,
      session_id: sessionId,
      profile_data: profileData,
    })
    .select()
  if (error) {
    console.error('Error saving profile:', error)
    return null
  }
  return data[0]
}

export async function fetchMyProfiles() {
  const sessionId = getSessionId()
  const { data, error } = await supabase
    .from('saved_profiles')
    .select('*, stories(headline, category, category_color)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Error fetching profiles:', error)
    return []
  }
  return data
}

// --- Live Polls ---

export async function submitPollData(storyId, neighborhood, pollData) {
  const { error } = await supabase
    .from('story_polls')
    .insert({
      story_id: storyId,
      neighborhood: neighborhood || null,
      poll_data: pollData,
    })
  if (error) console.error('Error submitting poll:', error)
}

export async function fetchAllPollData() {
  const { data, error } = await supabase
    .from('story_polls')
    .select('story_id, neighborhood, poll_data')
  if (error) { console.error('Error fetching all polls:', error); return [] }
  return data
}

// --- Community Reflections ---

export async function submitReflection(storyId, commitment, message, neighborhood) {
  const sessionId = getSessionId()
  const { error } = await supabase
    .from('community_reflections')
    .insert({
      story_id: storyId,
      session_id: sessionId,
      commitment,
      message: message || null,
      neighborhood: neighborhood || null,
    })
  if (error) console.error('Error submitting reflection:', error)
  return !error
}

export async function fetchReflections(storyId) {
  const { data, error } = await supabase
    .from('community_reflections')
    .select('commitment, message, created_at')
    .eq('story_id', storyId)
    .eq('flagged', false)
    .order('created_at', { ascending: false })

  if (error || !data) return { total: 0, commitments: {}, messages: [] }

  const commitments = {}
  data.forEach(d => {
    commitments[d.commitment] = (commitments[d.commitment] || 0) + 1
  })

  const messages = data
    .filter(d => d.message)
    .slice(0, 10)
    .map(d => ({ text: d.message, time: d.created_at }))

  return { total: data.length, commitments, messages }
}

// --- Story Analyses ---

export async function fetchStoryAnalysis(storyId) {
  const { data, error } = await supabase
    .from('story_analyses')
    .select('*')
    .eq('story_id', storyId)
    .single()
  if (error) return null
  return data
}

export async function fetchAllAnalyses() {
  const { data, error } = await supabase
    .from('story_analyses')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function saveEditorialOverride(storyId, override) {
  const { error } = await supabase
    .from('story_analyses')
    .update({
      editorial_override: override,
      override_by: 'editor',
      override_at: new Date().toISOString(),
    })
    .eq('story_id', storyId)
  if (error) console.error('Error saving override:', error)
  return !error
}

// --- Live Polls ---

export async function fetchPollStats(storyId, neighborhood) {
  const { data, error } = await supabase
    .from('story_polls')
    .select('poll_data, neighborhood')
    .eq('story_id', storyId)

  if (error || !data) return null

  const total = data.length
  const neighborhoodData = neighborhood
    ? data.filter(d => d.neighborhood === neighborhood)
    : []
  const neighborhoodCount = neighborhoodData.length

  return { total, neighborhoodCount, allData: data, neighborhoodData }
}

// --- Generated Stories (RSS Pipeline) ---

export async function fetchGeneratedStories(status = 'published') {
  const { data, error } = await supabase
    .from('generated_stories')
    .select('*')
    .eq('status', status)
    .order('publish_date', { ascending: false })
  if (error) {
    console.error('Error fetching generated stories:', error)
    return []
  }
  return data
}

export async function fetchGeneratedStoriesByDate(date) {
  const { data, error } = await supabase
    .from('generated_stories')
    .select('*')
    .eq('status', 'published')
    .eq('publish_date', date)
    .order('featured', { ascending: false })
  if (error) {
    console.error('Error fetching generated stories by date:', error)
    return []
  }
  return data
}

export async function fetchGeneratedStoryBySlug(storyId) {
  const { data, error } = await supabase
    .from('generated_stories')
    .select('*')
    .eq('story_id', storyId)
    .eq('status', 'published')
    .single()
  if (error) return null
  return data
}

export async function fetchAllGeneratedStories() {
  const { data, error } = await supabase
    .from('generated_stories')
    .select('*, rss_items(title, link, feed_name)')
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function updateGeneratedStoryStatus(id, status, editorNotes) {
  const updates = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'published') {
    updates.approved_by = 'editor'
    updates.approved_at = new Date().toISOString()
    updates.publish_date = new Date().toISOString().split('T')[0]
  }
  if (editorNotes) updates.editor_notes = editorNotes

  const { error } = await supabase
    .from('generated_stories')
    .update(updates)
    .eq('id', id)
  if (error) console.error('Error updating story status:', error)
  return !error
}

export async function updateGeneratedStoryConfig(id, config) {
  const { error } = await supabase
    .from('generated_stories')
    .update({ config, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.error('Error updating story config:', error)
  return !error
}

export async function updateGeneratedStoryImage(id, imageUrl, config) {
  // Update both image_url column and config.hero.image to keep them in sync
  const updatedConfig = { ...config }
  if (!updatedConfig.hero) updatedConfig.hero = {}
  updatedConfig.hero.image = imageUrl || null
  // Also update hero block inside blocks array if present
  if (Array.isArray(updatedConfig.blocks)) {
    const heroBlock = updatedConfig.blocks.find(b => b.type === 'hero')
    if (heroBlock) heroBlock.image = imageUrl || null
  }

  const { error } = await supabase
    .from('generated_stories')
    .update({
      image_url: imageUrl || null,
      config: updatedConfig,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) console.error('Error updating story image:', error)
  return !error
}

// --- RSS Items (Pipeline Dashboard) ---

export async function fetchRssItemById(id) {
  const { data, error } = await supabase
    .from('rss_items')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function fetchGeneratedStoryByRssItemId(rssItemId) {
  const { data, error } = await supabase
    .from('generated_stories')
    .select('*')
    .eq('rss_item_id', rssItemId)
    .single()
  if (error) return null
  return data
}

export async function fetchRssItems(processed = null) {
  let query = supabase
    .from('rss_items')
    .select('*')
    .order('pub_date', { ascending: false })
    .limit(100)

  if (processed !== null) {
    query = query.eq('processed', processed)
  }
  const { data, error } = await query
  if (error) return []
  return data
}

export async function fetchSkippedRssItems() {
  const { data, error } = await supabase
    .from('rss_items')
    .select('*')
    .eq('processed', true)
    .not('skip_reason', 'is', null)
    .order('pub_date', { ascending: false })
    .limit(50)
  if (error) return []
  return data
}

// --- App Types ---

export async function fetchAppTypes() {
  const { data, error } = await supabase
    .from('app_types')
    .select('*')
  if (error) return []
  return data
}

// --- Topics ---

export async function fetchTopics(status = 'published') {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function fetchAllTopics() {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function fetchTopicBySlug(slug) {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (error) return null
  return data
}

export async function fetchStoriesByTopic(topicSlug) {
  const { data, error } = await supabase
    .from('generated_stories')
    .select('*')
    .eq('topic_slug', topicSlug)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function assignStoryToTopic(storyId, topicSlug) {
  const { error } = await supabase
    .from('generated_stories')
    .update({ topic_slug: topicSlug, updated_at: new Date().toISOString() })
    .eq('id', storyId)
  return !error
}

export async function upsertTopic(topic) {
  const { data, error } = await supabase
    .from('topics')
    .upsert(topic, { onConflict: 'slug' })
    .select()
  if (error) { console.error('Upsert topic error:', error); return null }
  return data?.[0]
}

export async function fetchAllStoriesByTopic(topicSlug) {
  const { data, error } = await supabase
    .from('generated_stories')
    .select('*')
    .eq('topic_slug', topicSlug)
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function publishTopicAndStories(topicSlug) {
  const now = new Date().toISOString()
  const today = now.split('T')[0]
  // Publish the topic
  await supabase.from('topics').update({ status: 'published', updated_at: now }).eq('slug', topicSlug)
  // Publish all its stories
  await supabase.from('generated_stories')
    .update({ status: 'published', publish_date: today, updated_at: now })
    .eq('topic_slug', topicSlug)
    .neq('status', 'rejected')
}
