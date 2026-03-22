import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Baby, Car, ShieldCheck, AlertTriangle, CheckCircle2,
  ArrowRight, MapPin, Phone, ExternalLink, Clock, XCircle
} from 'lucide-react'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'
import AdSlot from '../components/AdSlot'
import DynamicNarrative from '../components/DynamicNarrative'
import LivePoll from '../components/LivePoll'

const seatRecommendations = {
  'under-1': 'Rear-facing infant seat',
  '1-3': 'Rear-facing convertible seat',
  '4-7': 'Forward-facing seat with harness',
  '8-12': 'Booster seat with seat belt',
}

const correctSeatType = {
  'under-1': 'rear-facing',
  '1-3': 'rear-facing',
  '4-7': 'forward-facing',
  '8-12': 'booster',
}

const quizQuestions = [
  {
    id: 'age',
    question: "What is your child's age?",
    icon: Baby,
    options: [
      { label: 'Under 1 year old', value: 'under-1' },
      { label: '1 to 3 years old', value: '1-3' },
      { label: '4 to 7 years old', value: '4-7' },
      { label: '8 to 12 years old', value: '8-12' },
    ],
  },
  {
    id: 'seat-type',
    question: 'What type of car seat is your child currently using?',
    icon: Car,
    options: [
      { label: 'Rear-facing', value: 'rear-facing' },
      { label: 'Forward-facing', value: 'forward-facing' },
      { label: 'Booster seat', value: 'booster' },
      { label: 'No car seat', value: 'none' },
    ],
  },
  {
    id: 'movement',
    question: 'Can you move the seat more than 1 inch side to side at the belt path?',
    icon: AlertTriangle,
    options: [
      { label: 'Yes — it moves more than an inch', value: 'yes' },
      { label: 'No — it feels solid', value: 'no' },
    ],
  },
  {
    id: 'chest-clip',
    question: 'Where is the harness chest clip positioned?',
    icon: ShieldCheck,
    options: [
      { label: 'At armpit level', value: 'armpit' },
      { label: 'At belly level', value: 'belly' },
      { label: 'Not sure', value: 'unsure' },
    ],
  },
  {
    id: 'harness',
    question: "Can you pinch excess harness strap at your child's shoulder?",
    icon: ShieldCheck,
    options: [
      { label: 'Yes — I can pinch a fold of strap', value: 'yes' },
      { label: 'No — the strap is snug', value: 'no' },
    ],
  },
  {
    id: 'recline',
    question: 'What is the seat recline angle?',
    icon: Car,
    options: [
      { label: 'Matches the indicator on the seat', value: 'correct' },
      { label: 'Tilted too upright', value: 'upright' },
      { label: 'Tilted too far back', value: 'back' },
      { label: 'Not sure', value: 'unsure' },
    ],
  },
]

const tips = {
  age: {
    'under-1': 'Children under 1 must always ride rear-facing. This is the safest position for infants — it supports the head, neck, and spine in a crash.',
    '1-3': 'Children ages 1-3 should remain rear-facing as long as possible, ideally until they reach the maximum height or weight limit of their convertible seat. Ohio law requires rear-facing until age 2 or 20 lbs.',
    '4-7': 'Children ages 4-7 should use a forward-facing seat with a 5-point harness. Keep them harnessed until they outgrow the seat\'s weight or height limit — most seats go up to 65 lbs.',
    '8-12': 'Children ages 8-12 typically need a booster seat until the seat belt fits properly: lap belt across the upper thighs (not the stomach) and shoulder belt across the chest (not the neck).',
  },
  'seat-type': {}, // dynamically generated based on age
  movement: {
    yes: 'CRITICAL ERROR: A loose seat can shift dangerously in a crash. The seat should move no more than 1 inch side to side or front to back at the belt path. Reinstall using either the LATCH system or seat belt — never both. Pull the belt or strap tight while pressing down on the seat with your knee.',
    no: 'Good — a properly secured seat moves less than 1 inch at the belt path. Recheck this every time you reinstall or move the seat to another vehicle.',
  },
  'chest-clip': {
    armpit: 'Correct — the chest clip should sit at armpit level, centered on the sternum. This keeps the harness straps positioned over the strongest parts of the body.',
    belly: 'CRITICAL ERROR: A chest clip at belly level can cause serious abdominal injuries in a crash and allows the child to be ejected from the harness. Move it up to armpit level immediately.',
    unsure: 'Check now: the chest clip should be at armpit level, centered on the chest. If it\'s sitting on the belly or up near the neck, it needs to be repositioned. This takes 5 seconds and matters enormously.',
  },
  harness: {
    yes: 'CRITICAL ERROR: If you can pinch a fold of harness webbing at the shoulder, the harness is too loose. In a crash, a loose harness allows the child\'s body to move forward before the harness engages — dramatically increasing injury risk. Tighten until you cannot pinch any excess.',
    no: 'Correct — the harness should be snug enough that you cannot pinch any excess webbing at the shoulder. Check this every ride, especially with different layers of clothing.',
  },
  recline: {
    correct: 'Good — the recline angle matches the manufacturer\'s indicator. This ensures your child\'s airway stays open (especially important for rear-facing seats) and that the harness functions correctly.',
    upright: 'CRITICAL ERROR for rear-facing seats: A seat that is too upright can cause a young child\'s head to fall forward, restricting the airway. For rear-facing seats, follow the recline indicator carefully — most need a 30-45 degree angle. Use a rolled towel under the base if needed.',
    back: 'A seat reclined too far back may not restrain the child effectively in a frontal crash. Check the recline indicator on the side of the seat and adjust.',
    unsure: 'Check the side of your car seat for a recline indicator (usually a line, bubble level, or colored zone). Rear-facing seats especially need the correct angle to keep your child\'s airway open.',
  },
}

const inspectionLocations = [
  { name: 'Cincinnati Children\'s — Main Campus', address: '3333 Burnet Ave, Cincinnati, OH 45229', hours: 'Mon-Fri 9am-3pm', phone: '(513) 636-4200' },
  { name: 'Cincinnati Children\'s — Liberty Campus', address: '7777 Yankee Rd, Liberty Township, OH 45044', hours: 'Tue & Thu 10am-2pm', phone: '(513) 636-4200' },
  { name: 'Cincinnati Children\'s — Mason Location', address: '5665 Irwin-Simpson Rd, Mason, OH 45040', hours: 'Wed 10am-2pm', phone: '(513) 636-4200' },
]

export default function CarSeatSafety({ onBack }) {
  const [quizStep, setQuizStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [showInterstitial, setShowInterstitial] = useState(false)

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
    const errors = []
    let criticalCount = 0

    // Q1: age — informational, no error
    const childAge = answers['age']

    // Q2: seat type — cross-reference with age
    const seatType = answers['seat-type']
    const expected = correctSeatType[childAge]
    if (seatType === 'none') {
      errors.push({ critical: true, label: 'No car seat in use', tip: `Based on your child's age (${childAge}), they need a ${seatRecommendations[childAge]}. Ohio law requires a car seat or booster for children under 8 and under 4\'9". Riding without one is illegal and extremely dangerous.` })
      criticalCount++
    } else if (seatType !== expected) {
      errors.push({ critical: true, label: 'Wrong seat type for age', tip: `Your child (age ${childAge}) should be in a ${seatRecommendations[childAge]}, but is currently in a ${seatType} seat. This is one of the most common — and most dangerous — car seat errors.` })
      criticalCount++
    }

    // Q3: movement
    if (answers['movement'] === 'yes') {
      errors.push({ critical: true, label: 'Seat is loose', tip: tips.movement.yes })
      criticalCount++
    }

    // Q4: chest clip
    if (answers['chest-clip'] === 'belly') {
      errors.push({ critical: true, label: 'Chest clip too low', tip: tips['chest-clip'].belly })
      criticalCount++
    } else if (answers['chest-clip'] === 'unsure') {
      errors.push({ critical: false, label: 'Chest clip position unknown', tip: tips['chest-clip'].unsure })
    }

    // Q5: harness
    if (answers['harness'] === 'yes') {
      errors.push({ critical: true, label: 'Harness too loose', tip: tips.harness.yes })
      criticalCount++
    }

    // Q6: recline
    if (answers['recline'] === 'upright' && (childAge === 'under-1' || childAge === '1-3')) {
      errors.push({ critical: true, label: 'Recline angle too upright (airway risk)', tip: tips.recline.upright })
      criticalCount++
    } else if (answers['recline'] === 'upright') {
      errors.push({ critical: false, label: 'Recline angle may be too upright', tip: tips.recline.upright })
    } else if (answers['recline'] === 'back') {
      errors.push({ critical: false, label: 'Recline angle too far back', tip: tips.recline.back })
    } else if (answers['recline'] === 'unsure') {
      errors.push({ critical: false, label: 'Recline angle unknown', tip: tips.recline.unsure })
    }

    const totalErrors = errors.length
    const grade = criticalCount >= 2 ? 'F' : criticalCount === 1 && totalErrors >= 3 ? 'F' : totalErrors >= 3 ? 'D' : totalErrors === 2 ? 'C' : totalErrors === 1 ? 'B' : 'A'
    const gradeColor = grade === 'A' ? 'text-green-700' : grade === 'B' ? 'text-amber-700' : 'text-red-700'
    const gradeBg = grade === 'A' ? 'bg-green-50 border-green-200' : grade === 'B' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

    return { errors, criticalCount, totalErrors, grade, gradeColor, gradeBg, childAge }
  }, [showResults, answers])

  return (
    <StoryShell
      onBack={onBack}
      category="SPONSORED"
      categoryColor="#0891b2"
      timestamp="March 21, 2026"
      readTime="Safety Check"
      storyId="car-seat"
    >
      {/* Sponsor badge */}
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-cyan-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded">SPONSORED INTERACTIVE</span>
        <span className="text-xs text-cyan-700 font-semibold flex items-center gap-1.5">
          <span className="text-base">🏥</span> Cincinnati Children's Hospital
        </span>
      </div>

      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
        Is Your Child's Car Seat Installed Correctly?
      </h1>

      <p className="text-xl text-ink-light leading-relaxed mb-4">
        <span className="font-mono font-bold text-red-700 text-2xl">73%</span> of car seats have at least one critical installation error,
        according to the National Highway Traffic Safety Administration.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-4">
        Cincinnati Children's Hospital inspected over 2,000 car seats last year. Three out of four needed adjustment — a loose strap here,
        a mispositioned clip there, a seat angled wrong. Small details that parents can't see from the driver's seat. Details that determine
        whether a child walks away from a crash or doesn't.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-4">
        Most parents think they installed it correctly. Most are wrong.
      </p>
      <p className="text-lg font-medium text-ink leading-relaxed mb-8">
        Take 2 minutes to check. Your child's safety depends on details you can't see from the driver's seat.
      </p>

      <Divider />

      {/* Stats dashboard */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard value="73%" label="Error Rate" sub="NHTSA national data" />
        <StatCard value="2,000+" label="Seats Inspected" sub="Cincy Children's 2025" />
        <StatCard value="3 of 4" label="Needed Adjustment" sub="Local inspection data" />
      </div>

      {/* Branded insight */}
      <AdSlot.Insight storyId="car-seat" />

      <Divider />

      {/* Quiz */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">The 2-Minute Car Seat Check</h2>
      <p className="text-ink-light text-sm mb-6">Six questions. Two minutes. Answer honestly — no one sees this but you.</p>

      {quizQuestions.slice(0, quizStep + 1).map((q, qi) => (
        <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <q.icon size={16} className="text-cyan-600" />
            <p className="text-sm font-medium text-ink">
              <span className="text-cyan-600 font-bold">Q{qi + 1}.</span> {q.question}
            </p>
          </div>
          <div className="space-y-2">
            {q.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(q.id, opt.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all
                  ${answers[q.id] === opt.value ? 'border-cyan-500 bg-cyan-50' : 'border-rule bg-white hover:border-cyan-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {answers[q.id] && tips[q.id]?.[answers[q.id]] && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 bg-paper-warm rounded-lg p-3 border border-rule">
              <p className="text-sm text-ink-light">{tips[q.id][answers[q.id]]}</p>
            </motion.div>
          )}
        </motion.div>
      ))}

      {/* Interstitial — after quiz, before results */}
      {showInterstitial && !showResults && (
        <AdSlot.Interstitial storyId="car-seat" onComplete={() => setShowResults(true)} />
      )}

      <AnimatePresence>
        {showResults && results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Divider />

            <h2 className="font-serif text-3xl font-bold text-ink mb-4">Your Car Seat Safety Score</h2>

            <div className={`rounded-xl p-8 text-center mb-6 border-2 ${results.gradeBg}`}>
              <p className={`text-6xl font-bold font-mono ${results.gradeColor}`}>{results.grade}</p>
              <p className="text-sm text-ink-muted mt-2">
                {results.totalErrors === 0 ? 'No errors found' : `${results.totalErrors} error${results.totalErrors > 1 ? 's' : ''} found`}
                {results.criticalCount > 0 && ` (${results.criticalCount} critical)`}
              </p>
              <p className="text-sm text-ink-light mt-1">
                {results.grade === 'A' ? 'Excellent. Your car seat setup appears correct. Recheck after every reinstallation or vehicle change.'
                  : results.grade === 'B' ? 'One issue found. It\'s likely a quick fix — but don\'t wait. Small errors become big problems at 35 mph.'
                    : results.grade === 'C' ? 'Multiple issues detected. Your child\'s restraint has meaningful gaps. Review the fixes below and address them today.'
                      : 'Critical errors found. Your child may not be properly restrained in a crash. Fix these immediately or schedule a free inspection.'}
              </p>
            </div>

            <DynamicNarrative storyId="car-seat" profileData={{ answers, grade: results.grade, errors: results.errors }} />

            <LivePoll
              storyId="car-seat"
              neighborhood={null}
              pollData={{ grade: results.grade, errors: results.totalErrors }}
            />

            {/* Error details */}
            {results.errors.length > 0 && (
              <>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Issues Found</h3>
                <div className="space-y-3 mb-8">
                  {results.errors.map((err, i) => (
                    <div key={i} className={`rounded-lg p-4 border ${err.critical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-start gap-2 mb-1">
                        {err.critical ? (
                          <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-sm font-bold ${err.critical ? 'text-red-700' : 'text-amber-700'}`}>
                            {err.critical && 'CRITICAL: '}{err.label}
                          </p>
                          <p className="text-sm text-ink-light mt-1">{err.tip}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {results.totalErrors === 0 && (
              <div className="rounded-lg p-4 border bg-green-50 border-green-200 mb-8">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-700">No errors detected</p>
                    <p className="text-sm text-ink-light mt-1">
                      Your car seat setup looks correct based on your answers. Remember to recheck after every reinstallation,
                      vehicle change, or when your child grows into a new size range. For a hands-on verification, Cincinnati Children's
                      offers free inspections year-round.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Critical warning callout */}
            {results.criticalCount >= 2 && (
              <div className="bg-red-600 text-white rounded-xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={20} />
                  <h3 className="font-serif text-lg font-bold">Immediate Action Needed</h3>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  Multiple critical errors were found with your child's car seat setup. In a crash at just 30 mph, these errors
                  could mean the difference between minor bruising and life-threatening injury. Do not drive with your child until
                  these issues are resolved — or schedule a free inspection at Cincinnati Children's today.
                </p>
              </div>
            )}

            {/* Recommended seat type */}
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-5 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-cyan-700" />
                <h3 className="text-sm font-bold text-cyan-800">Recommended for Your Child</h3>
              </div>
              <p className="text-sm text-ink-light">
                Based on your child's age ({results.childAge}), the recommended restraint is a <span className="font-bold text-ink">{seatRecommendations[results.childAge]}</span>.
                Keep your child in each stage as long as possible — until they exceed the seat's height or weight limits.
              </p>
            </div>

            {/* CTA: Free inspections */}
            <div className="bg-white border-2 border-ink rounded-xl overflow-hidden mb-8">
              <div className="bg-ink px-6 py-4">
                <h3 className="text-white font-serif text-lg font-bold flex items-center gap-2">
                  <span className="text-xl">🏥</span> Schedule a Free Car Seat Inspection
                </h3>
                <p className="text-white/70 text-sm mt-1">Cincinnati Children's Hospital — no appointment needed at most locations</p>
              </div>
              <div className="p-6 space-y-5">
                {inspectionLocations.map((loc, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-ink">{loc.name}</p>
                      <p className="text-xs text-ink-light">{loc.address}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{loc.hours}</p>
                    </div>
                    <a href={`tel:${loc.phone}`} className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2.5 py-1.5 rounded shrink-0 flex items-center gap-1">
                      <Phone size={10} /> Call
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary CTA */}
            <a
              href="#"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-cyan-200 bg-cyan-50 text-cyan-700 font-medium text-sm hover:bg-cyan-100 transition-colors mb-8"
            >
              <Car size={16} />
              Find a Car Seat Check Event Near You
              <ExternalLink size={12} />
            </a>

            {/* Closing */}
            <p className="text-lg text-ink-light leading-relaxed mb-8">
              A properly installed car seat reduces the risk of fatal injury by 71% for infants and 54% for toddlers.
              The check takes two minutes. The inspection is free. The alternative is unthinkable.
            </p>

            {/* Sponsor attribution */}
            <div className="bg-paper-warm border border-rule rounded-xl p-5 mb-8 flex items-center gap-4">
              <span className="text-3xl">🏥</span>
              <div>
                <p className="text-xs text-ink-muted uppercase tracking-wider font-bold mb-1">Presented by</p>
                <p className="text-sm font-bold text-ink">Cincinnati Children's Hospital Medical Center</p>
                <p className="text-xs text-ink-light">Keeping Cincinnati's kids safe since 1883</p>
              </div>
            </div>

            {/* Sponsored result card */}
            <AdSlot.ResultCard storyId="car-seat" />

            <SaveButton
              label="Save Your Car Seat Safety Report"
              storyId="car-seat"
              profileData={{ childAge: results.childAge, answers, grade: results.grade, errors: results.totalErrors, critical: results.criticalCount }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </StoryShell>
  )
}

function StatCard({ value, label, sub }) {
  return (
    <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-center">
      <p className="text-3xl sm:text-4xl font-bold font-mono text-cyan-700">{value}</p>
      <p className="text-xs font-bold text-cyan-800 uppercase tracking-wide">{label}</p>
      <p className="text-[10px] text-cyan-500">{sub}</p>
    </div>
  )
}

function Divider() {
  return <div className="my-10 flex items-center gap-4"><div className="h-px flex-1 bg-rule" /><div className="w-1.5 h-1.5 bg-cyan-600 rotate-45" /><div className="h-px flex-1 bg-rule" /></div>
}
