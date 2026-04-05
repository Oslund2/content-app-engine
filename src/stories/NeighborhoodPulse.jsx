import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Users, BarChart3, TrendingUp, ChevronRight,
  Loader2, ArrowRight, CheckCircle2, MapPin, X
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import StoryShell from '../components/StoryShell'
import { fetchAllPollData, fetchMyProfiles, getSessionId } from '../lib/supabase'
import { StoryMap, MapMarker, ChoroplethLayer, MapLegendItem } from '../components/map'
import { neighborhoodPolygons, getNeighborhoodCenter } from '../components/map'

const NEIGHBORHOODS = [
  // West Side
  'West Price Hill',
  'East Price Hill',
  'Westwood',
  'Sayler Park',
  'Sedamsville',
  'North Fairmount',
  'South Fairmount',
  // Central / Basin
  'Downtown / OTR',
  'Pendleton',
  'Mt. Auburn',
  'Camp Washington',
  'West End',
  // Uptown
  'Clifton',
  'Corryville',
  'CUF',
  'Avondale',
  // North
  'Northside',
  'College Hill',
  'Mt. Airy',
  'Winton Place',
  'Spring Grove Village',
  'Carthage',
  'Hartwell',
  'Finneytown',
  // Northeast
  'Bond Hill',
  'Roselawn',
  'Pleasant Ridge',
  'Kennedy Heights',
  'Paddock Hills',
  'Silverton',
  'Deer Park',
  'Norwood',
  // East
  'Walnut Hills',
  'East Walnut Hills',
  'Evanston',
  'Hyde Park',
  'Oakley',
  'Madisonville',
  'Mt. Lookout',
  // Southeast
  'Mt. Washington',
  'Anderson Twp',
  'Columbia Tusculum',
  'Linwood',
  'California',
  // River
  'East End',
  'The Banks',
  // Northern Kentucky
  'Covington (NKY)',
  'Newport (NKY)',
  'Bellevue (NKY)',
  'Dayton (NKY)',
  'Ft. Thomas (NKY)',
  'Highland Heights (NKY)',
  'Cold Spring (NKY)',
  'Alexandria (NKY)',
  'Wilder (NKY)',
  'Fort Wright (NKY)',
  'Park Hills (NKY)',
  'Ludlow (NKY)',
  'Erlanger (NKY)',
  'Independence (NKY)',
  'Villa Hills (NKY)',
  'Crescent Springs (NKY)',
  'Florence (NKY)',
  'Burlington (NKY)',
  'Hebron (NKY)',
  // Outer suburbs
  'Mason / West Chester',
  'Delhi',
  'Cheviot',
  'Mariemont',
]

// Map raw neighborhood values (from polls) to display names
function normalizeNeighborhood(raw) {
  if (!raw || typeof raw !== 'string') return null
  const lower = raw.toLowerCase().replace(/-/g, ' ').trim()
  const map = {
    // Direct matches
    'west price hill': 'West Price Hill',
    'east price hill': 'East Price Hill',
    'price hill': 'West Price Hill',
    'westwood': 'Westwood',
    'sayler park': 'Sayler Park',
    'riverside': 'Sayler Park',
    'sedamsville': 'Sedamsville',
    'north fairmount': 'North Fairmount',
    'south fairmount': 'South Fairmount',
    'downtown': 'Downtown / OTR',
    'downtown otr': 'Downtown / OTR',
    'downtown / otr': 'Downtown / OTR',
    'otr': 'Downtown / OTR',
    'over the rhine': 'Downtown / OTR',
    'pendleton': 'Pendleton',
    'mt. auburn': 'Mt. Auburn',
    'mt auburn': 'Mt. Auburn',
    'mount auburn': 'Mt. Auburn',
    'camp washington': 'Camp Washington',
    'west end': 'West End',
    'clifton': 'Clifton',
    'clifton / cuf': 'Clifton',
    'corryville': 'Corryville',
    'cuf': 'CUF',
    'avondale': 'Avondale',
    'northside': 'Northside',
    'college hill': 'College Hill',
    'mt. airy': 'Mt. Airy',
    'mt airy': 'Mt. Airy',
    'mount airy': 'Mt. Airy',
    'winton place': 'Winton Place',
    'spring grove': 'Spring Grove Village',
    'spring grove village': 'Spring Grove Village',
    'carthage': 'Carthage',
    'hartwell': 'Hartwell',
    'finneytown': 'Finneytown',
    'bond hill': 'Bond Hill',
    'roselawn': 'Roselawn',
    'pleasant ridge': 'Pleasant Ridge',
    'kennedy heights': 'Kennedy Heights',
    'paddock hills': 'Paddock Hills',
    'silverton': 'Silverton',
    'deer park': 'Deer Park',
    'norwood': 'Norwood',
    'walnut hills': 'Walnut Hills',
    'east walnut hills': 'East Walnut Hills',
    'evanston': 'Evanston',
    'hyde park': 'Hyde Park',
    'oakley': 'Oakley',
    'madisonville': 'Madisonville',
    'mt. lookout': 'Mt. Lookout',
    'mt lookout': 'Mt. Lookout',
    'mount lookout': 'Mt. Lookout',
    'mt. washington': 'Mt. Washington',
    'mt washington': 'Mt. Washington',
    'mount washington': 'Mt. Washington',
    'anderson': 'Anderson Twp',
    'anderson twp': 'Anderson Twp',
    'anderson township': 'Anderson Twp',
    'columbia tusculum': 'Columbia Tusculum',
    'linwood': 'Linwood',
    'california': 'California',
    'east end': 'East End',
    'the banks': 'The Banks',
    'covington': 'Covington (NKY)',
    'covington (nky)': 'Covington (NKY)',
    'covington ky': 'Covington (NKY)',
    'newport': 'Newport (NKY)',
    'newport (nky)': 'Newport (NKY)',
    'newport ky': 'Newport (NKY)',
    'bellevue': 'Bellevue (NKY)',
    'bellevue (nky)': 'Bellevue (NKY)',
    'bellevue ky': 'Bellevue (NKY)',
    'dayton ky': 'Dayton (NKY)',
    'dayton (nky)': 'Dayton (NKY)',
    'ft. thomas': 'Ft. Thomas (NKY)',
    'fort thomas': 'Ft. Thomas (NKY)',
    'ft thomas': 'Ft. Thomas (NKY)',
    'highland heights': 'Highland Heights (NKY)',
    'highland heights (nky)': 'Highland Heights (NKY)',
    'cold spring': 'Cold Spring (NKY)',
    'cold spring (nky)': 'Cold Spring (NKY)',
    'alexandria': 'Alexandria (NKY)',
    'alexandria ky': 'Alexandria (NKY)',
    'alexandria (nky)': 'Alexandria (NKY)',
    'wilder': 'Wilder (NKY)',
    'wilder (nky)': 'Wilder (NKY)',
    'fort wright': 'Fort Wright (NKY)',
    'ft. wright': 'Fort Wright (NKY)',
    'ft wright': 'Fort Wright (NKY)',
    'fort wright (nky)': 'Fort Wright (NKY)',
    'park hills': 'Park Hills (NKY)',
    'park hills (nky)': 'Park Hills (NKY)',
    'ludlow': 'Ludlow (NKY)',
    'ludlow (nky)': 'Ludlow (NKY)',
    'erlanger': 'Erlanger (NKY)',
    'erlanger (nky)': 'Erlanger (NKY)',
    'independence': 'Independence (NKY)',
    'independence ky': 'Independence (NKY)',
    'independence (nky)': 'Independence (NKY)',
    'villa hills': 'Villa Hills (NKY)',
    'villa hills (nky)': 'Villa Hills (NKY)',
    'crescent springs': 'Crescent Springs (NKY)',
    'crescent springs (nky)': 'Crescent Springs (NKY)',
    'florence': 'Florence (NKY)',
    'florence (nky)': 'Florence (NKY)',
    'florence ky': 'Florence (NKY)',
    'burlington': 'Burlington (NKY)',
    'burlington ky': 'Burlington (NKY)',
    'burlington (nky)': 'Burlington (NKY)',
    'hebron': 'Hebron (NKY)',
    'hebron (nky)': 'Hebron (NKY)',
    'mason': 'Mason / West Chester',
    'west chester': 'Mason / West Chester',
    'mason / west chester': 'Mason / West Chester',
    'liberty twp': 'Mason / West Chester',
    'liberty township': 'Mason / West Chester',
    'delhi': 'Delhi',
    'cheviot': 'Cheviot',
    'mariemont': 'Mariemont',
    // Common alternate forms
    'westside': 'Westwood',
    'west side': 'Westwood',
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
  const [expandedHood, setExpandedHood] = useState(null)
  const [myHood, setMyHood] = useState(() => localStorage.getItem('wcpo_my_neighborhood') || '')

  const handleSetMyHood = (value) => {
    setMyHood(value)
    if (value) {
      localStorage.setItem('wcpo_my_neighborhood', value)
    } else {
      localStorage.removeItem('wcpo_my_neighborhood')
    }
  }

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
          <p className="text-sm text-ink-muted mb-4">
            Aggregate data from every story, broken down by neighborhood.
          </p>

          {/* Community Engagement Map */}
          <StoryMap
            center={{ lat: 39.1280, lng: -84.5050 }}
            zoom={11.2}
            height={420}
            accentColor="#059669"
            legend={
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-ink uppercase tracking-wider mb-1">Engagement</p>
                <MapLegendItem color="#059669" label="High activity" />
                <MapLegendItem color="#84cc16" label="Moderate" />
                <MapLegendItem color="#fbbf24" label="Low" />
                <MapLegendItem color="#e5e5e5" label="No data" />
                {myHood && <MapLegendItem color="#dc2626" label="Your neighborhood" type="dot" />}
              </div>
            }
          >
            <ChoroplethLayer
              geojson={{
                ...neighborhoodPolygons,
                features: neighborhoodPolygons.features.map(f => {
                  const hoodName = NEIGHBORHOODS.find(n =>
                    f.properties.name === n || f.properties.name.includes(n) || n.includes(f.properties.name)
                  )
                  const count = hoodName ? (neighborhoodStats[hoodName]?.total || 0) : 0
                  const intensity = maxEngagement > 0 ? count / maxEngagement : 0
                  return {
                    ...f,
                    properties: {
                      ...f.properties,
                      _engagementColor: count === 0 ? '#e5e5e5'
                        : intensity > 0.5 ? '#059669'
                        : intensity > 0.2 ? '#84cc16'
                        : '#fbbf24',
                    },
                  }
                }),
              }}
              colorMap={{}}
              dataField="_engagementColor"
              defaultColor="#e5e5e520"
              selectedId={myHood ? (neighborhoodPolygons.features.find(f =>
                f.properties.name === myHood || f.properties.name.includes(myHood) || myHood.includes(f.properties.name)
              )?.properties?.name || '') : ''}
              selectedStrokeColor="#dc2626"
              opacity={0.5}
              id="pulse-engagement"
            />

            {/* Top 5 markers */}
            {leaderboard.filter(l => l.count > 0).map((l, i) => {
              const c = getNeighborhoodCenter(l.name)
              if (!c) return null
              return (
                <MapMarker key={l.name} lat={c.lat} lng={c.lng}
                  color={i === 0 ? '#059669' : '#84cc16'}
                  size={i === 0 ? 'lg' : 'md'}
                  label={`#${i + 1} ${l.name} (${l.count})`}
                />
              )
            })}

            {/* My neighborhood marker */}
            {myHood && (() => {
              const c = getNeighborhoodCenter(myHood)
              return c ? <MapMarker lat={c.lat} lng={c.lng} color="#dc2626" label={myHood} pulse /> : null
            })()}
          </StoryMap>

          {/* My Neighborhood selector */}
          <div className="flex items-center gap-2 mb-6 px-3 py-2.5 bg-paper-warm rounded-lg border border-rule">
            <MapPin size={14} className="text-wcpo-red shrink-0" />
            <span className="text-xs font-semibold text-ink whitespace-nowrap">My Neighborhood:</span>
            <select
              value={myHood}
              onChange={e => handleSetMyHood(e.target.value)}
              className="flex-1 text-xs text-ink bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="">Select yours...</option>
              {NEIGHBORHOODS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {myHood && (
              <button onClick={() => handleSetMyHood('')} className="text-ink-muted hover:text-ink p-0.5">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[...NEIGHBORHOODS].sort((a, b) => {
              // Pinned neighborhood always first
              if (a === myHood) return -1
              if (b === myHood) return 1
              // Then by engagement
              return (neighborhoodStats[b]?.total || 0) - (neighborhoodStats[a]?.total || 0)
            }).map((name, i) => {
              const stats = neighborhoodStats[name]
              const status = getStatusColor(stats)
              const colors = statusColors[status]
              const barWidth = maxEngagement > 0 ? (stats.total / maxEngagement) * 100 : 0
              const isExpanded = expandedHood === name
              const isPinned = name === myHood
              // All stories for this neighborhood, sorted by count
              const allStories = Object.entries(stats.stories)
                .sort((a, b) => b[1] - a[1])
              const topStories = allStories.slice(0, 3)

              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(0.04 * i, 0.8) }}
                  onClick={() => setExpandedHood(isExpanded ? null : name)}
                  className={`rounded-lg border p-4 cursor-pointer transition-all duration-200
                    ${isExpanded
                      ? 'border-emerald-300 shadow-md ring-1 ring-emerald-200 sm:col-span-2 lg:col-span-3 bg-white'
                      : isPinned
                        ? 'border-wcpo-red/30 bg-red-50/40 ring-1 ring-wcpo-red/10 hover:shadow-sm'
                        : 'border-rule bg-white hover:shadow-sm hover:border-slate-300'
                    }`}
                >
                  {isPinned && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-wcpo-red uppercase tracking-wider mb-2">
                      <MapPin size={10} /> Your Neighborhood
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                      <h3 className="font-serif text-sm font-bold text-ink">{name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-muted">{stats.total} {stats.total === 1 ? 'person' : 'people'}</span>
                      <ChevronRight size={12} className={`text-ink-muted transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Collapsed: show top 3 story tags */}
                  {!isExpanded && (
                    <>
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
                    </>
                  )}

                  {/* Expanded: full story-by-story breakdown */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.25 }}
                      className="mt-3"
                    >
                      {allStories.length > 0 ? (
                        <div className="space-y-2.5 mb-4">
                          {allStories.map(([storyId, count]) => {
                            const scores = stats.scores[storyId]
                            const avg = scores && scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
                            const storyBarWidth = stats.total > 0 ? (count / stats.total) * 100 : 0
                            return (
                              <div key={storyId}>
                                <div className="flex items-center justify-between mb-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onOpenStory(storyId) }}
                                    className="text-xs font-semibold text-ink hover:text-emerald-700 transition-colors text-left"
                                  >
                                    {STORY_LABELS[storyId] || STORY_SHORT[storyId] || storyId}
                                  </button>
                                  <div className="flex items-center gap-2">
                                    {avg !== null && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        avg >= 60 ? 'bg-emerald-100 text-emerald-700' :
                                        avg >= 35 ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>
                                        Avg {avg}%
                                      </span>
                                    )}
                                    <span className="text-[10px] text-ink-muted">{count} {count === 1 ? 'response' : 'responses'}</span>
                                  </div>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                    style={{ width: `${storyBarWidth}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-ink-muted italic mb-4">
                          No one from {name} has completed a story yet. Be the first!
                        </p>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onBack() }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                      >
                        Explore stories for {name} <ArrowRight size={12} />
                      </button>
                    </motion.div>
                  )}

                  <div className={`w-full h-1.5 bg-gray-100 rounded-full overflow-hidden ${isExpanded ? 'mt-3' : ''}`}>
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
