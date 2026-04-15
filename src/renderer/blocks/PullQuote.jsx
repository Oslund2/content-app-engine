import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

const variants = {
  accent: { wrapper: 'border-l-4 border-wcpo-red bg-red-50/50 pl-6 pr-4 py-5', quote: 'text-ink', icon: 'text-wcpo-red' },
  subtle: { wrapper: 'border-l-4 border-slate-300 pl-6 pr-4 py-5', quote: 'text-ink-light', icon: 'text-slate-400' },
  bordered: { wrapper: 'border-2 border-rule rounded-xl px-6 py-6 text-center', quote: 'text-ink', icon: 'text-ink-muted' },
}

export default function PullQuote({ quote, attribution, variant = 'accent' }) {
  if (!quote) return null
  const style = variants[variant] || variants.accent
  const isCentered = variant === 'bordered'

  return (
    <motion.blockquote
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`mb-8 ${style.wrapper}`}
    >
      <Quote size={20} className={`${style.icon} mb-2 ${isCentered ? 'mx-auto' : ''}`} />
      <p className={`font-serif text-xl sm:text-2xl leading-relaxed font-medium ${style.quote}`}>
        {quote}
      </p>
      {attribution && (
        <footer className="mt-3">
          <cite className="text-sm text-ink-muted not-italic font-medium">— {attribution}</cite>
        </footer>
      )}
    </motion.blockquote>
  )
}
