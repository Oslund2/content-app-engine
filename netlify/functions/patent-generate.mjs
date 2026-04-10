// Patent content generation — proxies Claude API for spec, claims, abstract, drawings
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
    const { type, applicationData } = await req.json()

    const prompts = {
      specification: buildSpecPrompt(applicationData),
      abstract: buildAbstractPrompt(applicationData),
      claims: buildClaimsPrompt(applicationData),
      drawings: buildDrawingsPrompt(applicationData),
    }

    const prompt = prompts[type]
    if (!prompt) {
      return new Response(JSON.stringify({ error: `Unknown generation type: ${type}` }), { status: 400 })
    }

    const maxTokens = { specification: 4096, abstract: 1024, claims: 8192, drawings: 2048 }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20251001',
        max_tokens: maxTokens[type] || 4096,
        system: 'You are a patent attorney assistant specializing in drafting USPTO patent applications. Generate precise, legally sound patent documentation. Always output valid JSON when asked for structured data.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return new Response(JSON.stringify({ error: 'API error' }), { status: 502 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    return new Response(JSON.stringify({ result: text, type }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('Patent generate error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}

function buildSpecPrompt(app) {
  return `Generate a complete patent specification for the following invention. Return a JSON object with keys: field_of_invention, background_art, summary_invention, detailed_description.

GROUNDING RULE: Only describe features that actually exist in the invention as described. Do not invent capabilities, algorithms, or components that are not described. Do not use speculative language.

Title: ${app.title || 'Untitled'}
Description: ${app.detailed_description || app.invention_description || 'No description provided'}
Technical Field: ${app.technical_field || app.field_of_invention || 'Software systems'}
Key Features: ${JSON.stringify(app.key_features || [])}

Each section should be 300-800 words of precise patent language. Use formal patent terminology throughout.`
}

function buildAbstractPrompt(app) {
  return `Write a patent abstract (50-150 words) for:

Title: ${app.title}
Specification: ${(app.specification || app.detailed_description || '').substring(0, 2000)}

The abstract must concisely describe: (1) the technical field, (2) the problem solved, (3) the solution, (4) key advantages. Use formal patent language. Return only the abstract text, no JSON.`
}

function buildClaimsPrompt(app) {
  return `Generate patent claims for the following invention. Return a JSON array of claim objects, each with: { claim_number, claim_type ("independent" or "dependent"), parent_claim_number (null for independent), claim_text, category ("method" or "system" or "apparatus") }.

Generate 2-3 independent claims and 10-15 dependent claims covering the key aspects.

Title: ${app.title}
Description: ${(app.detailed_description || app.invention_description || '').substring(0, 3000)}
Key Features: ${JSON.stringify(app.key_features || [])}

Use precise patent claim language. Each independent claim should stand alone. Dependent claims should reference their parent by number.`
}

function buildDrawingsPrompt(app) {
  return `Suggest patent drawings for the following invention. Return a JSON array of drawing objects, each with: { figure_number, title, description, drawing_type ("block_diagram" or "flowchart" or "sequence_diagram"), callouts: [{ number, label, description }] }.

Suggest 3-6 drawings covering system architecture, data flow, and key processes.

Title: ${app.title}
Description: ${(app.detailed_description || app.invention_description || '').substring(0, 2000)}

Each drawing should have 4-8 callouts with reference numbers (100, 200, 300 series).`
}

export const config = { path: '/.netlify/functions/patent-generate' }
