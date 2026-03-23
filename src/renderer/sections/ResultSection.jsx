import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { useConfig } from '../ConfigContext'
import { ScoreCard, GradeDisplay } from '../charts'
import { formatValue } from '../FormulaEngine'

export default function ResultSection({ results, storyId }) {
  const { allRequiredFilled, calculations } = useConfig()

  if (!results) return null

  // Don't render until all required inputs are filled
  const requiredIds = results.showAfterInputs
  if (!allRequiredFilled(requiredIds)) return null

  const { scoreCards = [], grade, actionItems = [] } = results

  return (
    <AnimatePresence>
      <motion.section
        key="results"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        {/* Score cards */}
        {scoreCards.length > 0 && (
          <div
            className={`grid gap-4 mb-6 ${
              scoreCards.length === 1
                ? 'grid-cols-1'
                : scoreCards.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {scoreCards.map((card, i) => {
              // Resolve value from calculations if it's a reference string
              const calcRef = card.calcId || card.valueRef
              const raw =
                typeof calcRef === 'string'
                  ? calculations[calcRef] ?? calculations[calcRef.replace('calculations.', '')]
                  : card.value

              // Handle level-based cards (where Sonnet generated levels/descriptions instead of a number)
              const hasLevels = card.levels || card.scoreRanges
              const display = hasLevels
                ? null // Will show description instead
                : (card.format && typeof raw === 'number')
                  ? formatValue(raw, card.format)
                  : raw

              return (
                <div key={card.calcId || card.id || i} className="bg-white border border-rule rounded-xl p-5">
                  <h4 className="text-sm font-bold text-ink mb-1">{card.label || card.title}</h4>
                  {display != null && (
                    <p className="text-2xl font-bold text-wcpo-red">{card.prefix}{display}{card.suffix}</p>
                  )}
                  {card.description && (
                    <p className="text-sm text-ink-light mt-2 leading-relaxed">{card.description}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Grade display */}
        {grade && (
          <div className="flex justify-center mb-6">
            <GradeDisplay
              grade={
                typeof grade.calcId === 'string'
                  ? calculations[grade.calcId]
                  : grade.value
              }
              label={grade.label}
              description={grade.description}
              scale={grade.scale}
              color={grade.color}
            />
          </div>
        )}

        {/* Action items */}
        {actionItems.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted mb-2">
              Recommended Actions
            </h3>
            {actionItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="bg-white border border-rule rounded-xl p-4"
              >
                <p className="text-sm font-semibold text-ink">{item.title || item.label}</p>
                {item.description && (
                  <p className="text-sm text-ink-light mt-1 leading-relaxed">
                    {item.description}
                  </p>
                )}
                {(item.cta || item.ctaUrl || item.url) && (
                  <a
                    href={item.ctaUrl || item.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-wcpo-red mt-2 hover:underline"
                  >
                    {item.cta || 'Learn More'} <ExternalLink size={10} />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </AnimatePresence>
  )
}
