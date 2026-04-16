// Dwell Time Projection Model
// Projects expected reader dwell time for original flat article vs interactive version,
// then translates the delta into reader & advertiser satisfaction scores.

import { countTotalWords } from './readTime'

const WPM = 230
const WORDS_PER_SECOND = WPM / 60 // ~3.833

// Industry benchmarks
const SKIM_FACTOR = 0.60          // readers skim ~60% of flat articles
const MIN_ARTICLE_DWELL = 52      // seconds — industry avg for news articles
const BASE_CPM = 3.50             // standard display CPM ($)
const INTERSTITIAL_DURATION = 3.5 // seconds (matches AdSlot.jsx DURATION)
const RESULT_CARD_VIEW = 8        // estimated seconds viewing result ad

// --- Per-block interaction time estimates (seconds) ---

function inputBlockTime(block) {
  if (!Array.isArray(block.inputs)) return 5
  return block.inputs.reduce((sum, inp) => {
    const t = inp.type
    if (t === 'slider' || t === 'range') return sum + 8
    if (t === 'dropdown' || t === 'radio' || t === 'radio-group') return sum + 5
    if (t === 'checkbox-group' || t === 'multiselect') return sum + 10
    if (t === 'map-select') return sum + 15
    if (t === 'button-array') return sum + 5
    return sum + 5
  }, 0)
}

function quizBlockTime(block) {
  const count = Array.isArray(block.questions) ? block.questions.length : 1
  return count * 12
}

function factCheckTime(block) {
  const count = Array.isArray(block.items) ? block.items.length : 1
  return count * 8
}

function collapsibleTime(block) {
  const count = Array.isArray(block.sections) ? block.sections.length : 1
  return count * 5
}

const BLOCK_TIMES = {
  'chart':            () => 8,
  'stat-dashboard':   () => 6,
  'comparison-table': () => 10,
  'timeline':         () => 12,
  'map':              () => 15,
  'before-after':     () => 6,
  'step-guide':       () => 8,
  'callout-box':      () => 5,
  'counter':          () => 3,
  'inline-image':     () => 4,
  'poll':             () => 10,
  'narrative':        () => 20,
  'ad-interstitial':  () => INTERSTITIAL_DURATION,
  'results':          () => 15,
  'save':             () => 5,
  'pull-quote':       () => 2,
  'info-card':        () => 4,
  'number-grid':      () => 5,
  'progress-bar':     () => 2,
  'ad-result':        () => RESULT_CARD_VIEW,
  'connections':      () => 3,
  // Reading-time blocks — interaction time already in word count
  'hero':             () => 0,
  'article-body':     () => 0,
  'divider':          () => 0,
}

const INTERACTION_BLOCK_TYPES = new Set([
  'input', 'progressive-quiz', 'chart', 'stat-dashboard', 'comparison-table',
  'timeline', 'map', 'before-after', 'fact-check', 'collapsible', 'step-guide',
  'callout-box', 'counter', 'poll', 'narrative', 'results', 'info-card',
  'number-grid', 'progress-bar', 'inline-image',
])

// --- Original article dwell (flat reading) ---

export function computeOriginalDwell(config) {
  const wordCount = countTotalWords(config)
  const readSeconds = wordCount / WORDS_PER_SECOND
  const skimmedSeconds = readSeconds * SKIM_FACTOR
  const totalSeconds = Math.max(skimmedSeconds, MIN_ARTICLE_DWELL)

  return { totalSeconds, readSeconds, skimFactor: SKIM_FACTOR, wordCount }
}

// --- Interactive version dwell (per-block model) ---

export function computeInteractiveDwell(config) {
  const wordCount = countTotalWords(config)
  const readSeconds = wordCount / WORDS_PER_SECOND // full attention, no skim
  const blocks = Array.isArray(config.blocks) ? config.blocks : []
  const sensitivity = config.sensitivity ?? {}

  const blockBreakdown = []
  let interactionSeconds = 0
  const typeSet = new Set()

  for (const block of blocks) {
    const { type } = block
    if (!type) continue
    typeSet.add(type)

    let seconds = 0
    if (type === 'input') {
      seconds = inputBlockTime(block)
    } else if (type === 'progressive-quiz') {
      seconds = quizBlockTime(block)
    } else if (type === 'fact-check') {
      seconds = factCheckTime(block)
    } else if (type === 'collapsible') {
      seconds = collapsibleTime(block)
    } else if (type === 'ad-interstitial') {
      seconds = sensitivity.disableInterstitials ? 0 : INTERSTITIAL_DURATION
    } else if (BLOCK_TIMES[type]) {
      seconds = BLOCK_TIMES[type]()
    }

    if (seconds > 0) {
      blockBreakdown.push({ type, id: block.id || type, seconds })
      interactionSeconds += seconds
    }
  }

  // If no explicit ad-interstitial block but interstitials aren't disabled,
  // the StoryRenderer/BlockRenderer still injects one after inputs complete
  const hasExplicitAd = blocks.some(b => b.type === 'ad-interstitial')
  const hasInputs = blocks.some(b => b.type === 'input' || b.type === 'progressive-quiz')
  if (!hasExplicitAd && hasInputs && !sensitivity.disableInterstitials) {
    blockBreakdown.push({ type: 'ad-interstitial', id: 'auto-interstitial', seconds: INTERSTITIAL_DURATION })
    interactionSeconds += INTERSTITIAL_DURATION
  }

  const interactionBlockCount = blocks.filter(b => INTERACTION_BLOCK_TYPES.has(b.type)).length
  const totalSeconds = readSeconds + interactionSeconds

  return {
    totalSeconds,
    readSeconds,
    interactionSeconds,
    blockBreakdown,
    blockCount: blocks.length,
    interactionBlockCount,
    uniqueBlockTypes: typeSet.size,
  }
}

// --- Satisfaction metrics ---

export function computeSatisfactionMetrics(original, interactive, config) {
  const sensitivity = config?.sensitivity ?? {}
  const dwellMultiplier = original.totalSeconds > 0
    ? interactive.totalSeconds / original.totalSeconds
    : 1

  // Reader Satisfaction (0-100)
  const dwellScore = Math.min(dwellMultiplier / 5, 1) * 40
  const interactionScore = Math.min(interactive.interactionBlockCount / 8, 1) * 30
  const diversityScore = Math.min(interactive.uniqueBlockTypes / 10, 1) * 30
  const readerSatisfaction = Math.round(
    Math.min(Math.max(dwellScore + interactionScore + diversityScore, 0), 100)
  )

  // Advertiser Satisfaction (0-100)
  const adExposureSeconds = (sensitivity.disableInterstitials ? 0 : INTERSTITIAL_DURATION)
    + (sensitivity.disableAds ? 0 : RESULT_CARD_VIEW)
  const advDwellScore = Math.min(interactive.totalSeconds / 300, 1) * 25
  const advExposureScore = Math.min(adExposureSeconds / 20, 1) * 25
  const advDepthScore = Math.min(interactive.interactionBlockCount / 6, 1) * 25
  const activeRatio = interactive.totalSeconds > 0
    ? interactive.interactionSeconds / interactive.totalSeconds
    : 0
  const advAttentionScore = activeRatio * 25
  const advertiserSatisfaction = Math.round(
    Math.min(Math.max(advDwellScore + advExposureScore + advDepthScore + advAttentionScore, 0), 100)
  )

  // CPM uplift
  const bonus = dwellMultiplier * 0.5 + (advertiserSatisfaction / 100) * 2
  const projectedCPM = Math.round(BASE_CPM * (1 + bonus) * 100) / 100
  const cpmUplift = Math.round(((projectedCPM - BASE_CPM) / BASE_CPM) * 100)

  // Ad verification
  const adVerification = {
    interstitialDuration: INTERSTITIAL_DURATION,
    skipAfter: 1.2,
    interstitialEnabled: !sensitivity.disableInterstitials && !sensitivity.disableAds,
    resultCardEnabled: !sensitivity.disableAds,
    adExposureSeconds,
  }

  return {
    dwellMultiplier,
    readerSatisfaction,
    advertiserSatisfaction,
    baseCPM: BASE_CPM,
    projectedCPM,
    cpmUplift,
    adVerification,
  }
}

// --- Master function ---

export function analyzeStory(config) {
  if (!config) {
    return {
      wordCount: 0,
      original: { totalSeconds: 0, readSeconds: 0, skimFactor: SKIM_FACTOR, wordCount: 0 },
      interactive: { totalSeconds: 0, readSeconds: 0, interactionSeconds: 0, blockBreakdown: [], blockCount: 0, interactionBlockCount: 0, uniqueBlockTypes: 0 },
      satisfaction: { dwellMultiplier: 1, readerSatisfaction: 0, advertiserSatisfaction: 0, baseCPM: BASE_CPM, projectedCPM: BASE_CPM, cpmUplift: 0, adVerification: { interstitialDuration: INTERSTITIAL_DURATION, skipAfter: 1.2, interstitialEnabled: true, resultCardEnabled: true, adExposureSeconds: 0 } },
    }
  }

  const wordCount = countTotalWords(config)
  const original = computeOriginalDwell(config)
  const interactive = computeInteractiveDwell(config)
  const satisfaction = computeSatisfactionMetrics(original, interactive, config)

  return { wordCount, original, interactive, satisfaction }
}
