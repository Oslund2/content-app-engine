import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { Soundscape, storyScapes } from '../lib/soundscape'

export default function SoundscapeToggle({ storyId }) {
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const scapeRef = useRef(null)

  // Show toggle after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Manage soundscape lifecycle
  useEffect(() => {
    if (!enabled) {
      scapeRef.current?.destroy()
      scapeRef.current = null
      return
    }

    const scape = new Soundscape()
    scapeRef.current = scape
    const method = storyScapes[storyId]
    if (method && scape[method]) {
      scape[method]()
      scape.setVolume(0.5)
    }

    return () => {
      scape.destroy()
      scapeRef.current = null
    }
  }, [enabled, storyId])

  // Adjust volume on scroll
  useEffect(() => {
    if (!enabled) return
    const handleScroll = () => {
      const scrollPct = Math.min(window.scrollY / (document.body.scrollHeight - window.innerHeight), 1)
      // Volume peaks in the middle of the story, fades at top and bottom
      const vol = scrollPct < 0.1 ? scrollPct * 5 : scrollPct > 0.9 ? (1 - scrollPct) * 5 : 0.5 + scrollPct * 0.3
      scapeRef.current?.setVolume(Math.min(vol, 0.8))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [enabled])

  const toggle = useCallback(() => setEnabled(e => !e), [])

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={toggle}
        className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 ${
          enabled
            ? 'bg-wcpo-dark text-white'
            : 'bg-white text-ink-muted border border-rule hover:border-ink-muted'
        }`}
        title={enabled ? 'Mute ambient sound' : 'Enable ambient sound'}
      >
        {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </motion.button>
    </AnimatePresence>
  )
}
