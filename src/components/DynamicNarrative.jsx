import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'

/**
 * DynamicNarrative — Fetches a personalized narrative from Claude via serverless function.
 * Falls back gracefully to static content if the API is unavailable.
 *
 * Usage:
 * <DynamicNarrative storyId="fire-crisis" profileData={{ ... }} />
 */
export default function DynamicNarrative({ storyId, profileData }) {
  const [narrative, setNarrative] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const fetchedRef = useRef(null)

  // Stabilize profileData by serializing — avoids infinite re-fetch from new object refs
  const profileKey = useMemo(() => JSON.stringify(profileData), [profileData])

  useEffect(() => {
    if (!storyId || !profileData) return
    // Don't re-fetch if we already fetched for this exact profile
    const key = `${storyId}:${profileKey}`
    if (fetchedRef.current === key) return
    fetchedRef.current = key

    let cancelled = false
    setLoading(true)
    setError(false)

    async function fetchNarrative() {
      try {
        const res = await fetch('/.netlify/functions/narrative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId, profileData }),
        })
        const data = await res.json()
        if (!cancelled) {
          if (data.narrative) {
            setNarrative(data.narrative)
          } else {
            setError(true)
          }
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      }
    }

    fetchNarrative()
    return () => { cancelled = true }
  }, [storyId, profileKey, profileData])

  if (error || (!loading && !narrative)) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6 bg-paper-warm border border-rule rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-wcpo-red" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          Personalized Analysis
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-ink-muted text-sm py-2">
          <Loader2 size={14} className="animate-spin" />
          Writing your personalized analysis...
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          {narrative.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-ink-light leading-relaxed mb-3 last:mb-0 italic">
              {para}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  )
}
