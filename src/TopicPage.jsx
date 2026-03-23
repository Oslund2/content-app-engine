import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Share2, Bookmark, Zap, Clock, ArrowUpRight,
  Loader2, Layers
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
}

export default function TopicPage({ topicSlug, onBack, onOpenStory, isEmbed }) {
  const [topic, setTopic] = useState(null)
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-wcpo-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
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
          </div>
          <div className="flex items-center gap-3 text-white/50">
            <Share2 size={16} className="cursor-pointer hover:text-white transition-colors" />
            <Bookmark size={16} className="cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
      </header>

      {/* Topic Hero */}
      <section
        className="border-b border-rule"
        style={{ backgroundColor: topic.accent_color ? topic.accent_color + '08' : undefined }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Layers size={14} style={{ color: topic.accent_color || '#dc2626' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Deep Dive</span>
              <span className="text-[10px] text-ink-muted">&middot; {stories.length} Interactive Stories</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink leading-tight mb-4">
              {topic.title}
            </h1>

            {topic.subtitle && (
              <p className="text-lg sm:text-xl text-ink-light leading-relaxed max-w-3xl mb-8">
                {topic.subtitle}
              </p>
            )}

            {/* Key Stats */}
            {heroStats.length > 0 && (
              <div
                className={`grid gap-4 ${
                  heroStats.length <= 2 ? 'grid-cols-2' :
                  heroStats.length === 3 ? 'grid-cols-2 sm:grid-cols-3' :
                  'grid-cols-2 sm:grid-cols-4'
                }`}
              >
                {heroStats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                    className="bg-white rounded-xl p-4 border border-rule text-center"
                  >
                    <p className="text-2xl font-bold font-mono text-ink">{stat.value}</p>
                    <p className="text-sm font-semibold text-ink mt-1">{stat.label}</p>
                    {stat.sub && <p className="text-xs text-ink-muted mt-0.5">{stat.sub}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Interactive Timeline */}
        {timelineEvents.length > 0 && (
          <InteractiveTimeline events={timelineEvents} onOpenStory={onOpenStory} />
        )}

        {/* Story-App Grid */}
        {stories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Zap size={14} className="text-wcpo-red" />
              <h2 className="text-xs font-bold tracking-widest uppercase text-ink-muted">Explore the Stories</h2>
              <div className="flex-1 h-px bg-rule" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {stories.map((story, i) => {
                const config = story.config || {}
                const appTypeLabel = APP_TYPE_LABELS[story.app_type] || 'Interactive'

                return (
                  <motion.article
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * i }}
                    onClick={() => onOpenStory?.(story.story_id)}
                    className="group cursor-pointer bg-white rounded-xl border border-rule overflow-hidden hover:shadow-md hover:border-rule-light transition-all"
                  >
                    {/* Image or color bar */}
                    {story.image_url ? (
                      <div
                        className="h-36 bg-cover bg-center relative"
                        style={{ backgroundImage: `url(${story.image_url})` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-2 left-3 flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-white">
                            {appTypeLabel}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-1.5" style={{ backgroundColor: story.category_color || topic.accent_color || '#dc2626' }} />
                    )}

                    <div className="p-5">
                      {!story.image_url && (
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{ backgroundColor: (story.category_color || '#dc2626') + '15', color: story.category_color || '#dc2626' }}
                          >
                            {appTypeLabel}
                          </span>
                          {story.source_url && (
                            <span className="text-[10px] text-ink-muted">External</span>
                          )}
                        </div>
                      )}

                      <h3 className="font-serif text-base font-bold text-ink leading-snug mb-2 group-hover:text-wcpo-red transition-colors">
                        {story.headline || config.hero?.headline || 'Untitled'}
                      </h3>

                      <p className="text-sm text-ink-muted leading-relaxed mb-3 line-clamp-2">
                        {story.subhead || config.hero?.subhead || ''}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-ink-muted">
                          <Clock size={10} /> 5 min
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-wcpo-red opacity-0 group-hover:opacity-100 transition-opacity">
                          Explore <ArrowUpRight size={11} />
                        </span>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </section>
        )}

        {/* Community Poll */}
        {topic.poll_question && (
          <LivePoll storyId={`topic:${topicSlug}`} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-rule py-6 text-center text-xs text-ink-muted">
        <p>A Content-as-an-Application demo &middot; WCPO 9 News &middot; Deep Dive: {topic.title}</p>
      </footer>
    </>
  )
}
