import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, TrendingDown, Users, ChevronRight, CheckCircle2, Download, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'
import StoryConnections from '../components/StoryConnections'
import AdSlot from '../components/AdSlot'
import DynamicNarrative from '../components/DynamicNarrative'
import LivePoll from '../components/LivePoll'

const neighborhoods = {
  'downtown-otr': { name: 'Downtown / OTR', safety: 28, neighborhood: 42, crime: 20, services: 45, improvement: -8 },
  'clifton': { name: 'Clifton / CUF', safety: 35, neighborhood: 52, crime: 27, services: 48, improvement: -5 },
  'hyde-park': { name: 'Hyde Park', safety: 62, neighborhood: 74, crime: 55, services: 60, improvement: -3 },
  'westwood': { name: 'Westwood', safety: 22, neighborhood: 35, crime: 18, services: 30, improvement: -12 },
  'madisonville': { name: 'Madisonville', safety: 26, neighborhood: 38, crime: 22, services: 35, improvement: -9 },
  'mt-washington': { name: 'Mt. Washington', safety: 48, neighborhood: 60, crime: 40, services: 52, improvement: -4 },
  'northside': { name: 'Northside', safety: 32, neighborhood: 46, crime: 25, services: 42, improvement: -7 },
  'price-hill': { name: 'Price Hill', safety: 20, neighborhood: 30, crime: 15, services: 28, improvement: -14 },
  'walnut-hills': { name: 'Walnut Hills', safety: 30, neighborhood: 44, crime: 23, services: 40, improvement: -6 },
  'anderson': { name: 'Anderson Twp', safety: 58, neighborhood: 70, crime: 50, services: 58, improvement: -2 },
}

const cityAvg = { safety: 32, neighborhood: 50, crime: 25, services: 40 }
const nationalAvg = { safety: 53, neighborhood: 65, crime: 42, services: 55 }

const historicalData = [
  { year: '2019', cincinnati: 45, national: 55 },
  { year: '2021', cincinnati: 40, national: 54 },
  { year: '2023', cincinnati: 40, national: 53 },
  { year: '2025', cincinnati: 32, national: 53 },
]

export default function SafetyExplorer({ onBack, onOpenStory }) {
  const [selected, setSelected] = useState('')
  const [showComparison, setShowComparison] = useState(false)
  const [showInterstitial, setShowInterstitial] = useState(false)

  const hood = selected ? neighborhoods[selected] : null

  const radarData = useMemo(() => {
    if (!hood) return []
    return [
      { metric: 'Overall Safety', you: hood.safety, city: cityAvg.safety, national: nationalAvg.safety },
      { metric: 'Neighborhood Feel', you: hood.neighborhood, city: cityAvg.neighborhood, national: nationalAvg.neighborhood },
      { metric: 'Crime Prevention', you: hood.crime, city: cityAvg.crime, national: nationalAvg.crime },
      { metric: 'City Services', you: hood.services, city: cityAvg.services, national: nationalAvg.services },
    ]
  }, [hood])

  return (
    <StoryShell
      onBack={onBack}
      category="INVESTIGATION"
      categoryColor="#0d7377"
      timestamp="March 20, 2026"
      readTime="Interactive Explorer"
      storyId="safety-survey"
    >
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
        How Safe Does Cincinnati Feel?
      </h1>

      <p className="text-xl text-ink-light leading-relaxed mb-4">
        When the ETC Institute surveyed more than 1,200 Cincinnati residents last fall, the results landed like a verdict:
        only <span className="font-mono font-bold text-wcpo-red text-2xl">32%</span> said they felt satisfied with safety in the city.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-4">
        That's down from 40% in 2023. In comparable cities nationwide, the figure is 53%.
        The gap isn't just statistical — it's a 21-point gulf between how safe Cincinnati residents feel and how safe residents of similar cities feel.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-8">
        But city-wide averages flatten a more complex geography. Hyde Park and Price Hill don't experience the same Cincinnati.
        Select your neighborhood to see where you stand.
      </p>

      <Divider />

      {/* Historical trend */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">The Trendline</h2>
      <p className="text-sm text-ink-muted mb-4">% of residents "satisfied" or "very satisfied" with safety</p>
      <div className="bg-white border border-rule rounded-xl p-5 mb-10">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historicalData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#8a8a8a' }} axisLine={{ stroke: '#d4d0c8' }} tickLine={false} />
              <YAxis domain={[0, 70]} tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ borderRadius: '8px', border: '1px solid #d4d0c8', fontSize: '13px' }} />
              <Bar dataKey="cincinnati" fill="#c41230" radius={[4, 4, 0, 0]} name="Cincinnati" />
              <Bar dataKey="national" fill="#0d7377" radius={[4, 4, 0, 0]} name="National Avg" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 justify-center mt-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-wcpo-red" /> Cincinnati</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-teal" /> National Avg</span>
        </div>
      </div>

      <Divider />

      {/* Neighborhood selector */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">Your Neighborhood</h2>
      <p className="text-ink-light text-sm mb-4">Select yours to see how local perceptions compare to the city and national benchmarks.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
        {Object.entries(neighborhoods).map(([id, n]) => (
          <button
            key={id}
            onClick={() => { setSelected(id); setShowInterstitial(true); setShowComparison(false) }}
            className={`text-left px-3 py-2.5 rounded-lg border-2 text-sm transition-all
              ${selected === id ? 'border-teal bg-teal-bg' : 'border-rule bg-white hover:border-ink-muted'}`}
          >
            <span className={`font-medium ${selected === id ? 'text-teal' : 'text-ink'}`}>{n.name}</span>
          </button>
        ))}
      </div>

      {showInterstitial && !showComparison && (
        <AdSlot.Interstitial storyId="safety-survey" onComplete={() => setShowComparison(true)} />
      )}

      <AnimatePresence>
        {showComparison && hood && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Neighborhood score */}
            <div className="bg-white border border-rule rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl font-bold text-ink">{hood.name}</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded ${hood.safety >= 50 ? 'bg-green-100 text-green-800' : hood.safety >= 30 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                  {hood.safety >= 50 ? 'Above Average' : hood.safety >= 30 ? 'Near Average' : 'Below Average'}
                </span>
              </div>

              {/* Score bars */}
              {[
                { label: 'Overall Safety', value: hood.safety, city: cityAvg.safety, nat: nationalAvg.safety },
                { label: 'Neighborhood Feel', value: hood.neighborhood, city: cityAvg.neighborhood, nat: nationalAvg.neighborhood },
                { label: 'Crime Prevention', value: hood.crime, city: cityAvg.crime, nat: nationalAvg.crime },
                { label: 'City Services', value: hood.services, city: cityAvg.services, nat: nationalAvg.services },
              ].map((metric, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ink-light">{metric.label}</span>
                    <span className="text-sm font-mono font-bold text-ink">{metric.value}%</span>
                  </div>
                  <div className="relative h-4 bg-paper-warm rounded-full overflow-hidden">
                    {/* National avg marker */}
                    <div className="absolute top-0 h-full w-0.5 bg-teal/50 z-10" style={{ left: `${metric.nat}%` }} />
                    {/* City avg marker */}
                    <div className="absolute top-0 h-full w-0.5 bg-wcpo-red/40 z-10" style={{ left: `${metric.city}%` }} />
                    {/* Bar */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className={`h-full rounded-full ${metric.value >= metric.nat ? 'bg-green-500' : metric.value >= metric.city ? 'bg-amber-400' : 'bg-wcpo-red'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-ink-muted mt-0.5">
                    <span>0%</span>
                    <span className="flex gap-3">
                      <span className="text-wcpo-red">| City avg: {metric.city}%</span>
                      <span className="text-teal">| National: {metric.nat}%</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Trend indicator */}
            <div className={`rounded-xl p-4 flex items-start gap-3 mb-6 ${hood.improvement <= -10 ? 'bg-red-50 border border-red-200' : hood.improvement <= -5 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
              <TrendingDown size={18} className={hood.improvement <= -10 ? 'text-red-600' : hood.improvement <= -5 ? 'text-amber-600' : 'text-green-600'} />
              <div>
                <p className="text-sm font-semibold" style={{ color: hood.improvement <= -10 ? '#991b1b' : hood.improvement <= -5 ? '#92400e' : '#166534' }}>
                  {Math.abs(hood.improvement)}-point drop since 2023
                </p>
                <p className="text-sm" style={{ color: hood.improvement <= -10 ? '#b91c1c' : hood.improvement <= -5 ? '#a16207' : '#15803d' }}>
                  {hood.improvement <= -10
                    ? `${hood.name} has seen one of the sharpest declines in perceived safety in the city. Residents here are more than twice as likely to feel unsafe as the national average.`
                    : hood.improvement <= -5
                      ? `${hood.name}'s decline tracks roughly with the city average. The erosion is steady, not sudden — which often makes it harder to notice until the cumulative effect becomes unavoidable.`
                      : `${hood.name} has been relatively resilient, with only a modest decline. But even here, satisfaction lags national benchmarks.`}
                </p>
              </div>
            </div>

            {/* Radar chart */}
            <div className="bg-white border border-rule rounded-xl p-5 mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">{hood.name} vs. Benchmarks</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e5e5" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#8a8a8a' }} />
                    <PolarRadiusAxis domain={[0, 80]} tick={false} axisLine={false} />
                    <Radar name={hood.name} dataKey="you" stroke="#c41230" fill="#c41230" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="City Average" dataKey="city" stroke="#8a8a8a" fill="transparent" strokeDasharray="4 4" />
                    <Radar name="National" dataKey="national" stroke="#0d7377" fill="transparent" strokeDasharray="2 2" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-5 justify-center mt-2 text-xs text-ink-muted">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-wcpo-red/30 border border-wcpo-red" /> {hood.name}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border border-gray-400 border-dashed" /> City Avg</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border border-teal border-dashed" /> National</span>
              </div>
            </div>

            <DynamicNarrative storyId="safety-survey" profileData={{ neighborhood: selected, scores: hood, radarData }} />

            <LivePoll
              storyId="safety-survey"
              neighborhood={selected}
              pollData={{ safety: hood.safety, neighborhood: hood.neighborhood }}
            />

            <AdSlot.Insight storyId="safety-survey" />

            {/* Narrative conclusion */}
            <p className="text-lg text-ink-light leading-relaxed mb-4">
              The survey's authors note that timing matters: it was conducted in fall 2025, after several high-profile incidents.
              But the trend predates any single event. Since 2019, Cincinnati's safety perception has dropped 13 points while the national average barely budged.
            </p>
            <p className="text-lg text-ink-light leading-relaxed mb-8">
              What changes this? The data suggests it's not just policing — residents who rated city services higher also reported feeling safer,
              regardless of their neighborhood's crime statistics. Perception, it turns out, is infrastructure.
            </p>

            <AdSlot.ResultCard storyId="safety-survey" />

            <SaveButton
              label="Save Your Neighborhood Safety Profile"
              storyId="safety-survey"
              profileData={{ neighborhood: selected, scores: hood, radarData }}
            />
            <StoryConnections
              storyId="safety-survey"
              profileData={{ neighborhood: selected, scores: hood, radarData }}
              onOpenStory={onOpenStory}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </StoryShell>
  )
}

function Divider() {
  return <div className="my-10 flex items-center gap-4"><div className="h-px flex-1 bg-rule" /><div className="w-1.5 h-1.5 bg-teal rotate-45" /><div className="h-px flex-1 bg-rule" /></div>
}

