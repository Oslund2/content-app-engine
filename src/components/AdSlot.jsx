import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, X } from 'lucide-react'
import adConfig from '../adConfig.json'

function getAd(storyId, placement) {
  const direct = adConfig.direct[storyId]?.[placement]
  if (direct) return { ...direct, type: 'direct' }
  // Programmatic backfill — pick random fallback
  const fallbacks = adConfig.programmatic.fallback
  const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)]
  return { ...fallback, type: 'programmatic' }
}

/**
 * Interstitial — 3-second branded card between user input and results.
 * Shows after user commits an action, before results render.
 *
 * Usage: <AdSlot.Interstitial storyId="fire-crisis" onComplete={() => setShowResults(true)} />
 */
function Interstitial({ storyId, onComplete, constraints }) {
  // Respect sensitivity constraints — skip ad entirely
  if (constraints?.disableAds || constraints?.disableInterstitials) {
    if (onComplete) setTimeout(onComplete, 0)
    return null
  }
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(0)
  const [canSkip, setCanSkip] = useState(false)
  const ad = getAd(storyId, 'interstitial')
  const DURATION = 3500 // ms

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.min(elapsed / DURATION, 1))
      if (elapsed >= 1200) setCanSkip(true)
      if (elapsed >= DURATION) {
        clearInterval(timer)
        setVisible(false)
        onComplete()
      }
    }, 50)
    return () => clearInterval(timer)
  }, [onComplete])

  const skip = useCallback(() => {
    setVisible(false)
    onComplete()
  }, [onComplete])

  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="my-8"
    >
      <div
        className="rounded-xl overflow-hidden text-white"
        style={{ backgroundColor: ad.bgColor || '#1a1a2e' }}
      >
        {/* Progress bar */}
        <div className="h-0.5 bg-white/10">
          <motion.div
            className="h-full bg-white/50"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 border border-white/20 px-1.5 py-0.5 rounded">
                {ad.type === 'direct' ? 'Sponsor' : 'Ad'}
              </span>
              <span className="text-sm font-semibold text-white/70">{ad.sponsor}</span>
            </div>
            {canSkip && (
              <button
                onClick={skip}
                className="text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 text-xs"
              >
                Skip <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl shrink-0">{ad.logo}</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">{ad.headline}</h3>
              <p className="text-sm text-white/70 leading-relaxed">{ad.body}</p>
            </div>
          </div>

          {ad.cta && (
            <div className="mt-4 flex items-center justify-between">
              <a
                href={ad.ctaUrl || '#'}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {ad.cta} <ExternalLink size={12} />
              </a>
              <span className="text-[10px] text-white/30">
                {ad.type === 'direct' ? 'Direct' : 'Programmatic'} &middot; WCPO Interactive
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Sponsored result card — appears in the results/action area.
 * Native-styled, clearly labeled.
 *
 * Usage: <AdSlot.ResultCard storyId="fire-crisis" />
 */
function ResultCard({ storyId, constraints }) {
  if (constraints?.disableAds) return null
  const ad = getAd(storyId, 'result')

  return (
    <div className="my-4 bg-white border border-rule rounded-xl overflow-hidden">
      <div className="px-5 py-2 border-b border-rule bg-paper-warm flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted border border-rule px-1.5 py-0.5 rounded">
          Sponsored
        </span>
        <span className="text-xs text-ink-muted">{ad.sponsor}</span>
      </div>
      <div className="p-5 flex items-start gap-4">
        <span className="text-2xl shrink-0 mt-0.5">{ad.logo}</span>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-ink mb-1">{ad.headline}</h4>
          <p className="text-sm text-ink-light leading-relaxed">{ad.body}</p>
          {ad.cta && (
            <a
              href={ad.ctaUrl || '#'}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-wcpo-red mt-2 hover:underline"
            >
              {ad.cta} <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Branded insight — one-liner woven into narrative flow.
 * Reads like a cited source.
 *
 * Usage: <AdSlot.Insight storyId="fire-crisis" />
 */
function Insight({ storyId, constraints }) {
  if (constraints?.disableAds || constraints?.disableSponsoredInsights) return null
  const direct = adConfig.direct[storyId]?.insight
  if (!direct) return null

  return (
    <div className="my-6 pl-4 border-l-2 border-rule">
      <p className="text-sm text-ink-light leading-relaxed italic">
        {direct.text}
      </p>
      <p className="text-[10px] text-ink-muted mt-1 not-italic">
        <span className="border border-rule px-1 py-0.5 rounded mr-1">Sponsored Insight</span>
        Source: {direct.sponsor}
      </p>
    </div>
  )
}

const AdSlot = { Interstitial, ResultCard, Insight }
export default AdSlot
