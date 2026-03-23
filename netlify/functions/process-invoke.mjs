// HTTP-callable trigger for AI story processing (for manual/dashboard use)
// Imports the processing logic and wraps it in an HTTP response

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
  var data
  try { data = JSON.parse(rawBody) } catch(e) {
    throw new Error('Anthropic response not JSON (' + rawBody.length + ' chars): ' + rawBody.slice(0, 200))
  }
  var text = data.content && data.content[0] ? data.content[0].text : ''
  if (!text) throw new Error('Empty response from ' + model + ' (stop_reason: ' + data.stop_reason + ', keys: ' + Object.keys(data).join(',') + ')')
  return text
}

function parseJson(text) {
  try { return JSON.parse(text) } catch(e) {}
  var match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) return JSON.parse(match[1].trim())
  var objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) return JSON.parse(objMatch[0])
  throw new Error('Could not parse JSON')
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
  if (!res.ok) throw new Error('Supabase ' + method + ' ' + path + ': ' + await res.text())
  var text = await res.text()
  if (!text) return null
  try { return JSON.parse(text) } catch(e) { return null }
}

export default async (req, context) => {
  try {
    var apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
    var supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
    var supabaseKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!apiKey || !supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Missing env vars' }), {
        status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Fetch up to 3 unprocessed RSS items (limit to stay within 26s timeout)
    var items = await sbQuery(supabaseUrl, supabaseKey,
      'rss_items?processed=eq.false&order=worthiness_score.desc.nullslast&limit=1', 'GET')

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ message: 'No unprocessed items', processed: 0 }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    var results = []

    for (var idx = 0; idx < items.length; idx++) {
      var item = items[idx]
      try {
        var articleText = stripHtml(item.content_encoded || item.description || '')
        if (!articleText || articleText.length < 100) {
          results.push({ title: item.title, skipped: true, reason: 'Too short' })
          await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true })
          continue
        }

        // Stage 1: Triage — skip if already scored
        var triage
        if (item.worthiness_score != null) {
          triage = { worthiness_score: item.worthiness_score, suggested_app_type: 'data-explorer' }
        } else {
          var triageText = await callAnthropic(apiKey, 'claude-haiku-4-5-20251001',
            'You evaluate news articles for interactive app potential. Respond with ONLY a JSON object, nothing else: { "worthiness_score": 0-100, "suggested_app_type": "string", "skip_reason": "string if score<40" }',
            'HEADLINE: ' + item.title + '\nSUMMARY: ' + (item.description || '').slice(0, 300) + '\nARTICLE: ' + articleText.slice(0, 1000),
            300)
          try { triage = parseJson(triageText) } catch(e) { throw new Error('Triage parse failed: ' + triageText.slice(0, 100)) }
          await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH',
            { worthiness_score: triage.worthiness_score, skip_reason: triage.skip_reason || null })
        }

        if (triage.worthiness_score < 30) {
          await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true })
          results.push({ title: item.title, skipped: true, score: triage.worthiness_score, reason: triage.skip_reason })
          continue
        }

        // Stage 2: Config Generation (Sonnet) - simplified prompt for speed
        var configText = await callAnthropic(apiKey, 'claude-sonnet-4-6',
          'You are an interactive journalist at WCPO Cincinnati. Generate a JSON config for an interactive Story-App. Output ONLY valid JSON with: appType, theme{accentColor,categoryLabel,icon}, hero{headline,subhead,leadParagraphs[],keyStats[]}, inputs[], calculations[], results{showAfterInputs[],scoreCards[],charts[],actionItems[]}, narrative{systemPrompt,profileFields[]}, poll{question,fields[]}, narrationScript. Use REAL Cincinnati neighborhoods and data from the article.',
          'Convert this article to an interactive Story-App config:\n\nHEADLINE: ' + item.title + '\nFEED: ' + item.feed_name + '\nSuggested type: ' + triage.suggested_app_type + '\n\nFULL TEXT:\n' + articleText.slice(0, 4000),
          4096)
        console.log('Config response length: ' + configText.length + ' chars')
        var config
        try { config = parseJson(configText) } catch(e) { throw new Error('Config parse failed (len=' + configText.length + '): ' + configText.slice(0, 150)) }

        var storyId = slugify(item.title)
        var categoryColors = { news: '#dc2626', 'local-news': '#dc2626', sports: '#16a34a', entertainment: '#9333ea', lifestyle: '#0891b2' }

        await sbQuery(supabaseUrl, supabaseKey, 'generated_stories', 'POST', {
          rss_item_id: item.id,
          story_id: storyId,
          app_type: config.appType || triage.suggested_app_type,
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

        results.push({ title: item.title, storyId: storyId, appType: config.appType, score: triage.worthiness_score })
      } catch (err) {
        console.error('Error processing: ' + item.title, err)
        results.push({ title: item.title, error: err.message })
        await sbQuery(supabaseUrl, supabaseKey, 'rss_items?id=eq.' + item.id, 'PATCH', { processed: true }).catch(function(){})
      }
    }

    return new Response(JSON.stringify({ message: 'Processing complete', results: results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

export const config = {
  path: '/api/process-invoke',
}
