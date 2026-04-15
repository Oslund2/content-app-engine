import { motion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'

/**
 * CalloutBox — Dark-header box with icon rows for resources/actions.
 * Inspired by FireCrisis "Take Action Now" box.
 *
 * Config:
 * {
 *   type: "callout-box",
 *   title: "Take Action Now",
 *   variant: "dark" | "accent" | "light" (optional, defaults to "dark"),
 *   items: [
 *     {
 *       icon: "Phone",
 *       title: "Request Free Smoke Detectors",
 *       description: "Call 311 — up to 6 free detectors per household.",
 *       action: "Call 311",
 *       actionUrl: "tel:311" (optional)
 *     }
 *   ]
 * }
 */

const variants = {
  dark: { header: 'bg-ink', headerText: 'text-white', body: 'bg-white', border: 'border-ink' },
  accent: { header: 'bg-wcpo-red', headerText: 'text-white', body: 'bg-white', border: 'border-wcpo-red' },
  light: { header: 'bg-paper-warm', headerText: 'text-ink', body: 'bg-white', border: 'border-rule' },
  success: { header: 'bg-green-700', headerText: 'text-white', body: 'bg-white', border: 'border-green-700' },
  warning: { header: 'bg-amber-600', headerText: 'text-white', body: 'bg-white', border: 'border-amber-600' },
}

export default function CalloutBox({ title, items = [], variant = 'dark', image, imageAlt }) {
  if (!items.length) return null
  const style = variants[variant] || variants.dark

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`rounded-xl overflow-hidden mb-8 border-2 ${style.border}`}
    >
      {image && (
        <div className="relative aspect-video bg-slate-100">
          <img
            src={image}
            alt={imageAlt || title || 'Callout image'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.target.parentElement.style.display = 'none' }}
          />
        </div>
      )}
      <div className={`${style.header} px-6 py-4`}>
        <h3 className={`${style.headerText} font-serif text-lg font-bold`}>{title}</h3>
      </div>
      <div className={`${style.body} p-6 space-y-4`}>
        {items.map((item, i) => {
          const Icon = item.icon ? LucideIcons[item.icon] : null
          const actionEl = item.actionUrl ? (
            <a
              href={item.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-wcpo-red bg-red-50 px-2.5 py-1.5 rounded shrink-0 hover:bg-red-100 transition-colors"
            >
              {item.action}
            </a>
          ) : item.action ? (
            <span className="text-xs font-bold text-wcpo-red bg-red-50 px-2.5 py-1.5 rounded shrink-0">
              {item.action}
            </span>
          ) : null

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3"
            >
              {Icon && (
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-red-600" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-ink-light mt-0.5">{item.description}</p>
                )}
              </div>
              {actionEl}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
