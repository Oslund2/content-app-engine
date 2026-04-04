# Content-as-an-Application Engine

**What if every news story was an interactive application?**

![React](https://img.shields.io/badge/React-19-blue) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8) ![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e) ![Netlify](https://img.shields.io/badge/Deployed-Netlify-00c7b7)

---

## The Problem with Reading the News

A reader opens a story about fire deaths in their city. They read it, feel something, close the tab. Maybe they share it. Probably they don't.

That reader lives in the neighborhood where the fires happened. They have aging wiring and no working smoke detector. The story was *about* them, but it never *reached* them -- not really. It informed them in the abstract. It did not move them to act.

This is the fundamental failure of the article format: **it talks at people instead of engaging with them.** It delivers information uniformly to an audience that experiences the world in deeply personal, place-specific ways. A story about bridge closures affects a West Side commuter and an East Side retiree in completely different ways -- but the article treats them identically.

Content-as-an-Application fixes this. Instead of reading *about* a story, the reader **engages with it**: entering their neighborhood, their situation, their concerns. The application responds with personalized results -- their commute impact, their safety score, their eligibility, their risk level. The story becomes *theirs*.

---

## Connecting Stories to Readers, Readers to Community, Community to Each Other

### The Reader-to-Story Connection

Every story app begins with a question directed at the reader: *Where do you live? How do you commute? What concerns you?* This is not a survey -- it's the story adapting to the reader's reality. A fire safety assessment that returns "Your neighborhood, West Price Hill, has had 3 fires this year and your housing stock dates to 1925" creates a fundamentally different relationship than a headline that reads "7 Die in Cincinnati Fires."

The reader sees themselves in the data. The story is no longer about a statistic. It's about *their home*.

### The Reader-to-Community Connection

When a reader completes a story app, their anonymized responses join a live community dataset. The platform shows them how their neighbors responded:

- **Live polling** surfaces real-time community sentiment: "23% of respondents in your neighborhood have no working smoke detector."
- **Neighborhood dashboards** aggregate engagement across all stories by geography, showing which neighborhoods are most active, what issues resonate where, and how local engagement compares across the city.
- **Community reflections** -- for sensitive stories involving loss -- create a shared space where readers can express solidarity without performative engagement. After a shooting death of a teenager, readers select a commitment ("I'm going to check on a young person in my life today") and see a live count of neighbors who chose the same.

The reader discovers they are not alone. Their concern is shared. Their neighborhood is paying attention.

### The Community-to-Community Connection

A web of **42 conditional cross-story rules** connects readers across topics based on their specific inputs. A West Side resident who completes the fire safety assessment is shown the sidewalk repair eligibility checker -- because the same infrastructure neglect affects both. A reader worried about flood risk sees the storm readiness check. A parent checking car seat safety is connected to school zone data.

These aren't generic "related stories" links. They are **contextual, personalized recommendations** driven by the reader's neighborhood, their scores, and their stated concerns. The platform builds a narrative thread that follows the reader across the issues shaping their community, creating an engagement loop no static article can replicate.

---

## Story Apps at Scale: From Craft to Engine

### The Old World

Interactive news applications have always been powerful. The New York Times' dialect quiz, the Washington Post's election simulators, ProPublica's investigative tools -- these are among the most-shared, most-cited, most-remembered pieces of journalism ever published.

They were also among the most expensive. Each one required weeks of development by specialized teams: a journalist to report the story, a designer to envision the interaction, a developer to build the tool, a data engineer to structure the inputs. The result was beautiful but rare. A large newsroom might produce a handful per year. A local newsroom? Maybe none.

This created a structural inequity: the journalism that connects most deeply with readers -- the kind they *use*, not just *read* -- was available only to organizations with six-figure interactive budgets and dedicated news apps teams. Local news, the journalism closest to people's daily lives, was locked out of the format entirely.

### The New World

This engine changes that equation. An **automated pipeline** transforms any news story into a fully interactive story app:

1. **RSS feeds are monitored** every 15 minutes for new stories
2. **AI analysis** (Claude) evaluates each story for interactive potential and generates a complete application configuration -- inputs, calculations, result logic, chart specifications, narrative prompts
3. **A config-driven renderer** turns that configuration into a working interactive application with no custom code required
4. **Editorial review** provides human oversight before publication

The result: a local newsroom can deploy interactive story apps on virtually every story that warrants one, at a pace that was previously impossible. The limiting factor is no longer engineering capacity -- it's editorial judgment about which stories benefit most from the format.

Hand-crafted story apps still exist in the system for flagship pieces that deserve bespoke design. But the engine ensures that interactivity is no longer a luxury reserved for special projects. It's a standard publishing capability.

---

## Built-in Sensitivity and Editorial Judgment

Not every story should be treated the same way. A story about Opening Day parking is not the same as a story about a teenager shot in Avondale. The engine knows the difference.

### AI-Powered Sensitivity Analysis

Every story passes through an **editorial sensitivity classifier** powered by Claude that applies structured reasoning -- not keyword matching -- to determine how the interactive version should behave. The system applies a series of editorial judgment tests:

- **The "specific person" test**: Is this about an identifiable person who was harmed? Individual tragedies require different treatment than systemic patterns.
- **The "child" test**: Does it involve a minor victim? Automatically elevated to high or critical sensitivity.
- **The "would you run this ad?" test**: Would commercial placements feel exploitative alongside this content?
- **The "systemic vs. individual" test**: This is the core distinction. "7 people died in fires this year" is a pattern -- data tools *empower* readers to assess their own risk. "A 15-year-old was shot on Glenwood Avenue" is an individual tragedy -- interactive tools risk *exploiting* suffering. The system treats them differently.

### Four Sensitivity Levels

| Level | Treatment | Example |
|-------|-----------|---------|
| **Low** | Full interactivity, ads, polls, gamification | Park visit planner, Opening Day itinerary |
| **Moderate** | Serious tone, relevant ads only, data exploration appropriate | Fire safety assessment (systemic pattern), neighborhood safety survey |
| **High** | No ads, no gamification, resource-focused | Active investigation, named victims, acute community distress |
| **Critical** | No ads, no polls, no data visualization. Community reflection only | Child's death, mass casualty, hate crime |

### What This Means in Practice

When the engine encounters a story about a fatal house fire:
- **Interstitial ads** between inputs and results are suppressed
- **Sponsored content cards** are removed entirely
- **Live polls** may be disabled if community grief is acute
- **Narrative tone** shifts from informational to serious, somber, or urgent depending on severity
- **The story app's focus** redirects from engagement to **community resources, crisis contacts, and solidarity**

For the most sensitive stories -- a child's death, a mass shooting -- the engine produces a **community response space**: verified facts, age-appropriate guidance for parents, crisis resources, and a place where readers can express solidarity without performative engagement. No scores. No gamification. No ads. Just community.

### Editorial Override

AI classification is a starting point, not a verdict. Editors can review and override any sensitivity determination through the admin dashboard. The system provides a **publisher advisory** with each analysis explaining its reasoning, so editorial judgment is informed rather than replaced.

---

## The Generative AI Advantage

This deserves its own section because it represents a **structural competitive advantage** for any news organization that adopts this format.

When a user asks ChatGPT, Gemini, or Perplexity "What are the road closures for Reds Opening Day 2026?", the AI searches the web, evaluates content quality, and **cites the most useful sources**. A static article listing road closures competes with every other identical list. The AI summarizes them all and may or may not cite yours.

An **interactive Opening Day Planner** that accepts the reader's neighborhood and transportation mode and generates a personalized itinerary is fundamentally different. It can't be summarized -- it must be **linked to**. The AI will say: *"For a personalized game-day plan based on your neighborhood, use WCPO's interactive planner."*

**Why interactive content wins in AI search:**

- **Can't be extracted** -- A calculator's value is in using it, not reading about it
- **Structured data** -- JSON-driven content is machine-readable by design
- **Utility signal** -- AI systems increasingly weight usefulness alongside authority
- **Link-worthiness** -- AI prefers to link to tools over text when the user's intent is actionable

**The flywheel:** More interactive content leads to more AI citations, which drives more traffic, which generates more first-party data, which enables better content, which earns more citations. News organizations that build this flywheel first will have a compounding advantage that is very difficult to replicate.

---

## Live Stories

Real Cincinnati news stories transformed into interactive applications:

| Story | Application Type | Key Interaction |
|-------|-----------------|-----------------|
| **Reds Opening Day** | Day Planner | Neighborhood + transport + priorities = personalized itinerary |
| **Safety Survey** | Data Explorer | Select neighborhood = radar chart vs. city and national benchmarks |
| **Fourth Street Bridge** | Impact Calculator | Origin + frequency = cumulative cost/time over 2.5 years |
| **Sidewalk Repair Pilot** | Eligibility Checker | 3-question quiz + neighborhood = eligibility with next steps |
| **Sharon Lake Reopening** | Visit Planner | Multi-select interests + timing = tailored guide |
| **Fire Crisis** | Safety Assessment | Home details = personalized risk score with resources |
| **Keys Talk** | Decision Guide | Aging parent's driving signs = action plan with conversation starters |

*Plus AI-generated story apps published daily from the RSS pipeline.*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 (Vite) |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Text-to-Speech | Edge TTS (no API key) |
| Database | Supabase (PostgreSQL) |
| AI Pipeline | Claude (Anthropic) |
| Hosting | Netlify (Functions + CDN) |

---

## Architecture

```
src/
  StoryApp.jsx               # Root router (home / story / topic / embed)
  HomePage.jsx               # WCPO-branded news homepage with hero rotation
  TopicPage.jsx              # Themed story collections
  storyData.json             # Legacy story metadata
  connections.json           # 42 cross-story recommendation rules
  adConfig.json              # Sponsor integration config

  stories/                   # Hand-crafted story components (13)
  renderer/                  # Config-driven rendering engine
    StoryRenderer.jsx        #   Orchestrator (config → interactive app)
    BlockRenderer.jsx        #   Block-based composition system
    ConfigContext.jsx         #   React Context for formula evaluation
    FormulaEngine.js         #   Safe math parser (no eval())
    sections/                #   Hero, Input, Result, Chart, ArticleBody
    inputs/                  #   Slider, Radio, Checkbox, Dropdown, Quiz
    blocks/                  #   StatDashboard, Timeline, Collapsible, etc.
    charts/                  #   Bar, Area, Radar, ScoreCard, GradeDisplay

  components/
    StoryShell.jsx           # Shared chrome (header, nav, footer, embed)
    EmbedShareModal.jsx      # Universal embed code export
    LivePoll.jsx             # Real-time community polling
    DynamicNarrative.jsx     # AI-personalized narrative
    StoryConnections.jsx     # Contextual cross-story recommendations
    SaveButton.jsx           # Persistent result profiles
    AdSlot.jsx               # Sensitivity-aware ad placement
    AdminHub.jsx             # Editorial dashboard
    SensitivityAdmin.jsx     # Sensitivity analysis review
    StoryPipeline.jsx        # AI pipeline management

  hooks/
    useStoryConstraints.js   # Sensitivity constraint loader
    useNarration.js          # Text-to-speech controller

  lib/
    supabase.js              # Database client + all queries

netlify/functions/           # Serverless backend
  rss-ingest.mjs             # RSS feed polling (every 15 min)
  process-stories.mjs        # AI story generation (every 30 min)
  analyze-story.mjs          # Sensitivity classification
  build-topic.mjs            # Topic collection assembly
  narrative.mjs              # Personalized narrative generation
  tts.mjs                    # Text-to-speech API
  lib/pipeline.mjs           # Core AI processing pipeline
```

---

## Embed System

Every story app can be embedded on any external website via a universal embed code. Readers viewing any story can click the **Share** icon in the header to get a copy-paste `<iframe>` snippet with configurable height. Stories render in a clean embed mode -- no navigation chrome, no back button, faster transitions.

The admin Embed Center provides editors with embed codes for all stories in one place.

---

## Data Persistence (Supabase)

| Table | Purpose |
|-------|---------|
| `generated_stories` | AI-generated story configs, status, metadata |
| `rss_items` | Ingested RSS feed items with worthiness scores |
| `stories` | Legacy story metadata |
| `saved_profiles` | User-saved personalized results (session-based) |
| `story_polls` | Live community poll responses |
| `community_reflections` | Solidarity commitments and messages |
| `story_analyses` | AI sensitivity classifications + editorial overrides |
| `topics` | Themed story collections |

All user data is **session-based and anonymous** -- a random UUID in localStorage. No login, no PII, no tracking. Every interaction is voluntary, zero-party data.

---

## Getting Started

```bash
git clone https://github.com/Oslund2/content-app-engine.git
cd content-app-engine
npm install

cp .env.example .env
# Add Supabase URL, anon key, service role key, and Anthropic API key

npm run dev
```

---

## Deployment

Deploys to Netlify with continuous deployment from `master`:

```bash
npm run build    # Vite → dist/
git push origin master
```

Or deploy directly: `npx netlify deploy --prod`

---

## License

MIT

---

*Built as a Content-as-an-Application proof of concept. Not affiliated with WCPO or Scripps. Story data is illustrative and based on publicly reported news.*
