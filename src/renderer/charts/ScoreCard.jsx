import { motion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'

export default function ScoreCard({
  label,
  value,
  prefix = '',
  suffix = '',
  color,
  size = 'md',
  icon,
}) {
  const Icon = icon ? LucideIcons[icon] : null
  const textSize = size === 'lg' ? 'text-4xl' : 'text-3xl'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
      style={color ? { borderLeftWidth: 4, borderLeftColor: color } : undefined}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: color ? `${color}15` : '#f3f4f6' }}
          >
            <Icon size={20} style={{ color: color || '#6b7280' }} />
          </div>
        )}
        <div>
          <p className={`${textSize} font-bold font-mono leading-none`} style={color ? { color } : undefined}>
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          <p className="text-sm text-gray-500 mt-1">{label}</p>
        </div>
      </div>
    </motion.div>
  )
}
