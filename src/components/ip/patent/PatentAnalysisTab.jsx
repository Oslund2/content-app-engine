// PatentAnalysisTab — AI-powered novelty and Alice/Mayo analysis

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, Shield, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

export default function PatentAnalysisTab({ application, onReload }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [runningNovelty, setRunningNovelty] = useState(false)
  const [runningAlice, setRunningAlice] = useState(false)
  const [aliceResult, setAliceResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAnalysis()
  }, [application.id])

  const loadAnalysis = async () => {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('patent_novelty_analyses')
        .select('*')
        .eq('application_id', application.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setAnalysis(data)
    } catch (err) {
      console.error('Load analysis failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const runNoveltyAnalysis = async () => {
    setRunningNovelty(true)
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/patent-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'novelty',
          applicationData: application,
          priorArt: application.priorArt,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      const result = data.result
      await supabase.from('patent_novelty_analyses').insert({
        application_id: application.id,
        overall_score: result.overall_score,
        approval_probability: result.approval_probability,
        strength_rating: result.strength_rating,
        analysis_data: result,
      })
      loadAnalysis()
    } catch (err) {
      setError(err.message)
    } finally {
      setRunningNovelty(false)
    }
  }

  const runAliceAnalysis = async () => {
    setRunningAlice(true)
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/patent-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'alice',
          applicationData: application,
          claims: application.claims,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAliceResult(data.result)
    } catch (err) {
      setError(err.message)
    } finally {
      setRunningAlice(false)
    }
  }

  const scoreColor = (score) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  const riskIcon = (level) => {
    if (level === 'low') return <CheckCircle2 className="w-4 h-4 text-green-500" />
    if (level === 'medium') return <AlertTriangle className="w-4 h-4 text-amber-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const analysisData = analysis?.analysis_data || {}

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">AI Analysis</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">{error}</div>
      )}

      {/* Novelty Analysis */}
      <div className="bg-white rounded-xl border border-rule p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Novelty Analysis
          </h3>
          <button
            onClick={runNoveltyAnalysis}
            disabled={runningNovelty}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {runningNovelty ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {analysis ? 'Re-analyze' : 'Run Analysis'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
        ) : analysis ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className={`text-2xl font-bold ${scoreColor(analysis.overall_score || 0)}`}>{analysis.overall_score || 0}</p>
                <p className="text-[10px] text-ink-muted mt-0.5">Novelty Score</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className={`text-2xl font-bold ${scoreColor(analysis.approval_probability || 0)}`}>{analysis.approval_probability || 0}%</p>
                <p className="text-[10px] text-ink-muted mt-0.5">Approval Probability</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className={`text-lg font-bold capitalize ${analysis.strength_rating === 'strong' ? 'text-green-600' : analysis.strength_rating === 'moderate' ? 'text-amber-600' : 'text-red-600'}`}>
                  {analysis.strength_rating || 'N/A'}
                </p>
                <p className="text-[10px] text-ink-muted mt-0.5">Strength Rating</p>
              </div>
            </div>

            {analysisData.patentability_assessment && (
              <p className="text-xs text-ink leading-relaxed bg-blue-50 rounded-lg p-3">{analysisData.patentability_assessment}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysisData.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-1">Strengths</p>
                  <ul className="space-y-1">{analysisData.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1 text-[10px] text-green-600"><CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />{s}</li>
                  ))}</ul>
                </div>
              )}
              {analysisData.weaknesses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-1">Weaknesses</p>
                  <ul className="space-y-1">{analysisData.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-1 text-[10px] text-red-600"><AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />{w}</li>
                  ))}</ul>
                </div>
              )}
            </div>

            {analysisData.recommendations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink mb-1">Recommendations</p>
                <ul className="space-y-1">{analysisData.recommendations.map((r, i) => (
                  <li key={i} className="text-[10px] text-ink-muted">• {r}</li>
                ))}</ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-ink-muted">No analysis yet. Click "Run Analysis" to assess patentability.</p>
        )}
      </div>

      {/* Alice/Mayo Analysis */}
      <div className="bg-white rounded-xl border border-rule p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Alice/Mayo Analysis (35 USC 101)
          </h3>
          <button
            onClick={runAliceAnalysis}
            disabled={runningAlice}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {runningAlice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Run Alice Analysis
          </button>
        </div>

        {aliceResult ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {riskIcon(aliceResult.overall_risk)}
              <span className={`text-sm font-semibold capitalize ${
                aliceResult.overall_risk === 'low' ? 'text-green-600' :
                aliceResult.overall_risk === 'medium' ? 'text-amber-600' : 'text-red-600'
              }`}>
                {aliceResult.overall_risk} Risk
              </span>
            </div>

            {aliceResult.summary && (
              <p className="text-xs text-ink leading-relaxed bg-amber-50 rounded-lg p-3">{aliceResult.summary}</p>
            )}

            {aliceResult.claim_analyses?.map((ca, idx) => (
              <div key={idx} className="border border-rule rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  {riskIcon(ca.risk_level)}
                  <span className="text-xs font-semibold">Claim {ca.claim_number}</span>
                  <span className={`text-[10px] font-medium capitalize ${
                    ca.risk_level === 'low' ? 'text-green-600' : ca.risk_level === 'medium' ? 'text-amber-600' : 'text-red-600'
                  }`}>{ca.risk_level} risk</span>
                </div>
                {ca.abstract_idea_risk && <p className="text-[10px] text-ink-muted mt-1"><strong>Abstract Idea:</strong> {ca.abstract_idea_risk}</p>}
                {ca.inventive_concept && <p className="text-[10px] text-ink-muted mt-1"><strong>Inventive Concept:</strong> {ca.inventive_concept}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-muted">Run an Alice/Mayo analysis to assess subject matter eligibility for your claims.</p>
        )}
      </div>
    </div>
  )
}
