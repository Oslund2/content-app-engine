import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

/**
 * Collapsible — Click to expand contextual sidebar/section.
 * Inspired by FireCrisis dispatch controversy section.
 *
 * Config:
 * {
 *   type: "collapsible",
 *   title: "The Dispatch Controversy",
 *   icon: "MessageCircle",
 *   defaultOpen: false,
 *   variant: "subtle" | "bordered" | "highlighted",
 *   paragraphs: ["paragraph 1", "paragraph 2"]
 * }
 */

const variantStyles = {
  subtle: { wrapper: '', content: 'bg-paper-warm border-rule', toggle: 'text-ink-muted hover:text-ink' },
  bordered: { wrapper: 'border border-rule rounded-xl overflow-hidden', content: 'bg-white', toggle: 'text-ink hover:text-wcpo-red px-4 py-3' },
  highlighted: { wrapper: 'border-2 border-amber-200 rounded-xl overflow-hidden', content: 'bg-amber-50', toggle: 'text-amber-800 hover:text-amber-900 px-4 py-3 bg-amber-50' },
}

export default function Collapsible({ title, icon, defaultOpen = false, variant = 'subtle', paragraphs = [] }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  if (!paragraphs.length) return null

  const Icon = icon ? LucideIcons[icon] : null
  const style = variantStyles[variant] || variantStyles.subtle

  return (
    <div className={`mb-8 ${style.wrapper}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 text-sm font-medium transition-colors w-full ${style.toggle}`}
      >
        {Icon && <Icon size={14} />}
        <span>{title}</span>
        <ChevronRight size={14} className={`transition-transform ml-auto ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={`${style.content} rounded-xl p-5 ${variant === 'subtle' ? 'border mt-2' : ''}`}>
              {paragraphs.map((p, i) => (
                <p key={i} className="text-sm text-ink-light leading-relaxed mb-2 last:mb-0">{p}</p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
