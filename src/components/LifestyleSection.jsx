import { motion } from 'framer-motion'
import { ShoppingCart, UtensilsCrossed, Train, Music, ArrowRight } from 'lucide-react'

export default function LifestyleSection({ narrative, cityData, lifestyle, setLifestyle, calculations, onContinue }) {
  const update = (key, value) => setLifestyle(prev => ({ ...prev, [key]: value }))

  return (
    <section>
      <p className="text-2xl font-serif text-ink leading-snug mb-8">
        {narrative.intro}
      </p>

      <div className="space-y-6 mb-8">
        {/* Dining Out */}
        <InputCard
          icon={<UtensilsCrossed size={18} />}
          label="Dinners out per week"
          color="purple"
        >
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={7}
              step={1}
              value={lifestyle.diningOut}
              onChange={(e) => update('diningOut', Number(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono font-bold text-lg w-6 text-right text-ink">{lifestyle.diningOut}</span>
          </div>
        </InputCard>

        {/* Grocery Tier */}
        <InputCard
          icon={<ShoppingCart size={18} />}
          label="Grocery spending"
          color="teal"
        >
          <div className="flex gap-2">
            {['budget', 'moderate', 'premium'].map((tier) => (
              <button
                key={tier}
                onClick={() => update('groceryTier', tier)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all
                  ${lifestyle.groceryTier === tier
                    ? 'bg-teal text-white shadow-sm'
                    : 'bg-paper-warm text-ink-light hover:bg-teal-bg'
                  }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </InputCard>

        {/* Transit */}
        <InputCard
          icon={<Train size={18} />}
          label="Primary transportation"
          color="gold"
        >
          <div className="flex gap-2">
            <button
              onClick={() => update('hasTransit', true)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                ${lifestyle.hasTransit
                  ? 'bg-gold text-white shadow-sm'
                  : 'bg-paper-warm text-ink-light hover:bg-gold-bg'
                }`}
            >
              Public Transit
            </button>
            <button
              onClick={() => update('hasTransit', false)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                ${!lifestyle.hasTransit
                  ? 'bg-gold text-white shadow-sm'
                  : 'bg-paper-warm text-ink-light hover:bg-gold-bg'
                }`}
            >
              Personal Car
            </button>
          </div>
        </InputCard>

        {/* Entertainment */}
        <InputCard
          icon={<Music size={18} />}
          label="Entertainment & nightlife"
          color="indigo"
        >
          <div className="flex gap-2">
            {['minimal', 'moderate', 'active'].map((level) => (
              <button
                key={level}
                onClick={() => update('entertainmentLevel', level)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all
                  ${lifestyle.entertainmentLevel === level
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'bg-paper-warm text-ink-light hover:bg-indigo-50'
                  }`}
              >
                {level}
              </button>
            ))}
          </div>
        </InputCard>
      </div>

      {/* Live calculation */}
      <motion.div
        key={`${calculations.totalMonthly}`}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-rule rounded-xl p-6 sm:p-8 mb-8"
      >
        <p className="text-lg text-ink-light leading-relaxed">
          Your lifestyle profile suggests a monthly cost-of-living of approximately{' '}
          <span className="font-mono font-bold text-ink text-xl">${calculations.totalMonthly.toLocaleString()}</span>.
          In {cityData.name}, that places you in the{' '}
          <span className="font-semibold text-ink">{calculations.percentile}</span> of urban spenders.
        </p>
      </motion.div>

      <button
        onClick={onContinue}
        className="flex items-center gap-2 text-accent font-medium hover:gap-3 transition-all duration-200"
      >
        Show me the forecast <ArrowRight size={16} />
      </button>
    </section>
  )
}

function InputCard({ icon, label, children }) {
  return (
    <div className="bg-white border border-rule rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-ink-muted">{icon}</span>
        <span className="text-sm font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      </div>
      {children}
    </div>
  )
}
