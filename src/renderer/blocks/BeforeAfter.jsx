import { motion } from 'framer-motion'

export default function BeforeAfter({ title, beforeLabel = 'Before', afterLabel = 'After', beforeItems = [], afterItems = [], variant = 'split' }) {
  if (!beforeItems.length && !afterItems.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      {title && (
        <h3 className="font-serif text-lg font-bold text-ink mb-4">{title}</h3>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Before column */}
        <div className="rounded-xl overflow-hidden border border-red-200">
          <div className="bg-red-600 px-4 py-2.5">
            <p className="text-white text-xs font-bold uppercase tracking-wider">{beforeLabel}</p>
          </div>
          <div className="bg-red-50 p-4 space-y-3">
            {beforeItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                {typeof item === 'string' ? (
                  <p className="text-sm text-ink-light leading-relaxed">{item}</p>
                ) : (
                  <div>
                    {item.value && <p className="text-xl font-bold font-mono text-red-700">{item.value}</p>}
                    {item.label && <p className="text-xs font-semibold text-red-800">{item.label}</p>}
                    {item.detail && <p className="text-xs text-red-600 mt-0.5">{item.detail}</p>}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* After column */}
        <div className="rounded-xl overflow-hidden border border-green-200">
          <div className="bg-green-600 px-4 py-2.5">
            <p className="text-white text-xs font-bold uppercase tracking-wider">{afterLabel}</p>
          </div>
          <div className="bg-green-50 p-4 space-y-3">
            {afterItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                {typeof item === 'string' ? (
                  <p className="text-sm text-ink-light leading-relaxed">{item}</p>
                ) : (
                  <div>
                    {item.value && <p className="text-xl font-bold font-mono text-green-700">{item.value}</p>}
                    {item.label && <p className="text-xs font-semibold text-green-800">{item.label}</p>}
                    {item.detail && <p className="text-xs text-green-600 mt-0.5">{item.detail}</p>}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
