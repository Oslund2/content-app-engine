import { motion } from 'framer-motion'
import { useConfig } from './ConfigContext'
import { HeroSection, InputSection, ResultSection, ChartSection } from './sections'
import ArticleBody from './sections/ArticleBody'
import DynamicNarrative from '../components/DynamicNarrative'
import LivePoll from '../components/LivePoll'
import AdSlot from '../components/AdSlot'
import SaveButton from '../components/SaveButton'
import StoryConnections from '../components/StoryConnections'
import {
  StatDashboard,
  Timeline,
  InfoCard,
  ProgressiveQuiz,
  CalloutBox,
  Collapsible,
  ComparisonTable,
  StepGuide,
  FactCheck,
  Divider,
  InlineImage,
  Counter,
  BeforeAfter,
  ProgressBar,
  PullQuote,
  NumberGrid,
  MapBlock,
} from './blocks'

/**
 * BlockRenderer — Renders a blocks[] array where Claude decides the order,
 * mix, and density of content blocks. This replaces the fixed pipeline
 * (Hero → Article → Inputs → Results → Charts) with a composable system.
 *
 * Each block has a `type` field that maps to a component.
 * Some blocks are "input" blocks that gate downstream "gated" blocks.
 */

const blockComponents = {
  'stat-dashboard': StatDashboard,
  'timeline': Timeline,
  'info-card': InfoCard,
  'progressive-quiz': ProgressiveQuiz,
  'callout-box': CalloutBox,
  'collapsible': Collapsible,
  'comparison-table': ComparisonTable,
  'step-guide': StepGuide,
  'fact-check': FactCheck,
  'divider': Divider,
  'inline-image': InlineImage,
  'counter': Counter,
  'before-after': BeforeAfter,
  'progress-bar': ProgressBar,
  'pull-quote': PullQuote,
  'number-grid': NumberGrid,
  'map': MapBlock,
}

function InputBlock({ inputs }) {
  return <InputSection inputs={inputs} />
}

function ResultBlock({ results, storyId }) {
  return <ResultSection results={results} storyId={storyId} />
}

function ChartBlock({ charts }) {
  return <ChartSection charts={charts} />
}

function ArticleBlock({ paragraphs = [], sections = [], image, imageCaption }) {
  // Build a mini-config that ArticleBody expects
  const config = {
    articleBody: paragraphs,
    storySections: sections,
    hero: {},
  }
  return (
    <>
      {image && <InlineImage image={image} caption={imageCaption} />}
      <ArticleBody config={config} />
    </>
  )
}

function HeroBlock({ hero, sourceAttribution }) {
  return <HeroSection hero={hero} sourceAttribution={sourceAttribution} />
}

function NarrativeBlock({ storyId, profileData }) {
  return <DynamicNarrative storyId={storyId} profileData={profileData} />
}

function PollBlock({ storyId, pollData, constraints }) {
  return <LivePoll storyId={storyId} pollData={pollData} constraints={constraints} />
}

export default function BlockRenderer({ config, storyId, onBack, onOpenStory, sourceAttribution }) {
  const { allRequiredFilled, getProfileData, inputState } = useConfig()
  const blocks = config.blocks || []
  const sensitivity = config.sensitivity ?? {}

  // Collect all input IDs from input blocks to determine gating
  const allInputIds = blocks
    .filter(b => b.type === 'input' && Array.isArray(b.inputs))
    .flatMap(b => b.inputs.map(inp => inp.id))

  // Determine what gates "after-interaction" blocks
  const gateIds = config.results?.showAfterInputs || allInputIds
  const inputsComplete = gateIds.length === 0 || allRequiredFilled(gateIds)

  const profileData = getProfileData()

  return (
    <>
      {blocks.map((block, i) => {
        const { type, gated, ...props } = block

        // Gated blocks only show after inputs are complete
        if (gated && !inputsComplete) return null

        // Built-in block types
        const Component = blockComponents[type]
        if (Component) {
          return (
            <motion.div
              key={block.id || `block-${i}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.5) }}
            >
              <Component {...props} />
            </motion.div>
          )
        }

        // Legacy section types mapped to blocks
        switch (type) {
          case 'hero':
            return <HeroBlock key={`block-${i}`} hero={{ ...props, image: props.image || config.hero?.image }} sourceAttribution={sourceAttribution} />

          case 'article-body':
            return <ArticleBlock key={`block-${i}`} paragraphs={props.paragraphs} sections={props.sections} />

          case 'input':
            return <InputBlock key={`block-${i}`} inputs={Array.isArray(props.inputs) ? props.inputs : [props]} />

          case 'results':
            return gated && !inputsComplete ? null : (
              <ResultBlock key={`block-${i}`} results={props} storyId={storyId} />
            )

          case 'chart':
            return gated && !inputsComplete ? null : (
              <ChartBlock key={`block-${i}`} charts={Array.isArray(props.charts) ? props.charts : [props]} />
            )

          case 'narrative':
            return inputsComplete ? (
              <NarrativeBlock key={`block-${i}`} storyId={storyId} profileData={profileData} />
            ) : null

          case 'poll':
            return inputsComplete && !sensitivity.disablePolls ? (
              <PollBlock key={`block-${i}`} storyId={storyId} pollData={profileData} constraints={sensitivity} />
            ) : null

          case 'ad-interstitial':
            return inputsComplete && !sensitivity.disableInterstitials ? (
              <AdSlot.Interstitial key={`block-${i}`} storyId={storyId} onComplete={() => {}} constraints={sensitivity} />
            ) : null

          case 'ad-result':
            return inputsComplete ? (
              <AdSlot.ResultCard key={`block-${i}`} storyId={storyId} constraints={sensitivity} />
            ) : null

          case 'save':
            return inputsComplete ? (
              <div key={`block-${i}`} className="mt-8">
                <SaveButton
                  label={props.label ?? config.saveLabel ?? 'Save My Results'}
                  storyId={storyId}
                  profileData={profileData}
                />
              </div>
            ) : null

          case 'connections':
            return inputsComplete ? (
              <StoryConnections
                key={`block-${i}`}
                storyId={storyId}
                profileData={profileData}
                onOpenStory={onOpenStory}
                configConnections={config.connections}
              />
            ) : null

          default:
            return null
        }
      })}

      {/* Auto-append save + connections if not explicitly in blocks */}
      {inputsComplete && !blocks.some(b => b.type === 'save') && (
        <div className="mt-8">
          <SaveButton
            label={config.saveLabel ?? 'Save My Results'}
            storyId={storyId}
            profileData={profileData}
          />
        </div>
      )}
      {inputsComplete && !blocks.some(b => b.type === 'connections') && (
        <StoryConnections
          storyId={storyId}
          profileData={profileData}
          onOpenStory={onOpenStory}
          configConnections={config.connections}
        />
      )}
    </>
  )
}
