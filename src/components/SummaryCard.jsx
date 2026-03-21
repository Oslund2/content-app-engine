import { motion } from 'framer-motion'
import { Download, Check, Home, ShoppingCart, Train, UtensilsCrossed, Zap, Heart, Music } from 'lucide-react'

const iconMap = {
  Housing: Home,
  Groceries: ShoppingCart,
  Dining: UtensilsCrossed,
  Transit: Train,
  Entertainment: Music,
  Utilities: Zap,
  Healthcare: Heart,
}

export default function SummaryCard({ cityData, calculations, rent, lifestyle, saved, onSave }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white border-2 border-ink rounded-2xl overflow-hidden shadow-lg"
    >
      {/* Card header */}
      <div className="bg-ink px-6 sm:px-8 py-5">
        <h3 className="text-white font-serif text-xl sm:text-2xl font-bold">
          Your Inflation Profile
        </h3>
        <p className="text-white/60 text-sm mt-1">{cityData.name} &middot; March 2026</p>
      </div>

      <div className="px-6 sm:px-8 py-6 space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-4">
          <MetricBox label="Monthly Cost" value={`$${calculations.totalMonthly.toLocaleString()}`} />
          <MetricBox label="Annual Cost" value={`$${calculations.annualTotal.toLocaleString()}`} />
          <MetricBox label="2030 Projected" value={`$${calculations.projectedAnnual.toLocaleString()}`} accent />
          <MetricBox label="4-Year Delta" value={`+$${calculations.totalDelta.toLocaleString()}`} accent />
        </div>

        {/* Breakdown */}
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-3">Monthly Breakdown</h4>
          <div className="space-y-2">
            {calculations.breakdown.map((item) => {
              const Icon = iconMap[item.name] || Home
              const pct = Math.round((item.current / calculations.totalMonthly) * 100)
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <Icon size={14} style={{ color: item.color }} className="shrink-0" />
                  <span className="text-sm text-ink-light w-24 shrink-0">{item.name}</span>
                  <div className="flex-1 h-2 bg-paper-warm rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-xs font-mono text-ink-muted w-16 text-right">
                    ${item.current.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Profile tags */}
        <div className="flex flex-wrap gap-2">
          <Tag>Rent: ${rent.toLocaleString()}/mo</Tag>
          <Tag>{lifestyle.groceryTier} groceries</Tag>
          <Tag>{lifestyle.hasTransit ? 'Public transit' : 'Personal car'}</Tag>
          <Tag>{lifestyle.diningOut}x dining/wk</Tag>
          <Tag>{lifestyle.entertainmentLevel} entertainment</Tag>
        </div>

        {/* City inflation badge */}
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
          {cityData.name} inflation rate: {cityData.inflationRate}% &middot; Spender rank: {calculations.percentile}
        </div>

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={saved}
          className={`w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200
            ${saved
              ? 'bg-teal-bg text-teal border border-teal/20'
              : 'bg-ink text-white hover:bg-rule-dark active:scale-[0.98]'
            }`}
        >
          {saved ? (
            <><Check size={16} /> Saved to Dashboard</>
          ) : (
            <><Download size={16} /> Save to Dashboard</>
          )}
        </button>
      </div>
    </motion.div>
  )
}

function MetricBox({ label, value, accent }) {
  return (
    <div className={`rounded-lg p-4 ${accent ? 'bg-accent-bg' : 'bg-paper-warm'}`}>
      <p className="text-xs uppercase tracking-wide text-ink-muted mb-1">{label}</p>
      <p className={`text-lg sm:text-xl font-bold font-mono ${accent ? 'text-accent' : 'text-ink'}`}>
        {value}
      </p>
    </div>
  )
}

function Tag({ children }) {
  return (
    <span className="inline-block px-3 py-1 bg-paper-warm rounded-full text-xs text-ink-muted border border-rule">
      {children}
    </span>
  )
}
