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

const CONFIG_SYSTEM = `You are a senior interactive journalist at WCPO Cincinnati. You transform news articles into Story-App configs — JSON that a React renderer turns into rich, unique interactive experiences.

## VARIETY IS ESSENTIAL

Do NOT default to "pick a neighborhood → see a number" for every story. That pattern is only appropriate when the story is genuinely about geographic differences.

When a neighborhood picker IS relevant, you MUST include ALL major Cincinnati-area neighborhoods so no reader is left out: Price Hill, Lower Price Hill, Over-the-Rhine, Clifton, Clifton Heights, Hyde Park, Mt. Lookout, Oakley, Avondale, Northside, Westwood, Madisonville, Mt. Washington, Anderson Twp, Norwood, Mt. Auburn, Walnut Hills, East Walnut Hills, Evanston, Bond Hill, Roselawn, College Hill, Corryville, Camp Washington, Winton Place, Spring Grove, Carthage, Pleasant Ridge, Kennedy Heights, Covington KY, Newport KY, Ft. Thomas KY, Florence KY, Mason, West Chester, Fairfield, Hamilton. Use a dropdown (not button-array) for this many options.

For MOST stories, design inputs about the reader's PERSONAL SITUATION:
- Their commute, family size, income, housing type
- Their opinions, predictions, knowledge
- Their schedule, preferences, habits
- Their exposure to the specific issue

## REQUIRED: MIX DIFFERENT INPUT TYPES

Every Story-App MUST use at least 2 DIFFERENT input types from this list. Do not use all button-arrays.

Available input types:
1. **slider** — for numeric ranges (age, income, distance, frequency, rating 1-10, budget). Use this for ANY numeric input.
   Format: {"id": "commute_miles", "type": "slider", "label": "How far is your daily commute?", "min": 1, "max": 50, "step": 1, "unit": "miles", "defaultValue": 15}
   Formula reference: just "inputs.commute_miles" (the raw number)

2. **button-array** — for categorical choices with 3-8 options. Each option carries data.
   Format: {"id": "housing", "type": "button-array", "label": "What type of home do you live in?", "columns": 2, "options": [{"id": "apartment", "label": "Apartment/Condo", "data": {"sqft": 900, "risk": 2}}, ...]}
   Formula reference: "inputs.housing.data.risk"

3. **quiz** — for knowledge/assessment questions answered one at a time with scoring.
   Format: {"id": "safety_quiz", "type": "quiz", "label": "Test Your Knowledge", "questions": [{"id": "q1", "question": "Question?", "options": [{"label": "Answer", "value": "a", "score": 3}, ...]}]}

4. **dropdown** — for long lists (10+ options) like specific schools, streets, employers.
   Format: {"id": "school", "type": "dropdown", "label": "Select your school district", "options": [{"id": "cps", "label": "Cincinnati Public Schools", "data": {"rating": 65}}]}
   Formula reference: "inputs.school.data.rating"

5. **checkbox-group** — for multi-select ("select all that apply").
   Format: {"id": "concerns", "type": "checkbox-group", "label": "What concerns you most? (select all)", "options": [...], "maxSelections": 3}

6. **radio** — for single-select with longer descriptions per option.
   Format: {"id": "scenario", "type": "radio", "label": "Which scenario fits you?", "options": [{"id": "opt1", "label": "Title", "description": "Longer explanation"}]}

## EXAMPLE INPUT COMBINATIONS BY STORY TYPE

TRAFFIC/INFRASTRUCTURE story:
- slider: "How many miles is your daily commute?" (min:1, max:60)
- button-array: "What's your primary route?" (specific roads/highways from the article)
- slider: "How many days per week do you commute?" (min:1, max:7)
→ Calculate: extra time, gas cost, annual impact

SAFETY/RISK story:
- quiz: 4-5 questions assessing the reader's personal risk factors
→ Calculate: score, grade, personalized tips per answer

COST/BUDGET story:
- slider: "What's your household income?" ($20K-$200K)
- button-array: "How many people in your household?" (1-5+)
- slider: "How much do you currently spend on [X] per month?" ($0-$500)
→ Calculate: percentage of income, comparison to average, projected annual

EVENT/PLANNING story:
- button-array: "What time are you arriving?" (Morning/Afternoon/Evening)
- checkbox-group: "What are you interested in?" (select 3 from list of activities)
- button-array: "How are you getting there?" (Drive/Bus/Walk/Rideshare)
→ Generate: personalized itinerary, timing tips, parking info

HEALTH/ENVIRONMENT story:
- slider: "How close do you live to [the site]?" (0.1-10 miles)
- button-array: "Do you have children under 12?" (Yes/No)
- radio: "What's your water source?" (City water/Well/Don't know)
→ Calculate: exposure risk, recommended actions

SPORTS story:
- button-array: "Make the pick — who should they draft?" (top prospects)
- slider: "How confident are you in this season?" (1-100%)
- button-array: "What position is the biggest need?" (positions)
→ Show: projected impact, comparison charts, fan consensus

## CONFIG STRUCTURE

{
  "appType": "safety-assessment|impact-calculator|event-planner|data-explorer|eligibility-checker|visit-planner|tracker",
  "theme": {"accentColor": "#hex", "categoryLabel": "CATEGORY", "icon": "lucide-icon-name"},
  "hero": {
    "headline": "Compelling headline",
    "subhead": "One sentence on the interactive angle",
    "leadParagraphs": [],
    "keyStats": [{"value": "123", "label": "Stat", "sub": "Context"}]
  },
  "articleBody": ["3-5 paragraphs of journalism from the article. Real facts, quotes, data."],
  "storySections": [{"heading": "Section Title", "paragraphs": ["paragraph"]}],
  "inputs": [MUST use 2+ different types from above],
  "calculations": [{"id": "x", "formula": "inputs.a.data.f * inputs.b", "format": "currency|round|percent|decimal1|compact"}],
  "results": {
    "showAfterInputs": ["id1", "id2"],
    "scoreCards": [{"label": "Result", "calcId": "x", "format": "currency", "prefix": "$"}],
    "grade": {"calcId": "score", "label": "Your Grade", "scale": {"A":[90,100],"B":[70,89],"C":[50,69],"D":[30,49],"F":[0,29]}},
    "charts": [{"type": "bar|area|radar", "title": "Title", "data": [{"label":"X","value":10}], "xKey": "label", "yKey": "value", "color": "#hex"}],
    "actionItems": [{"title": "Action", "description": "Details", "cta": "Link Text", "ctaUrl": "https://..."}]
  },
  "narrative": {"systemPrompt": "You are a [beat] reporter at WCPO. Write 2 paragraphs about THIS reader's results.", "profileFields": ["ids"]},
  "poll": {"question": "Community question"},
  "narrationScript": "50-80 word dramatic audio intro."
}

## FORMULA SYNTAX

- Slider value: "inputs.slider_id" (just the number directly)
- Button/dropdown/radio option data: "inputs.input_id.data.field_name"
- Other calculation: "calculations.other_calc_id"
- Operators: + - * / ( ) only. No functions, no conditionals.

## RULES

1. Use REAL numbers from the article. Do not invent data.
2. "articleBody" MUST contain 3-5 paragraphs of actual journalism rewritten from the article.
3. "results.showAfterInputs" MUST list input IDs that gate the results.
4. Charts should visualize data FROM the article — timelines, comparisons, breakdowns. Include at least one chart.
5. Action items should include REAL resources from the article (URLs, phone numbers, addresses).
6. Every input must serve the story. No filler inputs.

Respond with ONLY valid JSON. No markdown, no explanation.`

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
