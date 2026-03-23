import { motion } from 'framer-motion'

export default function HeroSection({ hero }) {
  if (!hero) return null

  const { headline, subhead, leadParagraphs = [], keyStats = [] } = hero

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-10"
    >
      {/* Headline */}
      {headline && (
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink leading-tight mb-3">
          {headline}
        </h1>
      )}

      {/* Subhead */}
      {subhead && (
        <p className="text-lg text-ink-light leading-relaxed mb-6">{subhead}</p>
      )}

      {/* Key stats grid */}
      {keyStats.length > 0 && (
        <div
          className={`grid gap-4 mb-8 ${
            keyStats.length === 1
              ? 'grid-cols-1'
              : keyStats.length === 2
                ? 'grid-cols-2'
                : keyStats.length === 3
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-4'
          }`}
        >
          {keyStats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
              className="bg-paper-warm rounded-xl p-4 border border-rule text-center"
            >
              <p className="text-2xl font-bold font-mono text-ink">{stat.value}</p>
              <p className="text-sm font-semibold text-ink mt-1">{stat.label}</p>
              {stat.sub && (
                <p className="text-xs text-ink-muted mt-0.5">{stat.sub}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Lead paragraphs */}
      {leadParagraphs.length > 0 && (
        <div className="space-y-4">
          {leadParagraphs.map((para, i) => (
            <p key={i} className="text-base text-ink-light leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      )}
    </motion.section>
  )
}
