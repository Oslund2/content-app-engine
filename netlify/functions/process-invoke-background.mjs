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
        'You are an interactive journalist at WCPO Cincinnati. Generate a JSON config for an interactive Story-App. Output ONLY valid JSON with: appType, theme{accentColor,categoryLabel,icon}, hero{headline,subhead,leadParagraphs[],keyStats[]}, inputs[], calculations[], results{showAfterInputs[],scoreCards[],charts[],actionItems[]}, narrative{systemPrompt,profileFields[]}, poll{question,fields[]}, narrationScript. Use REAL Cincinnati neighborhoods and data from the article.',
        'Convert this article:\n\nHEADLINE: ' + item.title + '\nFEED: ' + item.feed_name + '\nType: ' + suggestedType + '\n\nTEXT:\n' + articleText.slice(0, 4000),
        4096)

      console.log('Config response: ' + configText.length + ' chars')
      var config = parseJson(configText)
      console.log('Config parsed, appType: ' + config.appType)

      var storyId = slugify(item.title)
      var categoryColors = { news: '#dc2626', 'local-news': '#dc2626', sports: '#16a34a', entertainment: '#9333ea', lifestyle: '#0891b2' }

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
        publish_date: new Date().toISOString().split('T')[0],
        model_used: 'claude-sonnet-4-6',
        narrative_prompt: config.narrative ? config.narrative.systemPrompt : null,
        narration_script: config.narrationScript || null,
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
