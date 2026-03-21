import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, Calendar, ChevronRight, Target, Star, Users, ArrowRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'

const matches = [
  { week: 1, date: 'Feb 21', opponent: 'Atlanta United', home: true, result: 'W', score: '2-0', scorers: ['Denkey', 'Hagglund'], attendance: 25513 },
  { week: 2, date: 'Feb 28', opponent: 'Minnesota United', home: false, result: 'D', score: '1-1', scorers: ['Acosta'], attendance: 19738 },
  { week: 3, date: 'Mar 8', opponent: 'Toronto FC', home: true, result: 'W', score: '3-1', scorers: ['Denkey', 'Denkey', 'Acosta'], attendance: 25891 },
  { week: 4, date: 'Mar 15', opponent: 'New England', home: false, result: 'L', score: '0-2', scorers: [], attendance: 21044 },
  { week: 5, date: 'Mar 22', opponent: 'CF Montreal', home: true, result: 'D', score: '2-2', scorers: ['Denkey', 'Barreal'], attendance: 25200 },
]

const upcoming = [
  { week: 6, date: 'Mar 29', opponent: 'Columbus Crew', home: false, rivalry: true },
  { week: 7, date: 'Apr 5', opponent: 'Charlotte FC', home: true, rivalry: false },
  { week: 8, date: 'Apr 12', opponent: 'Nashville SC', home: false, rivalry: false },
  { week: 9, date: 'Apr 19', opponent: 'Inter Miami', home: true, rivalry: false },
]

const playerStats = [
  { name: 'K. Denkey', goals: 4, assists: 1, minutes: 450, rating: 8.2 },
  { name: 'L. Acosta', goals: 2, assists: 3, minutes: 430, rating: 7.8 },
  { name: 'A. Barreal', goals: 1, assists: 2, minutes: 380, rating: 7.1 },
  { name: 'N. Hagglund', goals: 1, assists: 0, minutes: 450, rating: 7.3 },
  { name: 'M. Miazga', goals: 0, assists: 0, minutes: 450, rating: 7.5 },
]

const TOTAL_MATCHES = 34
const PTS_WIN = 3
const PTS_DRAW = 1

export default function FCCincinnati({ onBack }) {
  const [predictions, setPredictions] = useState({})
  const [showProjection, setShowProjection] = useState(false)
  const [fanConfidence, setFanConfidence] = useState(70)

  const currentRecord = useMemo(() => {
    const w = matches.filter(m => m.result === 'W').length
    const d = matches.filter(m => m.result === 'D').length
    const l = matches.filter(m => m.result === 'L').length
    const pts = w * PTS_WIN + d * PTS_DRAW
    const gf = matches.reduce((sum, m) => sum + parseInt(m.score.split('-')[0]), 0)
    const ga = matches.reduce((sum, m) => sum + parseInt(m.score.split('-')[1]), 0)
    return { w, d, l, pts, gf, ga, ppg: (pts / matches.length).toFixed(2) }
  }, [])

  const projection = useMemo(() => {
    const remaining = TOTAL_MATCHES - matches.length
    const predictedUpcoming = Object.values(predictions)
    const upcomingW = predictedUpcoming.filter(p => p === 'W').length
    const upcomingD = predictedUpcoming.filter(p => p === 'D').length
    const upcomingPts = upcomingW * PTS_WIN + upcomingD * PTS_DRAW

    // Project rest of season from current PPG + user predictions
    const totalPredicted = matches.length + predictedUpcoming.length
    const totalPts = currentRecord.pts + upcomingPts
    const ppgSoFar = totalPredicted > 0 ? totalPts / totalPredicted : currentRecord.pts / matches.length
    const projectedFinal = Math.round(ppgSoFar * TOTAL_MATCHES)

    // Historical context
    const playoffLine = 48
    const shieldPace = 68

    // Weekly points accumulation chart
    const weeklyData = matches.map((m, i) => {
      const pts = matches.slice(0, i + 1).reduce((s, mm) => s + (mm.result === 'W' ? 3 : mm.result === 'D' ? 1 : 0), 0)
      return { week: m.week, pts, label: `vs ${m.opponent}` }
    })

    // Add predictions
    let runningPts = currentRecord.pts
    upcoming.forEach(u => {
      const pred = predictions[u.week]
      if (pred) {
        runningPts += pred === 'W' ? 3 : pred === 'D' ? 1 : 0
        weeklyData.push({ week: u.week, pts: runningPts, label: `vs ${u.opponent} (predicted)` })
      }
    })

    return { projectedFinal, playoffLine, shieldPace, ppgSoFar: ppgSoFar.toFixed(2), weeklyData }
  }, [currentRecord, predictions])

  return (
    <StoryShell
      onBack={onBack}
      category="SPORTS"
      categoryColor="#003087"
      timestamp="March 21, 2026"
      readTime="Season Tracker"
    >
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
        Five Matches In. Where Is This Season Going?
      </h1>

      <p className="text-xl text-ink-light leading-relaxed mb-4">
        FC Cincinnati opened 2026 with the earliest home opener in franchise history — and promptly beat Atlanta 2-0.
        Five matches later, the Orange and Blue sit at <span className="font-mono font-bold text-ink">{currentRecord.w}W-{currentRecord.d}D-{currentRecord.l}L</span>,
        with <span className="font-mono font-bold text-ink">{currentRecord.pts} points</span> and a goal difference of +{currentRecord.gf - currentRecord.ga}.
      </p>
      <p className="text-lg text-ink-light leading-relaxed mb-8">
        It's early. But early form has a way of becoming prophecy. Predict the next four matches,
        and we'll project where this season ends up.
      </p>

      <Divider />

      {/* Results so far */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-4">The Story So Far</h2>
      <div className="space-y-2 mb-6">
        {matches.map(m => (
          <div key={m.week} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${m.result === 'W' ? 'bg-green-50 border-green-200' : m.result === 'L' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${m.result === 'W' ? 'bg-green-500' : m.result === 'L' ? 'bg-red-500' : 'bg-amber-500'}`}>
              {m.result}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">
                {m.home ? 'vs' : '@'} {m.opponent} <span className="font-mono font-bold">{m.score}</span>
              </p>
              <p className="text-xs text-ink-muted">{m.date} &middot; {m.scorers.length > 0 ? m.scorers.join(', ') : 'No scorers'}</p>
            </div>
            <span className="text-xs text-ink-muted">{m.attendance.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="Points" value={currentRecord.pts} />
        <StatCard label="PPG" value={currentRecord.ppg} />
        <StatCard label="Goals For" value={currentRecord.gf} />
        <StatCard label="Goals Against" value={currentRecord.ga} />
      </div>

      {/* Top performers */}
      <div className="bg-white border border-rule rounded-xl p-5 mb-10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Top Performers</h3>
        {playerStats.map((p, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-rule last:border-0">
            <span className="text-sm font-medium text-ink">{p.name}</span>
            <div className="flex items-center gap-4 text-xs font-mono text-ink-muted">
              <span>{p.goals}G</span>
              <span>{p.assists}A</span>
              <span>{p.minutes}&apos;</span>
              <span className="font-bold text-ink">{p.rating}</span>
            </div>
          </div>
        ))}
      </div>

      <Divider />

      {/* Predict upcoming */}
      <h2 className="font-serif text-2xl font-bold text-ink mb-2">Predict the Next Four</h2>
      <p className="text-ink-light text-sm mb-4">Call each result. We'll project the full season from your picks.</p>

      <div className="space-y-3 mb-6">
        {upcoming.map(u => (
          <div key={u.week} className="bg-white border border-rule rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {u.home ? 'vs' : '@'} {u.opponent}
                  {u.rivalry && <span className="ml-2 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">RIVALRY</span>}
                </p>
                <p className="text-xs text-ink-muted">{u.date} &middot; Week {u.week}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['W', 'D', 'L'].map(result => (
                <button
                  key={result}
                  onClick={() => setPredictions(p => ({ ...p, [u.week]: result }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
                    ${predictions[u.week] === result
                      ? result === 'W' ? 'bg-green-500 text-white' : result === 'L' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                      : 'bg-paper-warm text-ink-muted hover:bg-gray-200'
                    }`}
                >
                  {result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(predictions).length >= 2 && (
        <button
          onClick={() => setShowProjection(true)}
          className="flex items-center gap-2 text-blue-700 font-medium hover:gap-3 transition-all duration-200 mb-6"
        >
          Project the season <ArrowRight size={16} />
        </button>
      )}

      <AnimatePresence>
        {showProjection && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Divider />

            <h2 className="font-serif text-3xl font-bold text-ink mb-2">Season Projection</h2>
            <p className="text-ink-light leading-relaxed mb-6">
              Based on current form ({currentRecord.ppg} PPG) adjusted for your predictions
              ({projection.ppgSoFar} projected PPG over 34 matches):
            </p>

            {/* Big number */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center mb-6">
              <p className="text-sm uppercase tracking-wider text-blue-600 mb-1">Projected Final Points</p>
              <p className="text-5xl font-bold font-mono text-blue-800">{projection.projectedFinal}</p>
              <p className="text-sm text-blue-600 mt-2">
                {projection.projectedFinal >= projection.shieldPace
                  ? 'Supporters\' Shield pace. This would be historic.'
                  : projection.projectedFinal >= projection.playoffLine
                    ? `Above the playoff line (${projection.playoffLine} pts). Postseason bound.`
                    : `Below the typical playoff line of ${projection.playoffLine} pts. Work to do.`}
              </p>
            </div>

            {/* Points chart */}
            <div className="bg-white border border-rule rounded-xl p-5 mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">Points Accumulation</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projection.weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <defs>
                      <linearGradient id="fccGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#003087" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#003087" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#8a8a8a' }} tickLine={false} axisLine={{ stroke: '#d4d0c8' }}
                      tickFormatter={v => `Wk ${v}`} />
                    <YAxis tick={{ fontSize: 11, fill: '#8a8a8a' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v, name) => [`${v} pts`, 'Points']}
                      labelFormatter={l => `Week ${l}`}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #d4d0c8', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}
                    />
                    <Area type="monotone" dataKey="pts" stroke="#003087" strokeWidth={2.5} fill="url(#fccGrad)"
                      dot={{ fill: '#003087', r: 4, stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fan confidence */}
            <div className="bg-white border border-rule rounded-xl p-6 mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Your confidence this team makes the playoffs
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={0} max={100} step={5}
                  value={fanConfidence}
                  onChange={(e) => setFanConfidence(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="font-mono font-bold text-2xl text-ink w-16 text-right">{fanConfidence}%</span>
              </div>
            </div>

            <p className="text-lg text-ink-light leading-relaxed mb-8">
              The World Cup pause this summer will break the rhythm for every MLS club.
              How Cincinnati handles that interruption — holding form, keeping Denkey healthy, integrating
              any summer signings — will determine whether these early-season projections hold or dissolve.
              But for now, the math says this team is in the conversation.
            </p>

            <SaveButton
              label="Save Your Season Projection"
              storyId="fc-cincinnati"
              profileData={{ predictions, projectedFinal: projection.projectedFinal, fanConfidence, currentRecord }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </StoryShell>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
      <p className="text-[10px] uppercase tracking-wide text-blue-600 mb-0.5">{label}</p>
      <p className="text-xl font-bold font-mono text-blue-800">{value}</p>
    </div>
  )
}

function Divider() {
  return <div className="my-10 flex items-center gap-4"><div className="h-px flex-1 bg-rule" /><div className="w-1.5 h-1.5 bg-blue-700 rotate-45" /><div className="h-px flex-1 bg-rule" /></div>
}
