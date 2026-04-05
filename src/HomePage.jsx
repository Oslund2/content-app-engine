import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cloud, Search, Menu, Play, Clock, ChevronRight,
  Circle, Shield, Construction, Trees, ArrowUpRight, Zap,
  MapPin, Thermometer, TrendingUp, Calendar, Archive, Bookmark, Loader2,
  Trophy, CloudLightning, Droplets, Flame, Baby, Activity, Heart, Settings, X
} from 'lucide-react'
import storyData from './storyData.json'
import { fetchStories, fetchStoryDates, fetchMyProfiles, fetchGeneratedStories, fetchTopics, fetchStoriesByTopic } from './lib/supabase'

const storyIcons = {
  baseball: Baseline,
  shield: Shield,
  bridge: Construction,
  construction: Construction,
  trees: Trees,
  football: Trophy,
  soccer: Circle,
  storm: CloudLightning,
  flood: Droplets,
  fire: Flame,
  carseat: Baby,
  pulse: Activity,
  community: Heart,
}

function Baseline() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93c4.08 2.03 6.48 5.72 7.07 10.07" />
      <path d="M19.07 4.93c-4.08 2.03-6.48 5.72-7.07 10.07" />
    </svg>
  )
}

const storyPhotos = {
  'fire-crisis': '/photos/fire.jpg',
  'opening-day': '/photos/baseball.jpg',
  'safety-survey': '/photos/safety.jpg',
  'bridge-impact': '/photos/bridge.jpg',
  'sidewalk-repair': '/photos/sidewalk.jpg',
  'sharon-lake': '/photos/lake.jpg',
  'bengals-draft': '/photos/football.jpg',
  'fc-cincinnati': '/photos/soccer.jpg',
  'storm-ready': '/photos/storm.jpg',
  'flood-risk': '/photos/flood.jpg',
  'car-seat': '/photos/carseat.jpg',
  'neighborhood-pulse': '/photos/safety.jpg',
  'community-response': '/photos/community.jpg',
}

// Map DB rows back to the format our components expect
function dbToStory(row) {
  return {
    id: row.id,
    category: row.category,
    categoryColor: row.category_color,
    headline: row.headline,
    subhead: row.subhead,
    image: row.image,
    photo: storyPhotos[row.id],
    timestamp: formatDate(row.publish_date),
    readTime: row.read_time,
    featured: row.featured,
    publishDate: row.publish_date,
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// Convert generated story rows to display format
function generatedToStory(row) {
  return {
    id: row.story_id,
    category: row.category,
    categoryColor: row.category_color || '#dc2626',
    headline: row.headline,
    subhead: row.subhead || row.config?.hero?.subhead || '',
    image: null,
    photo: row.image_url || null,
    timestamp: formatDate(row.publish_date),
    readTime: '5 min',
    featured: row.featured,
    publishDate: row.publish_date,
    isGenerated: true,
  }
}

// Seeded PRNG for per-visit randomization
function seededShuffle(arr, seed) {
  const shuffled = [...arr]
  let s = seed
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = ((s >>> 0) % (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Fresh seed every page load — every visit gets a different layout
function getPageSeed() {
  return Math.floor(Math.random() * 2147483647)
}

export default function HomePage({ onOpenStory, onOpenTopic, generatedStories = [], fetchError, onRetry }) {
  const { brand } = storyData
  const [allStories, setAllStories] = useState([])
  const [dates, setDates] = useState([])
  const [savedProfiles, setSavedProfiles] = useState([])
  const [topics, setTopics] = useState([])
  const [showArchive, setShowArchive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLive, setShowLive] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [topicStories, setTopicStories] = useState([])
  const [pageSeed] = useState(getPageSeed)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [weather, setWeather] = useState(null)
  const searchRef = useRef(null)

  // Live weather from Open-Meteo (free, no key)
  useEffect(() => {
    const WMO_LABELS = {
      0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Foggy', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Drizzle',
      61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
      71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
      80: 'Showers', 81: 'Showers', 82: 'Heavy Showers',
      85: 'Snow Showers', 86: 'Snow Showers',
      95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
    }
    fetch('https://api.open-meteo.com/v1/forecast?latitude=39.1&longitude=-84.51&current=temperature_2m,weather_code&temperature_unit=fahrenheit')
      .then(r => r.json())
      .then(d => {
        const temp = Math.round(d.current.temperature_2m)
        const label = WMO_LABELS[d.current.weather_code] || 'Partly Cloudy'
        setWeather({ temp, label })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    async function load() {
      const [stories, storyDates, profiles, pubTopics] = await Promise.all([
        fetchStories(),
        fetchStoryDates(),
        fetchMyProfiles(),
        fetchTopics('published'),
      ])
      setAllStories(stories.map(dbToStory))
      setDates(storyDates)
      setSavedProfiles(profiles)
      setTopics(pubTopics)
      // Fetch stories for the most recent topic (for teasers)
      if (pubTopics.length > 0) {
        fetchStoriesByTopic(pubTopics[0].slug).then(setTopicStories).catch(err => console.error('Failed to load topic stories:', err))
      }
      setLoading(false)
    }
    load()
  }, [])

  // Merge legacy stories with generated stories
  const legacyStories = allStories.length > 0 ? allStories : storyData.stories
  const genStories = generatedStories.map(generatedToStory)

  // Combine: legacy stories first (preserving original order), then generated stories mixed in
  const stories = [...legacyStories, ...genStories]

  // Show stories from the last 7 days on the main page; archive is for older
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  const thisWeekCutoff = weekAgo.toISOString().split('T')[0]
  const currentStories = stories.filter(s => !s.publishDate || s.publishDate >= thisWeekCutoff || s.isGenerated)
  const archiveStories = stories.filter(s => s.publishDate && s.publishDate < thisWeekCutoff && !s.isGenerated)
  const archiveDates = dates.filter(d => d < thisWeekCutoff)

  const sportsCategories = ['SPORTS']
  const weatherCategories = ['WEATHER']
  const sponsoredCategories = ['SPONSORED']
  const communityCategories = ['COMMUNITY']
  const newsStories = currentStories.filter(s => !sportsCategories.includes(s.category) && !weatherCategories.includes(s.category) && !sponsoredCategories.includes(s.category) && !communityCategories.includes(s.category))
  const sportsStories = currentStories.filter(s => sportsCategories.includes(s.category))
  const weatherStories = currentStories.filter(s => weatherCategories.includes(s.category))
  const communityStories = currentStories.filter(s => communityCategories.includes(s.category))
  const sponsoredStories = currentStories.filter(s => sponsoredCategories.includes(s.category))

  // Only stories with landscape (4x3-ish) photos can be hero.
  // Portrait/tall images look bad in the side-by-side hero layout.
  const heroEligiblePhotos = new Set([
    'fire-crisis', 'opening-day', 'safety-survey', 'flood-risk',
    'sharon-lake', 'bengals-draft', 'fc-cincinnati', 'football',
    'neighborhood-pulse', 'community-response', 'sidewalk-repair',
    'baseball', 'soccer',
  ])
  // Reject tiny images (headshots/avatars) and known portrait sources from hero
  const isHeroWorthyUrl = (url) => {
    if (!url) return false
    // Filter out tiny images (100px, 60px thumbnails) and square headshots
    if (/[?&](w|s|size|resize)=(60|100|120|150)\b/.test(url)) return false
    if (/\/resize\/\d{2,3}[x/]/.test(url)) return false
    // Filter out obvious headshot/avatar paths
    if (/avatar|headshot|_sq[-.]|profile/i.test(url)) return false
    return true
  }
  const featuredCandidates = currentStories.filter(s => {
    // Legacy stories: must be in the landscape-approved list
    if (storyPhotos[s.id]) return heroEligiblePhotos.has(s.id)
    // Generated stories: must have a hero-worthy photo URL
    if (s.photo && isHeroWorthyUrl(s.photo)) return true
    return false
  })
  const featured = featuredCandidates.length > 0
    ? featuredCandidates[((pageSeed >>> 0) % featuredCandidates.length)]
    : currentStories.find(s => s.headline) || newsStories[0]
  const newsRest = seededShuffle(newsStories.filter(s => s !== featured), pageSeed)
  const sportsRest = seededShuffle(sportsStories.filter(s => s !== featured), pageSeed + 1)
  const weatherRest = seededShuffle(weatherStories.filter(s => s !== featured), pageSeed + 2)
  const communityRest = seededShuffle(communityStories.filter(s => s !== featured), pageSeed + 3)
  const rest = newsRest

  return (
    <>
      {/* === MASTHEAD === */}
      <header className="bg-wcpo-dark text-white">
        <div className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-white/60">
              <span className="flex items-center gap-1"><MapPin size={11} /> Cincinnati, OH</span>
              {weather && (
                <span className="flex items-center gap-1"><Thermometer size={11} /> {weather.temp}°F {weather.label}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showMenu
              ? <X size={22} className="sm:hidden cursor-pointer" onClick={() => setShowMenu(false)} />
              : <Menu size={22} className="sm:hidden cursor-pointer" onClick={() => setShowMenu(true)} />
            }
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">WCPO</span>
                <span className="bg-wcpo-red text-white text-xs font-bold px-2 py-0.5 rounded">9</span>
              </div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 mt-0.5 hidden sm:block">
                {brand.slogan}
              </p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/80">
            <span className="hover:text-white cursor-pointer transition-colors">News</span>
            <span className="hover:text-white cursor-pointer transition-colors">Weather</span>
            <span className="hover:text-white cursor-pointer transition-colors">Sports</span>
            <span className="hover:text-white cursor-pointer transition-colors">Investigates</span>
            <span className="text-wcpo-red font-semibold flex items-center gap-1">
              <Zap size={13} /> Interactive
            </span>
            <span
              onClick={() => onOpenStory('neighborhood-pulse')}
              className="text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer hover:text-emerald-300 transition-colors"
            >
              <Activity size={13} /> Live Pulse
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <Search size={18} className="text-white/60 cursor-pointer hover:text-white" onClick={() => { setSearchOpen(o => !o); setTimeout(() => searchRef.current?.focus(), 100) }} />
            <Settings
              size={18}
              className="text-white/60 cursor-pointer hover:text-white transition-colors"
              onClick={() => onOpenStory('admin-hub')}
            />
            <button
              onClick={() => setShowLive(prev => !prev)}
              className="hidden sm:flex items-center gap-1.5 bg-wcpo-red text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
            >
              <Play size={11} fill="currentColor" /> LIVE
            </button>
          </div>
        </div>

        <div className="bg-wcpo-red/90">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
            <span className="bg-white text-wcpo-red text-[10px] font-extrabold px-2 py-0.5 rounded shrink-0">
              INTERACTIVE
            </span>
            <p className="text-white text-sm font-medium truncate">
              These stories are applications. Click any story to explore it — your way.
            </p>
          </div>
        </div>
      </header>

      {/* === MOBILE MENU DRAWER === */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sm:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowMenu(false)}
            />
            {/* Drawer */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="sm:hidden fixed top-0 left-0 bottom-0 w-72 bg-wcpo-dark z-50 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <span className="text-white text-xl font-extrabold tracking-tight">WCPO</span>
                <X size={22} className="text-white/60 cursor-pointer" onClick={() => setShowMenu(false)} />
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {[
                  { label: 'News', icon: null },
                  { label: 'Weather', icon: null },
                  { label: 'Sports', icon: null },
                  { label: 'Investigates', icon: null },
                ].map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setShowMenu(false)}
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                    className="w-full text-left px-5 py-3.5 text-sm font-medium text-white/80 hover:bg-white/5 active:bg-white/10 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-white/10 my-2" />
                <button
                  type="button"
                  onClick={() => { setShowMenu(false); onOpenStory('neighborhood-pulse') }}
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  className="w-full text-left px-5 py-3.5 text-sm font-semibold text-emerald-400 hover:bg-white/5 active:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Activity size={15} /> Live Pulse
                </button>
                <button
                  type="button"
                  onClick={() => { setShowMenu(false); onOpenStory('admin-hub') }}
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  className="w-full text-left px-5 py-3.5 text-sm font-medium text-white/80 hover:bg-white/5 active:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Settings size={15} /> Publisher Tools
                </button>
                <div className="border-t border-white/10 my-2" />
                <button
                  type="button"
                  onClick={() => { setShowMenu(false); setShowLive(prev => !prev) }}
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  className="w-full text-left px-5 py-3.5 text-sm font-semibold text-wcpo-red hover:bg-white/5 active:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Play size={15} fill="currentColor" /> {showLive ? 'Hide LIVE Stream' : 'Watch LIVE'}
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* === ERROR BANNER === */}
      {fetchError && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-red-700">{fetchError}</p>
            {onRetry && (
              <button onClick={onRetry} className="text-xs font-semibold text-red-700 bg-red-100 px-3 py-1 rounded hover:bg-red-200 transition-colors">
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* === SEARCH BAR === */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-white border-b border-rule"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
              <div className="flex items-center gap-3">
                <Search size={16} className="text-ink-muted shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search stories..."
                  className="flex-1 text-sm text-ink bg-transparent outline-none placeholder:text-ink-muted"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-ink-muted hover:text-ink">
                    <X size={14} />
                  </button>
                )}
                <button onClick={() => { setSearchOpen(false); setSearchQuery('') }} className="text-xs text-ink-muted hover:text-ink">
                  Close
                </button>
              </div>
              {searchQuery.trim().length >= 2 && (() => {
                const q = searchQuery.toLowerCase()
                const matches = currentStories.filter(s =>
                  (s.headline && s.headline.toLowerCase().includes(q))
                  || (s.subhead && s.subhead.toLowerCase().includes(q))
                  || (s.category && s.category.toLowerCase().includes(q))
                )
                return matches.length > 0 ? (
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                    {matches.slice(0, 8).map(s => (
                      <button
                        key={s.id}
                        onClick={() => { onOpenStory(s.id); setSearchOpen(false); setSearchQuery('') }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink line-clamp-1">{s.headline}</p>
                          <p className="text-xs text-ink-muted">{s.category}</p>
                        </div>
                        <ChevronRight size={14} className="text-ink-muted shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-ink-muted">No stories match "{searchQuery}"</p>
                )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === LIVE PLAYER === */}
      <AnimatePresence>
        {showLive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-black"
          >
            <div className="max-w-4xl mx-auto relative">
              <button
                onClick={() => setShowLive(false)}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="aspect-video">
                <iframe
                  src="https://assets.scrippsdigital.com/cms/video/player.html?video=https://content.uplynk.com/channel/d8a0c6e385814acc8c310e2b841ae563.m3u8&live=1&autoplay=true&purl=/live&da=1&poster=https://ewscripps.brightspotcdn.com/a6/13/ee80fd6b460481b06c0756952494/24-sn-1355113946-the-national-report-web-investigative-300x200.png&title=The%20National%20Report&kw=&contplay=*recent&mute=0&cust_params=temp%3D%26weather%3D&paramOverrides=%3Frepl%3Daboi&host=wcpo.com&s=wcpo&env=production&channel=wcpo-main-channel"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="WCPO Live Stream"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === MAIN CONTENT === */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-ink-muted text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading stories...
          </div>
        )}

        {/* Featured Story */}
        {featured && (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => onOpenStory(featured.id)}
            className="group cursor-pointer mb-10"
          >
            <div className={`grid md:grid-cols-2 bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow duration-300 ${featured.category === 'BREAKING' ? 'border-red-300' : 'border-rule'}`}>
              {/* Hero image — always 16:9, never portrait */}
              <div className="aspect-video overflow-hidden">
                <img
                  src={featured.photo || storyPhotos[featured.id]}
                  alt={featured.headline}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  {featured.category === 'BREAKING' && (
                    <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded animate-pulse">BREAKING</span>
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: featured.categoryColor }}>
                    {featured.category === 'BREAKING' ? 'ONGOING CRISIS' : featured.category}
                  </span>
                  <span className="text-xs text-ink-muted">&middot; {featured.readTime}</span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-tight mb-3 group-hover:text-wcpo-red transition-colors">
                  {featured.headline}
                </h1>
                <p className="text-ink-light leading-relaxed mb-4">
                  {featured.subhead}
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-wcpo-red group-hover:gap-3 transition-all">
                  Launch Interactive <ArrowUpRight size={15} />
                </div>
              </div>
            </div>
          </motion.article>
        )}

        {/* Deep Dive Topic — show only the most recent published topic */}
        {topics.length > 0 && topics.slice(0, 1).map(topic => {
          const accent = topic.accent_color || '#dc2626'
          const stats = topic.hero_stats || []
          return (
            <motion.section
              key={topic.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => onOpenTopic?.(topic.slug)}
              className="group cursor-pointer mb-10 -mx-4 sm:-mx-6"
            >
              <div
                className="relative overflow-hidden rounded-none sm:rounded-2xl hover:shadow-xl transition-shadow duration-300"
                style={{ background: `linear-gradient(135deg, ${accent}14 0%, ${accent}06 60%, transparent 100%)` }}
              >
                {/* Top accent bar */}
                <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}60, transparent)` }} />

                <div className="px-6 sm:px-8 py-8 sm:py-10">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Left: text content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="text-[10px] font-extrabold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: `${accent}18`, color: accent }}
                        >
                          Deep Dive
                        </span>
                        <span className="text-[10px] text-ink-muted font-medium">Curated Experience</span>
                      </div>
                      <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-ink leading-tight mb-2 group-hover:text-wcpo-red transition-colors">
                        {topic.title}
                      </h2>
                      {topic.subtitle && (
                        <p className="text-sm sm:text-base text-ink-light leading-relaxed mb-4 max-w-2xl">
                          {topic.subtitle}
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all"
                          style={{ color: accent }}
                        >
                          Explore All Stories <ArrowUpRight size={15} />
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Story-app teasers */}
                  {topicStories.length > 0 && (
                    <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {topicStories.slice(0, 6).map((story, si) => (
                        <div
                          key={story.id}
                          className="bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-sm flex items-start gap-3 hover:bg-white/90 transition-colors"
                          onClick={(e) => { e.stopPropagation(); onOpenStory(story.story_id) }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-sm"
                            style={{ backgroundColor: `${accent}15` }}
                          >
                            {si + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink leading-snug line-clamp-2">
                              {story.headline || story.config?.hero?.headline || 'Story'}
                            </p>
                            {story.source_name && (
                              <p className="text-[10px] text-ink-muted mt-0.5">Source: {story.source_name}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          )
        })}

        {/* Section label */}
        <div className="flex items-center gap-3 mb-6">
          <Zap size={14} className="text-wcpo-red" />
          <h2 className="text-xs font-bold tracking-widest uppercase text-ink-muted">More Interactive Stories</h2>
          <div className="flex-1 h-px bg-rule" />
        </div>

        {/* News Story Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {rest.map((story, i) => (
            <StoryCard
              key={story.id}
              story={story}
              index={i}
              onClick={() => onOpenStory(story.id)}
            />
          ))}
        </div>

        {/* === SPORTS SECTION === */}
        {sportsRest.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Trophy size={14} className="text-orange-600" />
              <h2 className="text-xs font-bold tracking-widest uppercase text-ink-muted">Sports</h2>
              <div className="flex-1 h-px bg-rule" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sportsRest.map((story, i) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  index={i}
                  onClick={() => onOpenStory(story.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* === WEATHER SECTION === */}
        {weatherRest.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <CloudLightning size={14} className="text-violet-600" />
              <h2 className="text-xs font-bold tracking-widest uppercase text-ink-muted">Weather</h2>
              <div className="flex-1 h-px bg-rule" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {weatherRest.map((story, i) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  index={i}
                  onClick={() => onOpenStory(story.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* === COMMUNITY SECTION === */}
        {communityRest.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Activity size={14} className="text-emerald-600" />
              <h2 className="text-xs font-bold tracking-widest uppercase text-ink-muted">Community</h2>
              <div className="flex-1 h-px bg-rule" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {communityRest.map((story, i) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  index={i}
                  onClick={() => onOpenStory(story.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* === SPONSORED SECTION === */}
        {sponsoredStories.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Baby size={14} className="text-cyan-600" />
              <h2 className="text-xs font-bold tracking-widest uppercase text-ink-muted">Sponsored</h2>
              <div className="flex-1 h-px bg-rule" />
              <span className="text-[10px] text-ink-muted border border-rule px-1.5 py-0.5 rounded">Sponsored Content</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sponsoredStories.map((story, i) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  index={i}
                  onClick={() => onOpenStory(story.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* === SAVED PROFILES === */}
        {savedProfiles.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Bookmark size={14} className="text-wcpo-red" />
              <h2 className="text-xs font-bold tracking-widest uppercase text-ink-muted">Your Saved Profiles</h2>
              <div className="flex-1 h-px bg-rule" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProfiles.map((profile) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => onOpenStory(profile.story_id)}
                  className="cursor-pointer bg-white rounded-lg border border-rule p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: profile.stories?.category_color || '#666' }}
                    >
                      {profile.stories?.category || 'Story'}
                    </span>
                    <span className="text-[10px] text-ink-muted">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-serif text-sm font-bold text-ink mb-1 line-clamp-1">
                    {profile.stories?.headline || 'Saved Profile'}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Saved {new Date(profile.created_at).toLocaleString()}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* === ARCHIVE === */}
        {archiveStories.length > 0 && (
          <section className="mt-12">
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="flex items-center gap-3 mb-6 w-full"
            >
              <Archive size={14} className="text-ink-muted" />
              <h2 className="text-xs font-bold tracking-widest uppercase text-ink-muted">Previous Days</h2>
              <div className="flex-1 h-px bg-rule" />
              <ChevronRight size={14} className={`text-ink-muted transition-transform ${showArchive ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showArchive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {archiveDates.map(date => {
                    const dayStories = archiveStories.filter(s => s.publishDate === date)
                    return (
                      <div key={date} className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar size={12} className="text-ink-muted" />
                          <span className="text-xs font-semibold text-ink-muted">{formatDate(date)}</span>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {dayStories.map((story, i) => (
                            <ArchiveCard key={story.id} story={story} onClick={() => onOpenStory(story.id)} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* Ticker */}
        <div className="mt-12 border-t border-rule pt-6">
          <div className="flex items-center gap-4 text-sm text-ink-muted">
            <TrendingUp size={14} className="text-wcpo-red" />
            <span className="font-semibold text-ink text-xs uppercase tracking-wider">Trending in Cincinnati</span>
            <div className="flex-1 flex items-center gap-4 overflow-hidden">
              {['Reds Opening Day Lineup', 'FC Cincinnati Season Preview', 'CVG Airport Expansion', 'OTR Restaurant Week'].map((t, i) => (
                <span key={i} className="shrink-0 text-xs text-ink-light hover:text-wcpo-red cursor-pointer transition-colors">
                  {t} <ChevronRight size={10} className="inline" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* === FOOTER === */}
      <footer className="bg-wcpo-dark text-white/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">WCPO</span>
              <span className="bg-wcpo-red text-white text-[8px] font-bold px-1.5 py-0.5 rounded ml-1.5">9</span>
              <p className="text-xs mt-1">A Scripps Company &middot; Cincinnati, OH</p>
            </div>
            <p className="text-xs">Content-as-an-Application Demo &middot; Not affiliated with WCPO</p>
          </div>
        </div>
      </footer>
    </>
  )
}

function StoryCard({ story, index, onClick }) {
  const iconColors = {
    shield: { bg: 'bg-teal/10', text: 'text-teal' },
    bridge: { bg: 'bg-amber-100', text: 'text-amber-700' },
    construction: { bg: 'bg-purple-100', text: 'text-purple-700' },
    trees: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    football: { bg: 'bg-orange-100', text: 'text-orange-700' },
    soccer: { bg: 'bg-blue-100', text: 'text-blue-700' },
    storm: { bg: 'bg-violet-100', text: 'text-violet-700' },
    flood: { bg: 'bg-sky-100', text: 'text-sky-700' },
    fire: { bg: 'bg-red-100', text: 'text-red-700' },
    carseat: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    pulse: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    community: { bg: 'bg-slate-100', text: 'text-slate-700' },
  }
  const colors = iconColors[story.image] || { bg: 'bg-gray-100', text: 'text-gray-600' }
  const Icon = storyIcons[story.image] || Construction

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 * index }}
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-lg border border-rule overflow-hidden hover:shadow-md hover:border-rule-light transition-all duration-200"
    >
      {/* Photo or color bar */}
      {(story.photo || storyPhotos[story.id]) ? (
        <div
          className="h-36 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${story.photo || storyPhotos[story.id]})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-2 left-3 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-white">
              {story.category}
            </span>
            <span className="text-[10px] text-white/80">{story.readTime}</span>
          </div>
        </div>
      ) : (
        <div className="h-1" style={{ backgroundColor: story.categoryColor }} />
      )}
      <div className="p-5">
        {!(story.photo || storyPhotos[story.id]) && (
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center`}>
            <Icon size={16} className={colors.text} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: story.categoryColor }}>
              {story.category}
            </span>
            <p className="text-[10px] text-ink-muted">{story.readTime}</p>
          </div>
        </div>
        )}
        <h3 className="font-serif text-lg font-bold text-ink leading-snug mb-2 group-hover:text-wcpo-red transition-colors">
          {story.headline}
        </h3>
        <p className="text-sm text-ink-muted leading-relaxed mb-4 line-clamp-2">
          {story.subhead}
        </p>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            <Clock size={10} /> {story.timestamp}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-wcpo-red opacity-0 group-hover:opacity-100 transition-opacity">
            Explore <ArrowUpRight size={11} />
          </span>
        </div>
      </div>
    </motion.article>
  )
}

function ArchiveCard({ story, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white rounded-lg border border-rule p-4 hover:shadow-sm hover:border-rule-light transition-all group"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: story.categoryColor }}>
          {story.category}
        </span>
        <span className="text-[10px] text-ink-muted">&middot; {story.readTime}</span>
      </div>
      <h4 className="font-serif text-sm font-bold text-ink leading-snug group-hover:text-wcpo-red transition-colors">
        {story.headline}
      </h4>
    </div>
  )
}
