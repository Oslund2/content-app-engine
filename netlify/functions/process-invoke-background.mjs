// Background function for AI story processing (15-min timeout)
// Processes RSS items through triage + config generation pipeline

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

function extractFirstImage(html) {
  if (!html) return null
  // Try src="https://...jpg/png/webp"
  var match = html.match(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)
  if (match) return match[1]
  // Try <img src="...">
  match = html.match(/<img[^>]+src="(https?:\/\/[^"]+)"/i)
  if (match) return match[1]
  return null
}

async function callAnthropic(apiKey, model, system, userMessage, maxTokens) {
  var response = await fetch('https://api.anthropic.com/v1/messages', {
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

function parseJson(text) {
  try { return JSON.parse(text) } catch(e) {}
  var match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) return JSON.parse(match[1].trim())
  var objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) return JSON.parse(objMatch[0])
  throw new Error('Could not parse JSON from: ' + text.slice(0, 100))
}

async function sbQuery(url, key, path, method, body) {
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
  try { return JSON.parse(text) } catch(e) { return null }
}

export default async (req, context) => {
  var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing env vars: API=' + !!apiKey + ' URL=' + !!supabaseUrl + ' KEY=' + !!supabaseKey)
    return
  }

  console.log('Background processing starting...')

  var items = await sbQuery(supabaseUrl, supabaseKey,
    'rss_items?processed=eq.false&order=worthiness_score.desc.nullslast&limit=5', 'GET')

  if (!items || items.length === 0) {
    console.log('No unprocessed items')
    return
  }

  console.log('Processing ' + items.length + ' items')

  for (var idx = 0; idx < items.length; idx++) {
    var item = items[idx]
    console.log('--- Item ' + (idx+1) + ': ' + item.title.slice(0, 50))

    try {
      var articleText = stripHtml(item.content_encoded || item.description || '')
      console.log('Article text length: ' + articleText.length)

      if (!articleText || articleText.length < 100) {
        console.log('Skipped: too short')
        await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true })
        continue
      }

      // Skip triage if already scored
      var worthiness = item.worthiness_score
      var suggestedType = 'data-explorer'

      if (worthiness == null) {
        console.log('Running triage...')
        var triageText = await callAnthropic(apiKey, 'claude-haiku-4-5-20251001',
          'You evaluate news articles for interactive app potential. Respond with ONLY JSON: { "worthiness_score": 0-100, "suggested_app_type": "string", "skip_reason": "string if score<40" }',
          'HEADLINE: ' + item.title + '\nARTICLE: ' + articleText.slice(0, 1000),
          300)
        var triage = parseJson(triageText)
        worthiness = triage.worthiness_score
        suggestedType = triage.suggested_app_type || 'data-explorer'
        console.log('Triage score: ' + worthiness)

        await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH',
          { worthiness_score: worthiness, skip_reason: triage.skip_reason || null })
      } else {
        console.log('Already scored: ' + worthiness)
      }

      if (worthiness < 30) {
        console.log('Skipped: score too low')
        await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true })
        continue
      }

      // Config Generation (Sonnet)
      console.log('Generating config with Sonnet...')
      var configText = await callAnthropic(apiKey, 'claude-sonnet-4-6',
        `You are a senior interactive journalist at WCPO Cincinnati. You transform news articles into deeply engaging interactive Story-Apps that connect readers to their community.

## YOUR MISSION
Choose the BEST interactive format for THIS specific story. Every story is different. Match the format to the story's emotional and informational core:

- **impact-calculator**: When the story has NUMBERS that affect people differently. "What does this cost YOU?" Readers input their situation → see personalized cost/time/impact. Use sliders for quantities, button-arrays for locations. Must have real formulas.
- **safety-assessment**: When the story involves personal RISK or PREPAREDNESS. Quiz format → score → grade → personalized tips. Sequential questions that reveal your situation.
- **eligibility-checker**: When a PROGRAM or BENEFIT exists. "Do you qualify?" Step-by-step criteria → yes/no with next steps.
- **data-explorer**: When the story has GEOGRAPHIC data. Pick your neighborhood → see how it compares. Radar charts, bar charts comparing areas.
- **event-planner**: When there's an UPCOMING EVENT. Pick preferences → get a personalized plan with timeline.
- **visit-planner**: When a PLACE reopened/opened. Select interests → tailored guide.
- **tracker**: When there's an ONGOING situation to follow. Make predictions → see projections.

## CRITICAL FORMAT RULES
Your JSON config must use EXACTLY these field formats:

inputs[]: Each input must have:
- "id": "snake_case_id"
- "type": one of "button-array", "slider", "dropdown", "quiz", "checkbox-group", "radio"
- "label": "Question for the reader"
- "options": array of {"id": "kebab-case", "label": "Display Text", "data": {}} objects (NOT plain strings)
- For sliders: "min", "max", "step", "defaultValue" (no options needed)
- For quiz: "questions": [{"id", "question", "options": [{"label", "value", "score"}]}]

calculations[]: Each must have:
- "id": "calc_name"
- "formula": arithmetic expression using "inputs.inputId.data.field" references
- "format": "currency" | "round" | "percent"

results.scoreCards[]: {"label", "valueRef": "calculations.calc_name", "prefix", "suffix"}
results.charts[]: {"type": "area"|"bar"|"radar", "title", "data": [{xKey: val, yKey: val}...], "xKey", "yKey", "color"}
results.actionItems[]: {"title", "description", "cta": "Button Text", "ctaUrl": "https://..."}

## COMMUNITY CONNECTION
Every input should make the reader think "this is about MY life." Use Cincinnati neighborhoods by name. Reference local landmarks, streets, prices. The goal is not information — it's personal relevance.

Output ONLY valid JSON. No markdown wrapping.`,
        'Convert this article into an interactive Story-App:\n\nHEADLINE: ' + item.title + '\nFEED: ' + item.feed_name + '\nSuggested type: ' + suggestedType + '\n\nFULL ARTICLE TEXT:\n' + articleText.slice(0, 5000),
        4096)

      console.log('Config response: ' + configText.length + ' chars')
      var config = parseJson(configText)
      console.log('Config parsed, appType: ' + config.appType)

      var storyId = slugify(item.title)
      var categoryColors = { news: '#dc2626', 'local-news': '#dc2626', sports: '#16a34a', entertainment: '#9333ea', lifestyle: '#0891b2' }

      // Extract image from RSS content
      var imageUrl = extractFirstImage(item.content_encoded)
      console.log('Image: ' + (imageUrl ? imageUrl.slice(0, 60) : 'none'))

      // Extract narration script — handle both string and object formats
      var narration = config.narrationScript
      if (narration && typeof narration === 'object') narration = narration.intro || narration.text || JSON.stringify(narration)
      if (!narration) narration = config.hero ? config.hero.leadParagraphs?.[0]?.slice(0, 300) : item.description

      console.log('Inserting generated story: ' + storyId)
      var result = await sbQuery(supabaseUrl, supabaseKey, 'generated_stories', 'POST', {
        rss_item_id: item.id,
        story_id: storyId,
        app_type: config.appType || suggestedType,
        status: 'draft',
        config: config,
        headline: (config.hero && config.hero.headline) || item.title,
        subhead: (config.hero && config.hero.subhead) || '',
        category: (item.feed_name || 'news').toUpperCase().replace('-', ' '),
        category_color: categoryColors[item.feed_name] || '#dc2626',
        image_url: imageUrl,
        publish_date: new Date().toISOString().split('T')[0],
        model_used: 'claude-sonnet-4-6',
        narrative_prompt: config.narrative ? config.narrative.systemPrompt : null,
        narration_script: narration,
      })

      console.log('SUCCESS: Inserted ' + storyId)

      // Only mark processed AFTER successful insert
      await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true })

    } catch (err) {
      console.error('FAILED on "' + item.title.slice(0, 50) + '": ' + err.message)
      // Do NOT mark as processed on failure — let it retry
    }
  }

  console.log('Background processing complete')
}
