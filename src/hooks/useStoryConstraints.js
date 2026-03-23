import { useState, useEffect } from 'react'
import { fetchStoryAnalysis } from '../lib/supabase'

const DEFAULT_CONSTRAINTS = {
  disableAds: false,
  disableGamification: false,
  disableDataViz: false,
  disablePolls: false,
  disableInterstitials: false,
  disableSponsoredInsights: false,
  requireCommunityFocus: false,
  requireCrisisResources: false,
  toneOverride: null,
}

export default function useStoryConstraints(storyId) {
  const [constraints, setConstraints] = useState(DEFAULT_CONSTRAINTS)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!storyId) { setLoading(false); return }

    let cancelled = false
    fetchStoryAnalysis(storyId).then(data => {
      if (cancelled) return
      if (data) {
        // Use editorial override if it exists, otherwise use AI constraints
        const dc = data.editorial_override?.designConstraints || data.design_constraints || DEFAULT_CONSTRAINTS
        setConstraints({ ...DEFAULT_CONSTRAINTS, ...dc })
        setAnalysis(data)
      }
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [storyId])

  return { constraints, analysis, loading }
}
