import { motion } from 'framer-motion'

const defaultColors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2']

export default function ProgressBar({ title, description, bars = [] }) {
  if (!bars.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      {title && (
        <h3 className="font-serif text-lg font-bold text-ink mb-1">{title}</h3>
      )}
      {description && (
        <p className="text-xs text-ink-muted mb-4">{description}</p>
      )}
      <div className="space-y-4">
        {bars.map((bar, i) => {
          const max = bar.max || 100
          const pct = Math.min((bar.value / max) * 100, 100)
          const color = bar.color || defaultColors[i % defaultColors.length]

          return (
            <div key={i}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-medium text-ink">{bar.label}</span>
                <span className="text-sm font-bold font-mono" style={{ color }}>
                  {bar.value}{bar.suffix || ''}{bar.max ? ` / ${bar.max}${bar.suffix || ''}` : ''}
                </span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
