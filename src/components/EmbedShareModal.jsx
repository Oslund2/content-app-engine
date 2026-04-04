import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Code2, Copy, Check } from 'lucide-react'

const sizes = [
  { label: 'Small', height: 400 },
  { label: 'Medium', height: 600 },
  { label: 'Large', height: 800 },
]

export default function EmbedShareModal({ open, onClose, storyId, headline }) {
  const [sizeIdx, setSizeIdx] = useState(2) // default Large
  const [copied, setCopied] = useState(false)
  const backdropRef = useRef(null)

  const embedCode = `<iframe
  src="https://content-app-engine.netlify.app/?story=${storyId}&embed=true"
  width="100%"
  height="${sizes[sizeIdx].height}"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 12px; max-width: 720px;"
  title="WCPO Interactive: ${headline || storyId}"
  allow="clipboard-write"
></iframe>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg mx-0 sm:mx-4 shadow-2xl overflow-hidden"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-rule">
              <div className="flex items-center gap-2">
                <Code2 size={16} className="text-slate-500" />
                <span className="text-sm font-semibold text-ink">Embed This Story</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Size selector */}
              <div>
                <label className="text-xs font-medium text-ink-muted block mb-2">Embed Height</label>
                <div className="flex gap-2">
                  {sizes.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => setSizeIdx(i)}
                      className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-all
                        ${sizeIdx === i
                          ? 'border-slate-400 bg-slate-50 text-ink shadow-sm'
                          : 'border-rule bg-white text-ink-muted hover:bg-slate-50'
                        }`}
                    >
                      {s.label} ({s.height}px)
                    </button>
                  ))}
                </div>
              </div>

              {/* Code preview */}
              <div className="border border-rule rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-rule">
                  <span className="text-[10px] font-medium text-ink-muted uppercase tracking-wider">HTML Embed Code</span>
                </div>
                <pre className="p-3 text-xs font-mono text-ink-light overflow-x-auto bg-white leading-relaxed whitespace-pre-wrap break-all">
                  {embedCode}
                </pre>
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all
                  ${copied
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
              >
                {copied ? <><Check size={14} /> Copied to Clipboard</> : <><Copy size={14} /> Copy Embed Code</>}
              </button>

              <p className="text-[11px] text-ink-muted text-center">
                Paste this code into any HTML page, CMS, or newsletter template.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
