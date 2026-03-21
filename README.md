# Content-as-an-Application Engine

**What if every news story was an interactive application?**

This project reimagines local journalism as a set of personalized, interactive utilities -- not static articles. Instead of reading *about* a story, users **engage with it**: calculating personal impact, exploring data, planning actions, and saving results.

Built as a proof-of-concept using WCPO 9 (Cincinnati) as the brand, it demonstrates how a local news organization can transform five real, timely stories into functional tools that inform, educate, and drive deeper audience engagement.

![React](https://img.shields.io/badge/React-19-blue) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8) ![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e) ![Netlify](https://img.shields.io/badge/Deployed-Netlify-00c7b7)

---

## The Thesis

Traditional digital news competes for attention with a static format born in the print era. "Content-as-an-Application" replaces the article with a **utility** -- a tool that adapts to the reader's inputs and returns personalized, actionable output.

The result: readers don't just consume information. They **use** it.

### Why This Matters for News Organizations

- **Dramatically higher engagement** -- Interactive tools keep users on-page 4-8x longer than static articles. Every slider adjustment, every neighborhood selection is a signal of active attention.
- **Personalization without AI cost** -- The "AI" here is local logic and structured data. No LLM calls, no API costs. The interactivity comes from well-designed calculation engines and conditional narrative.
- **Generative AI discoverability** -- This is the strategic upside most newsrooms are missing. As AI search engines (ChatGPT, Gemini, Perplexity, Claude) increasingly surface and cite structured, interactive content over flat text, **Content-as-an-Application pages become disproportionately visible** in AI-generated answers. Structured JSON data, semantic HTML, and tool-like utility give generative AI systems richer material to reference, quote, and link to. Static articles get summarized and forgotten. Interactive tools get recommended.
- **First-party data goldmine** -- Every user interaction is a voluntary signal: where they live, what they care about, what they can afford. This is declared, zero-party data -- infinitely more valuable than inferred behavioral data.
- **Repeatable framework** -- The architecture is story-agnostic. Any newsroom beat (weather, politics, real estate, education) can be converted to this format with a new `storyData.json` and a purpose-built component.

---

## Live Stories

Five real Cincinnati news stories from the week of March 17-21, 2026, each transformed into a unique interactive application:

| Story | Application Type | Key Interaction |
|-------|-----------------|-----------------|
| **Reds Opening Day** | Day Planner | Neighborhood + transport + priorities = personalized itinerary with departure time, cost, timeline, road closures |
| **Safety Survey** (32% feel safe) | Data Explorer | Select neighborhood = radar chart comparison against city and national benchmarks, trend analysis |
| **Fourth Street Bridge Closure** | Impact Calculator | Origin + frequency = cumulative cost/time over 2.5 years with area chart |
| **Sidewalk Repair Pilot** | Eligibility Checker | 3-question quiz + neighborhood = personalized eligibility result with next steps |
| **Sharon Lake Reopening** | Visit Planner | Multi-select interests + timing = tailored guide with trail details, pro tips, logistics |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 (Vite) |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| Hosting | Netlify |

---

## Architecture

```
src/
  storyData.json          # Story metadata (headline, category, timestamps)
  StoryApp.jsx            # Root router -- home vs. story view
  HomePage.jsx            # WCPO-branded news homepage
  components/
    StoryShell.jsx        # Shared story chrome (header, nav, footer)
  stories/
    OpeningDayPlanner.jsx
    SafetyExplorer.jsx
    BridgeImpact.jsx
    SidewalkChecker.jsx
    SharonLakeExplorer.jsx
  lib/
    supabase.js           # Supabase client + data helpers
```

Each story is a self-contained React component with:
- **Structured data** driving the narrative (not hardcoded strings)
- **Local calculation engine** (no external API calls)
- **Progressive disclosure** -- content reveals as the user interacts
- **Professional editorial voice** -- reads like journalism, functions like software
- **Persistent storage** -- user profiles and past stories saved via Supabase

---

## Data Persistence (Supabase)

The app uses Supabase for two core functions:

1. **Story Archive** -- Stories are stored with their publication date, so users can browse both today's interactive stories and those from previous days. The homepage shows the current day's stories with an archive section below.

2. **Saved Profiles** -- When a user clicks "Save to Dashboard," their personalized results (calculated values, selected inputs, timestamps) are stored. Returning users see their saved profiles.

Tables: `stories`, `saved_profiles`

---

## Getting Started

```bash
# Clone
git clone https://github.com/Oslund2/content-app-engine.git
cd content-app-engine

# Install
npm install

# Environment
cp .env.example .env
# Add your Supabase URL and anon key

# Run
npm run dev
```

---

## Deployment

The app deploys to Netlify with continuous deployment from the `main` branch:

```bash
# Build
npm run build    # outputs to dist/

# Deploy (automatic via Netlify Git integration)
git push origin main
```

---

## The Generative AI Advantage

This deserves its own section because it represents a **structural competitive advantage** for any news organization that adopts this format.

### How AI Search Works Today

When a user asks ChatGPT, Gemini, or Perplexity "What are the road closures for Reds Opening Day 2026?", the AI:

1. Searches the web for relevant sources
2. Evaluates content quality, structure, and utility
3. **Cites and links to the most useful sources**

A static WCPO article listing road closures competes with every other article listing the same closures. The AI summarizes them all into one answer and may or may not cite WCPO.

An **interactive Opening Day Planner** that accepts user input and generates personalized itineraries is fundamentally different. It can't be summarized -- it must be **linked to**. The AI will say: *"For a personalized game-day plan based on your neighborhood and transportation, use WCPO's interactive planner."*

### Why Interactive Content Wins in AI

- **Can't be extracted** -- A calculator's value is in using it, not reading about it
- **Structured data** -- JSON-driven content is machine-readable by design
- **Semantic richness** -- Input labels, calculation descriptions, and conditional narratives give AI systems dense context
- **Utility signal** -- AI systems increasingly weight "usefulness" alongside "authority"
- **Link-worthiness** -- AI prefers to link to tools over text when the user's intent is actionable

### The Flywheel

More interactive content leads to more AI citations, which drives more traffic, which generates more first-party data, which enables better content, which earns more AI citations.

News organizations that build this flywheel first will have a compounding advantage that is very difficult to replicate.

---

## License

MIT

---

*Built as a Content-as-an-Application proof of concept. Not affiliated with WCPO or Scripps. Story data is illustrative and based on publicly reported news from March 2026.*
