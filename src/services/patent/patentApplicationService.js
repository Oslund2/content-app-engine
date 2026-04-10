// src/services/patent/patentApplicationService.js
// Patent Application CRUD operations
import { supabase, getSessionId } from '../../lib/supabase'

const VALID_PATENT_COLUMNS = new Set([
  'title', 'status', 'abstract', 'specification', 'field_of_invention',
  'background_art', 'summary_invention', 'detailed_description',
  'prior_art_search_status', 'prior_art_search_completed_at',
  'novelty_score', 'novelty_analysis_id', 'differentiation_analysis',
  'claims_generation_status', 'drawings_generation_status',
  'specification_generation_status', 'full_application_status',
  'metadata', 'inventors', 'entity_status', 'correspondence_address',
  'attorney_info', 'cpc_classification', 'updated_at',
])

export async function getPatentApplications() {
  // Try session-based first, fall back to loading all if none found
  const sessionId = getSessionId()
  const { data: sessionApps, error: sessionErr } = await supabase
    .from('patent_applications')
    .select('*')
    .eq('session_id', sessionId)
    .order('updated_at', { ascending: false })

  if (sessionErr) {
    // session_id column may not exist yet — fall back to loading all
    const { data, error } = await supabase
      .from('patent_applications')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  // If session has apps, return those; otherwise return all (for IP Shield compat)
  if (sessionApps && sessionApps.length > 0) return sessionApps

  const { data: allApps, error: allErr } = await supabase
    .from('patent_applications')
    .select('*')
    .order('updated_at', { ascending: false })
  if (allErr) throw allErr
  return allApps || []
}

export async function getPatentApplication(applicationId) {
  const { data: application, error: appError } = await supabase
    .from('patent_applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle()
  if (appError) throw appError
  if (!application) return null

  const { data: claims } = await supabase
    .from('patent_claims')
    .select('*')
    .eq('application_id', applicationId)
    .order('claim_number', { ascending: true })

  const { data: drawings } = await supabase
    .from('patent_drawings')
    .select('*')
    .eq('application_id', applicationId)
    .order('figure_number', { ascending: true })

  // Try both table names (IP Shield uses patent_prior_art_search_results, new schema uses patent_prior_art_results)
  let priorArt = null
  const { data: pa1 } = await supabase
    .from('patent_prior_art_results')
    .select('*')
    .eq('application_id', applicationId)
    .order('relevance_score', { ascending: false })
  if (pa1 && pa1.length > 0) {
    priorArt = pa1
  } else {
    const { data: pa2 } = await supabase
      .from('patent_prior_art_search_results')
      .select('*')
      .eq('patent_application_id', applicationId)
      .order('relevance_score', { ascending: false })
    priorArt = pa2
  }

  return {
    ...application,
    inventors: application.inventors || [],
    correspondence_address: application.correspondence_address || null,
    claims: claims || [],
    drawings: drawings || [],
    priorArt: priorArt || [],
  }
}

export async function createPatentApplication(data) {
  const sessionId = getSessionId()
  const { data: application, error } = await supabase
    .from('patent_applications')
    .insert([{
      session_id: sessionId,
      title: data.title || 'Untitled Patent Application',
      status: 'draft',
      specification: data.specification || null,
      abstract: data.abstract || null,
      field_of_invention: data.technicalField || data.field_of_invention || null,
      detailed_description: data.inventionDescription || data.detailed_description || null,
      metadata: {
        filing_type: data.filing_type || 'provisional',
        inventor_name: data.inventor_name || null,
        inventor_citizenship: data.inventor_citizenship || 'US Citizen',
        problem_solved: data.problemSolved || data.problem_solved || null,
        key_features: data.keyFeatures || data.key_features || [],
      },
    }])
    .select()
    .single()
  if (error) throw error
  return application
}

export async function updatePatentApplication(applicationId, updates) {
  const safeUpdates = { updated_at: new Date().toISOString() }
  for (const [key, value] of Object.entries(updates)) {
    if (VALID_PATENT_COLUMNS.has(key)) safeUpdates[key] = value
  }
  const { error } = await supabase.from('patent_applications').update(safeUpdates).eq('id', applicationId)
  if (error) throw error
}

export async function deletePatentApplication(applicationId) {
  const { error } = await supabase.from('patent_applications').delete().eq('id', applicationId)
  if (error) throw error
}

// --- Claims CRUD ---
export async function createPatentClaim(applicationId, claim) {
  const { data, error } = await supabase.from('patent_claims').insert([{ application_id: applicationId, ...claim }]).select().single()
  if (error) throw error
  return data
}

export async function updatePatentClaim(claimId, updates) {
  const { error } = await supabase.from('patent_claims').update(updates).eq('id', claimId)
  if (error) throw error
}

export async function deletePatentClaim(claimId) {
  const { error } = await supabase.from('patent_claims').delete().eq('id', claimId)
  if (error) throw error
}

// --- Drawings CRUD ---
export async function createPatentDrawing(applicationId, drawing) {
  const { data, error } = await supabase.from('patent_drawings').insert([{ application_id: applicationId, ...drawing }]).select().single()
  if (error) throw new Error(`Failed to create patent drawing: ${error.message}`)
  return data
}

export async function updatePatentDrawing(drawingId, updates) {
  const { error } = await supabase.from('patent_drawings').update(updates).eq('id', drawingId)
  if (error) throw error
}

export async function deletePatentDrawing(drawingId) {
  const { error } = await supabase.from('patent_drawings').delete().eq('id', drawingId)
  if (error) throw error
}

export async function deleteAllDrawingsForApplication(applicationId) {
  const { error } = await supabase.from('patent_drawings').delete().eq('application_id', applicationId)
  if (error) throw new Error(`Failed to delete existing drawings: ${error.message}`)
}

// --- Utility functions ---
export function countWords(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

export function validateAbstract(abstract) {
  const wordCount = countWords(abstract)
  if (wordCount === 0) return { valid: false, wordCount, message: 'Abstract is required' }
  if (wordCount > 150) return { valid: false, wordCount, message: `Abstract exceeds 150 word limit (${wordCount} words)` }
  if (wordCount < 50) return { valid: false, wordCount, message: `Abstract is too short — USPTO requires a complete summary (min ~50 words)` }
  return { valid: true, wordCount, message: `${wordCount}/150 words` }
}

export function getFilingTypeLabel(type) {
  const labels = { provisional: 'Provisional Application', non_provisional: 'Non-Provisional Application', continuation: 'Continuation Application', cip: 'Continuation-in-Part (CIP)', divisional: 'Divisional Application' }
  return labels[type] || type
}

export function getStatusLabel(status) {
  const labels = { draft: 'Draft', in_review: 'In Review', ready_to_file: 'Ready to File', filed: 'Filed', pending: 'Pending at USPTO', granted: 'Granted', rejected: 'Rejected', abandoned: 'Abandoned' }
  return labels[status] || status
}

export function getStatusColor(status) {
  const colors = { draft: 'bg-gray-100 text-gray-800', in_review: 'bg-yellow-100 text-yellow-800', ready_to_file: 'bg-blue-100 text-blue-800', filed: 'bg-indigo-100 text-indigo-800', pending: 'bg-orange-100 text-orange-800', granted: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', abandoned: 'bg-gray-200 text-gray-600' }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
