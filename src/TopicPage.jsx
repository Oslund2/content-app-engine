import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Share2, Bookmark, Zap, Clock, ArrowUpRight,
  Loader2, Layers, ExternalLink, TrendingUp, ChevronRight
} from 'lucide-react'
import { fetchTopicBySlug, fetchStoriesByTopic } from './lib/supabase'
import InteractiveTimeline from './components/InteractiveTimeline'
import LivePoll from './components/LivePoll'

const APP_TYPE_LABELS = {
  'impact-calculator': 'Calculator',
  'safety-assessment': 'Assessment',
  'event-planner': 'Planner',
  'data-explorer': 'Explorer',
  'eligibility-checker': 'Checker',
  'visit-planner': 'Guide',
  'tracker': 'Tracker',
  'community-response': 'Community',
  'enhanced-article': 'Interactive',
  'investigation': 'Investigation',
}

const APP_TYPE_ICONS = {
  'impact-calculator': '📊',
  'safety-assessment': '🛡️',
  'event-planner': '📅',
  'data-explorer': '🔍',
  'eligibility-checker': '✅',
  'visit-planner': '🗺️',
  'tracker': '📈',
  'community-response': '💬',
  'enhanced-article': '⚡',
  'investigation': '🔎',
}

export default function TopicPage({ topicSlug, onBack, onOpenStory, isEmbed }) {
  const [topic, setTopic] = useState(null)
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    if (!topicSlug) return
    Promise.all([
      fetchTopicBySlug(topicSlug),
      fetchStoriesByTopic(topicSlug),
    ]).then(([t, s]) => {
      setTopic(t)
      setStories(s)
      setLoading(false)
    })
  }, [topicSlug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2 text-ink-muted">
        <Loader2 size={20} className="animate-spin" /> Loading topic...
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="flex items-center justify-center min-h-screen text-ink-muted">
        Topic not found.
        {onBack && <button onClick={onBack} className="ml-2 text-wcpo-red underline">Go home</button>}
      </div>
    )
  }

  const heroStats = topic.hero_stats || []
  const timelineEvents = topic.timeline_events || []
  const accent = topic.accent_color || '#dc2626'

  // Collect unique app types for filter tabs
  const appTypes = [...new Set(stories.map(s => s.app_type).filter(Boolean))]
  const filteredStories = activeFilter === 'all'
    ? stories
    : stories.filter(s => s.app_type === activeFilter)

  // Featured story = first story or one with an image
  const featured = stories.find(s => s.image_url) || stories[0]
  const rest = filteredStories.filter(s => s !== featured)

  // Unique sources for attribution bar
  const sources = [...new Set(stories.map(s => s.source_name).filter(Boolean))]

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Compact Header ─── */}
      <header className="sticky top-0 z-50 bg-wcpo-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to WCPO</span>
            </button>
          ) : <div className="w-20" />}
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-white tracking-tight">WCPO</span>
            <span className="bg-wcpo-red text-white text-[8px] font-bold px-1.5 py-0.5 rounded">9</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-2 hidden sm:block">Deep Dive</span>
          </div>
          <div className="flex items-center gap-3 text-white/50">
            <Share2 size={16} className="cursor-pointer hover:text-white transition-colors" />
            <Bookmark size={16} className="cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
      </header>

      {/* ─── Full-Width Hero Banner ─── */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accent}12 0%, ${accent}04 50%, transparent 100%)` }}
      >
        {/* Accent bar at very top */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}80, transparent)` }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="py-12 sm:py-16 lg:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-4xl"
            >
              {/* Topic badge */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${accent}15` }}
                >
                  <Layers size={18} style={{ color: accent }} />
                </div>
                <div>
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
                    style={{ color: accent }}
                  >
                    Deep Dive
                  </span>
                  <p className="text-xs text-ink-muted">
                    {stories.length} Interactive {stories.length === 1 ? 'Story' : 'Stories'}
                    {sources.length > 0 && <> &middot; {sources.length} {sources.length === 1 ? 'Source' : 'Sources'}</>}
                  </p>
                </div>
              </div>

              {/* Title */}
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink leading-[1.1] mb-5">
                {topic.title}
              </h1>

              {/* Subtitle */}
              {topic.subtitle && (
                <p className="text-lg sm:text-xl text-ink-light leading-relaxed max-w-3xl mb-8">
                  {topic.subtitle}
                </p>
              )}

              {/* Key Stats — floating cards */}
              {heroStats.length > 0 && (
                <div
                  className={`grid gap-4 ${
                    heroStats.length <= 2 ? 'grid-cols-2 max-w-md' :
                    heroStats.length === 3 ? 'grid-cols-3 max-w-2xl' :
                    'grid-cols-2 sm:grid-cols-4 max-w-3xl'
                  }`}
                >
                  {heroStats.map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-rule shadow-sm"
                    >
                      <p
                        className="text-3xl font-bold font-mono"
                        style={{ color: accent }}
                      >
                        {stat.value}
                      </p>
                      <p className="text-sm font-semibold text-ink mt-1">{stat.label}</p>
                      {stat.sub && <p className="text-[10px] text-ink-muted mt-0.5">{stat.sub}</p>}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Decorative bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rule to-transparent" />
      </section>

      {/* ─── Sources Attribution Bar ─── */}
      {sources.length > 0 && (
        <div className="border-b border-rule bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 text-xs text-ink-muted overflow-x-auto">
            <ExternalLink size={12} className="shrink-0" />
            <span className="shrink-0 font-medium text-ink">Sources:</span>
            {sources.map((src, i) => (
              <span key={src} className="shrink-0">
                {src}{i < sources.length - 1 ? <span className="mx-1">&middot;</span> : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* ─── Interactive Timeline ─── */}
        {timelineEvents.length > 0 && (
          <section className="mb-12">
            <InteractiveTimeline events={timelineEvents} onOpenStory={onOpenStory} />
          </section>
        )}

        {/* ─── Featured Story (large card) ─── */}
        {featured && (
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => onOpenStory?.(featured.story_id)}
            className="group cursor-pointer mb-10"
          >
            <div className="grid md:grid-cols-5 bg-white rounded-2xl border border-rule overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Image / colored panel */}
              {featured.image_url ? (
                <div
                  className="md:col-span-2 h-56 md:h-auto bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${featured.image_url})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 to-transparent" />
                </div>
              ) : (
                <div
                  className="md:col-span-2 h-56 md:h-auto relative flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${accent}20, ${accent}08)` }}
                >
                  <span className="text-6xl opacity-30">{APP_TYPE_ICONS[featured.app_type] || '⚡'}</span>
                </div>
              )}
              <div className="md:col-span-3 p-6 sm:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${accent}15`, color: accent }}
                  >
                    {APP_TYPE_LABELS[featured.app_type] || 'Interactive'}
                  </span>
                  {featured.source_name && (
                    <span className="text-[10px] text-ink-muted flex items-center gap-1">
                      <ExternalLink size={9} /> {featured.source_name}
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-tight mb-3 group-hover:text-wcpo-red transition-colors">
                  {featured.headline || featured.config?.hero?.headline || 'Untitled'}
                </h2>
                <p className="text-ink-light leading-relaxed mb-4 line-clamp-3">
                  {featured.subhead || featured.config?.hero?.subhead || ''}
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all" style={{ color: accent }}>
                  Launch Interactive <ArrowUpRight size={15} />
                </div>
              </div>
            </div>
          </motion.article>
        )}

        {/* ─── Filter Tabs ─── */}
        {appTypes.length > 1 && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'bg-ink text-white'
                  : 'bg-slate-100 text-ink-muted hover:bg-slate-200'
              }`}
            >
              All Stories
            </button>
            {appTypes.map(type => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === type
                    ? 'text-white'
                    : 'bg-slate-100 text-ink-muted hover:bg-slate-200'
                }`}
                style={activeFilter === type ? { backgroundColor: accent } : undefined}
              >
                {APP_TYPE_LABELS[type] || type}
              </button>
            ))}
          </div>
        )}

        {/* ─── Story Grid ─── */}
        {rest.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Zap size={14} style={{ color: accent }} />
              <h2 className="text-xs font-bold tracking-widest uppercase text-ink-muted">Explore &amp; Interact</h2>
              <div className="flex-1 h-px bg-rule" />
              <span className="text-xs text-ink-muted">{filteredStories.length} stories</span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {rest.map((story, i) => {
                  const config = story.config || {}
                  const appTypeLabel = APP_TYPE_LABELS[story.app_type] || 'Interactive'
                  const emoji = APP_TYPE_ICONS[story.app_type] || '⚡'

                  return (
                    <motion.article
                      key={story.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: 0.05 * i }}
                      onClick={() => onOpenStory?.(story.story_id)}
                      className="group cursor-pointer bg-white rounded-xl border border-rule overflow-hidden hover:shadow-md transition-all"
                    >
                      {/* Image or styled header */}
                      {story.image_url ? (
                        <div
                          className="h-40 bg-cover bg-center relative"
                          style={{ backgroundImage: `url(${story.image_url})` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
                              {appTypeLabel}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="h-28 relative flex items-end p-4"
                          style={{ background: `linear-gradient(135deg, ${accent}18, ${accent}06)` }}
                        >
                          <span className="absolute top-3 right-4 text-3xl opacity-20">{emoji}</span>
                          <span
                            className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${accent}20`, color: accent }}
                          >
                            {appTypeLabel}
                          </span>
                        </div>
                      )}

                      <div className="p-5">
                        <h3 className="font-serif text-base font-bold text-ink leading-snug mb-2 group-hover:text-wcpo-red transition-colors">
                          {story.headline || config.hero?.headline || 'Untitled'}
                        </h3>

                        <p className="text-sm text-ink-muted leading-relaxed mb-4 line-clamp-2">
                          {story.subhead || config.hero?.subhead || ''}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-ink-muted">
                              <Clock size={10} /> 5 min
                            </span>
                            {story.source_name && (
                              <span className="text-[10px] text-ink-muted flex items-center gap-1">
                                <ExternalLink size={8} /> {story.source_name}
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }}>
                            Explore <ArrowUpRight size={11} />
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  )
                })}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* ─── Community Poll ─── */}
        {topic.poll_question && (
          <section className="mb-12">
            <LivePoll storyId={`topic:${topicSlug}`} />
          </section>
        )}

        {/* ─── Related / CTA ─── */}
        {onBack && (
          <div className="text-center py-8">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              <ChevronRight size={14} className="rotate-180" />
              Explore more stories on WCPO
            </button>
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-rule bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-ink tracking-tight">WCPO</span>
            <span className="bg-wcpo-red text-white text-[7px] font-bold px-1.5 py-0.5 rounded">9</span>
          </div>
          <p className="text-xs text-ink-muted text-center">
            Content-as-an-Application &middot; Deep Dive: {topic.title}
            {sources.length > 0 && <> &middot; Sources: {sources.join(', ')}</>}
          </p>
        </div>
      </footer>
    </div>
  )
}
