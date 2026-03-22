import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Footprints, CheckCircle2, XCircle, HelpCircle, DollarSign, Users,
  Home, ArrowRight, Download, ChevronRight, AlertTriangle, MapPin
} from 'lucide-react'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'
import StoryConnections from '../components/StoryConnections'
import AdSlot from '../components/AdSlot'
import DynamicNarrative from '../components/DynamicNarrative'
import LivePoll from '../components/LivePoll'

const pilotNeighborhoods = [
  { name: 'South Fairmount', eligible: true, repairsCompleted: 12, income: 38200 },
  { name: 'East Westwood', eligible: true, repairsCompleted: 9, income: 36800 },
  { name: 'Millvale', eligible: true, repairsCompleted: 8, income: 34500 },
  { name: 'English Woods', eligible: true, repairsCompleted: 7, income: 31200 },
  { name: 'North Fairmount', eligible: true, repairsCompleted: 10, income: 33400 },
  { name: 'South Cumminsville', eligible: true, repairsCompleted: 5, income: 37100 },
  { name: 'Sedamsville', eligible: true, repairsCompleted: 4, income: 35600 },
]

const allNeighborhoods = [
  ...pilotNeighborhoods.map(n => ({ ...n, inPilot: true })),
  { name: 'Over-the-Rhine', inPilot: false, eligible: false, income: 42500, expansionLikely: true },
  { name: 'Avondale', inPilot: false, eligible: false, income: 35800, expansionLikely: true },
  { name: 'Walnut Hills', inPilot: false, eligible: false, income: 44200, expansionLikely: true },
  { name: 'Price Hill', inPilot: false, eligible: false, income: 38900, expansionLikely: true },
  { name: 'Westwood', inPilot: false, eligible: false, income: 41500, expansionLikely: true },
  { name: 'Madisonville', inPilot: false, eligible: false, income: 43800, expansionLikely: false },
  { name: 'Hyde Park', inPilot: false, eligible: false, income: 82000, expansionLikely: false },
  { name: 'Mt. Lookout', inPilot: false, eligible: false, income: 75000, expansionLikely: false },
  { name: 'Clifton', inPilot: false, eligible: false, income: 48200, expansionLikely: false },
  { name: 'Northside', inPilot: false, eligible: false, income: 45600, expansionLikely: false },
  { name: 'Mt. Washington', inPilot: false, eligible: false, income: 55000, expansionLikely: false },
  { name: 'Anderson Twp', inPilot: false, eligible: false, income: 72000, expansionLikely: false },
]

const quizQuestions = [
  {
    id: 'ownership',
    question: 'Do you own your home?',
    options: [
      { label: 'Yes, I own', value: true, icon: Home },
      { label: 'No, I rent', value: false, icon: Users },
    ],
    requirement: true,
    failMessage: 'The pilot is limited to homeowners, since Ohio law places sidewalk maintenance responsibility on property owners — not renters.',
  },
  {
    id: 'condition',
    question: 'What best describes your sidewalk?',
    options: [
      { label: 'Cracked or uneven — I can still walk on it', value: 'moderate', icon: AlertTriangle },
      { label: 'Severely broken — it\'s a trip hazard', value: 'severe', icon: XCircle },
      { label: 'Actually, it\'s fine', value: 'fine', icon: CheckCircle2 },
    ],
    requirement: (v) => v !== 'fine',
    failMessage: 'Good news — you don\'t need the program! The city focuses limited funds on genuine hazards.',
  },
  {
    id: 'afford',
    question: 'Could you cover a $500–$2,500 repair bill today?',
    options: [
      { label: 'Yes, that\'s manageable', value: 'yes', icon: DollarSign },
      { label: 'It would be a stretch', value: 'stretch', icon: HelpCircle },
      { label: 'No, that\'s not possible', value: 'no', icon: XCircle },
    ],
    requirement: (v) => v !== 'yes',
    failMessage: null, // doesn't disqualify but affects messaging
  },
]

export default function SidewalkChecker({ onBack, onOpenStory }) {
  const [neighborhood, setNeighborhood] = useState('')
  const [quizStep, setQuizStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [showInterstitial, setShowInterstitial] = useState(false)

  const hood = allNeighborhoods.find(n => n.name === neighborhood)

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(q => q + 1)
    } else {
      setShowInterstitial(true)
    }
  }

  const isEligible = hood?.inPilot && answers.ownership === true && answers.condition !== 'fine'
  const isExpansionCandidate = hood && !hood.inPilot && hood.expansionLikely && answers.ownership === true

  return (
    <StoryShell
      onBack={onBack}
      category="YOUR NEIGHBORHOOD"
      categoryColor="#6b21a8"
      timestamp="March 20, 2026"
      readTime="Eligibility Checker"
      storyId="sidewalk-repair"
    >
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
        The City Fixed 55 Sidewalks for Free
      </h1>

      <p className="text-xl text-ink-light leading-relaxed mb-4">
        Here's a number that might surprise you: only <span className="font-mono font-bold text-ink text-2xl">19%</span> of
        Cincinnati residents are satisfied with the condition of sidewalks in their area.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-4">
        In Ohio, the repair burden falls on homeowners — not the city. A single panel replacement can run $500 to $2,500,
        a cost that's quietly regressive: the neighborhoods with the worst sidewalks tend to be the ones least able to fix them.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-4">
        Last year, City Council approved a <span className="font-semibold text-ink">$100,000 pilot</span> targeting
        seven neighborhoods where the median household income falls below $50,000. Of 63 homeowners who applied, 58 qualified.
        Fifty-five repairs are done. Three more are scheduled for this spring.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-8">
        The question now: does the pilot expand? Let's find out if you'd qualify.
      </p>

      <Divider />

      {/* Pilot stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <StatCard label="Budget" value="$100K" />
        <StatCard label="Applications" value="63" />
        <StatCard label="Approved" value="58" />
        <StatCard label="Completed" value="55" />
      </div>

      {/* Pilot neighborhoods map */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">The Pilot Neighborhoods</h2>
      <p className="text-sm text-ink-muted mb-4">All seven are on the West Side, chosen for income eligibility and geographic proximity.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-10">
        {pilotNeighborhoods.map(n => (
          <div key={n.name} className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-purple-800">{n.name}</p>
            <p className="text-lg font-bold font-mono text-purple-700">{n.repairsCompleted}</p>
            <p className="text-[10px] text-purple-500">repairs completed</p>
          </div>
        ))}
      </div>

      <AdSlot.Insight storyId="sidewalk-repair" />

      <Divider />

      {/* Interactive checker */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">Check Your Eligibility</h2>
      <p className="text-ink-light text-sm mb-6">Answer three questions to see where you stand — for the current pilot or a potential expansion.</p>

      {/* Neighborhood selector */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Your neighborhood</label>
        <select
          value={neighborhood}
          onChange={(e) => { setNeighborhood(e.target.value); setQuizStep(0); setAnswers({}); setShowResults(false) }}
          className="w-full px-4 py-3 rounded-lg border-2 border-rule bg-white text-ink text-sm focus:border-purple-500 focus:outline-none transition-colors"
        >
          <option value="">Select your neighborhood...</option>
          {allNeighborhoods.map(n => (
            <option key={n.name} value={n.name}>
              {n.name} {n.inPilot ? '(Pilot Area)' : ''}
            </option>
          ))}
        </select>
      </div>

      <AnimatePresence>
        {neighborhood && !showResults && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {quizQuestions.slice(0, quizStep + 1).map((q, qi) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <p className="text-sm font-medium text-ink mb-3">
                  <span className="text-purple-600 font-bold">Q{qi + 1}.</span> {q.question}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  {q.options.map(opt => (
                    <button
                      key={String(opt.value)}
                      onClick={() => handleAnswer(q.id, opt.value)}
                      className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm transition-all text-left
                        ${answers[q.id] === opt.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-rule bg-white hover:border-purple-300'}`}
                    >
                      <opt.icon size={16} className={answers[q.id] === opt.value ? 'text-purple-600' : 'text-ink-muted'} />
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {showInterstitial && !showResults && (
        <AdSlot.Interstitial storyId="sidewalk-repair" onComplete={() => setShowResults(true)} />
      )}

      <AnimatePresence>
        {showResults && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Divider />

            <h2 className="font-serif text-3xl font-bold text-ink mb-4">Your Result</h2>

            {isEligible ? (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={24} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-bold text-green-800 mb-1">You likely qualify</h3>
                    <p className="text-sm text-green-700">
                      {hood.name} is one of the seven pilot neighborhoods, you own your property, and you've described a repair need.
                      The city's Department of Transportation & Engineering handles inspections — if your sidewalk meets their hazard criteria,
                      the repair would be covered at no cost to you.
                    </p>
                    <p className="text-sm text-green-700 mt-2 font-semibold">
                      Contact DOTE at (513) 352-3454 or visit the Sidewalk Safety Program page on cincinnati-oh.gov to apply.
                    </p>
                  </div>
                </div>
              </div>
            ) : isExpansionCandidate ? (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <HelpCircle size={24} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-bold text-amber-800 mb-1">Not yet — but you're in the expansion zone</h3>
                    <p className="text-sm text-amber-700">
                      {hood.name} isn't in the current pilot, but with a median household income of ${hood.income.toLocaleString()},
                      it fits the profile of neighborhoods officials have discussed for expansion.
                      {answers.afford === 'no' && ' Your inability to cover repair costs is exactly the situation the program was designed to address.'}
                    </p>
                    <p className="text-sm text-amber-700 mt-2">
                      Council will review the pilot's results in the FY2027 budget cycle. Advocacy from residents in neighborhoods like yours
                      is what expands programs like this.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-paper-warm border-2 border-rule rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <XCircle size={24} className="text-ink-muted shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-bold text-ink mb-1">Not eligible under current criteria</h3>
                    <p className="text-sm text-ink-light">
                      {!answers.ownership
                        ? 'The program is designed for homeowners, since Ohio law places repair responsibility on property owners. If your sidewalk is dangerous, report it to your landlord — they\'re legally obligated to address hazards.'
                        : hood && !hood.inPilot && !hood.expansionLikely
                          ? `${hood.name}'s median income of $${hood.income.toLocaleString()} is above the pilot's $50,000 threshold. The program targets neighborhoods where repair costs represent a disproportionate burden.`
                          : 'Based on your responses, you don\'t currently qualify. The program prioritizes genuine hazards in income-eligible areas.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DynamicNarrative storyId="sidewalk-repair" profileData={{ neighborhood, answers, isEligible, isExpansionCandidate }} />

            <LivePoll
              storyId="sidewalk-repair"
              neighborhood={neighborhood}
              pollData={{ eligible: isEligible, expansionCandidate: isExpansionCandidate }}
            />

            {/* Cost context */}
            <div className="bg-white border border-rule rounded-xl p-5 mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">What Repairs Actually Cost</h3>
              <div className="space-y-3">
                {[
                  { type: 'Single panel replacement', low: 500, high: 800 },
                  { type: 'Multiple panels (10+ ft)', low: 800, high: 1500 },
                  { type: 'Full frontage rebuild', low: 1500, high: 2500 },
                  { type: 'ADA-compliant ramp addition', low: 2000, high: 3500 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-ink-light">{item.type}</span>
                    <span className="text-sm font-mono font-bold text-ink">${item.low} – ${item.high.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-lg text-ink-light leading-relaxed mb-8">
              The pilot's $100,000 budget covered 55 repairs at an average cost of about $1,800 each.
              Scaling to the entire city would require roughly $12 million — a number that's aspirational but not unthinkable,
              given that it's less than 1% of the city's annual budget. The question, as always, is priorities.
            </p>

            <AdSlot.ResultCard storyId="sidewalk-repair" />

            <SaveButton
              label="Save Your Eligibility Report"
              storyId="sidewalk-repair"
              profileData={{ neighborhood, answers, isEligible, isExpansionCandidate }}
            />
            <StoryConnections
              storyId="sidewalk-repair"
              profileData={{ neighborhood, answers, isEligible, isExpansionCandidate }}
              onOpenStory={onOpenStory}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </StoryShell>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
      <p className="text-[10px] uppercase tracking-wide text-purple-500 mb-0.5">{label}</p>
      <p className="text-xl font-bold font-mono text-purple-800">{value}</p>
    </div>
  )
}

function Divider() {
  return <div className="my-10 flex items-center gap-4"><div className="h-px flex-1 bg-rule" /><div className="w-1.5 h-1.5 bg-purple-500 rotate-45" /><div className="h-px flex-1 bg-rule" /></div>
}

