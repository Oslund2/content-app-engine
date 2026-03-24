import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react'
import { useConfig } from '../ConfigContext'

/**
 * InfoCard — Conditional background color based on data, with mini-stats grid.
 * Inspired by FireCrisis neighborhood risk card.
 *
 * Config:
 * {
 *   type: "info-card",
 *   title: "Your Risk Profile" (or formula-driven via titleField),
 *   showWhen: "input_id" (optional — only show after this input is filled),
 *   conditionField: "inputs.neighborhood.data.risk",
 *   levels: {
 *     "high":     { color: "red",    label: "HIGH RISK",    icon: "ShieldAlert" },
 *     "elevated": { color: "amber",  label: "ELEVATED RISK" },
 *     "moderate": { color: "yellow", label: "MODERATE RISK" },
 *     "low":      { color: "green",  label: "LOW RISK",     icon: "CheckCircle2" }
 *   },
 *   stats: [
 *     { label: "Fires in 2026", field: "inputs.neighborhood.data.fires2026" },
 *     { label: "Avg Housing Built", field: "inputs.neighborhood.data.housingAge" },
 *   ],
 *   note: "Optional contextual note that shows below",
 *   noteCondition: "inputs.neighborhood.data.housingAge < 1960" (show note only when true)
 * }
 */

const colorMap = {
  red: { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-200 text-red-800', note: 'text-amber-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-200 text-amber-800', note: 'text-amber-600' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-200 text-yellow-800', note: 'text-yellow-600' },
  green: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-200 text-green-800', note: 'text-green-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-200 text-blue-800', note: 'text-blue-600' },
}

const iconMap = { AlertTriangle, CheckCircle2, Info, ShieldAlert }

function resolveField(path, inputState, calculations) {
  if (!path) return undefined
  const parts = path.split('.')
  if (parts[0] === 'inputs') {
    let val = inputState[parts[1]]
    for (let i = 2; i < parts.length; i++) {
      if (val == null) return undefined
      val = val[parts[i]]
    }
    return val
  }
  if (parts[0] === 'calculations') {
    return calculations[parts[1]]
  }
  return undefined
}

export default function InfoCard({ title, showWhen, conditionField, levels = {}, stats = [], note }) {
  const { inputState, calculations } = useConfig()

  // Gate on showWhen
  if (showWhen && !inputState[showWhen]) return null

  const conditionValue = resolveField(conditionField, inputState, calculations)
  if (conditionValue === undefined) return null

  // Find matching level
  const levelKey = String(conditionValue).toLowerCase()
  const level = levels[levelKey] || levels[conditionValue] || Object.values(levels)[0]
  if (!level) return null

  const colors = colorMap[level.color] || colorMap.blue
  const Icon = level.icon ? (iconMap[level.icon] || null) : null

  // Resolve stat values
  const resolvedStats = stats.map(s => ({
    label: s.label,
    value: resolveField(s.field, inputState, calculations),
  })).filter(s => s.value !== undefined)

  // Resolve title (may reference an input label)
  const displayTitle = title || ''

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className={`rounded-xl p-5 border-2 ${colors.bg} ${colors.border}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg font-bold text-ink">{displayTitle}</h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1 ${colors.badge}`}>
              {Icon && <Icon size={12} />}
              {level.label}
            </span>
          </div>

          {resolvedStats.length > 0 && (
            <div className={`grid gap-3 mb-3 ${resolvedStats.length <= 2 ? 'grid-cols-2' : resolvedStats.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
              {resolvedStats.map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-lg font-bold font-mono text-ink">
                    {typeof s.value === 'boolean' ? (s.value ? 'Yes' : 'No') : s.value}
                  </p>
                  <p className="text-[10px] text-ink-muted uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {note && (
            <p className="text-sm text-ink-light">
              <AlertTriangle size={13} className={`inline ${colors.note} mr-1`} />
              {note}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
