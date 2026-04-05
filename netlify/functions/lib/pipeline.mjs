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
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&#x27;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, function (m, code) { return String.fromCharCode(code) })
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

function repairJson(text) {
  // Remove trailing commas before ] or }
  var fixed = text.replace(/,\s*([}\]])/g, '$1')
  // Try to close unclosed arrays and objects
  var opens = 0, arrs = 0
  for (var i = 0; i < fixed.length; i++) {
    if (fixed[i] === '{') opens++
    else if (fixed[i] === '}') opens--
    else if (fixed[i] === '[') arrs++
    else if (fixed[i] === ']') arrs--
  }
  // Truncate at last complete property if deeply broken
  if (opens > 0 || arrs > 0) {
    // Find the last complete key-value pair ending with , or } or ]
    var lastGood = fixed.lastIndexOf('",')
    if (lastGood === -1) lastGood = fixed.lastIndexOf(']}')
    if (lastGood === -1) lastGood = fixed.lastIndexOf('}')
    if (lastGood > fixed.length * 0.5) {
      fixed = fixed.slice(0, lastGood + 1)
    }
    // Recount and close
    opens = 0; arrs = 0
    for (var j = 0; j < fixed.length; j++) {
      if (fixed[j] === '{') opens++
      else if (fixed[j] === '}') opens--
      else if (fixed[j] === '[') arrs++
      else if (fixed[j] === ']') arrs--
    }
    while (arrs > 0) { fixed += ']'; arrs-- }
    while (opens > 0) { fixed += '}'; opens-- }
  }
  return fixed
}

export function parseJson(text) {
  try { return JSON.parse(text) } catch (e) { /* continue */ }
  var match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) {
    try { return JSON.parse(match[1].trim()) } catch (e) { /* continue */ }
    try { return JSON.parse(repairJson(match[1].trim())) } catch (e) { /* continue */ }
  }
  var objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try { return JSON.parse(objMatch[0]) } catch (e) { /* continue */ }
    try { return JSON.parse(repairJson(objMatch[0])) } catch (e) { /* continue */ }
  }
  throw new Error('Could not parse JSON from: ' + text.slice(0, 100))
}

// ─── HTML Article Extraction (for external URLs) ────────────────────────────

function getMetaContent(html, attr, value) {
  var pattern = new RegExp('<meta[^>]+' + attr + '=["\']' + value + '["\'][^>]+content=["\']([^"\']+)["\']', 'i')
  var match = html.match(pattern)
  if (match) return match[1]
  // Try reversed order (content before name)
  pattern = new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+' + attr + '=["\']' + value + '["\']', 'i')
  match = html.match(pattern)
  return match ? match[1] : null
}

function getTagText(html, tag) {
  var match = html.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'))
  return match ? match[1].replace(/<[^>]+>/g, '').trim() : null
}

export function extractArticleMeta(html) {
  if (!html) return { title: '', author: '', description: '', content: '', ogImage: null }

  // Title: OG > meta > <title> > <h1>
  var title = getMetaContent(html, 'property', 'og:title')
    || getMetaContent(html, 'name', 'title')
    || getTagText(html, 'title')
    || getTagText(html, 'h1')
    || ''

  // Author
  var author = getMetaContent(html, 'name', 'author')
    || getMetaContent(html, 'property', 'article:author')
    || ''

  // Description
  var description = getMetaContent(html, 'property', 'og:description')
    || getMetaContent(html, 'name', 'description')
    || ''

  // OG Image
  var ogImage = getMetaContent(html, 'property', 'og:image') || null

  // Site name
  var siteName = getMetaContent(html, 'property', 'og:site_name') || ''

  // Article content: try <article>, then <main>, then <div class containing "article/content/body/story">
  var content = ''
  var articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (articleMatch) {
    content = articleMatch[1]
  } else {
    var mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    if (mainMatch) {
      content = mainMatch[1]
    } else {
      // Find largest div with article-like class
      var divMatch = html.match(/<div[^>]+class="[^"]*(?:article|content|story|body|entry)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      if (divMatch) content = divMatch[1]
    }
  }

  // If no structured content found, use body
  if (!content) {
    var bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    content = bodyMatch ? bodyMatch[1] : html
  }

  return {
    title: stripHtml(title).slice(0, 300),
    author: stripHtml(author).slice(0, 100),
    description: stripHtml(description).slice(0, 500),
    content: content, // raw HTML — caller should stripHtml when needed
    ogImage: ogImage,
    siteName: stripHtml(siteName).slice(0, 100),
  }
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

const CONFIG_SYSTEM = `You are a senior interactive journalist and experience designer at WCPO Cincinnati. You transform news articles into Story-App configs — JSON that a React renderer turns into rich, UNIQUE interactive experiences.

## YOUR DESIGN PHILOSOPHY

You are designing an EXPERIENCE, not filling in a form. Each story-app should feel like a bespoke product built specifically for this story. Think about:

1. **Visual rhythm** — Alternate between dense data, breathing room, interactive moments, and payoff reveals. Never put three similar-looking sections in a row.
2. **Progressive disclosure** — Don't show everything at once. Let readers earn their way deeper into the story.
3. **Emotional design** — Use color, size, and emphasis to convey meaning before reading. A red stat card communicates danger before anyone reads the number.
4. **Personal relevance** — Every interaction should make the reader think "this is about ME, not just about news."

## BLOCK SYSTEM

You compose story-apps from BLOCKS — reusable content components you can arrange in any order. Think of blocks like Lego pieces: the creativity is in how you combine them.

### Available Block Types:

**1. stat-dashboard** — Big colored stat cards. Use for crisis numbers, key metrics, at-a-glance data.
\`\`\`json
{"type": "stat-dashboard", "variant": "crisis|warning|success|info|neutral", "stats": [
  {"value": "7", "label": "Deaths", "sub": "Jan–Mar 2026", "icon": "Flame"},
  {"value": "500%", "label": "Increase", "sub": "vs. last year"}
]}
\`\`\`

**2. timeline** — Scrollable event list with color-coded severity dots. Use for chronological events, incident histories, development milestones.
\`\`\`json
{"type": "timeline", "title": "The Timeline", "events": [
  {"date": "Jan 5", "label": "Winton Place fire", "severity": "normal"},
  {"date": "Jan 17", "label": "Spring Grove — 3 dead", "severity": "critical", "badge": "3 deaths"}
], "showRunningTotal": true, "runningTotalField": "deaths"}
\`\`\`

**3. article-body** — Journalism paragraphs. Break your article into multiple article-body blocks interspersed between interactive elements (not one big wall of text).
\`\`\`json
{"type": "article-body", "paragraphs": ["paragraph 1", "paragraph 2"]}
\`\`\`

**4. input** — Interactive inputs. Available types: slider, button-array, dropdown, checkbox-group, radio.
\`\`\`json
{"type": "input", "inputs": [
  {"id": "commute_miles", "type": "slider", "label": "How far is your daily commute?", "min": 1, "max": 50, "step": 1, "unit": "miles", "defaultValue": 15},
  {"id": "housing", "type": "button-array", "label": "What type of home?", "columns": 2, "options": [
    {"id": "apartment", "label": "Apartment", "data": {"sqft": 900, "risk": 2}}
  ]}
]}
\`\`\`

**5. progressive-quiz** — Questions revealed one at a time with per-answer tips/feedback and a final grade. MUCH richer than basic quiz input — each answer gets contextual feedback, and the final result is color-coded.
\`\`\`json
{"type": "progressive-quiz", "id": "safety_quiz", "title": "Is Your Home Fire-Safe?", "subtitle": "Five questions. Two minutes.", "questions": [
  {"id": "detectors", "question": "Do you have smoke detectors?", "icon": "ShieldCheck", "options": [
    {"label": "Yes, all levels", "value": "all", "score": 3, "tip": "Good. Test them monthly."},
    {"label": "No", "value": "none", "score": 0, "tip": "Call 311 for free detectors today."}
  ]}
], "grading": {"A": [90,100], "B": [70,89], "C": [50,69], "D": [30,49], "F": [0,29]}}
\`\`\`

**6. info-card** — Dynamic card that changes color/content based on user input. Use for risk levels, eligibility results, personalized assessments.
\`\`\`json
{"type": "info-card", "title": "Your Risk Profile", "showWhen": "neighborhood", "conditionField": "inputs.neighborhood.data.risk", "levels": {
  "high": {"color": "red", "label": "HIGH RISK", "icon": "ShieldAlert"},
  "low": {"color": "green", "label": "LOW RISK", "icon": "CheckCircle2"}
}, "stats": [
  {"label": "Fires in 2026", "field": "inputs.neighborhood.data.fires"},
  {"label": "Housing Age", "field": "inputs.neighborhood.data.housingAge"}
], "note": "Homes built before 1960 lack hardwired detectors."}
\`\`\`

**7. comparison-table** — Side-by-side data comparison. Use for city vs. national, before vs. after, option A vs. option B.
\`\`\`json
{"type": "comparison-table", "title": "How Does Cincinnati Compare?", "columns": [
  {"label": "Cincinnati", "highlight": true}, {"label": "National Avg"}, {"label": "Ohio"}
], "rows": [
  {"label": "Median Home Price", "values": ["$225K", "$350K", "$200K"]},
  {"label": "Fire Deaths/100K", "values": ["2.1", "1.2", "1.5"], "highlightMax": true}
]}
\`\`\`

**8. callout-box** — Action-oriented box with dark header and icon rows. Use for resources, next steps, emergency contacts.
\`\`\`json
{"type": "callout-box", "title": "Take Action Now", "variant": "dark|accent|success|warning", "items": [
  {"icon": "Phone", "title": "Request Free Smoke Detectors", "description": "Call 311 — up to 6 free per household.", "action": "Call 311", "actionUrl": "tel:311"}
]}
\`\`\`

**9. step-guide** — Numbered steps with connecting lines. Use for how-to, process explanation, action plans.
\`\`\`json
{"type": "step-guide", "title": "What To Do Next", "variant": "numbered|checklist|timeline", "steps": [
  {"title": "Check your detectors", "description": "Press test button until it beeps.", "icon": "ShieldCheck"},
  {"title": "Create an exit plan", "description": "Walk every person to their second exit.", "icon": "Home"}
]}
\`\`\`

**10. fact-check** — Claim + verdict + explanation. Use for debunking, clarifying controversies, addressing misconceptions.
\`\`\`json
{"type": "fact-check", "title": "What's True and What's Not", "items": [
  {"claim": "Fire response times have gotten worse.", "verdict": "mostly-false", "explanation": "Response times remain under 5 minutes..."},
  {"claim": "Most victims lacked smoke detectors.", "verdict": "true", "explanation": "4 of 7 fatalities..."}
]}
\`\`\`

**11. collapsible** — Expandable context section. Use for background, controversies, technical details readers can skip.
\`\`\`json
{"type": "collapsible", "title": "The Dispatch Controversy", "icon": "MessageCircle", "variant": "subtle|bordered|highlighted", "paragraphs": ["paragraph 1", "paragraph 2"]}
\`\`\`

**12. chart** — Data visualization. Types: bar, area, radar.
\`\`\`json
{"type": "chart", "gated": true, "charts": [{"type": "bar", "title": "Deaths by Year", "data": [{"label": "2023", "value": 3}, {"label": "2026", "value": 7}], "xKey": "label", "yKey": "value", "color": "#dc2626"}]}
\`\`\`

**13. results** — Score cards, grade display, action items. Set \`gated: true\` so they appear only after inputs.
\`\`\`json
{"type": "results", "gated": true, "showAfterInputs": ["input1", "input2"], "scoreCards": [...], "grade": {...}, "actionItems": [...]}
\`\`\`

**14. divider** — Visual break between sections.
\`\`\`json
{"type": "divider", "variant": "diamond|line|dots"}
\`\`\`

**15. hero** — Story headline, subhead, lead paragraphs, key stats.
\`\`\`json
{"type": "hero", "headline": "...", "subhead": "...", "leadParagraphs": ["..."], "keyStats": [{"value": "7", "label": "Deaths", "sub": "2026"}]}
\`\`\`

**HEADLINE GUIDELINES:**
- The hero headline should include a local reference when natural — "Cincinnati," "Ohio," a specific neighborhood (e.g., "Price Hill," "Over-the-Rhine"), or "Greater Cincinnati." One reference is enough.
- This makes headlines feel like local journalism, not wire copy. Readers scan headlines — a local anchor tells them "this is about MY city" in the first few words.
- Good: "Cincinnati Breaks Ground on First Public Skatepark" / "Price Hill Man Dies in City's 7th Fatal Fire of 2026" / "How Ohio's New Sports Betting Law Hits Cincinnati Wallets"
- Avoid: Stacking multiple local references ("Cincinnati, Ohio, Greater Cincinnati Area..."). One is plenty.
- Exception: Skip if the story is obviously local (Reds, Bengals, WCPO, City Council) — the context already signals locality.

**16. narrative** — AI-generated personalized analysis (appears after inputs complete).
\`\`\`json
{"type": "narrative", "gated": true}
\`\`\`

**17. poll** — Community live poll (appears after inputs complete).
\`\`\`json
{"type": "poll", "gated": true, "question": "Do you feel safe in your neighborhood?"}
\`\`\`

## EXPERIENCE DESIGN PATTERNS

**CRISIS/BREAKING story:**
hero → stat-dashboard (crisis) → article-body (2 paras) → timeline → divider → comparison-table → article-body (1 para context) → input (neighborhood dropdown) → info-card → divider → progressive-quiz → callout-box → narrative → fact-check → collapsible (background)

**INFRASTRUCTURE/COST story:**
hero → article-body (scene-setting) → stat-dashboard (neutral) → comparison-table → divider → input (sliders + button-array for personal situation) → results (gated: cost cards) → chart (gated: projection) → step-guide → callout-box → narrative

**HEALTH/SAFETY story:**
hero → stat-dashboard (warning) → article-body (2 paras) → fact-check → divider → progressive-quiz → info-card → callout-box (resources) → collapsible (technical details) → narrative

**EVENT/PLANNING story:**
hero → article-body (excitement) → timeline (event schedule) → input (preferences) → step-guide (gated: personalized itinerary) → comparison-table (gated: options) → callout-box (logistics) → narrative

**SPORTS story:**
hero → stat-dashboard → comparison-table (player/team stats) → article-body → input (predictions) → chart (gated: projections) → results (gated) → fact-check (common takes) → narrative → poll

**INVESTIGATION/ACCOUNTABILITY story:**
hero → stat-dashboard → article-body → fact-check → timeline → collapsible (documents/evidence) → comparison-table → input (reader assessment) → results (gated) → callout-box → narrative

## DERIVATIVE CONTENT GUIDELINES

When working with third-party source articles:
1. **You are creating an ORIGINAL interactive experience** inspired by the source reporting. The source did the journalism — you are building the application.
2. **NEVER copy sentences or paragraphs** from the source article. Rewrite ALL facts in WCPO's voice — conversational, Cincinnati-focused, direct.
3. **Focus on the Cincinnati angle** — even if the source article is national, frame everything through how it affects Cincinnati-area readers specifically.
4. **The interactive elements are YOUR original contribution** — the quizzes, calculators, comparisons, and explorations don't exist in the source article. Design them from scratch based on the facts.
5. **Article-body blocks should be original editorial writing** that contextualizes the facts for a Cincinnati audience, not paraphrased copies of the source.
6. **Always cite specific facts** (numbers, dates, quotes) — these come from the source reporting and should be accurate. But the framing, structure, and narrative are yours.

## CRITICAL RULES

1. **blocks[] is required** — compose your story from the blocks above. Order matters — it's the reader's journey.
2. **Use REAL data** from the article. Do not invent numbers.
3. **At least 6 different block types** per story. Variety is the point.
4. **Break article text into multiple article-body blocks** interspersed between visual/interactive blocks. Never dump all text at the top.
5. **progressive-quiz OR input blocks** (or both) — every story needs reader interaction.
6. **At least one data visualization** — stat-dashboard, chart, comparison-table, or timeline.
7. **At least one action block** — callout-box, step-guide, or actionItems in results.
8. **Use gated: true** on blocks that should only appear after the reader interacts (results, charts, narrative, poll).
9. Neighborhood pickers: use dropdown with ALL Cincinnati neighborhoods (Price Hill, Over-the-Rhine, Clifton, Hyde Park, Oakley, Avondale, Northside, Westwood, Madisonville, Mt. Washington, Anderson Twp, Norwood, Mt. Auburn, Walnut Hills, Evanston, Bond Hill, College Hill, Covington KY, Newport KY, Mason, West Chester, etc.)
10. Input slider format: {"id": "x", "type": "slider", "label": "...", "min": N, "max": N, "step": N, "unit": "...", "defaultValue": N}
11. Formula syntax: "inputs.slider_id" (number), "inputs.id.data.field" (option data), "calculations.id" (other calc). Operators: + - * / ( ) only.

## CONFIG STRUCTURE

{
  "appType": "safety-assessment|impact-calculator|event-planner|data-explorer|eligibility-checker|tracker|investigation",
  "theme": {"accentColor": "#hex", "categoryLabel": "CATEGORY"},
  "blocks": [ ...blocks in reading order... ],
  "calculations": [{"id": "x", "formula": "inputs.a.data.f * inputs.b", "format": "currency|round|percent"}],
  "results": {"showAfterInputs": ["input_id_1", "input_id_2"]},
  "narrative": {"systemPrompt": "You are a [beat] reporter at WCPO. Write 2 paragraphs about THIS reader's results.", "profileFields": ["ids"]},
  "poll": {"question": "Community question"},
  "narrationScript": "50-80 word dramatic audio intro.",
  "saveLabel": "Save My Results"
}

Respond with ONLY valid JSON. No markdown, no explanation.`

export async function generateConfig(apiKey, item, articleText, triage) {
  var isExternal = item.source_type === 'external' || item.feed_name === 'topic-builder' || item.source_url
  var sourceNote = isExternal
    ? '\n\nIMPORTANT: This is THIRD-PARTY source material from ' + (item.source_name || 'an external outlet') + '. Create an ORIGINAL interactive experience inspired by this reporting. Rewrite all content in WCPO\'s voice for Cincinnati readers. Do NOT copy sentences from the source. The interactive elements (quizzes, calculators, comparisons) are your original contribution.\n'
    : ''

  var userMsg = 'Convert this article into a unique interactive Story-App config:\n\n'
    + 'HEADLINE: ' + item.title + '\n'
    + 'AUTHOR: ' + (item.author || 'WCPO Staff') + '\n'
    + 'FEED: ' + (item.feed_name || 'news') + '\n'
    + (isExternal ? 'SOURCE: ' + (item.source_name || 'External') + ' (' + (item.source_url || '') + ')\n' : '')
    + 'SUGGESTED TYPE: ' + (triage.suggested_app_type || 'data-explorer') + '\n'
    + 'INTERACTIVE ANGLES: ' + (triage.interactive_angles || '') + '\n'
    + 'KEY DATA: ' + JSON.stringify(triage.key_data_points || []) + '\n'
    + sourceNote
    + '\nFULL ARTICLE TEXT:\n' + articleText.slice(0, 5000)

  var configText = await callAnthropic(apiKey, 'claude-sonnet-4-6', CONFIG_SYSTEM, userMsg, 12000)
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

  if (triage.worthiness_score < 30 && !opts.forceGenerate) {
    return { skipped: true, reason: triage.skip_reason || 'Score too low', score: triage.worthiness_score }
  }
  if (triage.worthiness_score < 30 && opts.forceGenerate) {
    console.log('Force-generating despite low score: ' + triage.worthiness_score)
  }

  // Stage 2: Config Generation (Sonnet)
  console.log('Generating config with Sonnet...')
  var config = await generateConfig(apiKey, item, articleText, triage)
  console.log('Config parsed, appType: ' + config.appType + ', inputs: ' + (config.inputs ? config.inputs.length : 0))

  // Validate: must have inputs (top-level or inside blocks)
  var hasTopInputs = Array.isArray(config.inputs) && config.inputs.length > 0
  var hasBlockInputs = Array.isArray(config.blocks) && config.blocks.some(function (b) {
    return (b.type === 'input' && Array.isArray(b.inputs) && b.inputs.length > 0)
      || b.type === 'progressive-quiz'
  })
  if (!hasTopInputs && !hasBlockInputs) {
    throw new Error('Config has no inputs — Sonnet failed to generate interactivity')
  }
  if (!config.results) config.results = {}
  if (!config.results.showAfterInputs && hasTopInputs) {
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
  var imageUrl = extractFirstImage(item.content_encoded) || item.og_image || null

  // Inject image into config so it flows to the renderer
  if (imageUrl) {
    if (!config.hero) config.hero = {}
    config.hero.image = imageUrl
    // Also update hero block inside blocks array if present
    if (Array.isArray(config.blocks)) {
      var heroBlock = config.blocks.find(function (b) { return b.type === 'hero' })
      if (heroBlock) heroBlock.image = imageUrl
    }
  }

  var narration = config.narrationScript
  if (narration && typeof narration === 'object') narration = narration.intro || narration.text || ''
  if (!narration && config.hero) narration = (config.hero.leadParagraphs || [])[0] || item.description || ''

  var storyRow = {
    rss_item_id: item.id,
    story_id: storyId,
    app_type: config.appType || triage.suggested_app_type,
    status: 'draft',
    config: config,
    headline: stripHtml((config.hero && config.hero.headline) || item.title),
    subhead: (config.hero && config.hero.subhead) || '',
    category: (item.feed_name || 'news').toUpperCase().replace(/-/g, ' '),
    category_color: CATEGORY_COLORS[item.feed_name] || '#dc2626',
    image_url: imageUrl,
    publish_date: new Date().toISOString().split('T')[0],
    model_used: 'claude-sonnet-4-6',
    narrative_prompt: config.narrative ? config.narrative.systemPrompt : null,
    narration_script: typeof narration === 'string' ? narration.slice(0, 500) : null,
    source_url: item.source_url || null,
    source_name: item.source_name || null,
    source_author: item.source_author || null,
    topic_slug: item.topic_slug || null,
  }

  await sbQuery(supabaseUrl, supabaseKey, 'generated_stories?on_conflict=story_id', 'POST', storyRow)
  console.log('SUCCESS: Inserted ' + storyId)

  return {
    skipped: false,
    storyId: storyId,
    appType: config.appType,
    worthiness: triage.worthiness_score,
    sensitivity: sensitivity.sensitivityLevel,
  }
}
