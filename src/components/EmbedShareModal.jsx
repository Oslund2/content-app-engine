import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Code2, Copy, Check, Link2, Share2, FileText } from 'lucide-react'

const sizes = [
  { label: 'Small', height: 400 },
  { label: 'Medium', height: 600 },
  { label: 'Large', height: 800 },
]

const BASE_URL = 'https://content-app-engine.netlify.app'

export default function EmbedShareModal({ open, onClose, storyId, headline, subhead }) {
  const [tab, setTab] = useState('share') // 'share' | 'embed'
  const [sizeIdx, setSizeIdx] = useState(1) // default Medium
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [headlineCopied, setHeadlineCopied] = useState(false)
  const [subheadCopied, setSubheadCopied] = useState(false)
  const backdropRef = useRef(null)

  const storyUrl = `${BASE_URL}/?story=${storyId}`
  const shareText = headline || 'Check out this interactive story from WCPO'
  const iframeId = `wcpo-embed-${storyId}`

  const embedCode = `<iframe
  id="${iframeId}"
  src="${storyUrl}&embed=true"
  width="100%"
  height="${sizes[sizeIdx].height}"
  frameborder="0"
  style="border: none; border-radius: 8px; max-width: 720px; display: block;"
  title="WCPO Interactive: ${headline || storyId}"
  allow="clipboard-write"
></iframe>
<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'content-app-engine:resize') {
    var f = document.getElementById('wcpo-embed-' + e.data.storyId);
    if (f) f.style.height = e.data.height + 'px';
  }
});
</script>`

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storyUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleCopyHeadline = () => {
    navigator.clipboard.writeText(headline || '')
    setHeadlineCopied(true)
    setTimeout(() => setHeadlineCopied(false), 2000)
  }

  const handleCopySubhead = () => {
    navigator.clipboard.writeText(subhead || '')
    setSubheadCopied(true)
    setTimeout(() => setSubheadCopied(false), 2000)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: storyUrl })
      } catch {}
    }
  }

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(storyUrl)}`,
      '_blank', 'noopener,noreferrer,width=550,height=420'
    )
  }

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storyUrl)}`,
      '_blank', 'noopener,noreferrer,width=550,height=420'
    )
  }

  const shareToLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(storyUrl)}`,
      '_blank', 'noopener,noreferrer,width=550,height=420'
    )
  }

  const shareByEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`Check out this interactive story:\n\n${storyUrl}`)}`
  }

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Reset tab when opening
  useEffect(() => {
    if (open) { setTab('share'); setCopied(false); setLinkCopied(false) }
  }, [open])

  const hlLen = (headline || '').length
  const shLen = (subhead || '').length

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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

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
                <Share2 size={16} className="text-slate-500" />
                <span className="text-sm font-semibold text-ink">Share Story</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-rule">
              <button
                onClick={() => setTab('share')}
                className={`flex-1 text-xs font-medium py-2.5 border-b-2 transition-colors ${
                  tab === 'share' ? 'border-slate-800 text-ink' : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <Share2 size={12} className="inline mr-1 -mt-0.5" />Share
              </button>
              <button
                onClick={() => setTab('embed')}
                className={`flex-1 text-xs font-medium py-2.5 border-b-2 transition-colors ${
                  tab === 'embed' ? 'border-slate-800 text-ink' : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <Code2 size={12} className="inline mr-1 -mt-0.5" />Embed / CMS
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
              {tab === 'share' && (
                <>
                  {/* Copy Link */}
                  <button
                    onClick={handleCopyLink}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                      linkCopied
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {linkCopied ? <><Check size={14} /> Link Copied!</> : <><Link2 size={14} /> Copy Link</>}
                  </button>

                  {/* Social buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={shareToTwitter}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      Post on X
                    </button>
                    <button
                      onClick={shareToFacebook}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-[#1877F2] text-white hover:bg-[#166FE5] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Facebook
                    </button>
                    <button
                      onClick={shareToLinkedIn}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn
                    </button>
                    <button
                      onClick={shareByEmail}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-ink hover:bg-slate-200 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"/><path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"/></svg>
                      Email
                    </button>
                  </div>

                  {/* Native share on mobile */}
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                      onClick={handleNativeShare}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border border-rule text-ink hover:bg-slate-50 transition-colors"
                    >
                      <Share2 size={14} /> More sharing options...
                    </button>
                  )}
                </>
              )}

              {tab === 'embed' && (
                <>
                  {/* CMS Fields — copy headline and subhead into Brightspot */}
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
                      <FileText size={12} className="text-slate-500" />
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">CMS Fields (Brightspot)</span>
                    </div>
                    <div className="p-3 space-y-3">
                      {/* Headline */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Headline</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono ${hlLen > 110 ? 'text-red-500' : hlLen > 90 ? 'text-amber-500' : 'text-emerald-600'}`}>
                              {hlLen}/110
                            </span>
                            <button
                              onClick={handleCopyHeadline}
                              disabled={!headline}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                                headlineCopied
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {headlineCopied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-ink bg-white border border-rule rounded px-2.5 py-2 leading-snug min-h-[36px]">
                          {headline || <span className="text-ink-muted italic">No headline available</span>}
                        </p>
                      </div>

                      {/* Sub-Headline */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Sub-Headline</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono ${shLen > 200 ? 'text-red-500' : shLen > 160 ? 'text-amber-500' : 'text-emerald-600'}`}>
                              {shLen}/200
                            </span>
                            <button
                              onClick={handleCopySubhead}
                              disabled={!subhead}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                                subheadCopied
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {subheadCopied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-ink bg-white border border-rule rounded px-2.5 py-2 leading-snug min-h-[36px]">
                          {subhead || <span className="text-ink-muted italic">No sub-headline available</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Initial height (fallback if CMS strips the resize script) */}
                  <div>
                    <label className="text-xs font-medium text-ink-muted block mb-2">
                      Initial Height <span className="text-ink-muted/60 font-normal">(auto-adjusts via script below)</span>
                    </label>
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

                  {/* Embed code */}
                  <div className="border border-rule rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-slate-50 border-b border-rule">
                      <span className="text-[10px] font-medium text-ink-muted uppercase tracking-wider">HTML Embed Code</span>
                    </div>
                    <pre className="p-3 text-xs font-mono text-ink-light overflow-x-auto bg-white leading-relaxed whitespace-pre-wrap break-all">
                      {embedCode}
                    </pre>
                  </div>

                  <button
                    onClick={handleCopyEmbed}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all
                      ${copied
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                  >
                    {copied ? <><Check size={14} /> Copied to Clipboard</> : <><Copy size={14} /> Copy Embed Code</>}
                  </button>

                  <p className="text-[11px] text-ink-muted text-center">
                    The embed starts with the hero image — headline and sub-headline come from CMS fields above.
                    If your CMS strips &lt;script&gt; tags, the initial height above is used as a fixed fallback.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
