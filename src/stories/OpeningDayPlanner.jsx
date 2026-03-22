import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Clock, Car, Train, Footprints, ChevronRight, AlertTriangle,
  PartyPopper, Beer, Camera, Sun, CheckCircle2, ArrowRight, Download
} from 'lucide-react'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'
import StoryConnections from '../components/StoryConnections'
import AdSlot from '../components/AdSlot'
import DynamicNarrative from '../components/DynamicNarrative'
import LivePoll from '../components/LivePoll'

const neighborhoods = [
  { id: 'downtown', name: 'Downtown / OTR', driveMin: 5, walkMin: 15, transitMin: 10, parkingCost: 35, tip: 'Walk to the Banks — skip parking entirely.' },
  { id: 'clifton', name: 'Clifton / UC Area', driveMin: 15, walkMin: 55, transitMin: 22, parkingCost: 30, tip: 'Take the Metro bus #17 from McMillan — drops you at Government Square.' },
  { id: 'hyde-park', name: 'Hyde Park / Oakley', driveMin: 18, walkMin: null, transitMin: 28, parkingCost: 25, tip: 'Park at Rookwood and Uber the last mile. You\u2019ll save $15 on event parking.' },
  { id: 'westside', name: 'West Side / Price Hill', driveMin: 20, walkMin: null, transitMin: 35, parkingCost: 20, tip: 'I-75 to the Western Hills Viaduct is your fastest shot. River Road backs up after 2pm.' },
  { id: 'nky', name: 'Northern Kentucky', driveMin: 12, walkMin: 25, transitMin: 18, parkingCost: 15, tip: 'Park in Covington or Newport and walk across the Roebling. Best photo op of the day.' },
  { id: 'mason', name: 'Mason / Liberty Twp', driveMin: 35, walkMin: null, transitMin: 55, parkingCost: 20, tip: 'Leave by 1pm if you want to catch the parade. I-71 will be a parking lot by 2:30.' },
]

const closedRoads = [
  'Freedom Way (Pete Rose to Joe Nuxhall Way)',
  'Marian Spencer Way',
  'Joe Nuxhall Way',
  'Mehring Way (partial)',
  'Race Street at 2nd (parade route)',
  'Vine Street at 2nd (parade route)',
  'Elm Street (Findlay Market to 2nd)',
]

const timeline = [
  { time: '10:00 AM', event: 'Findlay Market opens — grab breakfast', icon: Beer, category: 'food' },
  { time: '11:30 AM', event: 'Stake out your parade spot on Race St', icon: MapPin, category: 'parade' },
  { time: '12:00 PM', event: 'Findlay Market Parade steps off', icon: PartyPopper, category: 'parade' },
  { time: '2:30 PM', event: 'Gates open at Great American Ball Park', icon: CheckCircle2, category: 'game' },
  { time: '3:00 PM', event: 'Pre-game ceremonies begin', icon: Camera, category: 'game' },
  { time: '4:10 PM', event: 'First pitch — Reds vs. Red Sox', icon: Sun, category: 'game' },
]

export default function OpeningDayPlanner({ onBack, onOpenStory }) {
  const [neighborhood, setNeighborhood] = useState('')
  const [transport, setTransport] = useState('drive')
  const [priorities, setPriorities] = useState({ parade: true, tailgate: false, earlyEntry: true })
  const [step, setStep] = useState(0)
  const [showInterstitial, setShowInterstitial] = useState(false)
  const [showPlan, setShowPlan] = useState(false)

  const hood = neighborhoods.find(n => n.id === neighborhood)

  const plan = useMemo(() => {
    if (!hood) return null
    const travelMin = transport === 'drive' ? hood.driveMin : transport === 'transit' ? hood.transitMin : hood.walkMin
    if (travelMin === null) return { error: `Walking from ${hood.name} isn't practical — switch to driving or transit.` }

    const gameStart = 16 * 60 + 10 // 4:10 PM in minutes
    const gatesOpen = 14 * 60 + 30 // 2:30 PM
    const paradeStart = 12 * 60 // noon

    let targetArrival = priorities.earlyEntry ? gatesOpen : gameStart - 30
    if (priorities.parade) targetArrival = Math.min(targetArrival, paradeStart - 30)

    const departMinutes = targetArrival - travelMin - 15 // 15 min buffer
    const departHour = Math.floor(departMinutes / 60)
    const departMin = departMinutes % 60
    const departTime = `${departHour > 12 ? departHour - 12 : departHour}:${String(departMin).padStart(2, '0')} ${departHour >= 12 ? 'PM' : 'AM'}`

    const cost = transport === 'drive' ? hood.parkingCost + 5 : transport === 'transit' ? 4.50 : 0
    const totalHours = priorities.parade ? 7 : 4.5

    return { travelMin, departTime, cost, totalHours, tip: hood.tip }
  }, [hood, transport, priorities])

  return (
    <StoryShell
      onBack={onBack}
      category="SPORTS"
      categoryColor="#c41230"
      timestamp="March 21, 2026"
      readTime="Interactive Planner"
      storyId="opening-day"
    >
      {/* Headline */}
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
        Plan Your Perfect Opening Day
      </h1>
      <p className="text-xl text-ink-light leading-relaxed mb-4">
        On Thursday, 80,000 people will descend on the Banks for the 150th Opening Day ceremony.
        Jeff Brantley rings the bell. The parade starts at noon. First pitch at 4:10.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-8">
        It's the closest thing Cincinnati has to a civic religion — and like any pilgrimage, it rewards those who plan.
        Tell us where you're coming from, and we'll build your game-day itinerary.
      </p>

      <Divider />

      {/* Step 1: Neighborhood */}
      <SectionLabel number="1" text="Where are you coming from?" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {neighborhoods.map(n => (
          <button
            key={n.id}
            onClick={() => { setNeighborhood(n.id); if (step < 1) setStep(1) }}
            className={`text-left px-4 py-3 rounded-lg border-2 transition-all duration-200
              ${neighborhood === n.id
                ? 'border-wcpo-red bg-red-50 shadow-sm'
                : 'border-rule bg-white hover:border-ink-muted'}`}
          >
            <div className="flex items-center gap-2">
              <MapPin size={13} className={neighborhood === n.id ? 'text-wcpo-red' : 'text-ink-muted'} />
              <span className="font-medium text-sm text-ink">{n.name}</span>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {step >= 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Step 2: Transport */}
            <Divider />
            <SectionLabel number="2" text="How are you getting there?" />
            <div className="flex gap-3 mb-8">
              {[
                { id: 'drive', label: 'Driving', icon: Car },
                { id: 'transit', label: 'Transit', icon: Train },
                { id: 'walk', label: 'Walking', icon: Footprints },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setTransport(id); if (step < 2) { setStep(2); setShowInterstitial(true) } else { setShowInterstitial(true); setShowPlan(false) } }}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all
                    ${transport === id
                      ? 'border-wcpo-red bg-red-50'
                      : 'border-rule bg-white hover:border-ink-muted'}`}
                >
                  <Icon size={22} className={transport === id ? 'text-wcpo-red' : 'text-ink-muted'} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Step 3: Priorities */}
            <SectionLabel number="3" text="What matters most?" />
            <div className="space-y-3 mb-8">
              {[
                { key: 'parade', label: 'I want to see the Findlay Market Parade', sub: 'Starts at noon — plan to arrive by 11:30' },
                { key: 'tailgate', label: 'I want to tailgate before the game', sub: 'Lots open at 10am — bring your grill' },
                { key: 'earlyEntry', label: 'I want to be there when gates open', sub: 'Gates at 2:30 — first crack at merch' },
              ].map(({ key, label, sub }) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${priorities[key] ? 'border-wcpo-red bg-red-50' : 'border-rule bg-white'}`}
                >
                  <input
                    type="checkbox"
                    checked={priorities[key]}
                    onChange={() => {
                      setPriorities(p => ({ ...p, [key]: !p[key] }))
                      if (step < 3) setStep(3)
                    }}
                    className="mt-0.5 accent-[#c41230]"
                  />
                  <div>
                    <p className="font-medium text-sm text-ink">{label}</p>
                    <p className="text-xs text-ink-muted">{sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showInterstitial && !showPlan && (
        <AdSlot.Interstitial storyId="opening-day" onComplete={() => setShowPlan(true)} />
      )}

      <AnimatePresence>
        {showPlan && step >= 2 && plan && !plan.error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Divider />

            {/* Your Plan */}
            <h2 className="font-serif text-3xl font-bold text-ink mb-2">Your Game Plan</h2>
            <p className="text-ink-light mb-6">
              Based on your inputs, here's how to make the most of March 26th from {hood.name}.
            </p>

            {/* Key stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <QuickStat label="Depart" value={plan.departTime} />
              <QuickStat label="Travel" value={`${plan.travelMin} min`} />
              <QuickStat label="Est. Cost" value={`$${plan.cost.toFixed(0)}`} />
              <QuickStat label="Total Time" value={`~${plan.totalHours}h`} />
            </div>

            {/* Pro tip */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-8">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Insider Tip</p>
                <p className="text-sm text-amber-700">{plan.tip}</p>
              </div>
            </div>

            <AdSlot.Insight storyId="opening-day" />

            {/* Timeline */}
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">Your Timeline</h3>
            <div className="space-y-0 mb-8">
              {timeline
                .filter(t => priorities.parade || t.category !== 'parade')
                .map((t, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-wcpo-red/10 flex items-center justify-center">
                        <t.icon size={14} className="text-wcpo-red" />
                      </div>
                      {i < timeline.length - 1 && <div className="w-px h-8 bg-rule" />}
                    </div>
                    <div className="pb-6">
                      <p className="text-xs font-mono font-bold text-wcpo-red">{t.time}</p>
                      <p className="text-sm text-ink">{t.event}</p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Road closures */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8">
              <h3 className="flex items-center gap-2 text-sm font-bold text-red-800 mb-3">
                <AlertTriangle size={14} /> Road Closures Starting March 25 at 6PM
              </h3>
              <ul className="space-y-1.5">
                {closedRoads.map((road, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-400 mt-1">&#8226;</span> {road}
                  </li>
                ))}
              </ul>
            </div>

            <DynamicNarrative storyId="opening-day" profileData={{ neighborhood, transport, priorities, plan }} />

            <LivePoll
              storyId="opening-day"
              neighborhood={neighborhood}
              pollData={{ transport, parade: priorities.parade }}
            />

            <AdSlot.ResultCard storyId="opening-day" />

            {/* Save */}
            <SaveButton
              label="Save Your Opening Day Plan"
              storyId="opening-day"
              profileData={{ neighborhood, transport, priorities, plan }}
            />
            <StoryConnections
              storyId="opening-day"
              profileData={{ neighborhood, transport, priorities, plan }}
              onOpenStory={onOpenStory}
            />
          </motion.div>
        )}
        {plan?.error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-4">
              <p className="text-sm text-amber-800">{plan.error}</p>
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
      <span className="w-7 h-7 rounded-full bg-wcpo-dark text-white text-xs font-bold flex items-center justify-center">
        {number}
      </span>
      <span className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{text}</span>
    </div>
  )
}

function QuickStat({ label, value }) {
  return (
    <div className="bg-white border border-rule rounded-lg p-3 text-center">
      <p className="text-[10px] uppercase tracking-wide text-ink-muted mb-1">{label}</p>
      <p className="text-lg font-bold font-mono text-ink">{value}</p>
    </div>
  )
}

function Divider() {
  return <div className="my-10 flex items-center gap-4"><div className="h-px flex-1 bg-rule" /><div className="w-1.5 h-1.5 bg-wcpo-red rotate-45" /><div className="h-px flex-1 bg-rule" /></div>
}

