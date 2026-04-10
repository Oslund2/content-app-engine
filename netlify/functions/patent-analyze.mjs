// Patent analysis — novelty scoring and Alice/Mayo risk assessment via Claude
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
    const { type, applicationData, priorArt, claims } = await req.json()

    let prompt
    if (type === 'novelty') {
      prompt = buildNoveltyPrompt(applicationData, priorArt)
    } else if (type === 'alice') {
      prompt = buildAlicePrompt(applicationData, claims)
    } else {
      return new Response(JSON.stringify({ error: `Unknown analysis type: ${type}` }), { status: 400 })
    }

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
        system: 'You are a patent examiner specializing in patentability analysis. Always respond with valid JSON.',
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

    let result
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse analysis' }
    } catch {
      result = { error: 'Could not parse analysis response' }
    }

    return new Response(JSON.stringify({ result, type }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('Patent analyze error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}

function buildNoveltyPrompt(app, priorArt) {
  return `Perform a novelty analysis for this patent application.

Title: ${app?.title || 'Untitled'}
Description: ${(app?.detailed_description || app?.specification || '').substring(0, 2000)}
${priorArt?.length ? `Prior Art Found: ${JSON.stringify(priorArt.slice(0, 5))}` : 'No prior art provided.'}

Return JSON:
{
  "overall_score": 0-100,
  "approval_probability": 0-100,
  "strength_rating": "strong|moderate|weak",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "patentability_assessment": "Detailed assessment paragraph"
}`
}

function buildAlicePrompt(app, claims) {
  return `Perform an Alice/Mayo (35 USC 101) subject matter eligibility analysis.

Title: ${app?.title || 'Untitled'}
Description: ${(app?.detailed_description || '').substring(0, 1500)}
Claims: ${claims ? JSON.stringify(claims.slice(0, 5)) : 'No claims provided'}

For each claim, apply the two-step Alice framework:
Step 1: Is the claim directed to an abstract idea, law of nature, or natural phenomenon?
Step 2: Does the claim recite additional elements that amount to significantly more?

Return JSON:
{
  "overall_risk": "low|medium|high",
  "claim_analyses": [
    {
      "claim_number": 1,
      "risk_level": "low|medium|high",
      "abstract_idea_risk": "explanation",
      "inventive_concept": "explanation",
      "recommendations": ["..."]
    }
  ],
  "summary": "Overall assessment paragraph"
}`
}

export const config = { path: '/.netlify/functions/patent-analyze' }
