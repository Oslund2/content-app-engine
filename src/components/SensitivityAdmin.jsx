import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, AlertTriangle, AlertOctagon, CheckCircle2, Loader2,
  ChevronDown, ChevronUp, Zap, RefreshCw, XCircle
} from 'lucide-react'
import { fetchAllAnalyses, fetchStories } from '../lib/supabase'
import { narrationText } from '../lib/narrationText'
import storyData from '../storyData.json'

const levelColors = {
  low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2 },
  moderate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: AlertOctagon },
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertOctagon },
}

const treatmentLabels = {
  'standard-interactive': 'Standard Interactive',
  'sensitive-community': 'Sensitive / Community',
  'do-not-convert': 'Do Not Convert',
}

// For community-response, use the actual article text since it's not in narrationText
const extraTexts = {
  'community-response': `A 15-year-old boy was killed early Sunday morning in Avondale, the Cincinnati Police Department said. At approximately 12:02 a.m. Sunday, officers were dispatched to the 800 block of Glenwood Avenue near Reading Road for reports of a shooting. When officers arrived, they found a person with a gunshot wound. The Cincinnati Fire Department pronounced the person dead at the scene. Police identified the victim as 15-year-old Nazir Owens. No suspects have been identified in the shooting. The Cincinnati Police Department's Homicide Unit is investigating the shooting.`,
  'neighborhood-pulse': `The Pulse of Cincinnati. Every interaction builds this picture. See how your neighborhood compares across every story — safety scores, fire readiness, commute costs, draft picks, and more aggregated into a community dashboard.`,
}

export default function SensitivityAdmin() {
  const [analyses, setAnalyses] = useState([])
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [batchRunning, setBatchRunning] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const [a, s] = await Promise.all([fetchAllAnalyses(), fetchStories()])
      setAnalyses(a)
      // Map DB rows to match storyData format
      const mapped = s.length > 0 ? s.map(r => ({
        id: r.id, headline: r.headline, subhead: r.subhead,
        category: r.category, image: r.image,
      })) : storyData.stories
      setStories(mapped)
      setLoading(false)
    }
    load()
  }, [])

  const getStoryText = (story) => {
    // Use narration text (richest content) → extra texts → fallback to headline+subhead
    return narrationText[story.id]
      || extraTexts[story.id]
      || `${story.headline || ''}. ${story.subhead || ''}`
  }

  const analyzeStory = async (story) => {
    setAnalyzing(story.id)
    setError(null)
    try {
      const text = getStoryText(story)
      const res = await fetch('/.netlify/functions/analyze-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: story.id,
          storyText: text,
          headline: story.headline,
          category: story.category,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(`${story.id}: ${data.error}`)
      } else if (data.analysis) {
        // Use the analysis directly from the API response (in case Supabase persist failed)
        const a = data.analysis
        const record = {
          story_id: story.id,
          sensitivity_level: a.sensitivityLevel,
          recommended_treatment: a.recommendedTreatment,
          design_constraints: a.designConstraints,
          suggested_focus: a.suggestedFocus,
          flags: a.flags,
          reasoning: a.reasoning,
          publisher_advisory: a.publisherAdvisory,
          model_used: 'claude-sonnet-4-6',
          created_at: new Date().toISOString(),
        }
        setAnalyses(prev => {
          const without = prev.filter(x => x.story_id !== story.id)
          return [record, ...without]
        })
        // Also try to refresh from Supabase in background
        fetchAllAnalyses().then(updated => {
          if (updated.length > 0) setAnalyses(updated)
        })
      }
    } catch (e) {
      setError(`${story.id}: ${e.message}`)
    }
    setAnalyzing(null)
  }

  const batchAnalyze = async () => {
    setBatchRunning(true)
    setError(null)
    for (const story of stories) {
      await analyzeStory(story)
    }
    setBatchRunning(false)
  }

  const getAnalysis = (storyId) => analyses.find(a => a.story_id === storyId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-ink-muted" size={24} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-ink-muted">
            {analyses.length} of {stories.length} stories analyzed
          </p>
        </div>
        <button
          onClick={batchAnalyze}
          disabled={batchRunning || analyzing}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white
            hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2"
        >
          {batchRunning
            ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</>
            : <><Zap size={14} /> Analyze All</>
          }
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-red-700 font-medium">Analysis Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {stories.map(story => {
          const analysis = getAnalysis(story.id)
          const isExpanded = expanded === story.id
          const isAnalyzing = analyzing === story.id
          const level = analysis ? levelColors[analysis.sensitivity_level] : null
          const LevelIcon = level?.icon

          return (
            <div key={story.id} className="border border-rule rounded-lg overflow-hidden bg-white">
              <div
                className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : story.id)}
              >
                <div className="w-20 shrink-0">
                  {isAnalyzing ? (
                    <Loader2 size={14} className="animate-spin text-ink-muted" />
                  ) : analysis ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${level.bg} ${level.text} ${level.border} border`}>
                      <LevelIcon size={10} />
                      {analysis.sensitivity_level}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-ink-muted uppercase">Pending</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{story.headline}</p>
                  <p className="text-xs text-ink-muted">{story.category}</p>
                </div>

                <div className="hidden sm:block w-40 text-right">
                  {analysis && (
                    <span className="text-xs text-ink-muted">
                      {treatmentLabels[analysis.recommended_treatment]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!analysis && !isAnalyzing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); analyzeStory(story) }}
                      className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      Analyze
                    </button>
                  )}
                  {analysis && !isAnalyzing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); analyzeStory(story) }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600"
                      title="Re-analyze"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                  {isExpanded ? <ChevronUp size={14} className="text-ink-muted" /> : <ChevronDown size={14} className="text-ink-muted" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && analysis && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-rule space-y-3">
                      {analysis.flags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.flags.map(flag => (
                            <span key={flag} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">Reasoning</p>
                        <p className="text-sm text-ink-light leading-relaxed">{analysis.reasoning}</p>
                      </div>

                      <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">Publisher Advisory</p>
                        <p className="text-sm text-amber-900 leading-relaxed">{analysis.publisher_advisory}</p>
                      </div>

                      {analysis.suggested_focus && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">Suggested Focus</p>
                          <p className="text-sm text-ink-light italic">{analysis.suggested_focus}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">Design Constraints</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(analysis.design_constraints || {}).map(([key, val]) => {
                            if (key === 'toneOverride') {
                              if (!val) return null
                              return (
                                <span key={key} className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-50 text-violet-700 border border-violet-200">
                                  tone: {val}
                                </span>
                              )
                            }
                            return (
                              <span
                                key={key}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border
                                  ${val ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}
                              >
                                {val ? 'ON' : 'off'} {key}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      <p className="text-[10px] text-ink-muted">
                        Model: {analysis.model_used} | Analyzed: {new Date(analysis.created_at).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
