// Normalizes AI-generated configs to match the renderer's expected format.
// Bridges the gap between what Sonnet generates and what InputSection/ResultSection expect.

function normalizeId(str) {
  if (!str) return ''
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function normalizeOption(opt) {
  if (typeof opt === 'string') {
    return { id: normalizeId(opt), label: opt, data: {} }
  }
  if (opt && typeof opt === 'object') {
    // Preserve data if explicitly set; otherwise extract numeric fields as data
    let data = opt.data
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      // Auto-extract numeric fields from the option as data
      data = {}
      for (const [k, v] of Object.entries(opt)) {
        if (typeof v === 'number') data[k] = v
      }
    }
    return {
      id: opt.id || opt.value || normalizeId(opt.label || opt.name || ''),
      label: opt.label || opt.name || opt.id || '',
      data: Object.keys(data).length > 0 ? data : opt,
      // Preserve description for radio/checkbox display
      ...(opt.description ? { description: opt.description } : {}),
    }
  }
  return { id: String(opt), label: String(opt), data: {} }
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
    'buttonArray': 'button-array',
    'buttons': 'button-array',
    'slider': 'slider',
    'range': 'slider',
    'quiz': 'quiz',
    'radio': 'radio',
    'radio-group': 'radio',
    'radioGroup': 'radio',
    'text': 'dropdown', // Fallback: text inputs become dropdowns
  }
  return map[type] || 'button-array'
}

function normalizeQuizQuestion(q) {
  if (!q) return null
  return {
    id: q.id || normalizeId(q.question || ''),
    question: q.question || q.label || '',
    helpText: q.helpText || q.description || '',
    options: (q.options || []).map(opt => ({
      label: opt.label || opt.text || '',
      value: opt.value || opt.id || normalizeId(opt.label || ''),
      score: typeof opt.score === 'number' ? opt.score : 0,
    })),
  }
}

function normalizeInput(input) {
  if (!input) return null
  const type = normalizeInputType(input.type)

  // Text inputs: skip them (we can't render free text in the config renderer)
  if (input.type === 'text' && (!input.options || input.options.length === 0)) return null

  // Quiz inputs have a special structure
  if (type === 'quiz') {
    const questions = (input.questions || []).map(normalizeQuizQuestion).filter(Boolean)
    if (questions.length === 0) return null
    return {
      ...input,
      id: input.id || normalizeId(input.label || 'quiz'),
      type: 'quiz',
      label: input.label || 'Assessment',
      questions,
      helpText: input.helpText || '',
    }
  }

  const options = (input.options || []).map(normalizeOption)

  // Slider: ensure min/max/step
  if (type === 'slider') {
    return {
      ...input,
      id: input.id || normalizeId(input.label || ''),
      type: 'slider',
      label: input.label || input.question || '',
      min: input.min ?? 0,
      max: input.max ?? 100,
      step: input.step ?? 1,
      defaultValue: input.defaultValue ?? input.default ?? input.min ?? 50,
      unit: input.unit || '',
      helpText: input.helpText || input.description || '',
    }
  }

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
    'ranked-list': 'bar',
    'icon-explainer': null,
    'timeline': 'bar',
    'line': 'area',
    'pie': 'bar', // Approximate pie as bar
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
    const strKey = keys.find(k => typeof firstItem[k] === 'string')
    const numKey = keys.find(k => typeof firstItem[k] === 'number')
    if (strKey) xKey = strKey
    if (numKey) yKey = numKey

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

  return {
    label: card.title || card.label || '',
    calcId: card.calcId || card.valueRef || card.calculation || null,
    value: card.value,
    format: card.format || null,
    prefix: card.prefix || '',
    suffix: card.suffix || '',
    description: card.description || '',
    levels: card.levels || card.scoreRanges || null,
  }
}

function normalizeGrade(grade) {
  if (!grade) return null
  return {
    calcId: grade.calcId || grade.valueRef || grade.calculation || null,
    value: grade.value,
    label: grade.label || 'Your Grade',
    description: grade.description || '',
    scale: grade.scale || { A: [90, 100], B: [70, 89], C: [50, 69], D: [30, 49], F: [0, 29] },
    color: grade.color || null,
  }
}

// Normalize inputs within a block's inputs array
function normalizeBlockInputs(block) {
  if (block.type === 'input' && Array.isArray(block.inputs)) {
    return {
      ...block,
      inputs: block.inputs.map(normalizeInput).filter(Boolean),
    }
  }
  // Chart blocks with charts array
  if (block.type === 'chart' && Array.isArray(block.charts)) {
    return {
      ...block,
      charts: block.charts.map(normalizeChart).filter(Boolean),
    }
  }
  // Results blocks
  if (block.type === 'results') {
    const nb = { ...block }
    if (nb.charts) nb.charts = nb.charts.map(normalizeChart).filter(Boolean)
    if (nb.scoreCards) nb.scoreCards = nb.scoreCards.map(normalizeScoreCard).filter(Boolean)
    if (nb.grade) nb.grade = normalizeGrade(nb.grade)
    if (nb.actionItems) {
      nb.actionItems = nb.actionItems.map(item => ({
        title: item.title || item.label || '',
        description: item.description || item.text || '',
        cta: item.cta || item.ctaText || (item.ctaUrl || item.url ? 'Learn More' : null),
        ctaUrl: item.ctaUrl || item.url || null,
      }))
    }
    return nb
  }
  return block
}

export function normalizeConfig(config) {
  if (!config) return config

  const normalized = { ...config }

  // ─── Block-based configs ─────────────────────────────────────────────
  if (Array.isArray(config.blocks) && config.blocks.length > 0) {
    normalized.blocks = config.blocks.map(normalizeBlockInputs)

    // Extract all input IDs from input blocks for showAfterInputs
    const allInputIds = normalized.blocks
      .filter(b => b.type === 'input' && Array.isArray(b.inputs))
      .flatMap(b => b.inputs.map(inp => inp.id))

    // Also collect inputs from progressive-quiz blocks
    normalized.blocks.forEach(b => {
      if (b.type === 'progressive-quiz' && b.id) {
        allInputIds.push(b.id)
      }
    })

    // Build a flat inputs array for ConfigContext (it needs all inputs for state management)
    const flatInputs = normalized.blocks
      .filter(b => b.type === 'input' && Array.isArray(b.inputs))
      .flatMap(b => b.inputs)
    if (flatInputs.length > 0) {
      normalized.inputs = flatInputs
    }

    // Ensure results.showAfterInputs
    if (!normalized.results) normalized.results = {}
    if (!normalized.results.showAfterInputs || normalized.results.showAfterInputs.length === 0) {
      normalized.results.showAfterInputs = allInputIds
    }

    // Ensure calculations at top level
    if (!normalized.calculations && config.results?.calculations) {
      normalized.calculations = config.results.calculations
    }

    // Ensure hero from first hero block (for StoryShell)
    if (!normalized.hero) {
      const heroBlock = normalized.blocks.find(b => b.type === 'hero')
      if (heroBlock) {
        normalized.hero = {
          headline: heroBlock.headline,
          subhead: heroBlock.subhead,
          leadParagraphs: heroBlock.leadParagraphs,
          keyStats: heroBlock.keyStats,
          image: heroBlock.image || config.image || null,
        }
      } else {
        normalized.hero = {
          headline: config.headline || config.title || 'Interactive Story',
          subhead: config.subhead || config.subtitle || '',
          image: config.image || null,
        }
      }
    }
    // Ensure hero.image is preserved if set at top level
    if (!normalized.hero.image && config.hero?.image) {
      normalized.hero.image = config.hero.image
    }

    // Ensure theme
    if (!normalized.theme) {
      normalized.theme = {
        accentColor: config.categoryColor || '#dc2626',
        categoryLabel: config.category || 'NEWS',
      }
    }

    // Normalize narrationScript
    if (config.narrationScript && typeof config.narrationScript === 'object') {
      normalized.narrationScript = config.narrationScript.intro || config.narrationScript.text || ''
    }

    return normalized
  }

  // ─── Legacy configs (backward compatible) ────────────────────────────

  // Normalize inputs
  if (config.inputs) {
    normalized.inputs = config.inputs
      .map(normalizeInput)
      .filter(Boolean)
  }

  // Ensure calculations array exists at top level (some configs nest it)
  if (!normalized.calculations && config.results?.calculations) {
    normalized.calculations = config.results.calculations
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

    // Normalize grade
    if (config.results.grade) {
      normalized.results.grade = normalizeGrade(config.results.grade)
    }

    // Normalize showAfterInputs — make sure referenced inputs exist
    if (normalized.inputs && normalized.inputs.length > 0) {
      if (!config.results.showAfterInputs || config.results.showAfterInputs.length === 0) {
        // Auto-set: require all non-quiz inputs
        normalized.results.showAfterInputs = normalized.inputs
          .filter(i => i.type !== 'quiz')
          .map(i => i.id)
      } else {
        const inputIds = new Set(normalized.inputs.map(i => i.id))
        const valid = config.results.showAfterInputs.filter(id => inputIds.has(id))
        // If none are valid, fall back to all input IDs
        normalized.results.showAfterInputs = valid.length > 0
          ? valid
          : normalized.inputs.filter(i => i.type !== 'quiz').map(i => i.id)
      }
    }

    // Normalize actionItems: ensure consistent shape
    if (config.results.actionItems) {
      normalized.results.actionItems = config.results.actionItems.map(item => ({
        title: item.title || item.label || '',
        description: item.description || item.text || '',
        cta: item.cta || item.ctaText || (item.ctaUrl || item.url ? 'Learn More' : null),
        ctaUrl: item.ctaUrl || item.url || null,
      }))
    }
  }

  // Normalize narrationScript — Sonnet sometimes nests it as an object
  if (config.narrationScript && typeof config.narrationScript === 'object') {
    normalized.narrationScript = config.narrationScript.intro || config.narrationScript.text || ''
  }

  // Ensure hero exists with at least headline
  if (!normalized.hero) {
    normalized.hero = {
      headline: config.headline || config.title || 'Interactive Story',
      subhead: config.subhead || config.subtitle || '',
      image: config.image || null,
    }
  }
  // Ensure hero.image is preserved if set at top level
  if (!normalized.hero.image && config.hero?.image) {
    normalized.hero.image = config.hero.image
  }

  // Ensure theme exists
  if (!normalized.theme) {
    normalized.theme = {
      accentColor: config.categoryColor || '#dc2626',
      categoryLabel: config.category || 'NEWS',
    }
  }

  return normalized
}
