import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Construction, MapPin, Clock, DollarSign, Car, Fuel, Calendar, TrendingUp, CheckCircle2, Download, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'

const origins = {
  'covington': { name: 'Covington', oldMin: 6, newMin: 18, oldMiles: 1.5, newMiles: 5.2, pedestrian: true },
  'newport': { name: 'Newport', oldMin: 4, newMin: 14, oldMiles: 1.0, newMiles: 3.8, pedestrian: true },
  'bellevue': { name: 'Bellevue', oldMin: 8, newMin: 20, oldMiles: 2.5, newMiles: 6.5, pedestrian: false },
  'ft-thomas': { name: 'Ft. Thomas', oldMin: 12, newMin: 22, oldMiles: 4.0, newMiles: 7.2, pedestrian: false },
  'florence': { name: 'Florence', oldMin: 22, newMin: 30, oldMiles: 12, newMiles: 15, pedestrian: false },
  'downtown-cincy': { name: 'Downtown Cincy', oldMin: 5, newMin: 5, oldMiles: 0, newMiles: 0, note: 'You\'re already on the Ohio side — no bridge needed. But your NKY colleagues aren\'t so lucky.' },
}

const destinations = [
  { id: 'downtown', name: 'Downtown Cincinnati' },
  { id: 'banks', name: 'The Banks / Riverfront' },
  { id: 'covington-main', name: 'Covington MainStrasse' },
  { id: 'newport-levee', name: 'Newport on the Levee' },
]

const GAS_PRICE = 3.45
const MPG = 25
const WORK_DAYS_PER_YEAR = 250
const CLOSURE_YEARS = 2.5

export default function BridgeImpact({ onBack }) {
  const [origin, setOrigin] = useState('')
  const [tripsPerWeek, setTripsPerWeek] = useState(5)
  const [step, setStep] = useState(0)

  const loc = origin ? origins[origin] : null

  const impact = useMemo(() => {
    if (!loc || loc.note) return loc?.note ? { note: loc.note } : null

    const addedMin = loc.newMin - loc.oldMin
    const addedMiles = loc.newMiles - loc.oldMiles
    const tripsPerYear = tripsPerWeek * 52
    const totalTripsInClosure = Math.round(tripsPerYear * CLOSURE_YEARS)

    const addedHoursPerYear = Math.round((addedMin * 2 * tripsPerWeek * 52) / 60) // round trip
    const totalAddedHours = Math.round(addedHoursPerYear * CLOSURE_YEARS)

    const addedGasCostPerTrip = (addedMiles * 2 / MPG) * GAS_PRICE
    const addedGasCostPerYear = Math.round(addedGasCostPerTrip * tripsPerYear)
    const totalAddedGasCost = Math.round(addedGasCostPerYear * CLOSURE_YEARS)

    // Wear: IRS rate $0.67/mile
    const wearPerYear = Math.round(addedMiles * 2 * tripsPerYear * 0.67)
    const totalWear = Math.round(wearPerYear * CLOSURE_YEARS)

    const totalCost = totalAddedGasCost + totalWear

    // Monthly accumulation chart
    const months = Array.from({ length: 30 }, (_, i) => ({
      month: i + 1,
      hours: Math.round((addedMin * 2 * tripsPerWeek * 4.33 * (i + 1)) / 60),
      cost: Math.round(((addedGasCostPerTrip + addedMiles * 2 * 0.67) * tripsPerWeek * 4.33 * (i + 1))),
    }))

    return {
      addedMin, addedMiles, addedHoursPerYear, totalAddedHours,
      addedGasCostPerYear, totalAddedGasCost, wearPerYear, totalWear,
      totalCost, totalTripsInClosure, months,
    }
  }, [loc, tripsPerWeek])

  return (
    <StoryShell
      onBack={onBack}
      category="TRANSPORTATION"
      categoryColor="#b8860b"
      timestamp="March 19, 2026"
      readTime="Impact Calculator"
    >
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
        The Bridge That Vanished
      </h1>

      <p className="text-xl text-ink-light leading-relaxed mb-4">
        On January 12, the Fourth Street Bridge over the Licking River closed for good. On March 2, they blew it up.
        The controlled demolition took seconds. The replacement will take until summer 2028.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-4">
        For the <span className="font-mono font-bold text-ink">11,608</span> vehicles and <span className="font-mono font-bold text-ink">700</span> pedestrians who crossed it daily,
        the math is brutally simple: every trip now takes longer, costs more, and burns fuel on detour miles that didn't exist three months ago.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-8">
        Covington responded with a $750,000 grant for impacted businesses. TANK launched a free shuttle.
        But for daily commuters, the question is personal: what does 2.5 years of detours actually cost <em>you</em>?
      </p>

      <Divider />

      {/* Origin selector */}
      <SectionLabel number="1" text="Where do you start your commute?" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {Object.entries(origins).map(([id, o]) => (
          <button
            key={id}
            onClick={() => { setOrigin(id); if (step < 1) setStep(1) }}
            className={`text-left px-4 py-3 rounded-lg border-2 transition-all
              ${origin === id ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-rule bg-white hover:border-ink-muted'}`}
          >
            <div className="flex items-center gap-2">
              <MapPin size={13} className={origin === id ? 'text-amber-600' : 'text-ink-muted'} />
              <span className="font-medium text-sm text-ink">{o.name}</span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">Was {o.oldMin} min → Now {o.newMin} min</p>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {step >= 1 && impact && !impact.note && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Trip frequency */}
            <SectionLabel number="2" text="How often do you cross?" />
            <div className="bg-white border border-rule rounded-xl p-6 mb-8">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold font-mono text-ink">{tripsPerWeek}</span>
                <span className="text-ink-muted">crossings per week</span>
              </div>
              <input
                type="range" min={1} max={14} step={1}
                value={tripsPerWeek}
                onChange={(e) => setTripsPerWeek(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-ink-muted mt-1">
                <span>1/week</span>
                <span>14/week (daily round-trip)</span>
              </div>
            </div>

            <Divider />

            {/* Results */}
            <h2 className="font-serif text-3xl font-bold text-ink mb-2">Your 2.5-Year Cost</h2>
            <p className="text-ink-light leading-relaxed mb-6">
              Starting from {loc.name}, each crossing now adds <span className="font-mono font-bold text-ink">{impact.addedMin} minutes</span> and{' '}
              <span className="font-mono font-bold text-ink">{impact.addedMiles.toFixed(1)} miles</span> of detour. Here's what that compounds to:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <ImpactCard icon={Clock} label="Hours Lost" value={impact.totalAddedHours} unit="hrs" color="amber" />
              <ImpactCard icon={Fuel} label="Extra Gas" value={`$${impact.totalAddedGasCost.toLocaleString()}`} color="red" />
              <ImpactCard icon={Car} label="Wear & Tear" value={`$${impact.totalWear.toLocaleString()}`} color="orange" />
              <ImpactCard icon={DollarSign} label="Total Cost" value={`$${impact.totalCost.toLocaleString()}`} color="red" highlight />
            </div>

            {/* Cumulative chart */}
            <div className="bg-white border border-rule rounded-xl p-5 mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">
                Cumulative Impact Over 30 Months
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={impact.months} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <defs>
                      <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b8860b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#b8860b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8a8a8a' }} tickLine={false} axisLine={{ stroke: '#d4d0c8' }}
                      tickFormatter={v => v % 6 === 0 ? `Mo ${v}` : ''} />
                    <YAxis tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false}
                      tickFormatter={v => `$${v}`} />
                    <Tooltip
                      formatter={(v, name) => [name === 'cost' ? `$${v.toLocaleString()}` : `${v} hrs`, name === 'cost' ? 'Total Cost' : 'Hours Lost']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #d4d0c8', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}
                    />
                    <Area type="monotone" dataKey="cost" stroke="#b8860b" strokeWidth={2} fill="url(#costGrad)"
                      dot={false} activeDot={{ r: 4, fill: '#b8860b', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Context */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">The Bigger Picture</p>
                  <p className="text-sm text-amber-700">
                    Multiply your numbers by the 11,608 daily vehicles and the regional cost becomes staggering.
                    At average usage, the bridge closure will cost NKY commuters an estimated{' '}
                    <span className="font-bold">$45M+ in aggregate</span> over 2.5 years — before accounting for the economic impact on Covington and Newport businesses
                    that rely on cross-river foot traffic.
                  </p>
                </div>
              </div>
            </div>

            {/* TANK shuttle info */}
            <div className="bg-teal-bg border border-teal/20 rounded-xl p-5 mb-8">
              <p className="text-sm font-semibold text-teal mb-1">Free Alternative: TANK Shuttle</p>
              <p className="text-sm text-teal/80">
                TANK is running a free shuttle every 30 minutes for pedestrians and cyclists during the closure.
                If you can leave the car at home even 2 days a week, that's{' '}
                <span className="font-bold">${Math.round(impact.totalCost * 0.4).toLocaleString()} back in your pocket</span>.
              </p>
            </div>

            <p className="text-lg text-ink-light leading-relaxed mb-8">
              The new bridge opens summer 2028. Until then, these numbers are the daily reality.
              What makes them worth tracking is the compound effect — the kind of cost that's easy to dismiss on any given Tuesday,
              but impossible to ignore across 30 months of Tuesdays.
            </p>

            <SaveButton
              label="Save Your Commute Impact Report"
              storyId="bridge-impact"
              profileData={{ origin, tripsPerWeek, impact }}
            />
          </motion.div>
        )}
        {impact?.note && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-4">
              <p className="text-sm text-blue-800">{impact.note}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </StoryShell>
  )
}

function SectionLabel({ number, text }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-7 h-7 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">{number}</span>
      <span className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{text}</span>
    </div>
  )
}

function ImpactCard({ icon: Icon, label, value, unit, color, highlight }) {
  const bg = highlight ? 'bg-red-50 border-red-200' : 'bg-white border-rule'
  return (
    <div className={`rounded-xl p-4 text-center border ${bg}`}>
      <Icon size={18} className={`mx-auto mb-2 ${highlight ? 'text-red-600' : 'text-amber-600'}`} />
      <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${highlight ? 'text-red-700' : 'text-ink'}`}>{value}</p>
      {unit && <p className="text-xs text-ink-muted">{unit}</p>}
    </div>
  )
}

function Divider() {
  return <div className="my-10 flex items-center gap-4"><div className="h-px flex-1 bg-rule" /><div className="w-1.5 h-1.5 bg-amber-500 rotate-45" /><div className="h-px flex-1 bg-rule" /></div>
}

