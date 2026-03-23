import { useMemo } from 'react'
import { ConfigProvider, useConfig } from './ConfigContext'
import { normalizeConfig } from './normalizeConfig'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'
import StoryConnections from '../components/StoryConnections'
import AdSlot from '../components/AdSlot'
import DynamicNarrative from '../components/DynamicNarrative'
import LivePoll from '../components/LivePoll'
import { HeroSection, InputSection, ResultSection, ChartSection } from './sections'
import ArticleBody from './sections/ArticleBody'

/**
 * Inner component that can access ConfigContext.
 */
function StoryContent({ config, storyId, onBack, onOpenStory }) {
  const { allRequiredFilled, getProfileData } = useConfig()

  const profileData = getProfileData()
  const hasInputs = Array.isArray(config.inputs) && config.inputs.length > 0
  const requiredIds = config.results?.showAfterInputs
  const inputsComplete = hasInputs ? allRequiredFilled(requiredIds) : false
  const sensitivity = config.sensitivity ?? {}

  return (
    <StoryShell
      onBack={onBack}
      category={config.theme?.categoryLabel ?? config.category ?? config.hero?.category}
      categoryColor={config.theme?.accentColor ?? config.categoryColor ?? config.hero?.categoryColor}
      headline={config.hero?.headline}
      storyId={storyId}
      timestamp={config.timestamp}
      readTime={config.readTime ?? '5 min'}
    >
      {/* Hero */}
      <HeroSection hero={config.hero} />

      {/* Story body — the journalism, before any interactivity */}
      <ArticleBody config={config} />

      {/* Interactive inputs */}
      <InputSection inputs={config.inputs} />

      {/* Interstitial ad between inputs and results */}
      {inputsComplete && !sensitivity.disableInterstitials && (
        <AdSlot.Interstitial storyId={storyId} onComplete={() => {}} constraints={sensitivity} />
      )}

      {/* Results: score cards, grade, action items */}
      <ResultSection results={config.results} storyId={storyId} />

      {/* Charts */}
      {inputsComplete && (
        <ChartSection charts={config.results?.charts} />
      )}

      {/* AI-generated personalised narrative */}
      {inputsComplete && (
        <DynamicNarrative storyId={storyId} profileData={profileData} />
      )}

      {/* Community live poll */}
      {inputsComplete && config.poll && !sensitivity.disablePolls && (
        <LivePoll storyId={storyId} pollData={profileData} constraints={sensitivity} />
      )}

      {/* Sponsored result card */}
      {inputsComplete && (
        <AdSlot.ResultCard storyId={storyId} constraints={sensitivity} />
      )}

      {/* Save profile */}
      {inputsComplete && (
        <div className="mt-8">
          <SaveButton
            label={config.saveLabel ?? 'Save My Results'}
            storyId={storyId}
            profileData={profileData}
          />
        </div>
      )}

      {/* Cross-story connections */}
      {inputsComplete && (
        <StoryConnections
          storyId={storyId}
          profileData={profileData}
          onOpenStory={onOpenStory}
          configConnections={config.connections}
        />
      )}
    </StoryShell>
  )
}

/**
 * StoryRenderer — config-driven story orchestrator.
 *
 * Usage:
 *   <StoryRenderer config={configObject} storyId="my-story" onBack={() => {}} onOpenStory={(id) => {}} />
 */
export default function StoryRenderer({ config, storyId, onBack, onOpenStory }) {
  const normalized = useMemo(() => normalizeConfig(config), [config])
  if (!normalized) return null

  return (
    <ConfigProvider config={normalized}>
      <StoryContent
        config={normalized}
        storyId={storyId}
        onBack={onBack}
        onOpenStory={onOpenStory}
      />
    </ConfigProvider>
  )
}
