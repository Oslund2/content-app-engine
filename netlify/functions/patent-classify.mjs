// CPC Classification suggestion — uses Claude to suggest appropriate patent classification codes
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
    const { title, inventionDescription, technicalField, claimsText } = await req.json()

    const prompt = `You are a patent classification expert. Analyze the following invention and suggest the most appropriate Cooperative Patent Classification (CPC) codes.

Title: ${title}
Technical Field: ${technicalField || 'Not specified'}
Description: ${(inventionDescription || '').substring(0, 2000)}
${claimsText ? `Claims: ${claimsText.substring(0, 1000)}` : ''}

Return a JSON object with:
{
  "primary": { "code": "G06F...", "title": "...", "confidence": 0.0-1.0 },
  "secondary": [{ "code": "...", "title": "...", "confidence": 0.0-1.0 }],
  "rationale": "Explanation of why these codes were chosen"
}

Common software CPC codes for reference:
- G06F: Electric Digital Data Processing
- G06N: Computing Based on Specific Models (AI/ML)
- G06N3/00: Neural Networks
- G06N20/00: Machine Learning
- G06Q: Business Data Processing
- G06Q10/06: Project/Resource Management
- G06Q50/18: Legal Services
- G06T: Image Data Processing
- H04L: Digital Information Transmission
- H04N: Pictorial Communication`

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20251001',
        max_tokens: 2048,
        system: 'You are a patent classification expert. Always respond with valid JSON.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return new Response(JSON.stringify({ error: 'API error' }), { status: 502 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'

    // Extract JSON from response
    let result
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse classification' }
    } catch {
      result = { error: 'Could not parse classification response' }
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('Patent classify error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}

export const config = { path: '/.netlify/functions/patent-classify' }
