import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, X, Volume2 } from 'lucide-react'

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function NarrationPlayer({ narration, storyTitle }) {
  const visible = narration.isPlaying || narration.status === 'paused'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-wcpo-dark border-t border-white/10"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={narration.toggle}
              className="w-9 h-9 rounded-full bg-wcpo-red flex items-center justify-center text-white hover:bg-red-700 transition-colors shrink-0"
            >
              {narration.isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>

            {/* Info + Progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Volume2 size={11} className="text-white/40 shrink-0" />
                <p className="text-xs text-white/60 truncate">{storyTitle || 'WCPO Story'}</p>
              </div>
              {/* Progress bar */}
              <div
                className="w-full h-1 bg-white/10 rounded-full cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const pct = (e.clientX - rect.left) / rect.width
                  narration.seek(pct * narration.duration)
                }}
              >
                <div
                  className="h-full bg-wcpo-red rounded-full transition-all duration-200"
                  style={{ width: `${narration.duration ? (narration.currentTime / narration.duration) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-[11px] font-mono text-white/40 shrink-0 w-20 text-right">
              {formatTime(narration.currentTime)} / {formatTime(narration.duration)}
            </span>

            {/* Close */}
            <button
              onClick={narration.stop}
              className="text-white/30 hover:text-white/70 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
