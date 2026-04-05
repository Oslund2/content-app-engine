import { useMemo, Component } from 'react'
import { ConfigProvider, useConfig } from './ConfigContext'
import { normalizeConfig } from './normalizeConfig'
import { estimateReadTime } from '../lib/readTime'
import StoryShell from '../components/StoryShell'
import SaveButton from '../components/SaveButton'
import StoryConnections from '../components/StoryConnections'
import AdSlot from '../components/AdSlot'
import DynamicNarrative from '../components/DynamicNarrative'
import LivePoll from '../components/LivePoll'
import { HeroSection, InputSection, ResultSection, ChartSection } from './sections'
import ArticleBody from './sections/ArticleBody'
import BlockRenderer from './BlockRenderer'

/**
 * Inner component that can access ConfigContext.
 */
function StoryContent({ config, storyId, onBack, onOpenStory, sourceAttribution }) {
  const { allRequiredFilled, getProfileData } = useConfig()
  const isBlockBased = Array.isArray(config.blocks) && config.blocks.length > 0

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
      readTime={config.readTime ?? estimateReadTime(config)}
    >
      {isBlockBased ? (
        /* New block-based rendering */
        <BlockRenderer
          config={config}
          storyId={storyId}
          onBack={onBack}
          onOpenStory={onOpenStory}
          sourceAttribution={sourceAttribution}
        />
      ) : (
        /* Legacy fixed-pipeline rendering (backward compatible) */
        <>
          {/* Hero */}
          <HeroSection hero={config.hero} sourceAttribution={sourceAttribution} />

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
        </>
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
class StoryErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('StoryRenderer crash:', error, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="font-serif text-2xl font-bold text-ink mb-3">Something went wrong</h2>
          <p className="text-ink-muted mb-4">This story app encountered an error while rendering.</p>
          <pre className="text-xs text-left bg-slate-100 rounded-lg p-4 overflow-x-auto text-red-600 mb-4">
            {this.state.error?.message || 'Unknown error'}
          </pre>
          {this.props.onBack && (
            <button onClick={this.props.onBack} className="text-sm font-semibold text-wcpo-red hover:underline">
              Back to WCPO
            </button>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

export default function StoryRenderer({ config, storyId, onBack, onOpenStory, sourceAttribution }) {
  const normalized = useMemo(() => normalizeConfig(config), [config])
  if (!normalized) return null

  return (
    <StoryErrorBoundary onBack={onBack}>
      <ConfigProvider config={normalized}>
        <StoryContent
          config={normalized}
          storyId={storyId}
          onBack={onBack}
          onOpenStory={onOpenStory}
          sourceAttribution={sourceAttribution}
        />
      </ConfigProvider>
    </StoryErrorBoundary>
  )
}
