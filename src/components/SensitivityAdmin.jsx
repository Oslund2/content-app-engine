import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, AlertTriangle, AlertOctagon, CheckCircle2, Loader2,
  ChevronDown, ChevronUp, ArrowLeft, Zap, RefreshCw
} from 'lucide-react'
import { fetchAllAnalyses, fetchStories } from '../lib/supabase'
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

export default function SensitivityAdmin({ onBack }) {
  const [analyses, setAnalyses] = useState([])
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(null) // storyId being analyzed
  const [expanded, setExpanded] = useState(null)
  const [batchRunning, setBatchRunning] = useState(false)

  useEffect(() => {
    async function load() {
      const [a, s] = await Promise.all([fetchAllAnalyses(), fetchStories()])
      setAnalyses(a)
      setStories(s.length > 0 ? s : storyData.stories)
      setLoading(false)
    }
    load()
  }, [])

  const analyzeStory = async (story) => {
    setAnalyzing(story.id)
    try {
      // Build story text from available data
      const text = `${story.headline || ''}. ${story.subhead || ''}`
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
      if (data.analysis) {
        // Refresh analyses
        const updated = await fetchAllAnalyses()
        setAnalyses(updated)
      }
    } catch (e) {
      console.error('Analysis failed:', e)
    }
    setAnalyzing(null)
  }

  const batchAnalyze = async () => {
    setBatchRunning(true)
    const analyzed = new Set(analyses.map(a => a.story_id))
    const unanalyzed = stories.filter(s => !analyzed.has(s.id))
    for (const story of unanalyzed) {
      await analyzeStory(story)
    }
    setBatchRunning(false)
  }

  const getAnalysis = (storyId) => analyses.find(a => a.story_id === storyId)

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="animate-spin text-ink-muted" size={24} />
      </div>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-wcpo-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to WCPO</span>
          </button>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-amber-400" />
            <span className="text-sm font-bold text-white">Sensitivity Admin</span>
          </div>
          <div />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink">Story Sensitivity Analysis</h1>
            <p className="text-sm text-ink-muted mt-1">
              {analyses.length} of {stories.length} stories analyzed
            </p>
          </div>
          <button
            onClick={batchAnalyze}
            disabled={batchRunning}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white
              hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2"
          >
            {batchRunning
              ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</>
              : <><Zap size={14} /> Analyze All</>
            }
          </button>
        </div>

        <div className="space-y-2">
          {stories.map(story => {
            const analysis = getAnalysis(story.id)
            const isExpanded = expanded === story.id
            const isAnalyzing = analyzing === story.id
            const level = analysis ? levelColors[analysis.sensitivity_level] : null
            const LevelIcon = level?.icon

            return (
              <div key={story.id} className="border border-rule rounded-lg overflow-hidden bg-white">
                {/* Row */}
                <div
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : story.id)}
                >
                  {/* Status badge */}
                  <div className="w-20 shrink-0">
                    {analysis ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${level.bg} ${level.text} ${level.border} border`}>
                        <LevelIcon size={10} />
                        {analysis.sensitivity_level}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-ink-muted uppercase">Pending</span>
                    )}
                  </div>

                  {/* Story info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{story.headline}</p>
                    <p className="text-xs text-ink-muted">{story.category}</p>
                  </div>

                  {/* Treatment */}
                  <div className="hidden sm:block w-40 text-right">
                    {analysis && (
                      <span className="text-xs text-ink-muted">
                        {treatmentLabels[analysis.recommended_treatment]}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!analysis && (
                      <button
                        onClick={(e) => { e.stopPropagation(); analyzeStory(story) }}
                        disabled={isAnalyzing}
                        className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600
                          hover:bg-slate-200 disabled:opacity-50"
                      >
                        {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : 'Analyze'}
                      </button>
                    )}
                    {analysis && (
                      <button
                        onClick={(e) => { e.stopPropagation(); analyzeStory(story) }}
                        disabled={isAnalyzing}
                        className="p-1 rounded text-slate-400 hover:text-slate-600"
                        title="Re-analyze"
                      >
                        {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      </button>
                    )}
                    {isExpanded ? <ChevronUp size={14} className="text-ink-muted" /> : <ChevronDown size={14} className="text-ink-muted" />}
                  </div>
                </div>

                {/* Expanded details */}
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
                        {/* Flags */}
                        {analysis.flags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.flags.map(flag => (
                              <span key={flag} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                {flag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Reasoning */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">Reasoning</p>
                          <p className="text-sm text-ink-light leading-relaxed">{analysis.reasoning}</p>
                        </div>

                        {/* Publisher Advisory */}
                        <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">Publisher Advisory</p>
                          <p className="text-sm text-amber-900 leading-relaxed">{analysis.publisher_advisory}</p>
                        </div>

                        {/* Suggested Focus */}
                        {analysis.suggested_focus && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">Suggested Focus</p>
                            <p className="text-sm text-ink-light italic">{analysis.suggested_focus}</p>
                          </div>
                        )}

                        {/* Design Constraints */}
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

                        {/* Model */}
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
      </main>
    </>
  )
}
