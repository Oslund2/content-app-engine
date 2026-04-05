import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudLightning, AlertTriangle, Home, Users, Radio, Battery, Droplets, Wind, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'
import StoryConnections from '../components/StoryConnections'
import AdSlot from '../components/AdSlot'
import DynamicNarrative from '../components/DynamicNarrative'
import LivePoll from '../components/LivePoll'
import { StoryMap, MapMarker, ChoroplethLayer, MapLegendItem } from '../components/map'
import { neighborhoodPolygons, getNeighborhoodCenter } from '../components/map'

const questions = [
  {
    id: 'housing',
    question: 'What type of home do you live in?',
    icon: Home,
    options: [
      { label: 'House with basement', value: 'basement', score: 3, tip: 'Your basement is your best shelter. Get there fast.' },
      { label: 'House, no basement', value: 'no-basement', score: 2, tip: 'Interior room on the lowest floor, away from windows. Closets and bathrooms with plumbing walls are strongest.' },
      { label: 'Apartment (upper floor)', value: 'apt-upper', score: 1, tip: 'Get to the lowest floor interior hallway. Do NOT stay on upper floors during a tornado warning.' },
      { label: 'Mobile/manufactured home', value: 'mobile', score: 0, tip: 'Leave immediately when a warning is issued. Mobile homes offer almost no tornado protection. Identify a nearby sturdy building NOW.' },
    ],
  },
  {
    id: 'alerts',
    question: 'How do you receive severe weather alerts?',
    icon: Radio,
    options: [
      { label: 'Weather radio + phone alerts', value: 'both', score: 3, tip: 'Gold standard. The radio works when power and cell towers don\'t.' },
      { label: 'Phone alerts only', value: 'phone', score: 2, tip: 'Good, but phone alerts can be delayed. Consider a $30 NOAA weather radio as backup.' },
      { label: 'TV/social media', value: 'tv', score: 1, tip: 'These require power and attention. A tornado can form in minutes. You need automatic alerts.' },
      { label: 'I rely on sirens', value: 'sirens', score: 0, tip: 'Outdoor sirens are designed for people OUTSIDE. They may not wake you at night or reach you indoors. Get a weather radio.' },
    ],
  },
  {
    id: 'kit',
    question: 'Do you have an emergency kit ready?',
    icon: Battery,
    options: [
      { label: 'Yes, stocked and accessible', value: 'ready', score: 3, tip: 'You\'re ahead of 85% of households. Make sure batteries are fresh and water is rotated every 6 months.' },
      { label: 'Partial — some supplies scattered around', value: 'partial', score: 2, tip: 'Consolidate into one grab bag. When you have 60 seconds, you don\'t want to search.' },
      { label: 'No kit', value: 'none', score: 0, tip: 'Start with the basics: water (1 gal/person/day for 3 days), flashlight, batteries, first aid kit, medications, phone charger.' },
    ],
  },
  {
    id: 'plan',
    question: 'Does your household have a severe weather plan?',
    icon: Users,
    options: [
      { label: 'Yes, everyone knows where to go', value: 'full', score: 3, tip: 'Practice it once a season. Kids forget, and new roommates may not know.' },
      { label: 'Sort of — we\'d figure it out', value: 'vague', score: 1, tip: 'The March 5-7 outbreak gave 8-12 minutes of lead time in most areas. "Figure it out" doesn\'t work in 8 minutes.' },
      { label: 'No plan', value: 'none', score: 0, tip: 'Tonight: walk everyone in your household to the shelter spot. That single action could save a life.' },
    ],
  },
  {
    id: 'insurance',
    question: 'Do you know what your insurance covers for wind/storm damage?',
    icon: ShieldCheck,
    options: [
      { label: 'Yes, reviewed recently', value: 'reviewed', score: 3, tip: 'Smart. Document your belongings with photos/video now — before you need to file a claim.' },
      { label: 'I think so, but not sure on details', value: 'unsure', score: 1, tip: 'Check your deductible for wind damage — many Ohio policies have a separate, higher wind deductible.' },
      { label: 'No idea', value: 'none', score: 0, tip: 'Call your agent this week. After the March 5 outbreak, adjusters were booked for weeks in Michigan and Oklahoma.' },
    ],
  },
]

const riskLevels = {
  marginal: { level: 1, label: 'Marginal', color: '#16a34a', desc: 'Isolated severe storms possible' },
  slight: { level: 2, label: 'Slight', color: '#ca8a04', desc: 'Scattered severe storms expected' },
  enhanced: { level: 3, label: 'Enhanced', color: '#ea580c', desc: 'Numerous severe storms likely' },
  moderate: { level: 4, label: 'Moderate', color: '#dc2626', desc: 'Widespread severe expected' },
  high: { level: 5, label: 'High', color: '#7f1d1d', desc: 'Outbreak expected — rare designation' },
}

const cincyNeighborhoodRisk = {
  'West Side / Price Hill': 'slight',
  'Downtown / OTR': 'slight',
  'East Side / Hyde Park': 'slight',
  'Northern KY': 'slight',
  'Butler County': 'enhanced',
  'Warren County': 'slight',
  'Clermont County': 'marginal',
}

export default function StormReady({ onBack, onOpenStory }) {
  const [answers, setAnswers] = useState({})
  const [currentQ, setCurrentQ] = useState(0)
  const [area, setArea] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [showInterstitial, setShowInterstitial] = useState(false)

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1)
    } else {
      setShowInterstitial(true)
    }
  }

  const results = useMemo(() => {
    if (!showResults) return null
    let totalScore = 0
    let maxScore = 0
    const tips = []

    questions.forEach(q => {
      const answer = answers[q.id]
      const option = q.options.find(o => o.value === answer)
      if (option) {
        totalScore += option.score
        tips.push({ question: q.question, tip: option.tip, score: option.score, max: 3 })
      }
      maxScore += 3
    })

    const pct = Math.round((totalScore / maxScore) * 100)
    const grade = pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : pct >= 30 ? 'D' : 'F'
    const gradeColor = pct >= 70 ? 'text-green-700' : pct >= 50 ? 'text-amber-700' : 'text-red-700'
    const gradeBg = pct >= 70 ? 'bg-green-50 border-green-200' : pct >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

    return { totalScore, maxScore, pct, grade, gradeColor, gradeBg, tips }
  }, [showResults, answers])

  const areaRisk = area ? riskLevels[cincyNeighborhoodRisk[area] || 'slight'] : null

  return (
    <StoryShell
      onBack={onBack}
      category="WEATHER"
      categoryColor="#7c3aed"
      timestamp="March 21, 2026"
      readTime="Readiness Check"
      storyId="storm-ready"
    >
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
        Are You Ready for What's Coming?
      </h1>

      <p className="text-xl text-ink-light leading-relaxed mb-4">
        On March 5, a tornado outbreak killed 6 people across Oklahoma and Michigan. The EF-3 that hit
        Three Rivers, Michigan collapsed a Menards store with shoppers inside. It was the state's deadliest
        tornado since 1980.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-4">
        Cincinnati wasn't in the direct path. But forecasters say the Ohio Valley corridor — that's us — faces
        an <span className="font-semibold text-ink">above-average severe weather risk</span> through April and May.
        This Sunday, storms capable of hail, damaging winds, and spin-up tornadoes are already in the forecast.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-8">
        The difference between a close call and a catastrophe is almost always preparation.
        Take this 2-minute assessment and find out where you stand.
      </p>

      <Divider />

      {/* Current risk */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">This Week's Risk Level</h2>
      <p className="text-sm text-ink-muted mb-4">Storm Prediction Center outlook for the Cincinnati metro</p>

      <div className="flex gap-1 mb-4">
        {Object.entries(riskLevels).map(([key, r]) => (
          <div key={key} className="flex-1 text-center">
            <div
              className={`h-3 rounded-sm ${key === 'slight' ? 'ring-2 ring-offset-1 ring-ink' : ''}`}
              style={{ backgroundColor: r.color }}
            />
            <p className="text-[9px] mt-1 text-ink-muted">{r.level}</p>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-4">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Level 2 (Slight) — Sunday through Monday</p>
          <p className="text-sm text-amber-700">
            Two rounds of storms expected. Damaging winds, large hail, and isolated tornadoes possible.
            The enhanced risk (Level 3) is just west in Indiana.
          </p>
        </div>
      </div>

      {/* Storm Risk Map */}
      <StoryMap
        center={{ lat: 39.2000, lng: -84.4500 }}
        zoom={9}
        height={360}
        accentColor="#7c3aed"
        legend={
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-ink uppercase tracking-wider mb-1">SPC Risk Level</p>
            <MapLegendItem color="#16a34a" label="1 - Marginal" />
            <MapLegendItem color="#ca8a04" label="2 - Slight" />
            <MapLegendItem color="#ea580c" label="3 - Enhanced" />
          </div>
        }
      >
        <ChoroplethLayer
          geojson={{
            ...neighborhoodPolygons,
            features: neighborhoodPolygons.features
              .filter(f => Object.keys(cincyNeighborhoodRisk).some(a =>
                f.properties.name === a || f.properties.name.includes(a.split(' / ')[0])
              ))
              .map(f => {
                const areaKey = Object.keys(cincyNeighborhoodRisk).find(a =>
                  f.properties.name === a || f.properties.name.includes(a.split(' / ')[0]) || a.includes(f.properties.name)
                )
                const risk = areaKey ? cincyNeighborhoodRisk[areaKey] : 'marginal'
                return {
                  ...f,
                  properties: { ...f.properties, riskLevel: risk },
                }
              }),
          }}
          colorMap={{
            marginal: '#16a34a60',
            slight: '#ca8a0470',
            enhanced: '#ea580c70',
            moderate: '#dc262680',
            high: '#7f1d1d80',
          }}
          dataField="riskLevel"
          defaultColor="#e5e5e530"
          selectedId={area ? (neighborhoodPolygons.features.find(f =>
            f.properties.name === area || f.properties.name.includes(area.split(' / ')[0]) || area.includes(f.properties.name)
          )?.properties?.name || '') : ''}
          selectedStrokeColor="#7c3aed"
          id="storm-risk"
        />
        {area && (() => {
          const c = getNeighborhoodCenter(area)
          return c ? <MapMarker lat={c.lat} lng={c.lng} color="#7c3aed" label={area} pulse /> : null
        })()}
      </StoryMap>

      {/* Area selector */}
      <div className="mb-10">
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Your area</label>
        <select
          value={area}
          onChange={e => setArea(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border-2 border-rule bg-white text-ink text-sm focus:border-purple-500 focus:outline-none"
        >
          <option value="">Select your area...</option>
          {Object.keys(cincyNeighborhoodRisk).map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        {areaRisk && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm">
            <span className="font-bold" style={{ color: areaRisk.color }}>Level {areaRisk.level} ({areaRisk.label})</span>
            {' '}&mdash; {areaRisk.desc}
          </motion.p>
        )}
      </div>

      <AdSlot.Insight storyId="storm-ready" />

      <Divider />

      {/* Quiz */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">Your Readiness Assessment</h2>
      <p className="text-ink-light text-sm mb-6">5 questions. Be honest — this is for you, not us.</p>

      {questions.slice(0, currentQ + 1).map((q, qi) => (
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <q.icon size={16} className="text-purple-600" />
            <p className="text-sm font-medium text-ink">
              <span className="text-purple-600 font-bold">Q{qi + 1}.</span> {q.question}
            </p>
          </div>
          <div className="space-y-2">
            {q.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(q.id, opt.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all
                  ${answers[q.id] === opt.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-rule bg-white hover:border-purple-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      ))}

      {showInterstitial && !showResults && (
        <AdSlot.Interstitial storyId="storm-ready" onComplete={() => setShowResults(true)} />
      )}

      <AnimatePresence>
        {showResults && results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Divider />

            <h2 className="font-serif text-3xl font-bold text-ink mb-4">Your Readiness Score</h2>

            {/* Grade */}
            <div className={`rounded-xl p-8 text-center mb-6 border-2 ${results.gradeBg}`}>
              <p className={`text-6xl font-bold font-mono ${results.gradeColor}`}>{results.grade}</p>
              <p className="text-sm text-ink-muted mt-2">{results.totalScore} / {results.maxScore} points ({results.pct}%)</p>
              <p className="text-sm text-ink-light mt-1">
                {results.pct >= 85 ? 'You\'re significantly more prepared than the average household.'
                  : results.pct >= 70 ? 'Solid foundation. A few upgrades would close the gaps.'
                    : results.pct >= 50 ? 'Some preparation, but meaningful vulnerabilities remain.'
                      : 'Significant gaps. The good news: most fixes take less than an hour.'}
              </p>
            </div>

            <DynamicNarrative storyId="storm-ready" profileData={{ answers, grade: results.grade, score: results.pct, area }} />

            <LivePoll
              storyId="storm-ready"
              neighborhood={area}
              pollData={{ grade: results.grade, score: results.pct }}
            />

            {/* Per-question tips */}
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Your Personalized Action Items</h3>
            <div className="space-y-3 mb-8">
              {results.tips.map((t, i) => (
                <div key={i} className={`rounded-lg p-4 border ${t.score >= 2 ? 'bg-green-50 border-green-200' : t.score === 1 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start gap-2">
                    {t.score >= 2 ? <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" /> : <AlertTriangle size={16} className={`${t.score === 1 ? 'text-amber-600' : 'text-red-600'} shrink-0 mt-0.5`} />}
                    <div>
                      <p className="text-xs font-semibold text-ink mb-0.5">{t.score >= 2 ? 'Good' : t.score === 1 ? 'Improve' : 'Critical'}</p>
                      <p className="text-sm text-ink-light">{t.tip}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-lg text-ink-light leading-relaxed mb-4">
              The NWS gave the Three Rivers tornado warning with 12 minutes of lead time.
              Twelve minutes is enough — if you already know where to go, how you'll be alerted,
              and what to grab. It's not enough to make those decisions for the first time.
            </p>
            <p className="text-lg text-ink-light leading-relaxed mb-8">
              Cincinnati's tornado season runs March through June. The next storm isn't hypothetical — it's Sunday.
            </p>

            <AdSlot.ResultCard storyId="storm-ready" />

            <SaveButton
              label="Save Your Readiness Report"
              storyId="storm-ready"
              profileData={{ answers, grade: results.grade, score: results.pct, area }}
            />
            <StoryConnections
              storyId="storm-ready"
              profileData={{ answers, grade: results.grade, score: results.pct, area }}
              onOpenStory={onOpenStory}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </StoryShell>
  )
}

function Divider() {
  return <div className="my-10 flex items-center gap-4"><div className="h-px flex-1 bg-rule" /><div className="w-1.5 h-1.5 bg-purple-600 rotate-45" /><div className="h-px flex-1 bg-rule" /></div>
}
