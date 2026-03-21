import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

export default function CitySelector({ cities, selected, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <label className="block text-sm font-medium tracking-wide uppercase text-ink-muted mb-4">
        Select your city
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(cities).map(([key, c]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`group relative px-4 py-4 rounded-lg border-2 text-left transition-all duration-200
              ${selected === key
                ? 'border-accent bg-accent-bg shadow-sm'
                : 'border-rule bg-white hover:border-ink-muted hover:shadow-sm'
              }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={14} className={selected === key ? 'text-accent' : 'text-ink-muted'} />
              <span className="font-semibold text-sm text-ink">{c.name}</span>
            </div>
            <p className="text-xs text-ink-muted">Avg. rent: ${c.avgRent.toLocaleString()}/mo</p>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
