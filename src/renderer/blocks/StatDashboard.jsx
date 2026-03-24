import { motion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'

/**
 * StatDashboard — 2-4 big colored stat cards in a row.
 * Inspired by FireCrisis crisis dashboard.
 *
 * Config:
 * {
 *   type: "stat-dashboard",
 *   stats: [
 *     { value: "7", label: "Deaths", sub: "Jan–Mar 2026", color: "#dc2626", icon: "Flame" },
 *     ...
 *   ],
 *   variant: "crisis" | "neutral" | "success" (optional, defaults to "neutral")
 * }
 */

const variantStyles = {
  crisis: { bg: 'bg-red-50', border: 'border-red-200', value: 'text-red-700', label: 'text-red-800', sub: 'text-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', value: 'text-amber-700', label: 'text-amber-800', sub: 'text-amber-500' },
  success: { bg: 'bg-green-50', border: 'border-green-200', value: 'text-green-700', label: 'text-green-800', sub: 'text-green-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', value: 'text-blue-700', label: 'text-blue-800', sub: 'text-blue-500' },
  neutral: { bg: 'bg-white', border: 'border-rule', value: 'text-ink', label: 'text-ink-muted', sub: 'text-ink-muted' },
}

export default function StatDashboard({ stats = [], variant = 'neutral' }) {
  if (!stats.length) return null
  const cols = stats.length <= 2 ? 'grid-cols-2' : stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'

  return (
    <div className={`grid ${cols} gap-3 mb-8`}>
      {stats.map((stat, i) => {
        const style = stat.color ? null : variantStyles[variant] || variantStyles.neutral
        const Icon = stat.icon ? LucideIcons[stat.icon] : null

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
            className={`rounded-xl p-4 text-center border ${style ? `${style.bg} ${style.border}` : 'bg-white border-rule'}`}
            style={stat.color ? { backgroundColor: `${stat.color}10`, borderColor: `${stat.color}40` } : undefined}
          >
            {Icon && (
              <div className="flex justify-center mb-1">
                <Icon size={18} style={stat.color ? { color: stat.color } : undefined} className={!stat.color && style ? style.value : ''} />
              </div>
            )}
            <p
              className={`text-3xl sm:text-4xl font-bold font-mono ${style ? style.value : ''}`}
              style={stat.color ? { color: stat.color } : undefined}
            >
              {stat.value}
            </p>
            <p
              className={`text-xs font-bold uppercase tracking-wide ${style ? style.label : 'text-ink'}`}
              style={stat.color ? { color: stat.color } : undefined}
            >
              {stat.label}
            </p>
            {stat.sub && (
              <p className={`text-[10px] ${style ? style.sub : 'text-ink-muted'}`}>{stat.sub}</p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
