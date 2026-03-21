import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cloud, Search, Menu, Play, Clock, ChevronRight,
  Circle, Shield, Construction, Trees, ArrowUpRight, Zap,
  MapPin, Thermometer, TrendingUp, Calendar, Archive, Bookmark, Loader2
} from 'lucide-react'
import storyData from './storyData.json'
import { fetchStories, fetchStoryDates, fetchMyProfiles } from './lib/supabase'

const storyIcons = {
  baseball: Baseline,
  shield: Shield,
  bridge: Construction,
  construction: Construction,
  trees: Trees,
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

// Map DB rows back to the format our components expect
function dbToStory(row) {
  return {
    id: row.id,
    category: row.category,
    categoryColor: row.category_color,
    headline: row.headline,
    subhead: row.subhead,
    image: row.image,
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

export default function HomePage({ onOpenStory }) {
  const { brand } = storyData
  const [allStories, setAllStories] = useState([])
  const [dates, setDates] = useState([])
  const [savedProfiles, setSavedProfiles] = useState([])
  const [showArchive, setShowArchive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [stories, storyDates, profiles] = await Promise.all([
        fetchStories(),
        fetchStoryDates(),
        fetchMyProfiles(),
      ])
      setAllStories(stories.map(dbToStory))
      setDates(storyDates)
      setSavedProfiles(profiles)
      setLoading(false)
    }
    load()
  }, [])

  // Use local JSON as fallback if Supabase hasn't loaded or returned empty
  const stories = allStories.length > 0 ? allStories : storyData.stories
  // Show all this week's stories on the main page; archive is for older weeks
  const thisWeekCutoff = '2026-03-15' // Monday of current week
  const currentStories = stories.filter(s => !s.publishDate || s.publishDate >= thisWeekCutoff)
  const archiveStories = stories.filter(s => s.publishDate && s.publishDate < thisWeekCutoff)
  const archiveDates = dates.filter(d => d < thisWeekCutoff)

  const featured = currentStories.find(s => s.featured) || currentStories[0]
  const rest = currentStories.filter(s => s !== featured)

  return (
    <>
      {/* === MASTHEAD === */}
      <header className="bg-wcpo-dark text-white">
        <div className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-white/60">
              <span className="flex items-center gap-1"><MapPin size={11} /> Cincinnati, OH</span>
              <span className="flex items-center gap-1"><Thermometer size={11} /> 58°F Partly Cloudy</span>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <span>Friday, March 21, 2026</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Menu size={22} className="sm:hidden cursor-pointer" />
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
          </nav>
          <div className="flex items-center gap-3">
            <Search size={18} className="text-white/60 cursor-pointer hover:text-white" />
            <button className="hidden sm:flex items-center gap-1.5 bg-wcpo-red text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-red-700 transition-colors">
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
            <div className="grid md:grid-cols-5 gap-6 bg-white rounded-xl border border-rule overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="md:col-span-3 bg-gradient-to-br from-wcpo-dark to-wcpo-red/80 p-8 sm:p-12 flex flex-col justify-between min-h-[280px] sm:min-h-[340px]">
                <span
                  className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded w-fit"
                  style={{ backgroundColor: (featured.categoryColor || '#c41230') + '33', color: '#fff' }}
                >
                  {featured.category}
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-12 h-12 text-white/30">
                      <Baseline />
                    </div>
                  </div>
                  <p className="text-white/50 text-sm">March 26, 2026 &middot; Great American Ball Park</p>
                </div>
              </div>
              <div className="md:col-span-2 p-6 sm:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: featured.categoryColor }}>
                    {featured.category}
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

        {/* Section label */}
        <div className="flex items-center gap-3 mb-6">
          <Zap size={14} className="text-wcpo-red" />
          <h2 className="text-xs font-bold tracking-widest uppercase text-ink-muted">More Interactive Stories</h2>
          <div className="flex-1 h-px bg-rule" />
        </div>

        {/* Story Grid */}
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
      <div className="h-1" style={{ backgroundColor: story.categoryColor }} />
      <div className="p-5">
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
