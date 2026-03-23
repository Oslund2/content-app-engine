// Netlify scheduled function — AI story processing pipeline
// Picks unprocessed RSS items, runs 3-stage pipeline: triage → config generation → sensitivity analysis

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

// Stage 1: Triage prompt (Haiku — fast and cheap)
const TRIAGE_PROMPT = `You are an editorial analyst for WCPO Cincinnati, a local news organization that converts news stories into interactive web applications.

Your job: evaluate whether this news article has enough substance and data to become an interactive Story-App — a calculator, quiz, planner, data explorer, eligibility checker, or similar interactive tool.

## App Types Available
- "safety-assessment": Quiz → score → grade → personalized action items (e.g. fire safety check, storm readiness)
- "impact-calculator": User inputs → formula-based calculation → cost/time/impact results with charts (e.g. commute cost, budget impact)
- "event-planner": Location + preferences → personalized timeline/itinerary (e.g. game day planner, festival guide)
- "data-explorer": Select neighborhood/area → comparison charts + benchmarks (e.g. safety data, property values, school ratings)
- "eligibility-checker": Criteria inputs → eligible/not eligible + next steps (e.g. program eligibility, benefit calculator)
- "visit-planner": Interest selection → tailored guide with recommendations (e.g. park visit, restaurant guide)
- "tracker": Predictions/selections → projections + charts (e.g. sports season tracker, election tracker)
- "community-response": Resources + reflection space for sensitive stories (e.g. tragedy response, crisis support)
- "enhanced-article": Article text + poll + minimal interactivity for stories that don't fit other types

## Evaluation Criteria
- Does the article contain NUMBERS, DATA, or FACTUAL DETAILS that could drive calculations or comparisons?
- Does it affect SPECIFIC NEIGHBORHOODS or communities in Cincinnati?
- Can readers personalize the information based on their situation (where they live, what they do, etc.)?
- Is there enough substance for meaningful interactivity, or is it a brief news update?

## Output
Respond with ONLY a JSON object:
{
  "worthiness_score": 0-100,
  "suggested_app_type": "one of the types above",
  "local_data_opportunities": "What neighborhood-level or personal-impact angles exist",
  "key_data_points": ["array", "of", "numbers", "facts", "locations mentioned"],
  "skip_reason": "If score < 40, explain why this story doesn't warrant interactivity"
}`

// Stage 2: Config generation prompt (Sonnet — the expensive, important step)
const CONFIG_SYSTEM_PROMPT = `You are a senior interactive journalist at WCPO Cincinnati. You transform news articles into interactive Story-App configurations — JSON specs that drive a config-driven React renderer.

## Your Mission
Create an interactive experience that makes this news story PERSONALLY RELEVANT to each reader. Every Story-App should answer: "What does this mean for ME, in MY neighborhood, for MY family?"

## The Config You Generate

You must output a valid JSON config object with this structure:

{
  "appType": "the app type",
  "theme": {
    "accentColor": "#hex color matching the story tone",
    "categoryLabel": "CATEGORY NAME",
    "icon": "lucide icon name"
  },
  "hero": {
    "headline": "Compelling headline",
    "subhead": "Contextual subhead",
    "leadParagraphs": ["1-2 paragraphs of editorial context"],
    "keyStats": [{"value": "123", "label": "Stat Label", "sub": "Context"}]
  },
  "inputs": [
    {
      "id": "unique_id",
      "type": "button-array|slider|dropdown|quiz|checkbox-group|radio",
      "label": "Question or prompt for the reader",
      "options": [{"id": "opt1", "label": "Display Label", "data": {"key": "value"}}],
      "columns": 3,
      "helpText": "Optional context"
    }
  ],
  "calculations": [
    {
      "id": "calc_id",
      "formula": "inputs.inputId.data.field * inputs.otherId.value * 52",
      "format": "currency|round|percent|decimal1|compact"
    }
  ],
  "results": {
    "showAfterInputs": ["input_ids that must be filled"],
    "scoreCards": [{"label": "Result Label", "valueRef": "calculations.calc_id", "prefix": "$", "suffix": "/year"}],
    "charts": [
      {
        "type": "area|bar|radar",
        "title": "Chart Title",
        "data": [{"x": "Label", "y": 100}],
        "xKey": "x",
        "yKey": "y",
        "color": "#hex"
      }
    ],
    "grade": {
      "valueRef": "calculations.score",
      "scale": {"A": [90,100], "B": [70,89], "C": [50,69], "D": [30,49], "F": [0,29]},
      "descriptions": {"A": "Excellent", "B": "Good", "C": "Fair", "D": "Needs Work", "F": "Critical"}
    },
    "actionItems": [{"title": "Action", "description": "Details", "cta": "Button text", "ctaUrl": "https://..."}]
  },
  "narrative": {
    "systemPrompt": "You are a [beat] reporter at WCPO Cincinnati. Write 2 paragraphs analyzing the reader's personal results...",
    "profileFields": ["input and calc ids to include in the narrative request"]
  },
  "poll": {
    "question": "Community poll question",
    "fields": ["field_ids to aggregate"]
  },
  "narrationScript": "50-100 word intro for text-to-speech narration of this story"
}

## Critical Rules

1. EVERY input option that represents a location must use REAL Cincinnati neighborhoods: Price Hill, Over-the-Rhine, Clifton, Hyde Park, Avondale, Northside, Westwood, Madisonville, Mt. Washington, Anderson Twp, Covington, Newport, Ft. Thomas, Florence, Mason, West Chester, etc.

2. EVERY calculation formula must use REAL numbers from the article. Do not invent statistics. If the article says "the project costs $4.2 million," use 4200000 in your formulas.

3. Chart data must be grounded in the article's facts. If the article provides a timeline, trend, or comparison, encode it as chart data.

4. The narrative systemPrompt should instruct Claude to write as a WCPO journalist — authoritative but accessible, community-focused, no jargon.

5. For quiz-type apps, questions should test or assess the reader's situation relative to the story (not trivia about the article).

6. Action items should include REAL local resources: phone numbers, websites, addresses mentioned in the article.

7. The narrationScript should be a dramatic, engaging 50-100 word intro suitable for text-to-speech.

## Formula Syntax
Formulas reference input values via dot paths:
- "inputs.neighborhood.data.population" — the data attached to the selected option
- "inputs.slider_id.value" — the current slider value
- "inputs.quiz_id.score" — the accumulated quiz score
- "calculations.other_calc.value" — reference another calculation
Operators: +, -, *, /, () only. No functions, no conditionals.

Respond with ONLY the JSON config. No markdown, no explanation.`

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

async function callAnthropic(apiKey, model, system, userMessage, maxTokens) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) return JSON.parse(match[1].trim())
    // Try finding JSON object in text
    const objMatch = text.match(/\{[\s\S]*\}/)
    if (objMatch) return JSON.parse(objMatch[0])
    throw new Error('Could not parse JSON from response')
  }
}

async function supabaseQuery(url, key, path, method, body) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': method === 'POST' ? 'return=representation' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${err}`)
  }
  return res.json()
}

async function processItem(item, apiKey, supabaseUrl, supabaseKey) {
  const articleText = stripHtml(item.content_encoded || item.description || '')
  if (!articleText || articleText.length < 100) {
    return { skipped: true, reason: 'Article too short' }
  }

  // --- Stage 1: Triage (Haiku) ---
  const triageInput = `HEADLINE: ${item.title}\nSUMMARY: ${item.description}\n\nARTICLE (first 1500 chars):\n${articleText.slice(0, 1500)}`

  let triage
  try {
    const triageText = await callAnthropic(apiKey, 'claude-haiku-4-5-20251001', TRIAGE_PROMPT, triageInput, 500)
    triage = parseJson(triageText)
  } catch (err) {
    console.error(`Triage failed for "${item.title}":`, err.message)
    return { skipped: true, reason: `Triage error: ${err.message}` }
  }

  // Update the RSS item with worthiness score
  await supabaseQuery(supabaseUrl, supabaseKey,
    `rss_items?id=eq.${item.id}`, 'PATCH',
    { worthiness_score: triage.worthiness_score, skip_reason: triage.skip_reason || null }
  ).catch(err => console.error('Score update error:', err.message))

  if (triage.worthiness_score < 40) {
    return { skipped: true, reason: triage.skip_reason, score: triage.worthiness_score }
  }

  // --- Stage 2: Config Generation (Sonnet) ---
  const configInput = `ARTICLE TO CONVERT:
HEADLINE: ${item.title}
AUTHOR: ${item.author || 'WCPO Staff'}
PUBLISHED: ${item.pub_date}
FEED: ${item.feed_name}

FULL TEXT:
${articleText.slice(0, 6000)}

TRIAGE ANALYSIS:
- Suggested App Type: ${triage.suggested_app_type}
- Local Data Opportunities: ${triage.local_data_opportunities}
- Key Data Points: ${JSON.stringify(triage.key_data_points)}

Generate the interactive Story-App config JSON for this article.`

  let config
  try {
    const configText = await callAnthropic(apiKey, 'claude-sonnet-4-6', CONFIG_SYSTEM_PROMPT, configInput, 4000)
    config = parseJson(configText)
  } catch (err) {
    console.error(`Config generation failed for "${item.title}":`, err.message)
    return { skipped: true, reason: `Config error: ${err.message}` }
  }

  // --- Stage 3: Sensitivity Analysis (Sonnet) ---
  // Reuse the analyze-story logic inline
  const sensitivityPrompt = `Analyze this news story for sensitivity. Is it about systemic patterns (OK for interactive tools) or individual tragedy (needs sensitive treatment)?

HEADLINE: ${item.title}
CATEGORY: ${item.feed_name}

STORY TEXT:
${articleText.slice(0, 3000)}

Respond with JSON: { "sensitivityLevel": "low|moderate|high|critical", "designConstraints": { "disableAds": bool, "disableGamification": bool, "disablePolls": bool, "disableInterstitials": bool, "toneOverride": null|"serious"|"somber"|"urgent" }, "flags": [], "reasoning": "..." }`

  let sensitivity = { sensitivityLevel: 'low', designConstraints: {}, flags: [] }
  try {
    const sensText = await callAnthropic(apiKey, 'claude-sonnet-4-6',
      'You are an editorial sensitivity analyst for WCPO Cincinnati. Classify news stories for interactive treatment. Use editorial judgment, not keyword matching.',
      sensitivityPrompt, 600)
    sensitivity = parseJson(sensText)
  } catch (err) {
    console.error(`Sensitivity analysis failed for "${item.title}":`, err.message)
    // Non-fatal — proceed with defaults
  }

  // Apply sensitivity constraints to config
  if (sensitivity.sensitivityLevel === 'high' || sensitivity.sensitivityLevel === 'critical') {
    config.appType = 'community-response'
  }

  // Determine category color
  const categoryColors = {
    news: '#dc2626',
    'local-news': '#dc2626',
    sports: '#16a34a',
    entertainment: '#9333ea',
    lifestyle: '#0891b2',
  }

  const storyId = slugify(item.title)

  // --- Save to generated_stories ---
  const storyRow = {
    rss_item_id: item.id,
    story_id: storyId,
    app_type: config.appType || triage.suggested_app_type,
    status: 'draft',
    config,
    sensitivity_analysis: sensitivity,
    narrative_prompt: config.narrative?.systemPrompt || null,
    narration_script: config.narrationScript || null,
    headline: config.hero?.headline || item.title,
    subhead: config.hero?.subhead || item.description?.slice(0, 200),
    category: (item.feed_name || 'news').toUpperCase().replace('-', ' '),
    category_color: categoryColors[item.feed_name] || '#dc2626',
    image_url: null, // RSS doesn't reliably provide images
    publish_date: new Date().toISOString().split('T')[0],
    model_used: 'claude-sonnet-4-6',
  }

  try {
    await supabaseQuery(supabaseUrl, supabaseKey, 'generated_stories', 'POST', storyRow)
  } catch (err) {
    console.error(`Save generated story failed for "${item.title}":`, err.message)
    return { skipped: true, reason: `Save error: ${err.message}` }
  }

  return {
    skipped: false,
    storyId,
    appType: config.appType,
    worthiness: triage.worthiness_score,
    sensitivity: sensitivity.sensitivityLevel,
  }
}

export default async (req) => {
  console.log('Story processing pipeline starting...')

  const apiKey = process.env.ANTHROPIC_API_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Missing required environment variables' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch up to 5 unprocessed RSS items
  let items
  try {
    items = await supabaseQuery(supabaseUrl, supabaseKey,
      'rss_items?processed=eq.false&order=pub_date.desc&limit=5', 'GET')
  } catch (err) {
    console.error('Failed to fetch unprocessed items:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!items || items.length === 0) {
    return new Response(JSON.stringify({ message: 'No unprocessed items', processed: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const results = []

  // Process sequentially to manage rate limits
  for (const item of items) {
    try {
      const result = await processItem(item, apiKey, supabaseUrl, supabaseKey)
      results.push({ title: item.title, ...result })

      // Mark as processed regardless of outcome
      await supabaseQuery(supabaseUrl, supabaseKey,
        `rss_items?id=eq.${item.id}`, 'PATCH',
        { processed: true }
      ).catch(err => console.error('Mark processed error:', err.message))

    } catch (err) {
      console.error(`Pipeline error for "${item.title}":`, err.message)
      results.push({ title: item.title, error: err.message })
    }
  }

  console.log(`Pipeline complete. Processed ${results.length} items.`)

  return new Response(JSON.stringify({
    message: 'Processing complete',
    processed: results.length,
    results,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const config = {
  path: '/.netlify/functions/process-stories',
  schedule: '*/30 * * * *',
}

