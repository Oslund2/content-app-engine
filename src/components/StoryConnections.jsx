import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import connections from '../connections.json'
import storyData from '../storyData.json'

const storyMap = Object.fromEntries(storyData.stories.map(s => [s.id, s]))

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

function evaluateCondition(condition, profileData) {
  if (!condition || !profileData) return false

  switch (condition.type) {
    case 'always':
      return true

    case 'neighborhoodIn': {
      const val = getNestedValue(profileData, condition.field)
      if (!val) return false
      const normalized = String(val).toLowerCase()
      return condition.values.some(v => normalized.includes(v.toLowerCase()) || v.toLowerCase().includes(normalized))
    }

    case 'valueEquals': {
      const val = getNestedValue(profileData, condition.field)
      return val === condition.value
    }

    case 'valueIn': {
      const val = getNestedValue(profileData, condition.field)
      if (!val) return false
      const normalized = String(val).toLowerCase()
      return condition.values.some(v => v.toLowerCase() === normalized)
    }

    case 'scoreBelow': {
      const val = getNestedValue(profileData, condition.field)
      return typeof val === 'number' && val < condition.threshold
    }

    case 'scoreAbove': {
      const val = getNestedValue(profileData, condition.field)
      return typeof val === 'number' && val > condition.threshold
    }

    case 'arrayIncludes': {
      const arr = getNestedValue(profileData, condition.field)
      return Array.isArray(arr) && arr.includes(condition.value)
    }

    default:
      return false
  }
}

export default function StoryConnections({ storyId, profileData, onOpenStory }) {
  const matched = useMemo(() => {
    if (!storyId || !profileData) return []

    const rules = connections
      .filter(r => r.sourceStory === storyId)
      .filter(r => evaluateCondition(r.condition, profileData))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))

    // Deduplicate by targetStory, keeping highest priority
    const seen = new Set()
    const unique = []
    for (const rule of rules) {
      if (!seen.has(rule.targetStory)) {
        seen.add(rule.targetStory)
        unique.push(rule)
      }
    }

    return unique.slice(0, 2)
  }, [storyId, profileData])

  if (matched.length === 0 || !onOpenStory) return null

  // Build a contextual header
  const neighborhoodVal = profileData?.neighborhood || profileData?.origin || profileData?.area
  const headerText = neighborhoodVal
    ? `Because you're in ${typeof neighborhoodVal === 'string' && neighborhoodVal.length > 2 ? neighborhoodVal.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'your area'}...`
    : 'Related to your results...'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-8"
    >
      <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
        {headerText}
      </p>

      <div className="space-y-3">
        {matched.map((rule, i) => {
          const story = storyMap[rule.targetStory]
          if (!story) return null

          return (
            <motion.button
              key={rule.targetStory}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.15 }}
              onClick={() => onOpenStory(rule.targetStory)}
              className="w-full text-left rounded-xl border border-rule bg-white hover:border-ink-muted
                         hover:shadow-sm transition-all duration-200 overflow-hidden group"
            >
              <div className="flex items-stretch">
                {/* Category accent bar */}
                <div
                  className="w-1 shrink-0"
                  style={{ backgroundColor: story.categoryColor }}
                />

                <div className="flex-1 px-4 py-4">
                  {/* Category label */}
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: story.categoryColor }}
                  >
                    {story.category}
                  </span>

                  {/* Headline */}
                  <p className="text-sm font-semibold text-ink mt-0.5 leading-snug">
                    {story.headline}
                  </p>

                  {/* Connection message */}
                  <p className="text-xs text-ink-light mt-1.5 leading-relaxed">
                    {rule.message}
                  </p>

                  {/* CTA */}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold mt-2 group-hover:gap-2 transition-all duration-200"
                        style={{ color: story.categoryColor }}>
                    Explore <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
