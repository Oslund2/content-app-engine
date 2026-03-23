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
