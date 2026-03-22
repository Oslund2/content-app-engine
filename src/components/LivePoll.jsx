import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { submitPollData, fetchPollStats } from '../lib/supabase'

// Per-story insight generators
const pollInsights = {
  'fire-crisis': (stats) => {
    const belowC = stats.allData.filter(d => ['D', 'F'].includes(d.poll_data.grade)).length
    const pct = stats.total > 0 ? Math.round((belowC / stats.total) * 100) : 0
    const noDetectors = stats.allData.filter(d => d.poll_data.hasDetectors === false).length
    const detPct = stats.total > 0 ? Math.round((noDetectors / stats.total) * 100) : 0
    return [
      `${pct}% of respondents scored D or F on fire safety.`,
      detPct > 0 ? `${detPct}% reported having no working smoke detectors.` : null,
    ].filter(Boolean)
  },
  'safety-survey': (stats) => {
    const safetyScores = stats.allData.map(d => d.poll_data.safety).filter(v => typeof v === 'number')
    const avg = safetyScores.length > 0 ? Math.round(safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length) : null
    return [
      avg !== null ? `Average safety perception from tool users: ${avg}%. City official data: 32%.` : null,
    ].filter(Boolean)
  },
  'bridge-impact': (stats) => {
    const costs = stats.allData.map(d => d.poll_data.totalCost).filter(v => typeof v === 'number')
    const hours = stats.allData.map(d => d.poll_data.addedHours).filter(v => typeof v === 'number')
    const avgCost = costs.length > 0 ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length) : null
    const totalHours = hours.reduce((a, b) => a + b, 0)
    return [
      avgCost !== null ? `Average commuter cost calculated: $${avgCost.toLocaleString()} over 2.5 years.` : null,
      totalHours > 0 ? `Collective hours lost by all respondents: ${totalHours.toLocaleString()}.` : null,
    ].filter(Boolean)
  },
  'sidewalk-repair': (stats) => {
    const eligible = stats.allData.filter(d => d.poll_data.eligible === true).length
    const expansion = stats.allData.filter(d => d.poll_data.expansionCandidate === true).length
    const eligPct = stats.total > 0 ? Math.round((eligible / stats.total) * 100) : 0
    const expPct = stats.total > 0 ? Math.round((expansion / stats.total) * 100) : 0
    return [
      `${eligPct}% of checkers qualify for the current pilot program.`,
      expPct > 0 ? `${expPct}% are in neighborhoods targeted for expansion.` : null,
    ].filter(Boolean)
  },
  'sharon-lake': (stats) => {
    const allInterests = stats.allData.flatMap(d => Array.isArray(d.poll_data.interests) ? d.poll_data.interests : [])
    const freq = {}
    allInterests.forEach(i => { freq[i] = (freq[i] || 0) + 1 })
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
    const top = sorted[0]
    const weekendCount = stats.allData.filter(d => d.poll_data.visitDay === 'weekend').length
    const weekendPct = stats.total > 0 ? Math.round((weekendCount / stats.total) * 100) : 0
    return [
      top ? `Most popular interest: ${top[0]} (${top[1]} visitors).` : null,
      `${weekendPct}% are planning a weekend visit.`,
    ].filter(Boolean)
  },
  'opening-day': (stats) => {
    const transports = stats.allData.map(d => d.poll_data.transport).filter(Boolean)
    const freq = {}
    transports.forEach(t => { freq[t] = (freq[t] || 0) + 1 })
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
    const paradeCount = stats.allData.filter(d => d.poll_data.parade === true).length
    const paradePct = stats.total > 0 ? Math.round((paradeCount / stats.total) * 100) : 0
    return [
      sorted[0] ? `Most popular transport: ${sorted[0][0]} (${Math.round((sorted[0][1] / stats.total) * 100)}%).` : null,
      `${paradePct}% plan to watch the Findlay Market Parade.`,
    ].filter(Boolean)
  },
  'bengals-draft': (stats) => {
    const picks = stats.allData.map(d => d.poll_data.pick).filter(Boolean)
    const freq = {}
    picks.forEach(p => { freq[p] = (freq[p] || 0) + 1 })
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
    const positions = stats.allData.map(d => d.poll_data.position).filter(Boolean)
    const posFreq = {}
    positions.forEach(p => { posFreq[p] = (posFreq[p] || 0) + 1 })
    const posSorted = Object.entries(posFreq).sort((a, b) => b[1] - a[1])
    return [
      sorted[0] ? `Fan favorite pick: ${sorted[0][0]} (${sorted[0][1]} votes).` : null,
      posSorted[0] ? `Most popular position: ${posSorted[0][0]} (${Math.round((posSorted[0][1] / stats.total) * 100)}%).` : null,
    ].filter(Boolean)
  },
  'fc-cincinnati': (stats) => {
    const finals = stats.allData.map(d => d.poll_data.projectedFinal).filter(v => typeof v === 'number')
    const confidence = stats.allData.map(d => d.poll_data.confidence).filter(v => typeof v === 'number')
    const avgFinal = finals.length > 0 ? Math.round(finals.reduce((a, b) => a + b, 0) / finals.length) : null
    const avgConf = confidence.length > 0 ? Math.round(confidence.reduce((a, b) => a + b, 0) / confidence.length) : null
    return [
      avgFinal !== null ? `Average fan projection: ${avgFinal} points.` : null,
      avgConf !== null ? `Average playoff confidence: ${avgConf}%.` : null,
    ].filter(Boolean)
  },
  'storm-ready': (stats) => {
    const grades = stats.allData.map(d => d.poll_data.grade).filter(Boolean)
    const belowC = grades.filter(g => ['D', 'F'].includes(g)).length
    const pct = stats.total > 0 ? Math.round((belowC / stats.total) * 100) : 0
    const scores = stats.allData.map(d => d.poll_data.score).filter(v => typeof v === 'number')
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
    return [
      avgScore !== null ? `Average readiness score: ${avgScore}%.` : null,
      `${pct}% scored below C on storm readiness.`,
    ].filter(Boolean)
  },
  'flood-risk': (stats) => {
    const hoods = stats.allData.map(d => d.poll_data.neighborhood || d.neighborhood).filter(Boolean)
    const freq = {}
    hoods.forEach(h => { freq[h] = (freq[h] || 0) + 1 })
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
    const aeCount = stats.allData.filter(d => d.poll_data.floodZone === 'AE').length
    const aePct = stats.total > 0 ? Math.round((aeCount / stats.total) * 100) : 0
    return [
      sorted[0] ? `Most checked neighborhood: ${sorted[0][0]}.` : null,
      aePct > 0 ? `${aePct}% of respondents are in AE flood zones.` : null,
    ].filter(Boolean)
  },
  'car-seat': (stats) => {
    const errors = stats.allData.map(d => d.poll_data.errors).filter(v => typeof v === 'number')
    const avgErrors = errors.length > 0 ? (errors.reduce((a, b) => a + b, 0) / errors.length).toFixed(1) : null
    const criticalCount = stats.allData.filter(d => {
      const e = d.poll_data.errors
      return typeof e === 'number' && e >= 2
    }).length
    const critPct = stats.total > 0 ? Math.round((criticalCount / stats.total) * 100) : 0
    return [
      avgErrors !== null ? `Average errors found per check: ${avgErrors}.` : null,
      critPct > 0 ? `${critPct}% had 2+ critical installation errors.` : null,
    ].filter(Boolean)
  },
}

// Animated counter component
function AnimatedCount({ value }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const duration = 1200
    const start = performance.now()
    const from = 0

    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [value])

  return <span>{display.toLocaleString()}</span>
}

export default function LivePoll({ storyId, neighborhood, pollData }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function run() {
      // Dedup: only submit once per story per session
      const key = `poll_submitted_${storyId}`
      if (!localStorage.getItem(key)) {
        await submitPollData(storyId, neighborhood, pollData)
        localStorage.setItem(key, '1')
      }

      const result = await fetchPollStats(storyId, neighborhood)
      setStats(result)
      setLoading(false)
    }
    run()
  }, [storyId, neighborhood, pollData])

  if (loading || !stats || stats.total === 0) return null

  const insightFn = pollInsights[storyId]
  const insights = insightFn ? insightFn(stats) : []

  // Generic aggregation for numeric/boolean keys as fallback
  const genericStats = []
  if (insights.length === 0 && stats.total > 0) {
    const sample = stats.allData[0]?.poll_data || {}
    for (const [key, val] of Object.entries(sample)) {
      if (typeof val === 'number') {
        const vals = stats.allData.map(d => d.poll_data[key]).filter(v => typeof v === 'number')
        if (vals.length > 0) {
          const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
          genericStats.push(`Average ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${avg}`)
        }
      } else if (typeof val === 'boolean') {
        const trueCount = stats.allData.filter(d => d.poll_data[key] === true).length
        const pct = Math.round((trueCount / stats.total) * 100)
        genericStats.push(`${pct}% answered yes for ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
      }
    }
  }

  const displayInsights = insights.length > 0 ? insights : genericStats

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-paper-warm border border-rule rounded-xl p-5 mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-ink-muted" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Community Results</h3>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Live
        </span>
      </div>

      {/* Participant counts */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold font-mono text-ink">
          <AnimatedCount value={stats.total} />
        </span>
        <span className="text-sm text-ink-light">people have completed this</span>
      </div>

      {neighborhood && stats.neighborhoodCount > 0 && (
        <p className="text-sm text-ink-muted mb-3">
          <span className="font-mono font-semibold text-ink">{stats.neighborhoodCount}</span> from {neighborhood}
        </p>
      )}

      {/* Insights */}
      {displayInsights.length > 0 && (
        <div className="mt-3 pt-3 border-t border-rule space-y-2">
          {displayInsights.map((insight, i) => (
            <p key={i} className="text-sm text-ink-light leading-relaxed">
              {insight}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  )
}
