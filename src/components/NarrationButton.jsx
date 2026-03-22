import { Headphones, Loader2 } from 'lucide-react'

export default function NarrationButton({ narration }) {
  if (!narration.isAvailable) return null

  return (
    <button
      onClick={narration.toggle}
      className="flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-wcpo-red transition-colors ml-auto"
    >
      {narration.status === 'loading' ? (
        <><Loader2 size={12} className="animate-spin" /> Loading...</>
      ) : narration.isPlaying ? (
        <><Headphones size={12} className="text-wcpo-red" /> Listening</>
      ) : (
        <><Headphones size={12} /> Listen</>
      )}
    </button>
  )
}
