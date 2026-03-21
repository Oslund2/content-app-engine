import { motion } from 'framer-motion'
import { Home, ArrowRight } from 'lucide-react'

function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '')
}

export default function RentSection({ cityData, narrative, rent, setRent, calculations, onContinue }) {
  const vars = {
    rentIncrease: calculations.rentIncrease,
    cityName: cityData.name,
    cityDesc: cityData.description,
    rent: rent.toLocaleString(),
    rentAnnual: calculations.rentAnnual.toLocaleString(),
    rentProjected: calculations.rentProjectedAnnual2027.toLocaleString(),
    rentDelta: calculations.rentDelta.toLocaleString(),
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-accent-bg flex items-center justify-center">
          <Home size={18} className="text-accent" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Housing</h2>
      </div>

      <p className="text-lg text-ink-light leading-relaxed mb-8">
        {interpolate(narrative.before, vars)}
      </p>

      {/* Rent Slider */}
      <div className="bg-white border border-rule rounded-xl p-6 sm:p-8 mb-8">
        <label className="block text-sm font-medium tracking-wide uppercase text-ink-muted mb-2">
          Your monthly rent
        </label>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-bold text-ink font-mono">${rent.toLocaleString()}</span>
          <span className="text-ink-muted">/month</span>
        </div>
        <input
          type="range"
          min={600}
          max={6000}
          step={50}
          value={rent}
          onChange={(e) => setRent(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-ink-muted mt-1">
          <span>$600</span>
          <span>$6,000</span>
        </div>
      </div>

      {/* Dynamic narrative */}
      <motion.div
        key={rent}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-lg text-ink-light leading-relaxed mb-4">
          {interpolate(narrative.after, vars)}
        </p>

        {/* Quick stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard label="Annual Rent" value={`$${calculations.rentAnnual.toLocaleString()}`} color="accent" />
          <StatCard label="2027 Projected" value={`$${calculations.rentProjectedAnnual2027.toLocaleString()}`} color="accent" />
          <StatCard label="Increase" value={`+$${calculations.rentDelta.toLocaleString()}`} color="accent" highlight />
        </div>
      </motion.div>

      <button
        onClick={onContinue}
        className="flex items-center gap-2 text-accent font-medium hover:gap-3 transition-all duration-200"
      >
        Continue the story <ArrowRight size={16} />
      </button>
    </section>
  )
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-lg p-3 sm:p-4 text-center ${highlight ? 'bg-accent-bg border border-accent/20' : 'bg-paper-warm border border-rule'}`}>
      <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm sm:text-lg font-bold font-mono ${highlight ? 'text-accent' : 'text-ink'}`}>{value}</p>
    </div>
  )
}
