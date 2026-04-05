import { useState, useCallback, useEffect, useMemo, lazy, Suspense, Component } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import HomePage from './HomePage'
import OpeningDayPlanner from './stories/OpeningDayPlanner'
import SafetyExplorer from './stories/SafetyExplorer'
import BridgeImpact from './stories/BridgeImpact'
import SidewalkChecker from './stories/SidewalkChecker'
import SharonLakeExplorer from './stories/SharonLakeExplorer'
import BengalsDraft from './stories/BengalsDraft'
import FCCincinnati from './stories/FCCincinnati'
import StormReady from './stories/StormReady'
import FloodRisk from './stories/FloodRisk'
import FireCrisis from './stories/FireCrisis'
import CarSeatSafety from './stories/CarSeatSafety'
import NeighborhoodPulse from './stories/NeighborhoodPulse'
import CommunityResponse from './stories/CommunityResponse'
import AdminHub from './components/AdminHub'
import { fetchGeneratedStories, fetchGeneratedStoryBySlug, logPageView } from './lib/supabase'

const StoryRenderer = lazy(() => import('./renderer/StoryRenderer'))

// Legacy hand-built story components
const storyComponents = {
  'opening-day': OpeningDayPlanner,
  'safety-survey': SafetyExplorer,
  'bridge-impact': BridgeImpact,
  'sidewalk-repair': SidewalkChecker,
  'sharon-lake': SharonLakeExplorer,
  'bengals-draft': BengalsDraft,
  'fc-cincinnati': FCCincinnati,
  'storm-ready': StormReady,
  'flood-risk': FloodRisk,
  'fire-crisis': FireCrisis,
  'car-seat': CarSeatSafety,
  'neighborhood-pulse': NeighborhoodPulse,
  'community-response': CommunityResponse,
  'admin-hub': AdminHub,
}

// Read URL params once on load
const TopicPage = lazy(() => import('./TopicPage'))

class AppErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Story crash:', error, info.componentStack) }
  render() {
    if (this.state.error) {
      return (
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="font-serif text-2xl font-bold text-ink mb-3">Something went wrong</h2>
          <p className="text-ink-muted mb-4">This story app encountered an error.</p>
          <pre className="text-xs text-left bg-slate-100 rounded-lg p-4 overflow-x-auto text-red-600 mb-4">
            {this.state.error?.message}
          </pre>
          <button onClick={() => { window.history.back() }} className="text-sm font-semibold text-wcpo-red hover:underline">
            Go Back
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function getUrlParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    storyId: params.get('story') || null,
    topicSlug: params.get('topic') || null,
    isEmbed: params.get('embed') === 'true',
  }
}

export default function StoryApp() {
  const urlParams = useMemo(getUrlParams, [])
  const [activeStory, setActiveStory] = useState(urlParams.storyId)
  const [activeTopic, setActiveTopic] = useState(urlParams.topicSlug)
  const [isEmbed] = useState(urlParams.isEmbed)
  const [generatedStories, setGeneratedStories] = useState([])
  const [embedStory, setEmbedStory] = useState(null)
  const [fetchError, setFetchError] = useState(null)

  // Fetch published generated stories on mount
  useEffect(() => {
    fetchGeneratedStories('published')
      .then(setGeneratedStories)
      .catch(err => {
        console.error('Failed to load stories:', err)
        setFetchError('Unable to load stories. Please try again.')
      })
  }, [])

  // For embed/direct-link: if the story isn't in published list and isn't legacy, fetch it by slug
  useEffect(() => {
    if (!activeStory) return
    if (storyComponents[activeStory]) return // legacy
    if (generatedStories.find(s => s.story_id === activeStory)) return // already loaded
    // Try fetching by slug (covers published stories not yet in state)
    fetchGeneratedStoryBySlug(activeStory)
      .then(story => { if (story) setEmbedStory(story) })
      .catch(err => console.error('Failed to load story:', err))
  }, [activeStory, generatedStories])

  // Log page views
  useEffect(() => {
    if (activeStory) logPageView(activeStory, 'view')
  }, [activeStory])

  const openStory = useCallback((id) => {
    setActiveStory(id)
    const url = new URL(window.location)
    url.searchParams.set('story', id)
    window.history.pushState({}, '', url)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const openTopic = useCallback((slug) => {
    setActiveTopic(slug)
    setActiveStory(null)
    const url = new URL(window.location)
    url.searchParams.set('topic', slug)
    url.searchParams.delete('story')
    window.history.pushState({}, '', url)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const goHome = useCallback(() => {
    setActiveStory(null)
    setActiveTopic(null)
    const url = new URL(window.location)
    url.searchParams.delete('story')
    url.searchParams.delete('topic')
    url.searchParams.delete('embed')
    window.history.replaceState({}, '', url.pathname)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const goBackToTopic = useCallback(() => {
    setActiveStory(null)
    const url = new URL(window.location)
    url.searchParams.delete('story')
    window.history.pushState({}, '', url)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Handle browser back/forward
  useEffect(() => {
    const handlePop = () => {
      const { storyId, topicSlug } = getUrlParams()
      setActiveStory(storyId)
      setActiveTopic(topicSlug)
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  // Check if it's a legacy component or a generated story
  const LegacyComponent = activeStory ? storyComponents[activeStory] : null
  const generatedStory = !LegacyComponent && activeStory
    ? generatedStories.find(s => s.story_id === activeStory) || embedStory
    : null

  // Embed mode: just the story/topic, no homepage chrome
  if (isEmbed && !activeStory && !activeTopic) {
    return (
      <div className="flex items-center justify-center min-h-screen text-ink-muted text-sm">
        No story specified. Use ?story=story-id&embed=true or ?topic=topic-slug&embed=true
      </div>
    )
  }

  // Determine the back button behavior for stories
  const storyBackFn = isEmbed ? undefined : (activeTopic ? goBackToTopic : goHome)

  return (
    <div className="min-h-screen bg-paper">
      <AnimatePresence mode="wait">
        {!activeStory && !activeTopic ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <HomePage onOpenStory={openStory} onOpenTopic={openTopic} generatedStories={generatedStories} fetchError={fetchError} onRetry={() => {
              setFetchError(null)
              fetchGeneratedStories('published').then(setGeneratedStories).catch(err => {
                console.error('Retry failed:', err)
                setFetchError('Still unable to load stories. Please check your connection.')
              })
            }} />
          </motion.div>
        ) : !activeStory && activeTopic ? (
          <motion.div
            key={'topic-' + activeTopic}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen gap-2 text-ink-muted">
                <Loader2 size={20} className="animate-spin" /> Loading topic...
              </div>
            }>
              <TopicPage
                topicSlug={activeTopic}
                onBack={isEmbed ? undefined : goHome}
                onOpenStory={openStory}
                isEmbed={isEmbed}
              />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            key={activeStory}
            initial={{ opacity: 0, y: isEmbed ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isEmbed ? 0.2 : 0.4 }}
          >
            {LegacyComponent ? (
              <LegacyComponent onBack={storyBackFn} onOpenStory={openStory} />
            ) : generatedStory ? (
              <AppErrorBoundary>
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen gap-2 text-ink-muted">
                    <Loader2 size={20} className="animate-spin" /> Loading story...
                  </div>
                }>
                  <StoryRenderer
                    config={{
                      ...generatedStory.config,
                      hero: {
                        ...generatedStory.config?.hero,
                        image: generatedStory.config?.hero?.image || generatedStory.image_url || null,
                      },
                    }}
                    storyId={generatedStory.story_id}
                    onBack={storyBackFn}
                    onOpenStory={openStory}
                    sourceAttribution={generatedStory.source_url ? {
                      url: generatedStory.source_url,
                      name: generatedStory.source_name,
                      author: generatedStory.source_author,
                    } : null}
                  />
                </Suspense>
              </AppErrorBoundary>
            ) : (
              <div className="flex items-center justify-center min-h-screen text-ink-muted">
                <Loader2 size={16} className="animate-spin mr-2" /> Loading story...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
