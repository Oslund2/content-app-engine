import { motion } from 'framer-motion'

/**
 * Timeline — Scrollable event list with color-coded dots.
 * Inspired by FireCrisis fire timeline.
 *
 * Config:
 * {
 *   type: "timeline",
 *   title: "The Timeline",
 *   description: "Optional description",
 *   events: [
 *     { date: "Jan 5", label: "Winton Place", detail: "optional detail", highlight: false, severity: "normal"|"warning"|"critical" },
 *     ...
 *   ],
 *   showRunningTotal: false,
 *   runningTotalField: "deaths" (if showRunningTotal, what numeric field to accumulate)
 * }
 */

const severityColors = {
  critical: { dot: 'bg-red-600', row: 'bg-red-50', badge: 'bg-red-100 text-red-700' },
  warning: { dot: 'bg-amber-500', row: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  success: { dot: 'bg-green-500', row: 'bg-green-50', badge: 'bg-green-100 text-green-700' },
  normal: { dot: 'bg-gray-400', row: '', badge: 'bg-gray-100 text-gray-600' },
}

export default function Timeline({ title, description, events = [], showRunningTotal = false, runningTotalField }) {
  if (!events.length) return null

  // Compute running total if needed
  let runningTotal = 0
  const enriched = events.map(ev => {
    if (showRunningTotal && runningTotalField && typeof ev[runningTotalField] === 'number') {
      runningTotal += ev[runningTotalField]
    }
    return { ...ev, _cumulative: runningTotal }
  })

  return (
    <div className="mb-8">
      {title && <h2 className="font-serif text-2xl font-bold text-ink mb-2">{title}</h2>}
      {description && <p className="text-sm text-ink-muted mb-4">{description}</p>}

      <div className="bg-white border border-rule rounded-xl p-5 max-h-80 overflow-y-auto">
        {enriched.map((ev, i) => {
          const sev = severityColors[ev.severity || 'normal']
          const isHighlighted = ev.highlight || ev.severity === 'critical'

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 py-2 border-b border-rule last:border-0 ${isHighlighted ? `${sev.row} -mx-2 px-2 rounded` : ''}`}
            >
              <span className="text-xs font-mono text-ink-muted w-16 shrink-0">{ev.date}</span>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${sev.dot}`} />
              <span className="text-sm text-ink flex-1">{ev.label}</span>
              {ev.badge && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${sev.badge}`}>
                  {ev.badge}
                </span>
              )}
              {showRunningTotal && (
                <span className="text-xs font-mono text-ink-muted w-8 text-right">{ev._cumulative}</span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted mt-3">
        {events.some(e => e.severity === 'critical') && (
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Critical</span>
        )}
        {events.some(e => e.severity === 'warning') && (
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Warning</span>
        )}
        {events.some(e => !e.severity || e.severity === 'normal') && (
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Normal</span>
        )}
        {showRunningTotal && (
          <span className="ml-auto">Rightmost: running total</span>
        )}
      </div>
    </div>
  )
}
