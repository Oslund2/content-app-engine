import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
import SensitivityAdmin from './components/SensitivityAdmin'

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
  'admin-sensitivity': SensitivityAdmin,
}

export default function StoryApp() {
  const [activeStory, setActiveStory] = useState(null)

  const openStory = useCallback((id) => {
    setActiveStory(id)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const goHome = useCallback(() => {
    setActiveStory(null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Ctrl+Shift+S opens sensitivity admin
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        openStory('admin-sensitivity')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openStory])

  const StoryComponent = activeStory ? storyComponents[activeStory] : null

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
            <HomePage onOpenStory={openStory} />
          </motion.div>
        ) : (
          <motion.div
            key={activeStory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {StoryComponent && <StoryComponent onBack={goHome} onOpenStory={openStory} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
