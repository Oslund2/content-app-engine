const narrationScripts = {
  'fire-crisis': `7 Dead. 22 Fires. Cincinnati Has Never Seen This Before. In the first 11 weeks of 2026, residential fires have killed seven people in Cincinnati — a 500% increase over the same period last year. Fire officials say they have never seen a concentration like this in 25 years. The victims range from their 20s to their 70s. Three died in a single blaze in Spring Grove Village on January 17. In nearly every case, crews arrived within five minutes — but the fires were already fully involved. Not all homes had working smoke detectors. "We've never seen this before," said Assistant Chief Matt Flagler. "Not in this grouping. Not in 25 years."`,

  'opening-day': `Plan Your Perfect Opening Day. On Thursday, 80,000 people will descend on the Banks for the 150th Opening Day ceremony. Jeff Brantley rings the bell. The parade starts at noon. First pitch at 4:10. It's the closest thing Cincinnati has to a civic religion — and like any pilgrimage, it rewards those who plan. Tell us where you're coming from, and we'll build your game-day itinerary.`,

  'safety-survey': `How Safe Does Cincinnati Feel? When the ETC Institute surveyed more than 1,200 Cincinnati residents last fall, the results landed like a verdict: only 32% said they felt satisfied with safety in the city. That's down from 40% in 2023. In comparable cities nationwide, the figure is 53%. The gap isn't just statistical — it's a 21-point gulf between how safe Cincinnati residents feel and how safe residents of similar cities feel. But city-wide averages flatten a more complex geography. Hyde Park and Price Hill don't experience the same Cincinnati. Select your neighborhood to see where you stand.`,

  'bridge-impact': `The Bridge That Vanished. On January 12, the Fourth Street Bridge over the Licking River closed for good. On March 2, they blew it up. The controlled demolition took seconds. The replacement will take until summer 2028. For the 11,608 vehicles and 700 pedestrians who crossed it daily, the math is brutally simple: every trip now takes longer, costs more, and burns fuel on detour miles that didn't exist three months ago. Covington responded with a $750,000 grant for impacted businesses. TANK launched a free shuttle. But for daily commuters, the question is personal: what does 2.5 years of detours actually cost you?`,

  'sidewalk-repair': `The City Fixed 55 Sidewalks for Free. Here's a number that might surprise you: only 19% of Cincinnati residents are satisfied with the condition of sidewalks in their area. In Ohio, the repair burden falls on homeowners — not the city. A single panel replacement can run $500 to $2,500, a cost that's quietly regressive: the neighborhoods with the worst sidewalks tend to be the ones least able to fix them. Last year, City Council approved a $100,000 pilot targeting seven neighborhoods where the median household income falls below $50,000. Of 63 homeowners who applied, 58 qualified. Fifty-five repairs are done. Three more are scheduled for this spring. The question now: does the pilot expand? Let's find out if you'd qualify.`,

  'sharon-lake': `Sharon Lake Is Back. Two years of construction. $17 million invested. The largest improvement project in Great Parks' history is finished, and Sharon Lake officially reopened on March 19. The lake that generations of Cincinnati families grew up visiting is, by most accounts, transformed: doubled wetland habitat, new boardwalks extending into areas that were previously inaccessible, an ADA-compliant kayak launch, and a trail system that finally connects the lake to the Sharon Woods gorge. The boathouse won't open until summer. The harbor redesign starts this fall and finishes in 2028. But what's here now is more than enough to warrant your first visit. Tell us what you're into, and we'll build your guide.`,

  'bengals-draft': `You Have the 10th Pick. Who Do You Take? The Bengals spent $126 million on defense this offseason. Boye Mafe, Bryan Cook, Jonathan Allen — three starters in three days. But the draft is where dynasties are built, and at pick #10, Cincinnati is in range for a franchise-altering talent. The question isn't just who — it's why. Do you draft for the biggest remaining need, or take the best player available? Step into the war room and make the call.`,

  'fc-cincinnati': `Five Matches In. Where Is This Season Going? FC Cincinnati opened 2026 with the earliest home opener in franchise history — and promptly beat Atlanta 2-0. Five matches later, the Orange and Blue sit at 2W-2D-1L, with 8 points and a goal difference of +3. It's early. But early form has a way of becoming prophecy. Predict the next four matches, and we'll project where this season ends up.`,

  'storm-ready': `Are You Ready for What's Coming? On March 5, a tornado outbreak killed 6 people across Oklahoma and Michigan. The EF-3 that hit Three Rivers, Michigan collapsed a Menards store with shoppers inside. It was the state's deadliest tornado since 1980. Cincinnati wasn't in the direct path. But forecasters say the Ohio Valley corridor — that's us — faces an above-average severe weather risk through April and May. This Sunday, storms capable of hail, damaging winds, and spin-up tornadoes are already in the forecast. The difference between a close call and a catastrophe is almost always preparation. Take this 2-minute assessment and find out where you stand.`,

  'flood-risk': `The River Is Rising. What Does It Mean for You? Earlier this month, 1.5 to 3 inches of rain fell on already-saturated ground. The Great Miami River at Miamitown approached minor flood stage. The Little Miami at Milford triggered flood warnings. The Ohio River at Cincinnati is tracking toward action stage — 46 feet — this weekend. Most Cincinnatians know the river floods. Fewer know what each foot of water actually means for their commute, their property, or their neighborhood. This tool connects the gauge reading to your reality.`,

  'car-seat': `Is Your Child's Car Seat Installed Correctly? 73% of car seats have at least one critical installation error, according to the National Highway Traffic Safety Administration. Cincinnati Children's Hospital inspected over 2,000 car seats last year. Three out of four needed adjustment — a loose strap here, a mispositioned clip there, a seat angled wrong. Small details that parents can't see from the driver's seat. Details that determine whether a child walks away from a crash or doesn't. Most parents think they installed it correctly. Most are wrong. Take 2 minutes to check. Your child's safety depends on details you can't see from the driver's seat.`,

  'neighborhood-pulse': `The Pulse of Cincinnati. Every interaction across every story builds this picture. This is your city — as told by the people who live in it.`,
}

export default async (req) => {
  // GET: availability check — edge-tts is always available (no API key needed)
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ available: true }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // OPTIONS: CORS
  if (req.method === 'OPTIONS') {
    return new Response('', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type' },
    })
  }

  // POST: generate speech
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { EdgeTTS } = await import('@andresaya/edge-tts')

    const { storyId } = await req.json()
    let text = narrationScripts[storyId]

    // Fallback: fetch narration_script from generated_stories table
    if (!text) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && supabaseServiceKey) {
        try {
          const res = await fetch(
            `${supabaseUrl}/rest/v1/generated_stories?story_id=eq.${encodeURIComponent(storyId)}&select=narration_script`,
            {
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
            }
          )
          if (res.ok) {
            const rows = await res.json()
            if (rows.length > 0 && rows[0].narration_script) {
              text = rows[0].narration_script
            }
          }
        } catch (e) {
          console.error('Supabase fetch error:', e)
        }
      }
      if (!text) {
        return new Response(JSON.stringify({ error: 'No narration available' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }
    }

    const edgeTts = new EdgeTTS()
    await edgeTts.synthesize(text, 'en-US-GuyNeural', { rate: '-5%', pitch: '-2Hz' })
    const audioBuffer = edgeTts.toBuffer()

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800, s-maxage=604800',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('TTS function error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}

export const config = { path: '/.netlify/functions/tts' }
