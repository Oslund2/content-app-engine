import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Users, BarChart3, TrendingUp, ChevronRight,
  Loader2, ArrowRight, CheckCircle2, MapPin
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import StoryShell from '../components/StoryShell'
import { fetchAllPollData, fetchMyProfiles, getSessionId } from '../lib/supabase'

const NEIGHBORHOODS = [
  'West Price Hill',
  'Downtown / OTR',
  'Hyde Park',
  'Westwood',
  'Clifton',
  'Northside',
  'Madisonville',
  'Mt. Washington',
  'Covington (NKY)',
  'Newport (NKY)',
  'Anderson Twp',
  'Price Hill',
]

// Map raw neighborhood values (from polls) to display names
// Handles: lowercase slugs, hyphenated, partial matches, alternate names
function normalizeNeighborhood(raw) {
  if (!raw || typeof raw !== 'string') return null
  const lower = raw.toLowerCase().replace(/-/g, ' ').trim()
  const map = {
    'west price hill': 'West Price Hill',
    'price hill': 'Price Hill',
    'east price hill': 'Price Hill',
    'downtown': 'Downtown / OTR',
    'downtown otr': 'Downtown / OTR',
    'downtown / otr': 'Downtown / OTR',
    'otr': 'Downtown / OTR',
    'over the rhine': 'Downtown / OTR',
    'hyde park': 'Hyde Park',
    'westwood': 'Westwood',
    'clifton': 'Clifton',
    'clifton / cuf': 'Clifton',
    'cuf': 'Clifton',
    'northside': 'Northside',
    'madisonville': 'Madisonville',
    'mt. washington': 'Mt. Washington',
    'mt washington': 'Mt. Washington',
    'mount washington': 'Mt. Washington',
    'covington': 'Covington (NKY)',
    'covington (nky)': 'Covington (NKY)',
    'newport': 'Newport (NKY)',
    'newport (nky)': 'Newport (NKY)',
    'anderson': 'Anderson Twp',
    'anderson twp': 'Anderson Twp',
    'anderson township': 'Anderson Twp',
    // Additional Cincinnati neighborhoods → closest grid match
    'spring grove': 'Northside',
    'spring grove village': 'Northside',
    'north fairmount': 'West Price Hill',
    'south fairmount': 'West Price Hill',
    'sedamsville': 'West Price Hill',
    'westside': 'Westwood',
    'west side': 'Westwood',
    'winton place': 'Northside',
    'avondale': 'Madisonville',
    'evanston': 'Madisonville',
    'walnut hills': 'Hyde Park',
    'east walnut hills': 'Hyde Park',
    'mt. auburn': 'Downtown / OTR',
    'mt auburn': 'Downtown / OTR',
    'camp washington': 'Clifton',
    'corryville': 'Clifton',
    'bond hill': 'Northside',
    'roselawn': 'Northside',
    'college hill': 'Northside',
    'carthage': 'Northside',
    'florence': 'Covington (NKY)',
    'ft. thomas': 'Newport (NKY)',
    'fort thomas': 'Newport (NKY)',
    'bellevue': 'Newport (NKY)',
  }
  return map[lower] || null
}

const STORY_LABELS = {
  'fire-crisis': 'Fire Crisis',
  'safety-survey': 'Safety Survey',
  'storm-ready': 'Storm Ready',
  'flood-risk': 'Flood Risk',
  'opening-day': 'Opening Day',
  'bridge-impact': 'Bridge Impact',
  'sidewalk-repair': 'Sidewalk Repair',
  'sharon-lake': 'Sharon Lake',
  'bengals-draft': 'Bengals Draft',
  'fc-cincinnati': 'FC Cincinnati',
  'car-seat': 'Car Seat Safety',
}

function getGradeFromPollData(pollData, storyId) {
  if (!pollData || typeof pollData !== 'object') return null
  // fire-crisis stores score, storm-ready stores readiness score
  if (storyId === 'fire-crisis') {
    const score = pollData.score ?? pollData.grade ?? pollData.total
    if (typeof score === 'number') return score
  }
  if (storyId === 'storm-ready') {
    const score = pollData.score ?? pollData.readiness ?? pollData.total
    if (typeof score === 'number') return score
  }
  // Generic: look for any numeric score
  const score = pollData.score ?? pollData.grade ?? pollData.total ?? pollData.readiness
  if (typeof score === 'number') return score
  return null
}

function gradeLabel(avg) {
  if (avg === null || avg === undefined) return '--'
  if (avg >= 7) return 'A'
  if (avg >= 5) return 'B'
  if (avg >= 3) return 'C'
  return 'D'
}

function getStatusColor(stats) {
  if (stats.total === 0) return 'gray'
  const allScores = Object.values(stats.scores).flat()
  if (allScores.length === 0) return 'gray'
  const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length
  if (avg >= 60) return 'green'
  if (avg >= 35) return 'amber'
  return 'red'
}

const STORY_SHORT = {
  'fire-crisis': 'Fire Safety',
  'storm-ready': 'Storm Ready',
  'safety-survey': 'Safety',
  'flood-risk': 'Flood',
  'bridge-impact': 'Bridge',
  'opening-day': 'Opening Day',
  'bengals-draft': 'Draft',
  'fc-cincinnati': 'FCC',
  'sidewalk-repair': 'Sidewalk',
  'sharon-lake': 'Sharon Lake',
  'car-seat': 'Car Seat',
}

const statusColors = {
  green: { bg: 'bg-emerald-100', ring: 'ring-emerald-400', dot: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-100', ring: 'ring-amber-400', dot: 'bg-amber-500' },
  red: { bg: 'bg-red-100', ring: 'ring-red-400', dot: 'bg-red-500' },
  gray: { bg: 'bg-gray-100', ring: 'ring-gray-300', dot: 'bg-gray-400' },
}

function Divider() {
  return <div className="border-t border-rule my-10" />
}

export default function NeighborhoodPulse({ onBack, onOpenStory }) {
  const [pollData, setPollData] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [polls, myProfiles] = await Promise.all([
        fetchAllPollData(),
        fetchMyProfiles(),
      ])
      setPollData(polls)
      setProfiles(myProfiles)
      setLoading(false)
    }
    load()
  }, [])

  // Aggregate by neighborhood — track which stories have data per neighborhood
  const neighborhoodStats = useMemo(() => {
    const stats = {}
    NEIGHBORHOODS.forEach(n => {
      stats[n] = { total: 0, stories: {}, scores: {} }
    })
    pollData.forEach(row => {
      // Try the neighborhood column first, then fall back to poll_data fields
      const rawHood = row.neighborhood
        || (row.poll_data?.neighborhood && typeof row.poll_data.neighborhood === 'string' ? row.poll_data.neighborhood : null)
        || (row.poll_data?.location && typeof row.poll_data.location === 'string' ? row.poll_data.location : null)
      const hood = normalizeNeighborhood(rawHood)
      if (!hood || !stats[hood]) return
      stats[hood].total += 1
      // Count per story
      stats[hood].stories[row.story_id] = (stats[hood].stories[row.story_id] || 0) + 1
      // Collect numeric scores per story
      const grade = getGradeFromPollData(row.poll_data, row.story_id)
      if (grade !== null) {
        if (!stats[hood].scores[row.story_id]) stats[hood].scores[row.story_id] = []
        stats[hood].scores[row.story_id].push(grade)
      }
    })
    return stats
  }, [pollData])

  const maxEngagement = useMemo(() => {
    return Math.max(1, ...Object.values(neighborhoodStats).map(s => s.total))
  }, [neighborhoodStats])

  // Leaderboard top 5
  const leaderboard = useMemo(() => {
    return NEIGHBORHOODS
      .map(n => ({ name: n, count: neighborhoodStats[n]?.total || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [neighborhoodStats])

  // Story breakdown
  const storyBreakdown = useMemo(() => {
    const counts = {}
    pollData.forEach(row => {
      counts[row.story_id] = (counts[row.story_id] || 0) + 1
    })
    return Object.entries(counts)
      .map(([id, count]) => ({ story: STORY_LABELS[id] || id, count }))
      .sort((a, b) => b.count - a.count)
  }, [pollData])

  // User's personal data
  const userNeighborhood = useMemo(() => {
    if (profiles.length === 0) return null
    // Try to extract neighborhood from profile_data
    for (const p of profiles) {
      const pd = p.profile_data
      if (pd?.neighborhood) return pd.neighborhood
    }
    return null
  }, [profiles])

  const completedStories = useMemo(() => {
    const ids = new Set(profiles.map(p => p.story_id))
    return ids.size
  }, [profiles])

  const totalEngagement = pollData.length

  const hasData = totalEngagement > 0

  return (
    <StoryShell
      onBack={onBack}
      category="COMMUNITY"
      categoryColor="#059669"
      timestamp="Live"
      readTime="Community Dashboard"
      storyId="neighborhood-pulse"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-4">
          The Pulse of Cincinnati
        </h1>
        <p className="text-xl text-ink-light leading-relaxed mb-4">
          Every interaction across every story builds this picture. This is your city — as told by the people who live in it.
        </p>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold">
            <Activity size={16} className="animate-pulse" />
            <span>{totalEngagement.toLocaleString()} total interactions</span>
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-ink-muted text-sm">
          <Loader2 size={18} className="animate-spin" /> Loading community data...
        </div>
      )}

      {!loading && !hasData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-paper-warm rounded-xl border border-rule"
        >
          <Activity size={40} className="mx-auto mb-4 text-emerald-400" />
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">The pulse is waiting</h2>
          <p className="text-ink-light max-w-md mx-auto mb-6">
            Be the first to contribute — complete any story above to add your data to the pulse.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            Explore Stories <ArrowRight size={14} />
          </button>
        </motion.div>
      )}

      {!loading && hasData && (
        <>
          <Divider />

          {/* Neighborhood Grid */}
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Neighborhood Grid</h2>
          <p className="text-sm text-ink-muted mb-6">
            Aggregate data from every story, broken down by neighborhood.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {NEIGHBORHOODS.map((name, i) => {
              const stats = neighborhoodStats[name]
              const status = getStatusColor(stats)
              const colors = statusColors[status]
              const barWidth = maxEngagement > 0 ? (stats.total / maxEngagement) * 100 : 0
              // Get the top 3 stories this neighborhood has data for
              const topStories = Object.entries(stats.stories)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)

              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.04 * i }}
                  className="bg-white rounded-lg border border-rule p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                      <h3 className="font-serif text-sm font-bold text-ink">{name}</h3>
                    </div>
                    <span className="text-xs text-ink-muted">{stats.total} {stats.total === 1 ? 'person' : 'people'}</span>
                  </div>
                  {topStories.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {topStories.map(([storyId, count]) => {
                        const scores = stats.scores[storyId]
                        const avg = scores && scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
                        return (
                          <span key={storyId} className="text-[10px] bg-paper-warm text-ink-muted px-2 py-0.5 rounded border border-rule">
                            {STORY_SHORT[storyId] || storyId}
                            {avg !== null && <span className="font-bold text-ink ml-1">{avg}%</span>}
                            {avg === null && <span className="ml-1">({count})</span>}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-ink-muted mb-3 italic">No interactions yet</p>
                  )}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, delay: 0.04 * i }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>

          <Divider />

          {/* Leaderboard */}
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Most Engaged Neighborhoods</h2>
          <p className="text-sm text-ink-muted mb-6">
            Ranked by total participation count across all stories.
          </p>

          <div className="space-y-3 mb-8">
            {leaderboard.map((item, i) => {
              const barWidth = maxEngagement > 0 ? (item.count / maxEngagement) * 100 : 0
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.08 * i }}
                  className="flex items-center gap-4"
                >
                  <span className="text-lg font-bold text-emerald-600 w-6 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-ink">{item.name}</span>
                      <span className="text-xs text-ink-muted">{item.count}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.7, delay: 0.08 * i }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <Divider />

          {/* Story Breakdown */}
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Story Engagement</h2>
          <p className="text-sm text-ink-muted mb-6">
            Which stories are getting the most interactions?
          </p>

          {storyBreakdown.length > 0 && (
            <div className="bg-white rounded-xl border border-rule p-4 mb-8">
              <ResponsiveContainer width="100%" height={Math.max(200, storyBreakdown.length * 40)}>
                <BarChart data={storyBreakdown} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="story" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value) => [`${value} interactions`, 'Total']}
                  />
                  <Bar dataKey="count" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <Divider />

          {/* Your Neighborhood */}
          {completedStories >= 2 && (
            <>
              <h2 className="font-serif text-2xl font-bold text-ink mb-2">Your Neighborhood</h2>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 mb-8"
              >
                {userNeighborhood && (
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={16} className="text-emerald-600" />
                    <span className="font-semibold text-emerald-800">{userNeighborhood}</span>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-emerald-800 font-medium">
                      You have completed {completedStories} of 11 stories
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold">
                      {Math.round((completedStories / 11) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-emerald-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedStories / 11) * 100}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-emerald-600 rounded-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {profiles.slice(0, 6).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onOpenStory(p.story_id)}
                      className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow border border-emerald-100"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                          {p.stories?.category || 'Completed'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-ink line-clamp-1">
                        {p.stories?.headline || p.story_id}
                      </p>
                    </div>
                  ))}
                </div>

                {completedStories < 11 && (
                  <button
                    onClick={onBack}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                  >
                    Complete more stories <ArrowRight size={14} />
                  </button>
                )}
              </motion.div>
            </>
          )}

          {completedStories < 2 && (
            <div className="bg-paper-warm rounded-xl border border-rule p-6 text-center mb-8">
              <Users size={28} className="mx-auto mb-3 text-emerald-500" />
              <h3 className="font-serif text-lg font-bold text-ink mb-1">Your personal card is almost ready</h3>
              <p className="text-sm text-ink-muted mb-4">
                Complete 2 or more stories to see how your neighborhood compares.
              </p>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Explore Stories <ArrowRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </StoryShell>
  )
}
