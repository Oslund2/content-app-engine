import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react'

/**
 * FactCheck — Claim + verdict + explanation pattern.
 *
 * Config:
 * {
 *   type: "fact-check",
 *   title: "What's True and What's Not",
 *   items: [
 *     {
 *       claim: "Fire response times have gotten worse.",
 *       verdict: "mostly-false" | "true" | "false" | "misleading" | "unverified",
 *       explanation: "Response times have remained steady at under 5 minutes..."
 *     }
 *   ]
 * }
 */

const verdictConfig = {
  true: { icon: CheckCircle2, label: 'TRUE', bg: 'bg-green-50', border: 'border-green-200', color: 'text-green-700', badge: 'bg-green-200 text-green-800' },
  'mostly-true': { icon: CheckCircle2, label: 'MOSTLY TRUE', bg: 'bg-green-50', border: 'border-green-200', color: 'text-green-700', badge: 'bg-green-200 text-green-800' },
  false: { icon: XCircle, label: 'FALSE', bg: 'bg-red-50', border: 'border-red-200', color: 'text-red-700', badge: 'bg-red-200 text-red-800' },
  'mostly-false': { icon: XCircle, label: 'MOSTLY FALSE', bg: 'bg-red-50', border: 'border-red-200', color: 'text-red-700', badge: 'bg-red-200 text-red-800' },
  misleading: { icon: AlertTriangle, label: 'MISLEADING', bg: 'bg-amber-50', border: 'border-amber-200', color: 'text-amber-700', badge: 'bg-amber-200 text-amber-800' },
  unverified: { icon: HelpCircle, label: 'UNVERIFIED', bg: 'bg-gray-50', border: 'border-gray-200', color: 'text-gray-600', badge: 'bg-gray-200 text-gray-700' },
}

export default function FactCheck({ title, description, items = [] }) {
  if (!items.length) return null

  return (
    <div className="mb-8">
      {title && <h2 className="font-serif text-2xl font-bold text-ink mb-2">{title}</h2>}
      {description && <p className="text-sm text-ink-muted mb-4">{description}</p>}

      <div className="space-y-4">
        {items.map((item, i) => {
          const vc = verdictConfig[item.verdict] || verdictConfig.unverified
          const Icon = vc.icon

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-xl border-2 overflow-hidden ${vc.border}`}
            >
              {/* Claim */}
              <div className={`${vc.bg} px-5 py-3 flex items-center justify-between`}>
                <p className="text-sm font-semibold text-ink flex-1">"{item.claim}"</p>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ml-3 shrink-0 ${vc.badge}`}>
                  {vc.label}
                </span>
              </div>
              {/* Explanation */}
              <div className="bg-white px-5 py-3">
                <div className="flex items-start gap-2">
                  <Icon size={16} className={`${vc.color} shrink-0 mt-0.5`} />
                  <p className="text-sm text-ink-light leading-relaxed">{item.explanation}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
