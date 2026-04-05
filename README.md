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
5. **Hero images** are automatically extracted from source articles and can be searched, replaced, or removed by editors before publishing

The result: a local newsroom can deploy interactive story apps on virtually every story that warrants one, at a pace that was previously impossible. The limiting factor is no longer engineering capacity -- it's editorial judgment about which stories benefit most from the format.

Hand-crafted story apps still exist in the system for flagship pieces that deserve bespoke design. But the engine ensures that interactivity is no longer a luxury reserved for special projects. It's a standard publishing capability.

---

## Any Source, Original Work

Story apps can be built from any news source -- local reporting, wire services, national outlets, press releases, public data. The engine is designed to ingest broadly while producing something fundamentally new.

This is not republishing. A story app does not reproduce the original article's text, structure, or expression. The pipeline reads source material for **facts, data points, and public-interest context**, then generates an entirely original interactive application: new language, new structure, new functionality that did not exist in the source. An article about aging drivers becomes a personalized decision guide with scored assessments and conversation starters. A report on bridge closures becomes an impact calculator that returns your cumulative commute cost over 2.5 years. The source informed the *subject matter*. The story app is a new *work*.

**How the engine avoids copyright concerns:**

- **No text reproduction** -- The AI pipeline generates all copy, headlines, subheads, input labels, result narratives, and editorial framing from scratch. Source text is never quoted, excerpted, or paraphrased at length.
- **Transformative function** -- The output is a software application, not an article. It accepts user input, performs calculations, renders personalized results, and provides interactive utility. This is a fundamentally different purpose and character than the source material.
- **Facts are not copyrightable** -- The factual substrate of journalism (dates, statistics, public statements, event details) is not protected by copyright. The engine works with facts, not expression.
- **Source attribution** -- Every generated story app includes a visible attribution link to the original reporting, crediting the journalist and publication. This drives traffic back to the source rather than diverting it.
- **Editorial review gate** -- No story app publishes automatically. Human editors review every generated application before it goes live, ensuring originality and appropriate treatment of source material.

The result is a system that can draw from the full breadth of public-interest reporting -- any beat, any outlet, any wire -- and produce original interactive journalism that adds value no article can provide.

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

## Monetization: Three Revenue Layers

Story apps generate revenue through three reinforcing channels:

1. **Addressable advertising** -- Every interaction is a declared signal. When a reader selects their neighborhood, indicates they commute by car, or reveals they rent rather than own, they are voluntarily disclosing targeting data that no cookie or tracking pixel can match. The platform supports **sensitivity-aware ad placements** -- interstitial ads between inputs and results, sponsored result cards, and inline sponsor integrations -- all gated by the editorial sensitivity system so ads never appear alongside tragedy. Advertisers can target by geography, interest, and situation with precision that programmatic display cannot approach.

2. **Engagement depth** -- Interactive story apps keep readers on-page 4-8x longer than static articles. Every slider adjustment, every quiz answer, every neighborhood selection is active attention -- not passive scrolling. This engagement translates directly into higher CPMs, stronger sponsorship value, and deeper brand association for advertisers embedded in the experience.

3. **First-party data collection** -- Every completed story app produces a rich, voluntary user profile: where the reader lives, what they care about, what their situation is. This zero-party data feeds back into **addressability** (more precise ad targeting) and **personalization** (better cross-story recommendations, smarter narrative generation, more relevant content). The cycle compounds: better personalization drives deeper engagement, which produces richer data, which enables more addressable inventory, which commands higher rates.

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
| Framework | React 19 (Vite 8) |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Text-to-Speech | Edge TTS (no API key) |
| Database | Supabase (PostgreSQL) |
| AI Pipeline | Claude Sonnet + Haiku (Anthropic) |
| Hosting | Netlify (Functions + Edge Functions + CDN) |
| Social Previews | Netlify Function (dynamic OpenGraph) |
| Image Search | Unsplash + NASA Images API (rights-free) |

---

## Architecture

```
src/
  StoryApp.jsx               # Root router (home / story / topic / embed)
  HomePage.jsx               # WCPO-branded news homepage with hero rotation + search
  TopicPage.jsx              # Themed story collections
  storyData.json             # Legacy story metadata
  connections.json           # 42 cross-story recommendation rules
  adConfig.json              # Sponsor integration config

  stories/                   # Hand-crafted story components (13)
  renderer/                  # Config-driven rendering engine
    StoryRenderer.jsx        #   Orchestrator (config -> interactive app)
    BlockRenderer.jsx        #   Block-based composition system
    ConfigContext.jsx         #   React Context for formula evaluation
    FormulaEngine.js         #   Safe math parser (no eval())
    normalizeConfig.js       #   Bridges AI output -> renderer expectations
    sections/                #   Hero (with image), Input, Result, Chart, ArticleBody
    inputs/                  #   Slider, Radio, Checkbox, Dropdown, Quiz, ButtonArray
    blocks/                  #   StatDashboard, Timeline, Collapsible, ComparisonTable,
                             #   FactCheck, InfoCard, ProgressiveQuiz, StepGuide, etc.
    charts/                  #   Bar, Area, Radar, ScoreCard, GradeDisplay

  components/
    StoryShell.jsx           # Shared chrome (header, nav, footer, embed)
    EmbedShareModal.jsx      # Share modal: Copy Link, Twitter/X, Facebook, LinkedIn,
                             #   Email, native mobile share, embed code export
    LivePoll.jsx             # Real-time community polling
    DynamicNarrative.jsx     # AI-personalized narrative (Claude Haiku)
    StoryConnections.jsx     # Contextual cross-story recommendations
    SaveButton.jsx           # Persistent result profiles
    AdSlot.jsx               # Sensitivity-aware ad placement
    AdminHub.jsx             # Editorial dashboard (Pipeline, Topics, Sensitivity, Analytics)
    SensitivityAdmin.jsx     # Sensitivity analysis review + override
    StoryPipeline.jsx        # AI pipeline management (RSS Queue, Drafts with image
                             #   rights gate, Published, Add URL, Rejected, Skipped)

  hooks/
    useStoryConstraints.js   # Sensitivity constraint loader
    useNarration.js          # Text-to-speech controller

  lib/
    supabase.js              # Database client + all queries + analytics
    readTime.js              # Content-based read time estimation

netlify/functions/           # Serverless backend
  lib/
    pipeline.mjs             # Core AI processing pipeline (triage -> config -> sensitivity)
    web-search.mjs           # Google News + RSS source discovery
    feeds.mjs                # Centralized RSS feed configuration (single source of truth)
  rss-ingest.mjs             # RSS feed polling (scheduled)
  rss-invoke.mjs             # Manual RSS ingestion trigger
  process-invoke.mjs         # Story generation trigger (supports ?force=true override)
  process-item-worker-background.mjs  # Background AI processing (15-min timeout)
  process-stories.mjs        # Batch story processing (scheduled)
  build-topic.mjs            # Topic collection assembly
  build-topic-background.mjs # Background topic builder with auto-publish
  analyze-story.mjs          # Sensitivity classification (Claude Sonnet)
  narrative.mjs              # Personalized narrative generation (Claude Haiku)
  tts.mjs                    # Text-to-speech API (Edge TTS)
  ingest-url.mjs             # External URL ingestion (with SSRF protection)
  find-story.mjs             # AI-powered story finder (scans national feeds)
  image-search.mjs           # Rights-free image search (Unsplash, NASA, Pixabay)
  og-meta.mjs                # Dynamic OpenGraph meta tags for social sharing
  topic-refresh.mjs          # Topic story refresh + auto-publish

```

---

## Publisher Tools

The admin dashboard (accessible via the gear icon on the homepage) provides a complete editorial workflow:

### Story Pipeline
- **RSS Queue** -- Incoming articles with AI worthiness scores; inline **Build Anyway** override when the AI skips a story
- **Drafts** -- Preview, approve, or reject generated stories; manage hero images; rights-check gate before publishing
- **Published** -- Manage published stories, unpublish
- **Add URL** -- Paste any article URL or use AI Story Finder to scan national feeds
- **Rejected / Skipped** -- Review rejection history and AI-skipped articles with skip reasons

### Hero Images & Rights Protection
Each story can have a hero image displayed at the top. The system enforces rights-free image usage:
- **Auto-extracted** from source article OG tags during pipeline processing (flagged as unverified)
- **Rights-free search** -- Image search returns results from **Unsplash** (free license) and **NASA Images** (public domain), with optional **Pixabay** support
- **Publish gate** -- When approving a story with an unverified image, editors see a warning: *"No rights-free image found."* with options to search for a rights-free image, paste their own URL, or publish without an image
- **Domain whitelist** -- Images from `unsplash.com`, `nasa.gov`, `pixabay.com`, and `wikimedia.org` are considered rights-cleared; all others trigger the warning
- **Optional** -- stories can publish without an image

### Topic Pages
Group stories into themed collections with custom titles, accent colors, and hero stats.

### Sensitivity Analysis
Review AI sensitivity classifications, see detected flags, and override with editorial judgment.

### Analytics
View story engagement over 7/14/30 days: total views, views per story, daily trend chart, and top stories ranked by views.

---

## Social Sharing & SEO

### Share Modal
Every story has a Share button that opens a modal with:
- **Copy Link** to clipboard
- **Twitter/X**, **Facebook**, **LinkedIn** share buttons
- **Email** sharing
- **Native mobile share** (on supported devices)
- **Embed code** export with configurable height

### Dynamic OpenGraph Meta Tags
A Netlify Function (`/api/og?story=slug`) serves server-rendered HTML with the story's headline, description, and hero image for social crawlers. This ensures rich previews when links are shared on any platform.

Default OG tags are set in `index.html` for the homepage.

---

## Embed System

Every story app can be embedded on any external website via a universal embed code. Stories render in a clean embed mode -- no navigation chrome, no back button, faster transitions.

---

## Data Persistence (Supabase)

| Table | Purpose |
|-------|---------|
| `generated_stories` | AI-generated story configs, status, metadata, hero images |
| `rss_items` | Ingested RSS feed items with worthiness scores + skip reasons |
| `stories` | Legacy story metadata |
| `saved_profiles` | User-saved personalized results (session-based) |
| `story_polls` | Live community poll responses |
| `community_reflections` | Solidarity commitments and messages |
| `story_analyses` | AI sensitivity classifications + editorial overrides |
| `topics` | Themed story collections |
| `page_views` | Anonymous story view analytics (session-based) |

All user data is **session-based and anonymous** -- a random UUID in localStorage. No login, no PII, no tracking. Every interaction is voluntary, zero-party data.

---

## Getting Started

```bash
git clone https://github.com/Oslund2/content-app-engine.git
cd content-app-engine
npm install

cp .env.example .env
# Required environment variables:
#   VITE_SUPABASE_URL        - Supabase project URL
#   VITE_SUPABASE_ANON_KEY   - Supabase anon/public key
#   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key (for serverless functions)
#   ANTHROPIC_API_KEY         - Claude API key (for AI pipeline)
#
# Optional:
#   PIXABAY_API_KEY            - Pixabay image search (adds rights-free photos)

npm run dev
```

---

## Deployment

Deploys to Netlify with continuous deployment from `master`:

```bash
npm run build    # Vite -> dist/
git push origin master
```

Or deploy directly: `npx netlify deploy --prod`

---

## License

MIT

---

*Built as a Content-as-an-Application proof of concept. Not affiliated with WCPO or Scripps. Story data is illustrative and based on publicly reported news.*

---

## Scaling Roadmap: Multi-City Deployment

This engine is built for Cincinnati but designed to scale to any city. Here's the plan for rapid multi-market deployment.

### The Problem

The Cincinnati instance has ~500 city-specific references across 45+ files:

| Category | References | Core Files |
|----------|-----------|------------|
| Brand/UI ("WCPO", "9 News") | 90+ | HomePage, StoryShell, TopicPage, AdminHub |
| City name ("Cincinnati") | 80+ | Pipeline prompts, UI, metadata |
| Neighborhoods | 200+ | NeighborhoodPulse, legacy stories, pipeline prompts |
| AI prompts | 50+ | narrative.mjs, pipeline.mjs, build-topic.mjs |
| RSS feeds (wcpo.com) | 5 | feeds.mjs |
| CSS brand colors | 90+ | index.css |
| Sports teams | 40+ | Legacy stories, adConfig |
| Legal/regulatory | 15+ | CarSeatSafety, SidewalkChecker |

### The Solution: Config-Driven Single Codebase

One repo, one deploy per city. Each instance reads from a **city config file** (`src/config/site.js`) that defines everything city-specific. To launch a new city: copy repo, edit config, deploy.

**Example `site.js` for Denver:**

```js
export default {
  // Brand
  station: 'KMGH',
  stationNumber: '7',
  stationTagline: 'Denver7',
  stationUrl: 'https://www.denver7.com',
  brandColor: '#0066cc',
  brandDark: '#1a1a2e',

  // Location
  city: 'Denver',
  state: 'Colorado',
  stateAbbr: 'CO',
  region: 'Front Range',
  metro: 'Denver Metro',

  // RSS Feeds
  feeds: [
    { name: 'news', url: 'https://www.denver7.com/news.rss' },
    { name: 'local-news', url: 'https://www.denver7.com/news/local-news.rss' },
    { name: 'sports', url: 'https://www.denver7.com/sports.rss' },
  ],

  // Neighborhoods
  neighborhoods: [
    'Capitol Hill', 'LoDo', 'RiNo', 'Five Points', 'Cherry Creek',
    'Highlands', 'Baker', 'Wash Park', 'Park Hill', 'Aurora', ...
  ],

  // Sports teams (for headline exceptions)
  sportsTeams: ['Broncos', 'Nuggets', 'Avalanche', 'Rockies', 'Rapids'],

  // Local resources
  areaCode: '303',
  emergencyResources: { ... },
}
```

### Refactor Phases

| Phase | Effort | What |
|-------|--------|------|
| 1. Extract city config | 1 day | Create `site.js` + server-side mirror, update CSS variables |
| 2. Brand context | 0.5 day | React context replacing all hardcoded "WCPO" / "Cincinnati" in UI |
| 3. Parameterize AI prompts | 0.5 day | Template variables (`{CITY}`, `{STATION}`) in all pipeline prompts |
| 4. Neighborhood extraction | 0.5 day | Move neighborhood arrays to config, update NeighborhoodPulse + pipeline |
| 5. Feed extraction | Done | Already centralized in `feeds.mjs` |
| 6. Legacy story cleanup | 0.5 day | Document what to delete per city (13 hand-built stories are Cincinnati-only) |
| **Total one-time refactor** | **~3 days** | |
| **Each new city after that** | **~2 hours** | Fill out config, set up Supabase + Netlify, deploy |

### Launching a New City (Post-Refactor)

```
1.  Fork/copy the repo                          1 min
2.  Edit src/config/site.js                     30 min
3.  Delete src/stories/ (legacy Cincinnati)      1 min
4.  Clean StoryApp.jsx legacy imports            5 min
5.  Create new Supabase project                 10 min
6.  Create new Netlify site                      5 min
7.  Set env vars (Supabase + Anthropic keys)     5 min
8.  Deploy                                       2 min
9.  RSS feeds start ingesting automatically     15 min
10. AI generates first local story apps         30 min
```

### What Doesn't Need to Change

These components are already city-agnostic and work for any market:

- **Block system** (17 block types) -- universal
- **FormulaEngine** -- city-agnostic math
- **Config renderer** (StoryRenderer, BlockRenderer, all blocks/inputs/charts) -- fully config-driven
- **Sensitivity analysis framework** -- universal editorial principles
- **Ad system** -- config-driven (adConfig.json), just swap content
- **Analytics** -- page_views table works for any city
- **Share modal** -- uses dynamic URLs
- **Image search** -- rights-free sources (Unsplash, NASA) are universal
- **Read time estimation** -- content-based, city-agnostic

### Future: Multi-Tenant (Option B)

If managing 10+ separate deploys becomes painful, migrate to a single multi-tenant deploy where URL routing determines the city (`app.com/denver`, `app.com/nashville`) and city config is loaded from Supabase. This adds complexity (row-level DB isolation, dynamic theming) but eliminates per-city infrastructure management.
