// src/services/patent/patentWorkflowOrchestrator.js
import { supabase } from '../../lib/supabase'

export async function getPatentStrength(applicationId) {
  const { data: app } = await supabase.from('patent_applications').select('*').eq('id', applicationId).single()
  if (!app) throw new Error('Application not found')

  const missingItems = []
  let completedSections = 0
  const totalSections = 7

  if (!app.field_of_invention) missingItems.push('Field of Invention'); else completedSections++
  if (!app.background_art) missingItems.push('Background'); else completedSections++
  if (!app.summary_invention) missingItems.push('Summary'); else completedSections++
  if (!app.detailed_description) missingItems.push('Detailed Description'); else completedSections++
  if (!app.abstract) missingItems.push('Abstract'); else completedSections++

  const { count: claimsCount } = await supabase.from('patent_claims').select('*', { count: 'exact', head: true }).eq('application_id', applicationId)
  if (!claimsCount) missingItems.push('Patent Claims'); else completedSections++

  const { count: drawingsCount } = await supabase.from('patent_drawings').select('*', { count: 'exact', head: true }).eq('application_id', applicationId)
  if (!drawingsCount) missingItems.push('Patent Drawings'); else completedSections++

  return {
    overallScore: app.novelty_score || 0,
    approvalProbability: 0,
    readinessPercentage: Math.round((completedSections / totalSections) * 100),
    missingItems,
  }
}
