// Netlify serverless function — proxies Claude API calls for dynamic narrative generation
// Keeps the Anthropic API key server-side

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const storyPrompts = {
  'fire-crisis': `You are a senior investigative journalist at WCPO Cincinnati writing a personalized fire safety analysis. Be direct, specific to the reader's situation, and actionable. Reference Cincinnati fire data. Write exactly 2 paragraphs.`,
  'safety-survey': `You are a data journalist at WCPO Cincinnati writing a personalized neighborhood safety analysis. Be specific about what the numbers mean for this reader's daily life. Write exactly 2 paragraphs.`,
  'bridge-impact': `You are a transportation reporter at WCPO Cincinnati writing a personalized commute impact analysis. Quantify the personal cost in relatable terms ("that's X dinners out" or "X tanks of gas"). Write exactly 2 paragraphs.`,
  'sidewalk-repair': `You are a neighborhood reporter at WCPO Cincinnati writing about this reader's sidewalk repair eligibility. Be encouraging if eligible, practical if not. Write exactly 2 paragraphs.`,
  'sharon-lake': `You are an outdoors writer at WCPO Cincinnati creating a personalized visit guide for Sharon Lake. Be enthusiastic but specific to their stated interests. Write exactly 2 paragraphs.`,
  'opening-day': `You are a sports columnist at WCPO Cincinnati writing a personalized Opening Day game plan. Be fun, practical, and capture the civic excitement. Write exactly 2 paragraphs.`,
  'bengals-draft': `You are an NFL draft analyst at WCPO Cincinnati writing about this reader's draft pick decision. Evaluate the pick honestly — praise good fits, flag reaches. Write exactly 2 paragraphs.`,
  'fc-cincinnati': `You are an MLS beat writer at WCPO Cincinnati writing a personalized season projection. Use the reader's predictions to evaluate their optimism or pessimism. Write exactly 2 paragraphs.`,
  'storm-ready': `You are an emergency preparedness reporter at WCPO Cincinnati writing a personalized storm readiness assessment. Be urgent where the score is low, affirming where it's high. Write exactly 2 paragraphs.`,
  'flood-risk': `You are a weather reporter at WCPO Cincinnati writing a personalized flood risk analysis. Connect the river gauge reading to what this reader will actually experience in their neighborhood. Write exactly 2 paragraphs.`,
  'car-seat': `You are a family safety reporter at WCPO Cincinnati writing about this reader's car seat safety results. Be clear about any critical errors and compassionate — most parents don't know. Write exactly 2 paragraphs.`,
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured', fallback: true }), { status: 200 })
  }

  try {
    const { storyId, profileData } = await req.json()
    const systemPrompt = storyPrompts[storyId]
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: 'Unknown story', fallback: true }), { status: 200 })
    }

    const userMessage = `Here is the reader's profile data from the interactive story:\n\n${JSON.stringify(profileData, null, 2)}\n\nWrite your personalized analysis based on this data. Use the editorial voice described in your instructions. Be specific to their inputs — do not be generic.`

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return new Response(JSON.stringify({ error: 'API error', fallback: true }), { status: 200 })
    }

    const data = await response.json()
    const narrative = data.content?.[0]?.text || ''

    return new Response(JSON.stringify({ narrative }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('Function error:', err)
    return new Response(JSON.stringify({ error: err.message, fallback: true }), { status: 200 })
  }
}

export const config = {
  path: '/.netlify/functions/narrative',
}
