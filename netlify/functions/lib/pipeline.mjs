// Shared pipeline logic for RSS → Story-App processing
// Used by process-invoke.mjs, process-invoke-background.mjs, and process-stories.mjs

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

// ─── Utilities ───────────────────────────────────────────────────────────────

export function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

export function extractFirstImage(html) {
  if (!html) return null
  var match = html.match(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)
  if (match) return match[1]
  match = html.match(/<img[^>]+src="(https?:\/\/[^"]+)"/i)
  if (match) return match[1]
  return null
}

export function parseJson(text) {
  try { return JSON.parse(text) } catch (e) { /* continue */ }
  var match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) return JSON.parse(match[1].trim())
  var objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) return JSON.parse(objMatch[0])
  throw new Error('Could not parse JSON from: ' + text.slice(0, 100))
}

const CATEGORY_COLORS = {
  news: '#dc2626',
  'local-news': '#dc2626',
  sports: '#16a34a',
  entertainment: '#9333ea',
  lifestyle: '#0891b2',
}

// ─── Supabase Client ─────────────────────────────────────────────────────────

export async function sbQuery(url, key, path, method, body) {
  var headers = {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': 'Bearer ' + key,
  }
  if (method === 'POST') headers['Prefer'] = 'resolution=merge-duplicates,return=representation'
  if (method === 'PATCH') headers['Prefer'] = 'return=minimal'
  var res = await fetch(url + '/rest/v1/' + path, {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    var errText = await res.text()
    throw new Error('Supabase ' + method + ' ' + path + ' (' + res.status + '): ' + errText.slice(0, 200))
  }
  var text = await res.text()
  if (!text) return null
  try { return JSON.parse(text) } catch (e) { return null }
}

// ─── Anthropic Client ────────────────────────────────────────────────────────

export async function callAnthropic(apiKey, model, system, userMessage, maxTokens) {
  var response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: userMessage }] }),
  })
  var rawBody = await response.text()
  if (!response.ok) {
    throw new Error('Anthropic API error ' + response.status + ': ' + rawBody.slice(0, 300))
  }
  var data = JSON.parse(rawBody)
  var text = data.content && data.content[0] ? data.content[0].text : ''
  if (!text) throw new Error('Empty response from ' + model)
  return text
}

// ─── Stage 1: Triage ────────────────────────────────────────────────────────

const TRIAGE_SYSTEM = `You evaluate news articles for interactive Story-App potential at WCPO Cincinnati.

A Story-App transforms a news article into an interactive experience that makes the story PERSONALLY RELEVANT to each reader. Consider: does this story have data, locations, or choices that a reader could personalize?

Respond with ONLY a JSON object:
{
  "worthiness_score": 0-100,
  "suggested_app_type": "safety-assessment|impact-calculator|event-planner|data-explorer|eligibility-checker|visit-planner|tracker|community-response|enhanced-article",
  "interactive_angles": "What unique interactive tools would make this story come alive?",
  "key_data_points": ["specific numbers, locations, facts from the article"],
  "skip_reason": "If score < 40, why this story lacks interactive potential"
}`

export async function runTriage(apiKey, item, articleText) {
  var triageText = await callAnthropic(apiKey, 'claude-haiku-4-5-20251001',
    TRIAGE_SYSTEM,
    'HEADLINE: ' + item.title + '\nFEED: ' + (item.feed_name || '') + '\nSUMMARY: ' + (item.description || '').slice(0, 300) + '\nARTICLE: ' + articleText.slice(0, 1500),
    400)
  return parseJson(triageText)
}

// ─── Stage 2: Config Generation ─────────────────────────────────────────────

const CONFIG_SYSTEM = `You are a senior interactive journalist at WCPO Cincinnati. You transform news articles into Story-App configs — JSON specs that a React renderer turns into rich, interactive experiences.

## YOUR MISSION
Create an interactive experience that makes this story PERSONALLY RELEVANT to each reader. Every Story-App must answer: "What does this mean for ME?"

Each story should have UNIQUE interactive tools based on its content. Do NOT produce the same generic "pick neighborhood → see number" for every story. Think creatively:
- A fire safety story → quiz that assesses YOUR home's risk, with specific tips per answer
- A bridge closure story → calculator that estimates YOUR extra commute time and cost
- A sports draft story → let the reader make the pick and see projected outcomes
- A park reopening → plan YOUR visit based on interests and timing
- A school safety report → explore YOUR school district's data vs. city averages
- A food festival → build YOUR itinerary from vendor options and schedule

## CONFIG STRUCTURE

{
  "appType": "safety-assessment|impact-calculator|event-planner|data-explorer|eligibility-checker|visit-planner|tracker|community-response",
  "theme": {
    "accentColor": "#hex matching story tone",
    "categoryLabel": "CATEGORY",
    "icon": "lucide-icon-name"
  },
  "hero": {
    "headline": "Compelling, active headline",
    "subhead": "One clear sentence summarizing the interactive angle",
    "leadParagraphs": [],
    "keyStats": [{"value": "123", "label": "Stat Label", "sub": "Context"}]
  },
  "articleBody": [
    "3-5 paragraphs of editorial journalism from the article. This is the STORY — the context readers need before interacting. Include key facts, quotes, data. Write in newspaper style. Each paragraph should be 2-3 sentences."
  ],
  "storySections": [
    {"heading": "Section Title", "paragraphs": ["paragraph 1", "paragraph 2"]}
  ],
  "inputs": [
    {
      "id": "unique_id",
      "type": "button-array|slider|dropdown|quiz|checkbox-group|radio",
      "label": "Question that makes the reader think about THEIR situation",
      "helpText": "Context that helps them answer honestly",
      "options": [{"id": "opt1", "label": "Display Label", "data": {"key": 123}}],
      "columns": 3
    }
  ],
  "calculations": [
    {
      "id": "calc_id",
      "formula": "inputs.inputId.data.field * 52",
      "format": "currency|round|percent|decimal1|compact"
    }
  ],
  "results": {
    "showAfterInputs": ["input_id_1", "input_id_2"],
    "scoreCards": [{"label": "Your Result", "calcId": "calc_id", "format": "currency", "prefix": "$", "suffix": "/year"}],
    "grade": {
      "calcId": "score",
      "label": "Your Rating",
      "scale": {"A": [90,100], "B": [70,89], "C": [50,69], "D": [30,49], "F": [0,29]},
      "description": "Based on your answers"
    },
    "charts": [
      {
        "type": "area|bar|radar",
        "title": "Chart Title",
        "data": [{"label": "Item", "value": 100}],
        "xKey": "label",
        "yKey": "value",
        "color": "#hex"
      }
    ],
    "actionItems": [
      {"title": "Take Action", "description": "Specific, actionable step", "cta": "Learn More", "ctaUrl": "https://real-url.com"}
    ]
  },
  "narrative": {
    "systemPrompt": "You are a [specific beat] reporter at WCPO Cincinnati. Write 2 paragraphs analyzing the reader's personal results from [this story]. Be specific to their inputs — reference their neighborhood, their score, their choices. Be authoritative but conversational.",
    "profileFields": ["input_and_calc_ids"]
  },
  "poll": {
    "question": "Community poll question that creates collective insight"
  },
  "narrationScript": "50-80 word dramatic audio intro. Start with a hook. Set the scene. End with why this matters to the listener personally."
}

## QUIZ INPUT FORMAT (for safety-assessment type)

For quiz-type inputs, the options array uses "value" and "score" instead of "id" and "data":
{
  "id": "safety_quiz",
  "type": "quiz",
  "label": "Check Your Readiness",
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "helpText": "Context for the question",
      "options": [
        {"label": "Answer A", "value": "a", "score": 3},
        {"label": "Answer B", "value": "b", "score": 1},
        {"label": "Answer C", "value": "c", "score": 0}
      ]
    }
  ]
}

## CRITICAL RULES

1. EVERY input option MUST have a "data" object with numeric values that formulas can reference. Example: {"id": "hyde-park", "label": "Hyde Park", "data": {"risk": 2, "population": 12000}}

2. Use REAL Cincinnati neighborhoods: Price Hill, Over-the-Rhine, Clifton, Hyde Park, Avondale, Northside, Westwood, Madisonville, Mt. Washington, Anderson Twp, Covington, Newport, Ft. Thomas, Florence, Mason, West Chester.

3. Use REAL numbers from the article in formulas and data. Do not invent statistics.

4. The "articleBody" MUST contain the actual journalism — rewrite the key facts from the article in 3-5 paragraphs. This is what gives the story credibility and context before the interactive section.

5. "results.showAfterInputs" MUST list the IDs of inputs that must be completed before results appear. Without this, results show immediately (broken).

6. Action items should include REAL resources: phone numbers, websites, addresses from the article.

7. Charts should visualize data FROM the article — timelines, comparisons, breakdowns.

8. Formula syntax: inputs.id.data.field, inputs.id (for sliders), calculations.other_id. Operators: + - * / () only.

Respond with ONLY the JSON config. No markdown fences, no explanation.`

export async function generateConfig(apiKey, item, articleText, triage) {
  var userMsg = 'Convert this article into a unique interactive Story-App config:\n\n'
    + 'HEADLINE: ' + item.title + '\n'
    + 'AUTHOR: ' + (item.author || 'WCPO Staff') + '\n'
    + 'FEED: ' + (item.feed_name || 'news') + '\n'
    + 'SUGGESTED TYPE: ' + (triage.suggested_app_type || 'data-explorer') + '\n'
    + 'INTERACTIVE ANGLES: ' + (triage.interactive_angles || '') + '\n'
    + 'KEY DATA: ' + JSON.stringify(triage.key_data_points || []) + '\n'
    + '\nFULL ARTICLE TEXT:\n' + articleText.slice(0, 5000)

  var configText = await callAnthropic(apiKey, 'claude-sonnet-4-6', CONFIG_SYSTEM, userMsg, 6000)
  return parseJson(configText)
}

// ─── Stage 3: Sensitivity Analysis ──────────────────────────────────────────

const SENSITIVITY_SYSTEM = 'You are an editorial sensitivity analyst for WCPO Cincinnati. Classify news stories for interactive treatment. Use editorial judgment, not keyword matching.'

const SENSITIVITY_PROMPT_TEMPLATE = `Analyze this news story for sensitivity. Is it about systemic patterns (OK for interactive tools) or individual tragedy (needs sensitive treatment)?

HEADLINE: {headline}
CATEGORY: {category}

STORY TEXT:
{text}

Respond with JSON: { "sensitivityLevel": "low|moderate|high|critical", "designConstraints": { "disableAds": bool, "disableGamification": bool, "disablePolls": bool, "disableInterstitials": bool, "toneOverride": null|"serious"|"somber"|"urgent" }, "flags": [], "reasoning": "..." }`

export async function runSensitivityAnalysis(apiKey, item, articleText) {
  var prompt = SENSITIVITY_PROMPT_TEMPLATE
    .replace('{headline}', item.title)
    .replace('{category}', item.feed_name || 'news')
    .replace('{text}', articleText.slice(0, 3000))

  try {
    var sensText = await callAnthropic(apiKey, 'claude-sonnet-4-6', SENSITIVITY_SYSTEM, prompt, 600)
    return parseJson(sensText)
  } catch (err) {
    console.error('Sensitivity analysis failed: ' + err.message)
    return { sensitivityLevel: 'low', designConstraints: {}, flags: [] }
  }
}

// ─── Full Pipeline: Process One Item ────────────────────────────────────────

export async function processItem(item, apiKey, supabaseUrl, supabaseKey, opts = {}) {
  var articleText = stripHtml(item.content_encoded || item.description || '')
  if (!articleText || articleText.length < 100) {
    return { skipped: true, reason: 'Article too short (' + articleText.length + ' chars)' }
  }

  // Stage 1: Triage (skip if already scored)
  var triage
  if (item.worthiness_score != null) {
    triage = { worthiness_score: item.worthiness_score, suggested_app_type: 'data-explorer', interactive_angles: '', key_data_points: [] }
    console.log('Already scored: ' + item.worthiness_score)
  } else {
    console.log('Running triage...')
    triage = await runTriage(apiKey, item, articleText)
    console.log('Triage score: ' + triage.worthiness_score)
    await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH',
      { worthiness_score: triage.worthiness_score, skip_reason: triage.skip_reason || null }
    ).catch(err => console.error('Score update error:', err.message))
  }

  if (triage.worthiness_score < 30) {
    return { skipped: true, reason: triage.skip_reason || 'Score too low', score: triage.worthiness_score }
  }

  // Stage 2: Config Generation (Sonnet)
  console.log('Generating config with Sonnet...')
  var config = await generateConfig(apiKey, item, articleText, triage)
  console.log('Config parsed, appType: ' + config.appType + ', inputs: ' + (config.inputs ? config.inputs.length : 0))

  // Validate: must have inputs and results
  if (!config.inputs || config.inputs.length === 0) {
    throw new Error('Config has no inputs — Sonnet failed to generate interactivity')
  }
  if (!config.results) config.results = {}
  if (!config.results.showAfterInputs) {
    config.results.showAfterInputs = config.inputs
      .filter(function (inp) { return inp.type !== 'quiz' })
      .map(function (inp) { return inp.id })
  }

  // Stage 3: Sensitivity Analysis (if enabled)
  var sensitivity = { sensitivityLevel: 'low', designConstraints: {}, flags: [] }
  if (!opts.skipSensitivity) {
    sensitivity = await runSensitivityAnalysis(apiKey, item, articleText)
    if (sensitivity.sensitivityLevel === 'high' || sensitivity.sensitivityLevel === 'critical') {
      config.appType = 'community-response'
    }
    config.sensitivity = {
      level: sensitivity.sensitivityLevel,
      ...sensitivity.designConstraints,
      flags: sensitivity.flags,
    }
  }

  // Build story row
  var storyId = slugify(item.title)
  var imageUrl = extractFirstImage(item.content_encoded)
  var narration = config.narrationScript
  if (narration && typeof narration === 'object') narration = narration.intro || narration.text || ''
  if (!narration && config.hero) narration = (config.hero.leadParagraphs || [])[0] || item.description || ''

  var storyRow = {
    rss_item_id: item.id,
    story_id: storyId,
    app_type: config.appType || triage.suggested_app_type,
    status: 'draft',
    config: config,
    headline: (config.hero && config.hero.headline) || item.title,
    subhead: (config.hero && config.hero.subhead) || '',
    category: (item.feed_name || 'news').toUpperCase().replace(/-/g, ' '),
    category_color: CATEGORY_COLORS[item.feed_name] || '#dc2626',
    image_url: imageUrl,
    publish_date: new Date().toISOString().split('T')[0],
    model_used: 'claude-sonnet-4-6',
    narrative_prompt: config.narrative ? config.narrative.systemPrompt : null,
    narration_script: typeof narration === 'string' ? narration.slice(0, 500) : null,
  }

  await sbQuery(supabaseUrl, supabaseKey, 'generated_stories', 'POST', storyRow)
  console.log('SUCCESS: Inserted ' + storyId)

  return {
    skipped: false,
    storyId: storyId,
    appType: config.appType,
    worthiness: triage.worthiness_score,
    sensitivity: sensitivity.sensitivityLevel,
  }
}
