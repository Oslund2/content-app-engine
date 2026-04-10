// Prior art analysis — uses Claude to analyze relevance of prior art to invention
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

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
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 503 })
  }

  try {
    const { title, description, claims } = await req.json()

    const prompt = `You are a patent examiner conducting a prior art search. Analyze the following invention and identify potentially relevant prior art.

Invention Title: ${title}
Description: ${(description || '').substring(0, 2000)}
${claims ? `Key Claims: ${claims.substring(0, 1000)}` : ''}

Return a JSON array of 5-8 plausible prior art references. For each:
{
  "patent_number": "US...",
  "title": "...",
  "abstract": "Brief description...",
  "relevance_score": 0-100,
  "similarity_explanation": "How this relates to the invention",
  "is_blocking": true/false,
  "source": "ai_simulated"
}

IMPORTANT: These are AI-simulated references for planning purposes. The user should verify with actual USPTO searches. Mark all as source: "ai_simulated".`

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20251001',
        max_tokens: 4096,
        system: 'You are a patent examiner. Always respond with valid JSON arrays.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return new Response(JSON.stringify({ error: 'API error' }), { status: 502 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || '[]'

    let results
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      results = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      results = []
    }

    return new Response(JSON.stringify({ results, simulated: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('Patent prior art error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}

export const config = { path: '/.netlify/functions/patent-prior-art' }
