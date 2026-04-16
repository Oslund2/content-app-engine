// Estimate read time from a story config's text content
// Average adult reads ~230 words per minute

const WPM = 230

function countWords(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function countTotalWords(config) {
  if (!config) return 0

  let totalWords = 0

  // Hero text
  if (config.hero) {
    totalWords += countWords(config.hero.headline)
    totalWords += countWords(config.hero.subhead)
    if (Array.isArray(config.hero.leadParagraphs)) {
      config.hero.leadParagraphs.forEach(p => { totalWords += countWords(p) })
    }
  }

  // Blocks
  if (Array.isArray(config.blocks)) {
    config.blocks.forEach(block => {
      if (Array.isArray(block.paragraphs)) {
        block.paragraphs.forEach(p => { totalWords += countWords(p) })
      }
      if (Array.isArray(block.sections)) {
        block.sections.forEach(s => {
          totalWords += countWords(s.heading)
          if (Array.isArray(s.paragraphs)) {
            s.paragraphs.forEach(p => { totalWords += countWords(p) })
          }
        })
      }
      if (Array.isArray(block.items)) {
        block.items.forEach(item => {
          totalWords += countWords(item.claim)
          totalWords += countWords(item.explanation)
          totalWords += countWords(item.title)
          totalWords += countWords(item.description)
        })
      }
      if (Array.isArray(block.steps)) {
        block.steps.forEach(s => {
          totalWords += countWords(s.title)
          totalWords += countWords(s.description)
        })
      }
      if (Array.isArray(block.questions)) {
        block.questions.forEach(q => {
          totalWords += countWords(q.question)
          if (Array.isArray(q.options)) {
            q.options.forEach(o => { totalWords += countWords(o.label) })
          }
        })
      }
      if (Array.isArray(block.paragraphs)) {
        block.paragraphs.forEach(p => { totalWords += countWords(p) })
      }
      totalWords += countWords(block.headline)
      totalWords += countWords(block.subhead)
      totalWords += countWords(block.title)
    })
  }

  // Legacy articleBody
  if (Array.isArray(config.articleBody)) {
    config.articleBody.forEach(p => { totalWords += countWords(p) })
  }

  return totalWords
}

export function estimateReadTime(config) {
  if (!config) return '5 min'

  const totalWords = countTotalWords(config)

  const hasInputs = Array.isArray(config.inputs) && config.inputs.length > 0
  const hasBlockInputs = Array.isArray(config.blocks) && config.blocks.some(b => b.type === 'input' || b.type === 'progressive-quiz')
  const interactionMinutes = (hasInputs || hasBlockInputs) ? 1 : 0

  const readMinutes = Math.ceil(totalWords / WPM) + interactionMinutes
  const clamped = Math.max(2, Math.min(readMinutes, 15))

  return `${clamped} min`
}
