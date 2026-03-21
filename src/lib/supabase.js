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
