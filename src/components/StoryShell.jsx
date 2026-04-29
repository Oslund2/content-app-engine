import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Share2, Bookmark, Clock, Zap } from 'lucide-react'
import useNarration from '../hooks/useNarration'
import NarrationButton from './NarrationButton'
import NarrationPlayer from './NarrationPlayer'
import EmbedShareModal from './EmbedShareModal'
import storyData from '../storyData.json'

export default function StoryShell({ onBack, category, categoryColor, timestamp, readTime, storyId, headline, subhead, children }) {
  const narration = useNarration(storyId)
  const storyMeta = storyData.stories.find(s => s.id === storyId)
  const storyTitle = headline || storyMeta?.headline || ''
  const playerVisible = narration.isPlaying || narration.status === 'paused'
  const [embedOpen, setEmbedOpen] = useState(false)
  const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true'

  // Embed mode: no chrome — the host page (CMS) provides headline and navigation
  if (isEmbed) {
    return (
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-4">
        {children}
      </main>
    )
  }

  return (
    <>
      {/* Compact header */}
      <header className="sticky top-0 z-50 bg-wcpo-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to WCPO</span>
            </button>
          ) : <div className="w-20" />}
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-white tracking-tight">WCPO</span>
            <span className="bg-wcpo-red text-white text-[8px] font-bold px-1.5 py-0.5 rounded">9</span>
          </div>
          <div className="flex items-center gap-3 text-white/50">
            <Share2
              size={16}
              className="cursor-pointer hover:text-white transition-colors"
              onClick={() => setEmbedOpen(true)}
            />
            <Bookmark size={16} className="cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
      </header>

      {/* Story meta bar */}
      <div className="border-b border-rule bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4 text-xs">
          <span className="font-bold uppercase tracking-wider" style={{ color: categoryColor }}>
            {category}
          </span>
          <span className="text-ink-muted flex items-center gap-1"><Clock size={10} /> {timestamp}</span>
          <span className="text-ink-muted flex items-center gap-1"><Zap size={10} /> {readTime}</span>
          <NarrationButton narration={narration} />
        </div>
      </div>

      {/* Content */}
      <main className={`max-w-3xl mx-auto px-5 sm:px-8 pt-10 pb-24 ${playerVisible ? 'pb-40' : ''}`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-rule py-6 text-center text-xs text-ink-muted">
        <p>A Content-as-an-Application demo &middot; WCPO 9 News &middot; Not financial or safety advice</p>
      </footer>

      <NarrationPlayer narration={narration} storyTitle={storyTitle} />

      <EmbedShareModal
        open={embedOpen}
        onClose={() => setEmbedOpen(false)}
        storyId={storyId}
        headline={storyTitle}
        subhead={subhead || ''}
      />
    </>
  )
}
