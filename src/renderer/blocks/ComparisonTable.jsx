import { motion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'

/**
 * ComparisonTable — Side-by-side comparison of scenarios.
 *
 * Config:
 * {
 *   type: "comparison-table",
 *   title: "How Does Cincinnati Compare?",
 *   columns: [
 *     { label: "Cincinnati", highlight: true },
 *     { label: "National Avg" },
 *     { label: "Ohio Avg" }
 *   ],
 *   rows: [
 *     { label: "Median Home Price", values: ["$225K", "$350K", "$200K"] },
 *     { label: "Fire Deaths/100K", values: ["2.1", "1.2", "1.5"], highlightMax: true }
 *   ]
 * }
 */

export default function ComparisonTable({ title, description, columns = [], rows = [] }) {
  if (!columns.length || !rows.length) return null

  return (
    <div className="mb-8">
      {title && <h2 className="font-serif text-2xl font-bold text-ink mb-2">{title}</h2>}
      {description && <p className="text-sm text-ink-muted mb-4">{description}</p>}

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-white border border-rule rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink-muted" />
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className={`text-center px-4 py-3 text-xs font-bold uppercase tracking-wider ${col.highlight ? 'text-wcpo-red bg-red-50' : 'text-ink-muted'}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                // Find max value index for highlighting
                let maxIdx = -1
                if (row.highlightMax || row.highlightMin) {
                  const nums = row.values.map(v => parseFloat(String(v).replace(/[^0-9.-]/g, '')))
                  if (nums.some(n => !isNaN(n))) {
                    maxIdx = row.highlightMax
                      ? nums.indexOf(Math.max(...nums.filter(n => !isNaN(n))))
                      : nums.indexOf(Math.min(...nums.filter(n => !isNaN(n))))
                  }
                }

                return (
                  <tr key={ri} className="border-b border-rule last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{row.label}</td>
                    {row.values.map((val, vi) => (
                      <td
                        key={vi}
                        className={`text-center px-4 py-3 font-mono ${
                          columns[vi]?.highlight ? 'bg-red-50/50 font-bold text-ink' : 'text-ink-light'
                        } ${vi === maxIdx ? 'font-bold text-wcpo-red' : ''}`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
