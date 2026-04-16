import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Clock, TrendingUp, BarChart3, CheckCircle2, ChevronDown, ChevronUp, DollarSign, Users, Megaphone, Info } from 'lucide-react'
import { analyzeStory } from '../lib/dwellTimeModel'

function formatTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function InfoTip({ text }) {
  const [show, setShow] = useState(false)
  const ref = useRef(null)

  return (
    <span className="relative inline-flex" ref={ref}>
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        className="text-ink-muted/50 hover:text-ink-muted transition-colors ml-1"
        aria-label="More info"
      >
        <Info size={12} />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-800 text-white text-[11px] leading-relaxed rounded-lg px-3 py-2.5 shadow-lg pointer-events-none"
          >
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

function Gauge({ label, value, icon: Icon, color, tooltip }) {
  const pct = Math.min(value, 100)
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className={`shrink-0 ${color}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-ink flex items-center">
            {label}
            {tooltip && <InfoTip text={tooltip} />}
          </span>
          <span className={`text-xs font-bold font-mono ${color}`}>{value}/100</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
          />
        </div>
      </div>
    </div>
  )
}

export default function DwellTimeProjection({ config }) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  const analysis = useMemo(() => analyzeStory(config), [config])
  const { original, interactive, satisfaction } = analysis

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-amber-500" />
        <h3 className="font-serif font-bold text-ink text-base">Engagement Projection</h3>
      </div>

      {/* Side-by-side dwell comparison */}
      <div className="grid grid-cols-2 gap-3">
        {/* Original Article */}
        <div className="rounded-xl overflow-hidden border border-slate-200">
          <div className="bg-slate-500 px-4 py-2.5">
            <p className="text-white text-xs font-bold uppercase tracking-wider">Original Article</p>
          </div>
          <div className="bg-slate-50 p-4 space-y-2">
            <div>
              <p className="text-xs text-ink-muted">Word count</p>
              <p className="text-sm font-mono font-bold text-ink">{original.wordCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Raw read time</p>
              <p className="text-sm font-mono text-ink">{formatTime(original.readSeconds)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Skim factor</p>
              <p className="text-sm font-mono text-ink">{Math.round(original.skimFactor * 100)}% attention</p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-ink-muted">Projected dwell</p>
              <p className="text-2xl font-bold font-mono text-slate-600">{formatTime(original.totalSeconds)}</p>
            </div>
          </div>
        </div>

        {/* Interactive Version */}
        <div className="rounded-xl overflow-hidden border border-green-200">
          <div className="bg-green-600 px-4 py-2.5">
            <p className="text-white text-xs font-bold uppercase tracking-wider">Interactive Version</p>
          </div>
          <div className="bg-green-50 p-4 space-y-2">
            <div>
              <p className="text-xs text-green-700/70">Read time (full attention)</p>
              <p className="text-sm font-mono font-bold text-green-800">{formatTime(interactive.readSeconds)}</p>
            </div>
            <div>
              <p className="text-xs text-green-700/70">Interaction time</p>
              <p className="text-sm font-mono text-green-800">{formatTime(interactive.interactionSeconds)}</p>
            </div>
            <div>
              <p className="text-xs text-green-700/70">Interactive blocks</p>
              <p className="text-sm font-mono text-green-800">{interactive.interactionBlockCount} of {interactive.blockCount} ({interactive.uniqueBlockTypes} types)</p>
            </div>
            <div className="pt-2 border-t border-green-200">
              <p className="text-xs text-green-700/70">Projected dwell</p>
              <p className="text-2xl font-bold font-mono text-green-700">{formatTime(interactive.totalSeconds)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dwell multiplier badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-5 py-2">
          <TrendingUp size={16} className="text-amber-600" />
          <span className="text-2xl font-bold font-mono text-amber-700">
            {satisfaction.dwellMultiplier.toFixed(1)}x
          </span>
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">longer engagement</span>
        </div>
      </div>

      {/* Block breakdown (collapsible) */}
      {interactive.blockBreakdown.length > 0 && (
        <div className="border border-rule rounded-lg overflow-hidden">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-paper-warm text-xs font-semibold text-ink hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <BarChart3 size={12} />
              Block-by-Block Breakdown ({interactive.blockBreakdown.length} contributing)
            </span>
            {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showBreakdown && (
            <div className="divide-y divide-rule">
              {interactive.blockBreakdown.map((b, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-ink-muted">{b.type}</span>
                    {b.id !== b.type && <span className="text-ink-muted">{b.id}</span>}
                  </div>
                  <span className="font-mono font-semibold text-ink">{formatTime(b.seconds)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-2 text-xs font-bold bg-slate-50">
                <span>Total interaction time</span>
                <span className="font-mono">{formatTime(interactive.interactionSeconds)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Satisfaction gauges */}
      <div className="bg-white border border-rule rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Satisfaction Indexes</p>
        <Gauge
          label="Reader Satisfaction"
          value={satisfaction.readerSatisfaction}
          icon={Users}
          color="text-blue-600"
          tooltip={`Measures how much more engaging the interactive version is vs. the original flat article. Scored on three factors: dwell time multiplier (${satisfaction.dwellMultiplier.toFixed(1)}x longer = up to 40 pts), number of interactive blocks like quizzes, sliders, and maps (${interactive.interactionBlockCount} blocks = up to 30 pts), and content variety across ${interactive.uniqueBlockTypes} different block types (up to 30 pts). A flat article scores near zero because readers skim at 60% attention for ~${formatTime(original.totalSeconds)}. The interactive version holds full attention for ${formatTime(interactive.totalSeconds)} through active participation.`}
        />
        <Gauge
          label="Advertiser Satisfaction"
          value={satisfaction.advertiserSatisfaction}
          icon={Megaphone}
          color="text-purple-600"
          tooltip={`Measures ad value from an advertiser's perspective. Four equal factors: total dwell time (${formatTime(interactive.totalSeconds)} on page = up to 25 pts), ad exposure time (${satisfaction.adVerification.adExposureSeconds}s of direct ad visibility via the quizterstitial + result card = up to 25 pts), engagement depth (${interactive.interactionBlockCount} active interactions = up to 25 pts), and attention quality (${Math.round(interactive.interactionSeconds / interactive.totalSeconds * 100)}% of time is active clicking/choosing vs. passive reading = up to 25 pts). A flat article delivers a scroll-past impression; this delivers verified engaged attention.`}
        />
      </div>

      {/* CPM uplift */}
      <div className="bg-white border border-rule rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={14} className="text-green-600" />
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center">
            CPM Projection
            <InfoTip text={`Baseline CPM ($${satisfaction.baseCPM.toFixed(2)}) reflects standard news display ads. The interactive version commands a premium because advertisers pay more for verified engaged attention: ${satisfaction.dwellMultiplier.toFixed(1)}x longer dwell, active user participation, and a ${satisfaction.adVerification.interstitialDuration}s forced-view quizterstitial ad between input and results. Industry data shows interactive ad units achieve 3-8x higher CPMs than static display.`} />
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-ink-muted">Baseline CPM</p>
            <p className="text-lg font-bold font-mono text-slate-500">${satisfaction.baseCPM.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Projected CPM</p>
            <p className="text-lg font-bold font-mono text-green-600">${satisfaction.projectedCPM.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Uplift</p>
            <p className="text-lg font-bold font-mono text-amber-600">+{satisfaction.cpmUplift}%</p>
          </div>
        </div>
      </div>

      {/* Ad verification */}
      <div className="flex items-start gap-2 bg-white border border-rule rounded-lg px-4 py-3">
        <CheckCircle2 size={14} className={satisfaction.adVerification.interstitialEnabled ? 'text-green-500 mt-0.5 shrink-0' : 'text-amber-500 mt-0.5 shrink-0'} />
        <div className="text-xs text-ink-muted leading-relaxed">
          <span className="font-semibold text-ink">Quizterstitial Ad: </span>
          {satisfaction.adVerification.interstitialEnabled ? (
            <>{satisfaction.adVerification.interstitialDuration}s exposure between input completion and results (skippable after {satisfaction.adVerification.skipAfter}s). Total ad exposure: {satisfaction.adVerification.adExposureSeconds}s per session.</>
          ) : (
            <>Disabled by sensitivity constraints for this story.</>
          )}
        </div>
      </div>
    </motion.div>
  )
}
