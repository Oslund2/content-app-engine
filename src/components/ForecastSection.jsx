import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

function interpolate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '')
}

export default function ForecastSection({ narrative, cityData, calculations, onContinue }) {
  const vars = {
    cityName: cityData.name,
    inflationRate: cityData.inflationRate,
    annualTotal: calculations.annualTotal.toLocaleString(),
    projectedAnnual: calculations.projectedAnnual.toLocaleString(),
    totalDelta: calculations.totalDelta.toLocaleString(),
    percentileWord: calculations.percentileWord,
  }

  return (
    <section className="mt-12">
      <motion.h2
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-6"
      >
        {narrative.headline}
      </motion.h2>

      <p className="text-lg text-ink-light leading-relaxed mb-8">
        {interpolate(narrative.body, vars)}
      </p>

      {/* Big number highlight */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-accent-bg border border-accent/20 rounded-xl p-8 text-center mb-8"
      >
        <p className="text-sm uppercase tracking-wide text-accent/70 mb-2">4-Year Additional Cost</p>
        <p className="text-4xl sm:text-5xl font-bold font-mono text-accent">
          +${calculations.totalDelta.toLocaleString()}
        </p>
        <p className="text-sm text-ink-muted mt-2">
          above current annual spending of ${calculations.annualTotal.toLocaleString()}
        </p>
      </motion.div>

      <button
        onClick={onContinue}
        className="flex items-center gap-2 text-accent font-medium hover:gap-3 transition-all duration-200"
      >
        See your personalized summary <ArrowRight size={16} />
      </button>
    </section>
  )
}
