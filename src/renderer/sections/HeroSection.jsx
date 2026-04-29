import { useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

export default function HeroSection({ hero, sourceAttribution }) {
  if (!hero) return null

  const { headline, subhead, leadParagraphs = [], keyStats = [], image } = hero
  const [imgError, setImgError] = useState(false)
  const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true'

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-10"
    >
      {/* Hero image */}
      {image && !imgError && (
        <div className="relative aspect-video rounded-xl overflow-hidden mb-6 bg-slate-100">
          <img
            src={image}
            alt={headline || 'Story image'}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Headline — hidden in embed mode (CMS provides this above the iframe) */}
      {headline && !isEmbed && (
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink leading-tight mb-3">
          {headline}
        </h1>
      )}

      {/* Subhead — hidden in embed mode */}
      {subhead && !isEmbed && (
        <p className="text-lg text-ink-light leading-relaxed mb-4">{subhead}</p>
      )}

      {/* Source attribution for external/3rd-party stories */}
      {sourceAttribution && (
        <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-slate-50 rounded-lg border border-rule text-xs">
          <ExternalLink size={12} className="text-ink-muted shrink-0" />
          <span className="text-ink-muted">Based on reporting by</span>
          <a
            href={sourceAttribution.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink hover:text-wcpo-red transition-colors"
          >
            {sourceAttribution.author || sourceAttribution.name || 'Source'}
          </a>
          {sourceAttribution.name && sourceAttribution.author && (
            <span className="text-ink-muted">({sourceAttribution.name})</span>
          )}
        </div>
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
              className="bg-paper-warm rounded-xl p-3 sm:p-4 border border-rule text-center min-w-0 overflow-hidden"
            >
              <p className="text-xl font-bold font-mono text-ink break-all leading-tight">{stat.value}</p>
              <p className="text-xs sm:text-sm font-semibold text-ink mt-1">{stat.label}</p>
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
