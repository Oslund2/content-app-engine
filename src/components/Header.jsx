import { motion } from 'framer-motion'
import { Newspaper, Clock, Calendar } from 'lucide-react'

export default function Header({ meta }) {
  return (
    <header className="border-b border-rule">
      {/* Top bar */}
      <div className="border-b border-rule px-5 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium tracking-widest uppercase text-ink-muted">
          <Newspaper size={16} />
          <span>{meta.byline}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1"><Calendar size={12} />{meta.publishDate}</span>
          <span className="flex items-center gap-1"><Clock size={12} />{meta.readTime}</span>
        </div>
      </div>

      {/* Headline */}
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-tight tracking-tight"
        >
          {meta.headline}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="mt-6 text-lg sm:text-xl text-ink-light leading-relaxed max-w-2xl"
        >
          {meta.subhead}
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 h-1 w-16 bg-accent origin-left"
        />
      </div>
    </header>
  )
}
