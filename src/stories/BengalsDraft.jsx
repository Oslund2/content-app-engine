import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Star, ChevronRight, ArrowRight, AlertTriangle, Users, Trophy, Target, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'
import StoryConnections from '../components/StoryConnections'
import AdSlot from '../components/AdSlot'
import DynamicNarrative from '../components/DynamicNarrative'
import LivePoll from '../components/LivePoll'

const teamNeeds = [
  { position: 'EDGE', priority: 95, label: 'Edge Rusher', reason: 'Bottom-5 pass rush in 2025. Mafe signing helps but need more.' },
  { position: 'CB', priority: 88, label: 'Cornerback', reason: 'Secondary was torched for 270+ pass yards/game.' },
  { position: 'DL', priority: 82, label: 'Interior D-Line', reason: 'Jonathan Allen is 31. Need youth alongside him.' },
  { position: 'OG', priority: 75, label: 'Offensive Guard', reason: 'Burrow was sacked 48 times. Interior protection is urgent.' },
  { position: 'LB', priority: 70, label: 'Inside Linebacker', reason: 'Coverage LB is a hole. Need someone who can run with TEs.' },
  { position: 'TE', priority: 60, label: 'Tight End', reason: 'No reliable pass-catching TE. Burrow needs a middle-field weapon.' },
]

const prospects = [
  { name: 'Mansoor Delane', school: 'LSU', position: 'CB', grade: 93, strengths: { coverage: 95, athleticism: 92, tackling: 78, instincts: 88 }, comp: 'Sauce Gardner', note: 'Kiper\'s pick at #10. Elite ball skills, 6 INTs in 2025.' },
  { name: 'Rueben Bain', school: 'Miami', position: 'EDGE', grade: 91, strengths: { coverage: 60, athleticism: 90, tackling: 85, instincts: 88 }, comp: 'Myles Garrett (lite)', note: 'True difference-maker off the edge. 12.5 sacks as a junior.' },
  { name: 'Caleb Downs', school: 'Ohio State', position: 'S', grade: 90, strengths: { coverage: 92, athleticism: 88, tackling: 82, instincts: 94 }, comp: 'Derwin James', note: 'Jeremiah\'s pick. Versatile safety who plays like a linebacker.' },
  { name: 'Derrick Harmon', school: 'Oregon', position: 'DL', grade: 88, strengths: { coverage: 40, athleticism: 82, tackling: 90, instincts: 85 }, comp: 'Chris Jones', note: 'Interior disruptor. 8 sacks from the DT position.' },
  { name: 'Kelvin Banks Jr.', school: 'Texas', position: 'OG', grade: 87, strengths: { coverage: 30, athleticism: 78, tackling: 70, instincts: 82 }, comp: 'Quenton Nelson', note: 'Can play guard or tackle. Elite pass protection metrics.' },
  { name: 'Tyler Warren', school: 'Penn State', position: 'TE', grade: 86, strengths: { coverage: 50, athleticism: 85, tackling: 55, instincts: 80 }, comp: 'George Kittle', note: 'Matchup nightmare. 1,100+ receiving yards in 2025.' },
  { name: 'Jihaad Campbell', school: 'Alabama', position: 'LB', grade: 85, strengths: { coverage: 80, athleticism: 88, tackling: 92, instincts: 90 }, comp: 'Roquan Smith', note: 'Three-down LB who can cover and blitz. 110+ tackles.' },
]

const freeAgentSignings = [
  { name: 'Boye Mafe', position: 'EDGE', contract: '3yr / $45M', impact: 'Fills starting edge role immediately' },
  { name: 'Bryan Cook', position: 'S', contract: '3yr / $36M', impact: 'Run-support safety, fills box role' },
  { name: 'Jonathan Allen', position: 'DT', contract: '2yr / $28M', impact: 'Veteran anchor, but 31 years old' },
  { name: 'Josh Johnson', position: 'QB', contract: '1yr / $2M', impact: 'Veteran backup behind Burrow' },
]

export default function BengalsDraft({ onBack, onOpenStory }) {
  const [selectedProspect, setSelectedProspect] = useState(null)
  const [userPick, setUserPick] = useState(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showInterstitial, setShowInterstitial] = useState(false)

  const prospect = selectedProspect ? prospects.find(p => p.name === selectedProspect) : null

  const fitScore = useMemo(() => {
    if (!prospect) return null
    const need = teamNeeds.find(n => n.position === prospect.position)
    const needPriority = need ? need.priority : 40
    const valueFit = prospect.grade >= 88 ? 'BPA' : prospect.grade >= 85 ? 'Solid' : 'Reach'
    return { needPriority, valueFit, overall: Math.round((needPriority + prospect.grade) / 2) }
  }, [prospect])

  const radarData = prospect ? [
    { attr: 'Coverage', value: prospect.strengths.coverage },
    { attr: 'Athleticism', value: prospect.strengths.athleticism },
    { attr: 'Tackling', value: prospect.strengths.tackling },
    { attr: 'Instincts', value: prospect.strengths.instincts },
  ] : []

  return (
    <StoryShell
      onBack={onBack}
      category="SPORTS"
      categoryColor="#FB4F14"
      timestamp="March 21, 2026"
      readTime="Draft Simulator"
    >
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
        You Have the 10th Pick. Who Do You Take?
      </h1>

      <p className="text-xl text-ink-light leading-relaxed mb-4">
        The Bengals spent <span className="font-mono font-bold text-ink">$126 million</span> on defense this offseason.
        Boye Mafe, Bryan Cook, Jonathan Allen — three starters in three days. But the draft is where dynasties are built,
        and at pick #10, Cincinnati is in range for a franchise-altering talent.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-8">
        The question isn't just <em>who</em> — it's <em>why</em>. Do you draft for the biggest remaining need, or take the
        best player available? Step into the war room and make the call.
      </p>

      <Divider />

      {/* Free agency context */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">What They Already Did</h2>
      <p className="text-sm text-ink-muted mb-4">$126M in defensive free agent spending this March</p>
      <div className="grid grid-cols-2 gap-3 mb-10">
        {freeAgentSignings.map((s, i) => (
          <div key={i} className="bg-white border border-rule rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-orange-600">{s.position}</span>
              <span className="font-semibold text-sm text-ink">{s.name}</span>
            </div>
            <p className="text-xs font-mono text-ink-muted mb-1">{s.contract}</p>
            <p className="text-xs text-ink-light">{s.impact}</p>
          </div>
        ))}
      </div>

      <AdSlot.Insight storyId="bengals-draft" />

      <Divider />

      {/* Need priorities */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">Remaining Needs</h2>
      <p className="text-sm text-ink-muted mb-4">Post-free agency priority ranking</p>
      <div className="bg-white border border-rule rounded-xl p-5 mb-10">
        {teamNeeds.map((need, i) => (
          <div key={i} className="mb-4 last:mb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-ink">{need.label}</span>
              <span className="text-xs font-mono text-ink-muted">{need.priority}/100</span>
            </div>
            <div className="h-3 bg-paper-warm rounded-full overflow-hidden mb-1">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${need.priority}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="h-full rounded-full"
                style={{ backgroundColor: need.priority > 85 ? '#FB4F14' : need.priority > 70 ? '#b8860b' : '#0d7377' }}
              />
            </div>
            <p className="text-xs text-ink-muted">{need.reason}</p>
          </div>
        ))}
      </div>

      <Divider />

      {/* Draft board */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">Your Pick at #10</h2>
      <p className="text-ink-light text-sm mb-4">These 7 prospects are projected to be available. Select one to see the full scouting report.</p>

      <div className="space-y-3 mb-8">
        {prospects.map((p) => {
          const need = teamNeeds.find(n => n.position === p.position)
          return (
            <button
              key={p.name}
              onClick={() => { setSelectedProspect(p.name); setUserPick(null); setShowAnalysis(false) }}
              className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all
                ${selectedProspect === p.name
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-rule bg-white hover:border-orange-300'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-orange-700">{p.position}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-ink-muted">{p.school} &middot; Grade: {p.grade} &middot; Comp: {p.comp}</p>
                  </div>
                </div>
                {need && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${need.priority > 85 ? 'bg-orange-100 text-orange-800' : need.priority > 70 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                    Need: {need.priority}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {prospect && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Divider />

            {/* Scouting report */}
            <h2 className="font-serif text-2xl font-bold text-ink mb-1">{prospect.name}</h2>
            <p className="text-sm text-ink-muted mb-4">{prospect.school} &middot; {prospect.position} &middot; NFL Comp: {prospect.comp}</p>

            <p className="text-lg text-ink-light leading-relaxed mb-6">{prospect.note}</p>

            {/* Radar chart */}
            <div className="bg-white border border-rule rounded-xl p-5 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">Athletic Profile</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e5e5" />
                    <PolarAngleAxis dataKey="attr" tick={{ fontSize: 12, fill: '#8a8a8a' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="#FB4F14" fill="#FB4F14" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fit score */}
            {fitScore && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-orange-600 mb-1">Grade</p>
                  <p className="text-2xl font-bold font-mono text-orange-700">{prospect.grade}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-orange-600 mb-1">Need Fit</p>
                  <p className="text-2xl font-bold font-mono text-orange-700">{fitScore.needPriority}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-orange-600 mb-1">Overall</p>
                  <p className="text-2xl font-bold font-mono text-orange-700">{fitScore.overall}</p>
                </div>
              </div>
            )}

            {/* Confirm pick */}
            {!userPick && (
              <button
                onClick={() => { setUserPick(prospect.name); setShowInterstitial(true) }}
                className="w-full py-4 rounded-xl bg-[#FB4F14] text-white font-bold text-lg hover:bg-orange-600 active:scale-[0.98] transition-all mb-6"
              >
                Draft {prospect.name} at #10
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showInterstitial && !showAnalysis && (
        <AdSlot.Interstitial storyId="bengals-draft" onComplete={() => setShowAnalysis(true)} />
      )}

      <AnimatePresence>
        {showAnalysis && userPick && fitScore && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Divider />

            <div className="bg-gradient-to-br from-[#FB4F14]/10 to-orange-50 border-2 border-[#FB4F14]/30 rounded-xl p-6 mb-6 text-center">
              <p className="text-sm uppercase tracking-wider text-orange-600 mb-2">With the 10th pick in the 2026 NFL Draft</p>
              <p className="text-sm text-ink-muted mb-1">The Cincinnati Bengals select</p>
              <p className="text-3xl sm:text-4xl font-serif font-bold text-ink mb-1">{prospect.name}</p>
              <p className="text-ink-muted">{prospect.position} &middot; {prospect.school}</p>
            </div>

            <DynamicNarrative storyId="bengals-draft" profileData={{ pick: userPick, position: prospect.position, grade: prospect.grade, fitScore }} />

            <LivePoll
              storyId="bengals-draft"
              neighborhood={null}
              pollData={{ pick: userPick, position: prospect.position }}
            />

            <p className="text-lg text-ink-light leading-relaxed mb-4">
              {fitScore.overall >= 90
                ? `This is the kind of pick that makes a GM look like a genius. ${prospect.name} addresses a top-tier need at ${prospect.position} with an elite prospect grade of ${prospect.grade}. In two years, Bengals fans may look back at this as the pick that completed the roster.`
                : fitScore.overall >= 80
                  ? `A strong selection. ${prospect.name} fills a real need at ${prospect.position} and brings Day 1 starter potential. It's not the flashiest pick, but it's the kind of disciplined drafting that wins divisions.`
                  : `An interesting gamble. ${prospect.name} is a talented player, but ${prospect.position} isn't the Bengals' most pressing need. This pick bets on talent over fit — a strategy that works when the player is special enough to transcend the depth chart.`}
            </p>

            <p className="text-lg text-ink-light leading-relaxed mb-8">
              The real draft is April 23 in Pittsburgh. When the Bengals are on the clock, remember this moment — and see how close you came.
            </p>

            <AdSlot.ResultCard storyId="bengals-draft" />

            <SaveButton
              label="Save Your Draft Pick"
              storyId="bengals-draft"
              profileData={{ pick: userPick, grade: prospect.grade, fitScore }}
            />
            <StoryConnections
              storyId="bengals-draft"
              profileData={{ pick: userPick, grade: prospect.grade, fitScore }}
              onOpenStory={onOpenStory}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </StoryShell>
  )
}

function Divider() {
  return <div className="my-10 flex items-center gap-4"><div className="h-px flex-1 bg-rule" /><div className="w-1.5 h-1.5 bg-[#FB4F14] rotate-45" /><div className="h-px flex-1 bg-rule" /></div>
}
