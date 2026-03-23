// Normalizes AI-generated configs to match the renderer's expected format.
// Bridges the gap between what Sonnet generates and what InputSection/ResultSection expect.

function normalizeId(str) {
  if (!str) return ''
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function normalizeOption(opt) {
  if (typeof opt === 'string') {
    return { id: normalizeId(opt), label: opt }
  }
  if (opt && typeof opt === 'object') {
    return {
      id: opt.id || opt.value || normalizeId(opt.label || opt.name || ''),
      label: opt.label || opt.name || opt.id || '',
      data: opt.data || opt,
    }
  }
  return { id: String(opt), label: String(opt) }
}

function normalizeInputType(type) {
  const map = {
    'select': 'dropdown',
    'dropdown': 'dropdown',
    'multiselect': 'checkbox-group',
    'multi-select': 'checkbox-group',
    'checkbox-group': 'checkbox-group',
    'checkbox': 'checkbox-group',
    'button-array': 'button-array',
    'buttons': 'button-array',
    'slider': 'slider',
    'range': 'slider',
    'quiz': 'quiz',
    'radio': 'radio',
    'radio-group': 'radio',
    'text': 'dropdown', // Fallback: text inputs become dropdowns with no options (hidden)
  }
  return map[type] || 'dropdown'
}

function normalizeInput(input) {
  if (!input) return null
  const type = normalizeInputType(input.type)
  const options = (input.options || []).map(normalizeOption)

  // Text inputs: skip them (we can't render free text in the config renderer)
  if (input.type === 'text') return null

  return {
    ...input,
    id: input.id || normalizeId(input.label || ''),
    type,
    label: input.label || input.question || '',
    options,
    columns: input.columns || (options.length <= 4 ? 2 : 3),
    helpText: input.helpText || input.placeholder || input.description || '',
  }
}

function normalizeChart(chart) {
  if (!chart) return null

  // Map non-standard chart types to supported ones
  const typeMap = {
    'area': 'area',
    'bar': 'bar',
    'radar': 'radar',
    'ranked-list': 'bar', // Render ranked lists as bar charts
    'icon-explainer': null, // Skip non-chart types
    'timeline': 'bar',
    'line': 'area',
  }

  const mappedType = typeMap[chart.type]
  if (!mappedType) return null

  let data = chart.data || []
  let xKey = chart.xKey || 'label'
  let yKey = chart.yKey || 'value'

  // If data items don't have the expected keys, try to normalize
  if (data.length > 0 && !data[0][xKey]) {
    const firstItem = data[0]
    const keys = Object.keys(firstItem)
    // Find a string key for x and a number key for y
    const strKey = keys.find(k => typeof firstItem[k] === 'string')
    const numKey = keys.find(k => typeof firstItem[k] === 'number')
    if (strKey) xKey = strKey
    if (numKey) yKey = numKey

    // If still no numeric key, create one from rank/index
    if (!numKey) {
      data = data.map((item, i) => ({ ...item, _value: data.length - i }))
      yKey = '_value'
    }
  }

  return {
    type: mappedType,
    title: chart.title || '',
    data,
    xKey,
    yKey,
    color: chart.color || '#dc2626',
    height: chart.height || 300,
  }
}

function normalizeScoreCard(card) {
  if (!card) return null

  // Handle various scoreCard formats Sonnet might generate
  return {
    label: card.title || card.label || '',
    value: card.value || '',
    description: card.description || '',
    // If it has levels (like HIGH/MODERATE/LOW), store them for display
    levels: card.levels || card.scoreRanges || null,
  }
}

export function normalizeConfig(config) {
  if (!config) return config

  const normalized = { ...config }

  // Normalize inputs
  if (config.inputs) {
    normalized.inputs = config.inputs
      .map(normalizeInput)
      .filter(Boolean) // Remove nulls (skipped text inputs)
  }

  // Normalize results
  if (config.results) {
    normalized.results = { ...config.results }

    // Normalize charts
    if (config.results.charts) {
      normalized.results.charts = config.results.charts
        .map(normalizeChart)
        .filter(Boolean)
    }

    // Normalize scoreCards
    if (config.results.scoreCards) {
      normalized.results.scoreCards = config.results.scoreCards
        .map(normalizeScoreCard)
        .filter(Boolean)
    }

    // Normalize showAfterInputs — make sure referenced inputs exist
    if (config.results.showAfterInputs && normalized.inputs) {
      const inputIds = new Set(normalized.inputs.map(i => i.id))
      normalized.results.showAfterInputs = config.results.showAfterInputs
        .filter(id => inputIds.has(id))
    }
  }

  // Normalize narrationScript — Sonnet sometimes nests it as an object
  if (config.narrationScript && typeof config.narrationScript === 'object') {
    normalized.narrationScript = config.narrationScript.intro || ''
  }

  return normalized
}
