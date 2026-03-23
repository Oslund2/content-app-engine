import { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react'
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
import { fetchGeneratedStories, fetchGeneratedStoryBySlug } from './lib/supabase'

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
function getUrlParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    storyId: params.get('story') || null,
    isEmbed: params.get('embed') === 'true',
  }
}

export default function StoryApp() {
  const urlParams = useMemo(getUrlParams, [])
  const [activeStory, setActiveStory] = useState(urlParams.storyId)
  const [isEmbed] = useState(urlParams.isEmbed)
  const [generatedStories, setGeneratedStories] = useState([])
  const [embedStory, setEmbedStory] = useState(null)

  // Fetch published generated stories on mount
  useEffect(() => {
    fetchGeneratedStories('published').then(setGeneratedStories).catch(() => {})
  }, [])

  // For embed/direct-link: if the story isn't in published list and isn't legacy, fetch it by slug
  useEffect(() => {
    if (!activeStory) return
    if (storyComponents[activeStory]) return // legacy
    if (generatedStories.find(s => s.story_id === activeStory)) return // already loaded
    // Try fetching by slug (covers published stories not yet in state)
    fetchGeneratedStoryBySlug(activeStory).then(story => {
      if (story) setEmbedStory(story)
    }).catch(() => {})
  }, [activeStory, generatedStories])

  const openStory = useCallback((id) => {
    setActiveStory(id)
    // Update URL without reload so embeds and direct links work
    const url = new URL(window.location)
    url.searchParams.set('story', id)
    window.history.pushState({}, '', url)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const goHome = useCallback(() => {
    setActiveStory(null)
    const url = new URL(window.location)
    url.searchParams.delete('story')
    url.searchParams.delete('embed')
    window.history.replaceState({}, '', url.pathname)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Handle browser back/forward
  useEffect(() => {
    const handlePop = () => {
      const { storyId } = getUrlParams()
      setActiveStory(storyId)
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  // Check if it's a legacy component or a generated story
  const LegacyComponent = activeStory ? storyComponents[activeStory] : null
  const generatedStory = !LegacyComponent && activeStory
    ? generatedStories.find(s => s.story_id === activeStory) || embedStory
    : null

  // Embed mode: just the story, no homepage chrome
  if (isEmbed && !activeStory) {
    return (
      <div className="flex items-center justify-center min-h-screen text-ink-muted text-sm">
        No story specified. Use ?story=story-id&embed=true
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <AnimatePresence mode="wait">
        {!activeStory ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <HomePage onOpenStory={openStory} generatedStories={generatedStories} />
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
              <LegacyComponent onBack={isEmbed ? undefined : goHome} onOpenStory={openStory} />
            ) : generatedStory ? (
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen gap-2 text-ink-muted">
                  <Loader2 size={20} className="animate-spin" /> Loading story...
                </div>
              }>
                <StoryRenderer
                  config={generatedStory.config}
                  storyId={generatedStory.story_id}
                  onBack={isEmbed ? undefined : goHome}
                  onOpenStory={openStory}
                />
              </Suspense>
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
