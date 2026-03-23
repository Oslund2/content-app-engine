// Netlify serverless function — AI-powered editorial sensitivity analysis
// Classifies news stories and recommends interactive treatment

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `You are an editorial sensitivity analyst for a local news organization (WCPO Cincinnati) that converts news stories into interactive web applications — calculators, planners, quizzes, explorers, and community response pages.

Your job is to read a news story and determine how it should be treated when converted into an interactive format. This is an editorial judgment call, not content moderation. You are not deciding whether the story should be published — it already has been. You are deciding how the interactive version should behave.

## The Core Question

"If we turn this story into an interactive experience, what would be appropriate and what would be exploitative?"

## Context: What These Interactive Story-Apps Do

Standard story-apps include:
- Interactive calculators (e.g., "calculate your commute cost")
- Personalized assessments (e.g., "check your fire safety score")
- Gamified experiences (e.g., "make the draft pick")
- Data visualizations with user input
- Sponsored ad placements (interstitials, result cards, branded insights)
- Live polls showing community data
- AI-generated personalized narratives

Sensitive story-apps replace all of the above with:
- Community resources and verified information
- Crisis support contacts
- Space for human reflection (not gamified engagement)
- No advertising of any kind
- No data collection beyond voluntary community response

## How to Think About Sensitivity

Do NOT use keyword matching. Use editorial reasoning.

**The "specific person" test**: Is this story about a specific identifiable person who has been harmed, killed, or victimized? If yes, the story must center that person's dignity. Gamification, advertising, and engagement mechanics are exploitative in this context.

**The "child" test**: Does this story involve a minor (under 18) as a victim? If yes, sensitivity is automatically elevated to at least "high." A child's death is "critical" — there is no scenario where ads or gamification are appropriate next to a child's death.

**The "active investigation" test**: Is there an ongoing criminal investigation with no identified suspects? If yes, any interactive element that invites speculation, theorizing, or engagement with the criminal aspects is harmful. Stick to verified facts and community resources.

**The "community grief" test**: Is a specific community (neighborhood, school, congregation) actively grieving? If yes, the interactive format should serve that community, not extract engagement from it.

**The "systemic vs. individual" test**: This is the most nuanced distinction.
- "7 people have died in fires this year" → systemic risk → interactive safety tools EMPOWER readers → standard treatment with data viz is appropriate
- "A 15-year-old was shot and killed on Glenwood Avenue" → individual tragedy → interactive tools would EXPLOIT the event → sensitive treatment required
- "32% of residents feel unsafe" → survey data about a systemic condition → data exploration is appropriate
- "A mother of three was killed in a hit-and-run" → individual tragedy → sensitive treatment required

The key: when a story is about a PATTERN (fire deaths as a trend, safety perceptions across neighborhoods), data tools help people understand and protect themselves. When a story is about a PERSON (a named victim, a specific family), data tools commodify suffering.

**The "would you run this ad?" test**: Imagine the specific ad placements. Would you put a DraftKings ad next to a story about a child who was shot? Would you put an insurance ad interstitial between a reader's input and results about a homicide victim? If the answer is obviously no, the design constraints should enforce that.

**The "tone" test**: Read the story aloud. If the appropriate human response is silence, grief, or anger — not curiosity or planning — then the story-app should create space for that response, not redirect it into engagement metrics.

## Sensitivity Levels

- **low**: Standard news content. Data-driven, systemic, civic, recreational, or service journalism. Interactive tools add genuine value. Ads are appropriate. Examples: Opening Day planner, park visit guide, bridge detour calculator.

- **moderate**: Serious but systemic. The story involves risk, harm, or community concern, but is about patterns and data, not specific individual victims. Interactive tools still empower, but tone should be serious. Ads should be relevant (not frivolous). Examples: Fire safety assessment (7 deaths as a trend), neighborhood safety survey, flood risk tool.

- **high**: Individual harm or acute community impact. The story involves identified victims, active danger, or acute community distress. Interactive elements should be limited to resources and information. Ads should be disabled or limited to public service. Gamification is inappropriate. Examples: Mass casualty event with named victims, school threat, environmental contamination affecting specific families.

- **critical**: A child's death, mass casualty, hate crime, suicide, or event where any engagement optimization would be exploitative. No ads. No gamification. No data viz. No polls. The story-app exists only to serve the community: resources, verified facts, and space for human response. Examples: Child killed by violence, mass shooting, suicide cluster.

## Sensitivity Flags

Detect and flag any that apply:
- "minor-victim" — victim is under 18
- "named-deceased" — a specific person who died is named in the story
- "active-investigation" — police/authorities are still investigating, no arrests
- "gun-violence" — involves firearms
- "mass-casualty" — 3+ people killed or injured in a single event
- "hate-crime" — motivated by bias against a protected class
- "suicide" — involves suicide or self-harm
- "sexual-assault" — involves sexual violence
- "domestic-violence" — involves intimate partner or family violence
- "child-endangerment" — a child was at risk or harmed
- "community-grief" — a specific community is actively mourning
- "active-threat" — ongoing danger to the public
- "graphic-content" — story describes graphic injury or death
- "school-related" — involves a school, students, or school setting

## Output Format

Respond with ONLY a JSON object. No markdown, no explanation outside the JSON.

{
  "sensitivityLevel": "low" | "moderate" | "high" | "critical",
  "recommendedTreatment": "standard-interactive" | "sensitive-community" | "do-not-convert",
  "designConstraints": {
    "disableAds": boolean,
    "disableGamification": boolean,
    "disableDataViz": boolean,
    "disablePolls": boolean,
    "disableInterstitials": boolean,
    "disableSponsoredInsights": boolean,
    "requireCommunityFocus": boolean,
    "requireCrisisResources": boolean,
    "toneOverride": null | "serious" | "somber" | "urgent"
  },
  "suggestedFocus": "Brief description of what the story-app should center",
  "flags": ["array", "of", "detected", "flags"],
  "reasoning": "2-3 sentences explaining the editorial logic. Be specific about WHY.",
  "publisherAdvisory": "Direct, actionable note to the editor. Write as if advising a junior producer. Be specific about what to do and NOT do."
}`

export default async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured', fallback: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // GET: retrieve cached analysis
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const storyId = url.searchParams.get('storyId')
    if (!storyId) {
      return new Response(JSON.stringify({ error: 'storyId required' }), { status: 400 })
    }
    // Read from Supabase via client
    return new Response(JSON.stringify({ message: 'Use client-side Supabase for reads' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body = await req.json()
    const { storyId, storyText, headline, category } = body

    if (!storyId || !storyText) {
      return new Response(JSON.stringify({ error: 'storyId and storyText required' }), { status: 400 })
    }

    // Build the user message with all available context
    let userMessage = `Analyze this news story for sensitivity:\n\n`
    if (headline) userMessage += `HEADLINE: ${headline}\n`
    if (category) userMessage += `CATEGORY: ${category}\n`
    userMessage += `\nSTORY TEXT:\n${storyText}\n\nProvide your sensitivity analysis as JSON.`

    // Use Sonnet for editorial judgment (not Haiku)
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return new Response(JSON.stringify({ error: 'API error', fallback: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const data = await response.json()
    let analysisText = data.content?.[0]?.text || ''

    // Parse JSON from response (handle potential markdown wrapping)
    let analysis
    try {
      analysis = JSON.parse(analysisText)
    } catch {
      // Try extracting JSON from markdown code block
      const match = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) {
        analysis = JSON.parse(match[1].trim())
      } else {
        throw new Error('Could not parse analysis response')
      }
    }

    // Persist to Supabase if service role key is available
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && supabaseServiceKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/story_analyses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            story_id: storyId,
            story_text: storyText,
            sensitivity_level: analysis.sensitivityLevel,
            recommended_treatment: analysis.recommendedTreatment,
            design_constraints: analysis.designConstraints,
            suggested_focus: analysis.suggestedFocus,
            flags: analysis.flags,
            reasoning: analysis.reasoning,
            publisher_advisory: analysis.publisherAdvisory,
            model_used: 'claude-sonnet-4-5-20250514',
          }),
        })
      } catch (e) {
        console.error('Supabase persist error:', e)
        // Non-fatal — still return the analysis
      }
    }

    return new Response(JSON.stringify({ analysis, storyId }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('Function error:', err)
    return new Response(JSON.stringify({ error: err.message, fallback: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

export const config = {
  path: '/.netlify/functions/analyze-story',
}
