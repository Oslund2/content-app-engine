import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, AlertTriangle, MapPin, Phone, Share2, Users, Home,
  ArrowRight, CheckCircle2, XCircle, HelpCircle, Clock, ShieldCheck, ExternalLink
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'
import StoryConnections from '../components/StoryConnections'
import AdSlot from '../components/AdSlot'
import DynamicNarrative from '../components/DynamicNarrative'
import LivePoll from '../components/LivePoll'

const fireTimeline = [
  { date: 'Jan 5', neighborhood: 'Winton Place', fatal: false, deaths: 0 },
  { date: 'Jan 10', neighborhood: 'Mt. Airy', fatal: false, deaths: 0 },
  { date: 'Jan 17', neighborhood: 'Spring Grove', fatal: true, deaths: 3 },
  { date: 'Jan 24', neighborhood: 'East Price Hill', fatal: false, deaths: 0 },
  { date: 'Jan 29', neighborhood: 'Westwood', fatal: true, deaths: 1 },
  { date: 'Feb 3', neighborhood: 'Avondale', fatal: false, deaths: 0 },
  { date: 'Feb 8', neighborhood: 'South Fairmount', fatal: false, deaths: 0 },
  { date: 'Feb 11', neighborhood: 'Mt. Auburn', fatal: false, deaths: 0 },
  { date: 'Feb 14', neighborhood: 'Walnut Hills', fatal: true, deaths: 1 },
  { date: 'Feb 19', neighborhood: 'Northside', fatal: false, deaths: 0 },
  { date: 'Feb 22', neighborhood: 'Camp Washington', fatal: false, deaths: 0 },
  { date: 'Feb 24', neighborhood: 'Evanston', fatal: false, deaths: 0 },
  { date: 'Feb 28', neighborhood: 'Bond Hill', fatal: false, deaths: 0 },
  { date: 'Mar 2', neighborhood: 'Carthage', fatal: false, deaths: 0 },
  { date: 'Mar 4', neighborhood: 'Sedamsville', fatal: false, deaths: 0 },
  { date: 'Mar 6', neighborhood: 'College Hill', fatal: false, deaths: 0 },
  { date: 'Mar 8', neighborhood: 'Roselawn', fatal: false, deaths: 0 },
  { date: 'Mar 10', neighborhood: 'Madisonville', fatal: true, deaths: 1 },
  { date: 'Mar 14', neighborhood: 'West Price Hill', fatal: true, deaths: 1 },
  { date: 'Mar 16', neighborhood: 'Over-the-Rhine', fatal: false, deaths: 0 },
  { date: 'Mar 18', neighborhood: 'East End', fatal: false, deaths: 0 },
  { date: 'Mar 20', neighborhood: 'Clifton', fatal: false, deaths: 0 },
]

const yearComparison = [
  { year: '2023', deaths: 3, fires: 38 },
  { year: '2024', deaths: 4, fires: 41 },
  { year: '2025', deaths: 1, fires: 29 },
  { year: '2026', deaths: 7, fires: 22 },
]

const neighborhoods = {
  'West Price Hill': { fires2026: 1, fatal: true, housingAge: 1925, outreach: true, risk: 'high' },
  'Spring Grove': { fires2026: 1, fatal: true, housingAge: 1935, outreach: true, risk: 'high' },
  'Winton Place': { fires2026: 1, fatal: false, housingAge: 1930, outreach: true, risk: 'high' },
  'Mt. Airy': { fires2026: 1, fatal: false, housingAge: 1940, outreach: true, risk: 'elevated' },
  'Walnut Hills': { fires2026: 1, fatal: true, housingAge: 1920, outreach: false, risk: 'elevated' },
  'Westwood': { fires2026: 1, fatal: true, housingAge: 1945, outreach: false, risk: 'elevated' },
  'Avondale': { fires2026: 1, fatal: false, housingAge: 1928, outreach: false, risk: 'elevated' },
  'Madisonville': { fires2026: 1, fatal: true, housingAge: 1950, outreach: false, risk: 'elevated' },
  'Over-the-Rhine': { fires2026: 1, fatal: false, housingAge: 1895, outreach: false, risk: 'elevated' },
  'Northside': { fires2026: 1, fatal: false, housingAge: 1935, outreach: false, risk: 'moderate' },
  'Clifton': { fires2026: 1, fatal: false, housingAge: 1920, outreach: false, risk: 'moderate' },
  'Hyde Park': { fires2026: 0, fatal: false, housingAge: 1930, outreach: false, risk: 'moderate' },
  'Mt. Washington': { fires2026: 0, fatal: false, housingAge: 1960, outreach: false, risk: 'low' },
  'Anderson Twp': { fires2026: 0, fatal: false, housingAge: 1985, outreach: false, risk: 'low' },
  'Mason / West Chester': { fires2026: 0, fatal: false, housingAge: 1995, outreach: false, risk: 'low' },
}

const quizQuestions = [
  {
    id: 'detectors',
    question: 'Do you have working smoke detectors on every level of your home?',
    icon: ShieldCheck,
    options: [
      { label: 'Yes, on every level and tested recently', value: 'all', score: 3 },
      { label: 'Some floors but not all', value: 'some', score: 1 },
      { label: 'No / I don\'t know', value: 'none', score: 0 },
    ],
    tips: {
      all: 'Good. Test them monthly — press the button until it beeps. Replace batteries yearly.',
      some: '4 of the 7 people who died this year were in homes without working detectors on the fire floor. Every level needs one. Call 311 for free detectors today.',
      none: 'This is the single highest-risk factor in Cincinnati\'s fire deaths this year. Call 311 right now. The city will give you up to 6 free smoke detectors and install them.',
    },
  },
  {
    id: 'age',
    question: 'How old are your smoke detectors?',
    icon: Clock,
    options: [
      { label: 'Less than 10 years old', value: 'new', score: 3 },
      { label: 'More than 10 years / not sure', value: 'old', score: 0 },
      { label: 'I just learned detectors expire', value: 'didnt-know', score: 0 },
    ],
    tips: {
      new: 'You\'re within the safe window. Mark the manufacture date so you know when to replace.',
      old: 'Smoke detectors expire after 10 years — the sensor degrades and stops working reliably. Check the manufacture date on the back. If it\'s blank or old, replace it.',
      'didnt-know': 'You\'re not alone — most people don\'t know this. Flip any detector over and look for a manufacture date. If it\'s older than 2016, it needs to go.',
    },
  },
  {
    id: 'exits',
    question: 'Does your household have two ways out of every bedroom?',
    icon: Home,
    options: [
      { label: 'Yes, and we\'ve practiced', value: 'practiced', score: 3 },
      { label: 'Probably, but we haven\'t discussed it', value: 'untested', score: 1 },
      { label: 'Some rooms have only one exit', value: 'one-exit', score: 0 },
    ],
    tips: {
      practiced: 'Chief McKinley says this is the difference between survival and tragedy. Practice twice a year — especially if kids or elderly are in the home.',
      untested: 'Tonight: walk every person in your home to their second exit. A window counts if it opens easily and there\'s a safe drop or ladder. Fire gives you 2-3 minutes. That rehearsal could save a life.',
      'one-exit': 'This is a structural risk. For rooms with one exit, a $30 escape ladder can be the difference. Place one near any second-floor bedroom window.',
    },
  },
  {
    id: 'vulnerable',
    question: 'Does anyone in your home have mobility issues, hearing loss, or sleep very heavily?',
    icon: Users,
    options: [
      { label: 'No', value: 'no', score: 3 },
      { label: 'Yes — elderly or mobility-impaired', value: 'mobility', score: 0 },
      { label: 'Yes — hearing loss or heavy sleeper', value: 'hearing', score: 0 },
    ],
    tips: {
      no: 'Good — but think beyond your own household. Do you know a senior living alone nearby?',
      mobility: 'Almost all of this year\'s victims were older residents. CFD is building a system to flag vulnerable residents for priority rescue. In the meantime, their bedroom should be on the ground floor with a clear path to an exit.',
      hearing: 'Standard smoke alarms may not wake them. The Cincinnati Fire Department provides free bed-shaker alarms for deaf and hard-of-hearing residents. Call 311 to request one.',
    },
  },
  {
    id: 'heating',
    question: 'Do you use space heaters, extension cords for appliances, or have an older electrical panel?',
    icon: Flame,
    options: [
      { label: 'No — all central heat, updated wiring', value: 'safe', score: 3 },
      { label: 'Space heaters sometimes', value: 'heaters', score: 1 },
      { label: 'Extension cords and/or old wiring', value: 'wiring', score: 0 },
    ],
    tips: {
      safe: 'Modern systems with updated wiring have the lowest ignition risk. Keep it maintained.',
      heaters: 'Space heaters cause 1 in 3 home heating fires nationally. Rule: 3 feet of clearance from anything, plug directly into wall outlets (never extension cords), and turn off when sleeping.',
      wiring: 'Homes built before 1960 — common across Cincinnati\'s West Side — often have electrical systems not designed for modern loads. Overloaded circuits are a leading ignition source. An electrician inspection costs $150-300 and could prevent a catastrophe.',
    },
  },
]

export default function FireCrisis({ onBack, onOpenStory }) {
  const [selectedHood, setSelectedHood] = useState('')
  const [quizStep, setQuizStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [showDispatch, setShowDispatch] = useState(false)
  const [showInterstitial, setShowInterstitial] = useState(false)

  const hood = selectedHood ? neighborhoods[selectedHood] : null

  const handleAnswer = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }))
    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(s => s + 1)
    } else {
      setShowInterstitial(true)
    }
  }

  const results = useMemo(() => {
    if (!showResults) return null
    let total = 0
    const max = quizQuestions.length * 3
    const items = []
    quizQuestions.forEach(q => {
      const val = answers[q.id]
      const opt = q.options.find(o => o.value === val)
      if (opt) {
        total += opt.score
        items.push({ question: q.question, score: opt.score, tip: q.tips[val] })
      }
    })
    const pct = Math.round((total / max) * 100)
    const grade = pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : pct >= 30 ? 'D' : 'F'
    const gradeColor = pct >= 70 ? 'text-green-700' : pct >= 50 ? 'text-amber-700' : 'text-red-700'
    const gradeBg = pct >= 70 ? 'bg-green-50 border-green-200' : pct >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
    return { total, max, pct, grade, gradeColor, gradeBg, items }
  }, [showResults, answers])

  const runningDeaths = fireTimeline.reduce((acc, f) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0
    acc.push({ ...f, cumulative: prev + f.deaths })
    return acc
  }, [])

  return (
    <StoryShell
      onBack={onBack}
      category="BREAKING"
      categoryColor="#dc2626"
      timestamp="Updated March 21, 2026"
      readTime="Safety Assessment"
    >
      {/* BREAKING badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded animate-pulse">BREAKING</span>
        <span className="text-xs text-red-600 font-semibold">ONGOING CRISIS</span>
      </div>

      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
        7 Dead. 22 Fires. Cincinnati Has Never Seen This Before.
      </h1>

      <p className="text-xl text-ink-light leading-relaxed mb-4">
        In the first 11 weeks of 2026, residential fires have killed seven people in Cincinnati — a
        <span className="font-mono font-bold text-red-700 text-2xl"> 500%</span> increase over the same period last year.
        Fire officials say they have never seen a concentration like this in 25 years.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-4">
        The victims range from their 20s to their 70s. Three died in a single blaze in Spring Grove Village
        on January 17. In nearly every case, crews arrived within five minutes — but the fires were already
        fully involved. Not all homes had working smoke detectors.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-8">
        "We've never seen this before," said Assistant Chief Matt Flagler. "Not in this grouping. Not in 25 years."
      </p>

      <Divider />

      {/* Crisis dashboard */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <CrisisStat value="7" label="Deaths" sub="Jan–Mar 2026" />
        <CrisisStat value="22" label="Residential Fires" sub="11 weeks" />
        <CrisisStat value="500%" label="Increase" sub="vs. same period 2025" />
      </div>

      {/* Timeline */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-4">The Timeline</h2>
      <div className="bg-white border border-rule rounded-xl p-5 mb-4 max-h-72 overflow-y-auto">
        {runningDeaths.map((f, i) => (
          <div key={i} className={`flex items-center gap-3 py-2 border-b border-rule last:border-0 ${f.fatal ? 'bg-red-50 -mx-2 px-2 rounded' : ''}`}>
            <span className="text-xs font-mono text-ink-muted w-14 shrink-0">{f.date}</span>
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${f.fatal ? 'bg-red-600' : 'bg-amber-400'}`} />
            <span className="text-sm text-ink flex-1">{f.neighborhood}</span>
            {f.fatal && (
              <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                {f.deaths} {f.deaths > 1 ? 'deaths' : 'death'}
              </span>
            )}
            <span className="text-xs font-mono text-ink-muted w-8 text-right">{f.cumulative}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-ink-muted mb-8">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Fatal fire</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Non-fatal fire</span>
        <span className="ml-auto">Rightmost column: cumulative deaths</span>
      </div>

      {/* Year comparison */}
      {/* Branded insight — mid-narrative */}
      <AdSlot.Insight storyId="fire-crisis" />

      <h2 className="font-serif text-2xl font-bold text-ink mb-2">The Anomaly</h2>
      <p className="text-sm text-ink-muted mb-4">Fire deaths, Jan–Mar (same 11-week period)</p>
      <div className="bg-white border border-rule rounded-xl p-5 mb-10">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearComparison} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 13, fill: '#4a4a4a', fontWeight: 600 }} axisLine={{ stroke: '#d4d0c8' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #d4d0c8', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }} />
              <Bar dataKey="deaths" name="Deaths" radius={[4, 4, 0, 0]}>
                {yearComparison.map((entry, i) => (
                  <motion.rect key={i} fill={entry.year === '2026' ? '#dc2626' : '#d4d0c8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Divider />

      {/* Neighborhood risk */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">Is Your Neighborhood at Risk?</h2>
      <p className="text-ink-light text-sm mb-4">
        Fires have clustered in neighborhoods with older housing stock — homes built before 1960 often lack
        hardwired smoke detectors and have electrical systems not built for modern loads.
      </p>

      <select
        value={selectedHood}
        onChange={e => setSelectedHood(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border-2 border-rule bg-white text-ink text-sm focus:border-red-500 focus:outline-none mb-4"
      >
        <option value="">Select your neighborhood...</option>
        {Object.keys(neighborhoods).map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      <AnimatePresence>
        {hood && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className={`rounded-xl p-5 border-2 ${hood.risk === 'high' ? 'bg-red-50 border-red-300' : hood.risk === 'elevated' ? 'bg-amber-50 border-amber-300' : hood.risk === 'moderate' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg font-bold text-ink">{selectedHood}</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded ${hood.risk === 'high' ? 'bg-red-200 text-red-800' : hood.risk === 'elevated' ? 'bg-amber-200 text-amber-800' : hood.risk === 'moderate' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                  {hood.risk.toUpperCase()} RISK
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <MiniStat label="Fires in 2026" value={hood.fires2026} />
                <MiniStat label="Fatalities" value={hood.fatal ? 'Yes' : 'None'} />
                <MiniStat label="Avg Housing Built" value={hood.housingAge} />
                <MiniStat label="CFD Outreach" value={hood.outreach ? 'Active' : 'Not yet'} />
              </div>
              {hood.housingAge < 1960 && (
                <p className="text-sm text-ink-light">
                  <AlertTriangle size={13} className="inline text-amber-600 mr-1" />
                  Homes built before 1960 are significantly more likely to lack hardwired detectors and have aging electrical systems.
                  {selectedHood}'s average housing stock dates to {hood.housingAge}.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Divider />

      {/* Quiz */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">Is Your Home Fire-Safe?</h2>
      <p className="text-ink-light text-sm mb-6">Five questions. Two minutes. This could save your life — or someone you love.</p>

      {quizQuestions.slice(0, quizStep + 1).map((q, qi) => (
        <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <q.icon size={16} className="text-red-600" />
            <p className="text-sm font-medium text-ink">
              <span className="text-red-600 font-bold">Q{qi + 1}.</span> {q.question}
            </p>
          </div>
          <div className="space-y-2">
            {q.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(q.id, opt.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all
                  ${answers[q.id] === opt.value ? 'border-red-500 bg-red-50' : 'border-rule bg-white hover:border-red-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {answers[q.id] && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 bg-paper-warm rounded-lg p-3 border border-rule">
              <p className="text-sm text-ink-light">{q.tips[answers[q.id]]}</p>
            </motion.div>
          )}
        </motion.div>
      ))}

      {/* Interstitial — after quiz, before results */}
      {showInterstitial && !showResults && (
        <AdSlot.Interstitial storyId="fire-crisis" onComplete={() => setShowResults(true)} />
      )}

      <AnimatePresence>
        {showResults && results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Divider />

            <h2 className="font-serif text-3xl font-bold text-ink mb-4">Your Fire Safety Score</h2>

            <div className={`rounded-xl p-8 text-center mb-6 border-2 ${results.gradeBg}`}>
              <p className={`text-6xl font-bold font-mono ${results.gradeColor}`}>{results.grade}</p>
              <p className="text-sm text-ink-muted mt-2">{results.total} / {results.max} points ({results.pct}%)</p>
              <p className="text-sm text-ink-light mt-1">
                {results.pct >= 85 ? 'Your home is significantly safer than average. Keep it that way.'
                  : results.pct >= 70 ? 'Solid foundation, but the gaps you have are the ones that kill.'
                    : results.pct >= 50 ? 'Meaningful vulnerabilities. The fixes are cheap and fast — the consequences of inaction are not.'
                      : 'Your household is at serious risk. But every item on this list can be fixed this week, most of them today.'}
              </p>
            </div>

            <DynamicNarrative storyId="fire-crisis" profileData={{ neighborhood: selectedHood, answers, grade: results.grade, score: results.pct }} />

            <LivePoll
              storyId="fire-crisis"
              neighborhood={selectedHood}
              pollData={{ grade: results.grade, score: results.pct, hasDetectors: answers.detectors !== 'none' }}
            />

            {/* Action items */}
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Your Action Items</h3>
            <div className="space-y-3 mb-8">
              {results.items.map((item, i) => (
                <div key={i} className={`rounded-lg p-4 border ${item.score >= 2 ? 'bg-green-50 border-green-200' : item.score === 1 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start gap-2">
                    {item.score >= 2 ? <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" /> : <AlertTriangle size={16} className={`${item.score === 1 ? 'text-amber-600' : 'text-red-600'} shrink-0 mt-0.5`} />}
                    <p className="text-sm text-ink-light">{item.tip}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="bg-white border-2 border-ink rounded-xl overflow-hidden mb-8">
              <div className="bg-ink px-6 py-4">
                <h3 className="text-white font-serif text-lg font-bold">Take Action Now</h3>
              </div>
              <div className="p-6 space-y-4">
                <ActionRow
                  icon={Phone}
                  title="Request Free Smoke Detectors"
                  desc="Call 311 — up to 6 free detectors per household. Bed-shaker alarms available for hearing-impaired."
                  action="Call 311"
                />
                <ActionRow
                  icon={ShieldCheck}
                  title="Request a Home Safety Inspection"
                  desc="Cincinnati Fire Department offers free residential inspections. They'll check detectors, exits, and hazards."
                  action="Call CFD"
                />
                <ActionRow
                  icon={Users}
                  title="Share With Someone Vulnerable"
                  desc="Know a senior living alone? A neighbor with mobility issues? This assessment could save their life. Send it."
                  action="Share"
                />
              </div>
            </div>

            {/* Dispatch sidebar */}
            <button
              onClick={() => setShowDispatch(!showDispatch)}
              className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
            >
              <span className="font-medium">The Dispatch Controversy</span>
              <ArrowRight size={14} className={`transition-transform ${showDispatch ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {showDispatch && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="bg-paper-warm border border-rule rounded-xl p-5 mb-8">
                    <p className="text-sm text-ink-light leading-relaxed mb-2">
                      In November 2025, the city moved fire dispatch from the Cincinnati Fire Department to the Emergency Communications Center (ECC).
                      Some firefighters say the change has affected how information is communicated to responding crews — specifically,
                      the level of detail about fire conditions on arrival.
                    </p>
                    <p className="text-sm text-ink-light leading-relaxed">
                      Fire Chief Frank McKinley acknowledged the transition has been noticed but said the spike in deaths is not
                      attributable to dispatch changes. "Our response times haven't changed," he said. "Crews are arriving in under five minutes.
                      The problem is these fires are fully involved before anyone calls 911."
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Closing */}
            <p className="text-lg text-ink-light leading-relaxed mb-8">
              Seven people are dead. The fire department has 874 firefighters — the highest staffing in years — and
              they're arriving in under five minutes. It's not enough, because by then the fire has already won.
              The only thing that consistently saves lives in a residential fire happens before the fire starts:
              a working detector, a plan, and a clear path out. Those three things cost less than dinner for two.
            </p>

            {/* Sponsored result card */}
            <AdSlot.ResultCard storyId="fire-crisis" />

            <SaveButton
              label="Save Your Fire Safety Report"
              storyId="fire-crisis"
              profileData={{ neighborhood: selectedHood, answers, grade: results.grade, score: results.pct }}
            />
            <StoryConnections
              storyId="fire-crisis"
              profileData={{ neighborhood: selectedHood, answers, grade: results.grade, score: results.pct }}
              onOpenStory={onOpenStory}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </StoryShell>
  )
}

function CrisisStat({ value, label, sub }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
      <p className="text-3xl sm:text-4xl font-bold font-mono text-red-700">{value}</p>
      <p className="text-xs font-bold text-red-800 uppercase tracking-wide">{label}</p>
      <p className="text-[10px] text-red-500">{sub}</p>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold font-mono text-ink">{value}</p>
      <p className="text-[10px] text-ink-muted uppercase tracking-wide">{label}</p>
    </div>
  )
}

function ActionRow({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-red-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="text-xs text-ink-light">{desc}</p>
      </div>
      <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1.5 rounded shrink-0">{action}</span>
    </div>
  )
}

function Divider() {
  return <div className="my-10 flex items-center gap-4"><div className="h-px flex-1 bg-rule" /><div className="w-1.5 h-1.5 bg-red-600 rotate-45" /><div className="h-px flex-1 bg-rule" /></div>
}
