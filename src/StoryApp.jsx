import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
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
import { fetchGeneratedStories } from './lib/supabase'

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

export default function StoryApp() {
  const [activeStory, setActiveStory] = useState(null)
  const [generatedStories, setGeneratedStories] = useState([])

  // Fetch published generated stories on mount
  useEffect(() => {
    fetchGeneratedStories('published').then(setGeneratedStories).catch(() => {})
  }, [])

  const openStory = useCallback((id) => {
    setActiveStory(id)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const goHome = useCallback(() => {
    setActiveStory(null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Check if it's a legacy component or a generated story
  const LegacyComponent = activeStory ? storyComponents[activeStory] : null
  const generatedStory = !LegacyComponent && activeStory
    ? generatedStories.find(s => s.story_id === activeStory)
    : null

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {LegacyComponent ? (
              <LegacyComponent onBack={goHome} onOpenStory={openStory} />
            ) : generatedStory ? (
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen gap-2 text-ink-muted">
                  <Loader2 size={20} className="animate-spin" /> Loading story...
                </div>
              }>
                <StoryRenderer
                  config={generatedStory.config}
                  storyId={generatedStory.story_id}
                  onBack={goHome}
                  onOpenStory={openStory}
                />
              </Suspense>
            ) : (
              <div className="flex items-center justify-center min-h-screen text-ink-muted">
                Story not found.
                <button onClick={goHome} className="ml-2 text-wcpo-red underline">Go home</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
