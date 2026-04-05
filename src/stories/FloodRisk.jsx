import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, MapPin, TrendingUp, AlertTriangle, Home, ArrowRight, Waves } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'
import StoryConnections from '../components/StoryConnections'
import AdSlot from '../components/AdSlot'
import DynamicNarrative from '../components/DynamicNarrative'
import LivePoll from '../components/LivePoll'
import { StoryMap, MapMarker, FloodOverlay, ChoroplethLayer, MapLegendItem } from '../components/map'
import { neighborhoodPolygons, getNeighborhoodCenter } from '../components/map'

const floodStages = {
  action: { level: 46, label: 'Action Stage', color: '#ca8a04', desc: 'Authorities monitor conditions. Low-lying roads may start flooding.' },
  minor: { level: 52, label: 'Minor Flood', color: '#ea580c', desc: 'Some roads close. Low-lying properties see water in yards.' },
  moderate: { level: 56, label: 'Moderate Flood', color: '#dc2626', desc: 'Significant road closures. River Road, Kellogg Ave underwater. Evacuations possible.' },
  major: { level: 60, label: 'Major Flood', color: '#7f1d1d', desc: 'Widespread damage. Downtown parking garages flood. Historic-level event.' },
}

const historicalFloods = [
  { year: '1937', crest: 79.9, label: 'Great Flood of 1937 — 79.9 ft' },
  { year: '1997', crest: 64.7, label: 'March 1997 — 64.7 ft' },
  { year: '2018', crest: 60.5, label: 'February 2018 — 60.5 ft' },
  { year: '2021', crest: 57.5, label: 'March 2021 — 57.5 ft' },
  { year: '2024', crest: 55.2, label: 'April 2024 — 55.2 ft' },
]

const neighborhoods = {
  'East End / Columbia Tusculum': {
    elevation: 'low', floodZone: 'AE',
    actionImpact: 'Eastern Ave begins to see ponding. River access trails submerged.',
    minorImpact: 'Eastern Ave impassable. Basements in lowest blocks take water.',
    moderateImpact: 'First-floor flooding in riverside homes. Full evacuation likely.',
    tip: 'You live in a FEMA AE flood zone. If you don\'t have flood insurance, get it today — there\'s a 30-day waiting period.'
  },
  'The Banks / Smale Park': {
    elevation: 'low', floodZone: 'AE',
    actionImpact: 'Riverwalk sections close. Smale Park begins flooding.',
    minorImpact: 'Mehring Way floods. Parking garages at risk. Great American Ball Park access affected.',
    moderateImpact: 'Major downtown access routes cut. Parking structures underwater.',
    tip: 'If you work downtown and park near the river, have an alternate parking plan ready by action stage.'
  },
  'Covington / Newport (NKY)': {
    elevation: 'low-moderate', floodZone: 'AE/X',
    actionImpact: 'Riverside Drive in Covington sees water. Newport flood wall holds.',
    minorImpact: 'Covington\'s MainStrasse area may see street flooding. Licking River backs up.',
    moderateImpact: 'Widespread NKY flooding. Major road closures on KY-8 and I-471 ramps.',
    tip: 'Newport\'s flood wall protects to 60 ft. Covington is more exposed — know your block\'s elevation.'
  },
  'Anderson / Mt. Washington': {
    elevation: 'moderate', floodZone: 'X',
    actionImpact: 'Minimal direct impact. Beechmont Ave near river may see closures.',
    minorImpact: 'Kellogg Ave closes. Creek flooding in low-lying subdivisions.',
    moderateImpact: 'Access to downtown via Kellogg and River Road cut off. Use I-275 / I-471.',
    tip: 'You\'re outside the flood zone but creek flooding is your risk. Check if your property is near a stream.'
  },
  'Riverside / Sayler Park': {
    elevation: 'low', floodZone: 'AE',
    actionImpact: 'River Road begins closing. Riverside Park submerged.',
    minorImpact: 'River Road fully closed. Homes nearest the river see yard flooding.',
    moderateImpact: 'First-floor flooding. This neighborhood has historically been among the hardest hit.',
    tip: 'Riverside and Sayler Park were devastated in 1997. Know your evacuation route to Delhi Pike.'
  },
  'Clifton / Northside (Upland)': {
    elevation: 'high', floodZone: 'X',
    actionImpact: 'No direct river impact. Mill Creek corridor may see backup.',
    minorImpact: 'Mill Creek flooding possible in Spring Grove area. Upland areas unaffected.',
    moderateImpact: 'Still generally safe, but Mill Creek flooding can close I-75 access at Mitchell Ave.',
    tip: 'River flooding won\'t reach you, but Mill Creek flash flooding in heavy rain is your local risk.'
  },
}

const riverForecast = [
  { day: 'Thu', level: 43.2 },
  { day: 'Fri', level: 43.8 },
  { day: 'Sat', level: 44.5 },
  { day: 'Sun', level: 46.1 },
  { day: 'Mon', level: 47.8 },
  { day: 'Tue', level: 48.2 },
  { day: 'Wed', level: 47.5 },
]

export default function FloodRisk({ onBack, onOpenStory }) {
  const [neighborhood, setNeighborhood] = useState('')
  const [simLevel, setSimLevel] = useState(46)
  const [showSim, setShowSim] = useState(false)
  const [showInterstitial, setShowInterstitial] = useState(false)

  const hood = neighborhood ? neighborhoods[neighborhood] : null

  const simStage = useMemo(() => {
    if (simLevel >= 60) return { ...floodStages.major, key: 'major' }
    if (simLevel >= 56) return { ...floodStages.moderate, key: 'moderate' }
    if (simLevel >= 52) return { ...floodStages.minor, key: 'minor' }
    if (simLevel >= 46) return { ...floodStages.action, key: 'action' }
    return { level: simLevel, label: 'Normal', color: '#16a34a', desc: 'River within normal range.', key: 'normal' }
  }, [simLevel])

  const neighborhoodImpact = useMemo(() => {
    if (!hood) return null
    if (simLevel >= 56) return hood.moderateImpact
    if (simLevel >= 52) return hood.minorImpact
    if (simLevel >= 46) return hood.actionImpact
    return 'No significant impact at current levels.'
  }, [hood, simLevel])

  return (
    <StoryShell
      onBack={onBack}
      category="WEATHER"
      categoryColor="#0369a1"
      timestamp="March 21, 2026"
      readTime="Flood Explorer"
      storyId="flood-risk"
    >
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
        The River Is Rising. What Does It Mean for You?
      </h1>

      <p className="text-xl text-ink-light leading-relaxed mb-4">
        Earlier this month, 1.5 to 3 inches of rain fell on already-saturated ground. The Great Miami River
        at Miamitown approached minor flood stage. The Little Miami at Milford triggered flood warnings.
        The Ohio River at Cincinnati is tracking toward <span className="font-mono font-bold text-ink">action stage (46 ft)</span> this weekend.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-8">
        Most Cincinnatians know the river floods. Fewer know what each foot of water actually means for
        their commute, their property, or their neighborhood. This tool connects the gauge reading to
        your reality.
      </p>

      <Divider />

      {/* River forecast chart */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">7-Day River Forecast</h2>
      <p className="text-sm text-ink-muted mb-4">Ohio River at Cincinnati (Public Landing gauge)</p>
      <div className="bg-white border border-rule rounded-xl p-5 mb-6">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={riverForecast} margin={{ top: 10, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0369a1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0369a1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8a8a8a' }} tickLine={false} axisLine={{ stroke: '#d4d0c8' }} />
              <YAxis domain={[40, 52]} tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v} ft`} />
              <ReferenceLine y={46} stroke="#ca8a04" strokeDasharray="4 4" label={{ value: 'Action: 46 ft', position: 'right', fontSize: 10, fill: '#ca8a04' }} />
              <ReferenceLine y={52} stroke="#ea580c" strokeDasharray="4 4" label={{ value: 'Minor: 52 ft', position: 'right', fontSize: 10, fill: '#ea580c' }} />
              <Tooltip
                formatter={(v) => [`${v} ft`, 'River Level']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #d4d0c8', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}
              />
              <Area type="monotone" dataKey="level" stroke="#0369a1" strokeWidth={2.5} fill="url(#riverGrad)"
                dot={{ fill: '#0369a1', r: 4, stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flood stage reference */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-10">
        {Object.entries(floodStages).map(([key, stage]) => (
          <div key={key} className="rounded-lg p-3 border text-center" style={{ borderColor: stage.color + '40', backgroundColor: stage.color + '08' }}>
            <p className="text-lg font-bold font-mono" style={{ color: stage.color }}>{stage.level} ft</p>
            <p className="text-xs font-semibold" style={{ color: stage.color }}>{stage.label}</p>
          </div>
        ))}
      </div>

      <Divider />

      {/* Historical context */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-4">Historical Crests</h2>
      <div className="bg-white border border-rule rounded-xl p-5 mb-10">
        {historicalFloods.map((f, i) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-ink-light">{f.label}</span>
              <span className="text-sm font-mono font-bold text-ink">{f.crest} ft</span>
            </div>
            <div className="h-3 bg-paper-warm rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(f.crest / 80) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: f.crest >= 60 ? '#7f1d1d' : f.crest >= 56 ? '#dc2626' : '#0369a1' }}
              />
            </div>
          </div>
        ))}
      </div>

      <AdSlot.Insight storyId="flood-risk" />

      <Divider />

      {/* Neighborhood selector */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">What Does It Mean for Your Neighborhood?</h2>
      <p className="text-ink-light text-sm mb-4">Select your area on the map or dropdown, then use the river level simulator to see the impact at each stage.</p>

      {/* Flood Zone Map */}
      <StoryMap
        center={{ lat: 39.0950, lng: -84.5050 }}
        zoom={11.2}
        height={400}
        accentColor="#0369a1"
        onMapClick={(e) => {
          // Check if click hits a neighborhood polygon
          if (e.features?.length > 0) {
            const name = e.features[0].properties?.name
            if (name && neighborhoods[name]) {
              setNeighborhood(name)
              setShowInterstitial(true)
              setShowSim(false)
            }
          }
        }}
        legend={
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-ink uppercase tracking-wider mb-1">Flood Zones</p>
            <MapLegendItem color="rgba(3,105,161,0.4)" label="FEMA AE (100-yr)" />
            <MapLegendItem color="rgba(3,105,161,0.15)" label="Zone X (moderate)" />
            <MapLegendItem color="#dc2626" label="Selected area" type="dot" />
            <MapLegendItem color="#0369a1" label={`Water at ${simLevel} ft`} type="fill" />
          </div>
        }
      >
        {/* Flood water overlay — scales with simulator */}
        <FloodOverlay level={simLevel} />

        {/* Neighborhood choropleth colored by flood zone */}
        <ChoroplethLayer
          geojson={{
            ...neighborhoodPolygons,
            features: neighborhoodPolygons.features.filter(f =>
              Object.keys(neighborhoods).some(n =>
                f.properties.name === n || n.includes(f.properties.name) || f.properties.name.includes(n.split(' / ')[0])
              )
            ),
          }}
          colorMap={{
            'East End': '#0369a180',
            'The Banks / Smale Park': '#0369a180',
            'Covington': '#0369a160',
            'Riverside / Sayler Park': '#0369a180',
            'Anderson Twp': '#16a34a40',
            'Clifton': '#16a34a40',
          }}
          dataField="name"
          defaultColor="#0369a140"
          selectedId={neighborhood ? (neighborhoodPolygons.features.find(f =>
            f.properties.name === neighborhood || neighborhood.includes(f.properties.name)
          )?.properties?.name || '') : ''}
          selectedStrokeColor="#dc2626"
          opacity={0.3}
          id="flood-neighborhoods"
        />

        {/* Selected neighborhood marker */}
        {neighborhood && (() => {
          const c = getNeighborhoodCenter(neighborhood)
          return c ? <MapMarker lat={c.lat} lng={c.lng} color="#dc2626" label={neighborhood} pulse /> : null
        })()}

        {/* River gauge marker */}
        <MapMarker lat={39.0968} lng={-84.5101} color="#0369a1" size="sm" label="Public Landing Gauge" />
      </StoryMap>

      <select
        value={neighborhood}
        onChange={e => { setNeighborhood(e.target.value); setShowInterstitial(true); setShowSim(false) }}
        className="w-full px-4 py-3 rounded-lg border-2 border-rule bg-white text-ink text-sm focus:border-blue-500 focus:outline-none mb-6"
      >
        <option value="">Select your neighborhood...</option>
        {Object.keys(neighborhoods).map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      {showInterstitial && !showSim && (
        <AdSlot.Interstitial storyId="flood-risk" onComplete={() => setShowSim(true)} />
      )}

      <AnimatePresence>
        {showSim && hood && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* River level simulator */}
            <div className="bg-white border border-rule rounded-xl p-6 mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                River Level Simulator
              </label>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold font-mono" style={{ color: simStage.color }}>{simLevel}</span>
                <span className="text-ink-muted">feet</span>
                <span className="ml-auto text-sm font-semibold px-2.5 py-1 rounded" style={{ backgroundColor: simStage.color + '15', color: simStage.color }}>
                  {simStage.label}
                </span>
              </div>
              <input
                type="range" min={38} max={66} step={0.5}
                value={simLevel}
                onChange={e => setSimLevel(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-ink-muted mt-1">
                <span>38 ft (Normal)</span>
                <span>66 ft (Major+)</span>
              </div>
            </div>

            {/* Impact for neighborhood */}
            <div className="rounded-xl p-5 mb-6 border-2" style={{ borderColor: simStage.color + '40', backgroundColor: simStage.color + '08' }}>
              <div className="flex items-start gap-3">
                <Waves size={18} style={{ color: simStage.color }} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: simStage.color }}>
                    {neighborhood} at {simLevel} ft ({simStage.label})
                  </p>
                  <p className="text-sm text-ink-light">{neighborhoodImpact}</p>
                </div>
              </div>
            </div>

            <DynamicNarrative storyId="flood-risk" profileData={{ neighborhood, simLevel, floodZone: hood.floodZone }} />

            <LivePoll
              storyId="flood-risk"
              neighborhood={neighborhood}
              pollData={{ simLevel, floodZone: hood.floodZone }}
            />

            {/* Neighborhood tip */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 mb-6">
              <MapPin size={16} className="text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Your Area: {hood.floodZone} Zone</p>
                <p className="text-sm text-blue-700">{hood.tip}</p>
              </div>
            </div>

            <p className="text-lg text-ink-light leading-relaxed mb-4">
              The river will crest around Tuesday at an estimated 48.2 feet — above action stage but
              below minor flood. The bigger concern is cumulative: each rain event this spring lands on
              ground that hasn't fully dried from the last one. The margin between "manageable" and
              "emergency" gets thinner with every storm.
            </p>
            <p className="text-lg text-ink-light leading-relaxed mb-8">
              Bookmark this page. As the river rises, come back and check what each reading means
              for your neighborhood in real time.
            </p>

            <AdSlot.ResultCard storyId="flood-risk" />

            <SaveButton
              label="Save Your Flood Risk Profile"
              storyId="flood-risk"
              profileData={{ neighborhood, simLevel, floodZone: hood.floodZone }}
            />
            <StoryConnections
              storyId="flood-risk"
              profileData={{ neighborhood, simLevel, floodZone: hood.floodZone }}
              onOpenStory={onOpenStory}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </StoryShell>
  )
}

function Divider() {
  return <div className="my-10 flex items-center gap-4"><div className="h-px flex-1 bg-rule" /><div className="w-1.5 h-1.5 bg-blue-600 rotate-45" /><div className="h-px flex-1 bg-rule" /></div>
}
