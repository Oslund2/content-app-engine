import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Shield, Code2, Newspaper, Layers, Plus, Trash2, GripVertical, Save, Loader2, Sparkles, ExternalLink, CheckCircle2, Zap, Rocket, RefreshCw } from 'lucide-react'
import SensitivityAdmin from './SensitivityAdmin'
import StoryPipeline from './StoryPipeline'
import storyData from '../storyData.json'
import { fetchAllGeneratedStories, fetchAllTopics, upsertTopic, assignStoryToTopic, fetchAllStoriesByTopic, publishTopicAndStories } from '../lib/supabase'

const tabs = [
  { id: 'sensitivity', label: 'Sensitivity Analysis', icon: Shield },
  { id: 'embed', label: 'Embed Center', icon: Code2 },
  { id: 'pipeline', label: 'Story Pipeline', icon: Newspaper },
  { id: 'topics', label: 'Topic Pages', icon: Layers },
]

function EmbedCenter() {
  const [selected, setSelected] = useState(null)
  const [copied, setCopied] = useState(false)
  const [generatedStories, setGeneratedStories] = useState([])

  useEffect(() => {
    fetchAllGeneratedStories().then(data => setGeneratedStories(data || []))
  }, [])

  const legacyStories = storyData.stories.filter(s => s.id !== 'neighborhood-pulse')
  const genStories = generatedStories.map(s => ({
    id: s.story_id,
    headline: s.headline,
    category: s.category,
    categoryColor: s.category_color || '#dc2626',
    readTime: '5 min',
    isGenerated: true,
  }))
  const stories = [...genStories, ...legacyStories]

  const getEmbedCode = (storyId) => {
    const story = stories.find(s => s.id === storyId)
    return `<iframe
  src="https://content-app-engine.netlify.app/?story=${storyId}&embed=true"
  width="100%"
  height="800"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 12px; max-width: 720px;"
  title="WCPO Interactive: ${story?.headline || storyId}"
  allow="clipboard-write"
></iframe>`
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <p className="text-sm text-ink-muted mb-6">
        Generate embed codes to place interactive stories on partner sites, CMS pages, or newsletters.
      </p>

      <div className="space-y-2 mb-6">
        {stories.map(story => (
          <button
            key={story.id}
            onClick={() => setSelected(selected === story.id ? null : story.id)}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3
              ${selected === story.id
                ? 'border-slate-400 bg-slate-50 shadow-sm'
                : 'border-rule bg-white hover:bg-slate-50'
              }`}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: story.categoryColor }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{story.headline}</p>
              <p className="text-xs text-ink-muted">{story.category} &middot; {story.readTime}</p>
            </div>
            <Code2 size={14} className={selected === story.id ? 'text-slate-600' : 'text-slate-300'} />
          </button>
        ))}
      </div>

      {selected && (
        <div className="border border-rule rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b border-rule flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Embed Code</span>
            <button
              onClick={() => handleCopy(getEmbedCode(selected))}
              className="text-xs font-medium text-slate-600 hover:text-ink px-2 py-1 rounded bg-white border border-rule"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-ink-light overflow-x-auto bg-white leading-relaxed">
            {getEmbedCode(selected)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function AdminHub({ onBack }) {
  const [activeTab, setActiveTab] = useState('sensitivity')

  return (
    <>
      <header className="sticky top-0 z-50 bg-wcpo-dark/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to WCPO</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-white tracking-tight">WCPO</span>
            <span className="bg-wcpo-red text-white text-[8px] font-bold px-1.5 py-0.5 rounded">9</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-serif text-2xl font-bold text-ink mb-6">Publisher Tools</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-rule">
          {tabs.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                  ${active
                    ? 'border-slate-800 text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink hover:border-slate-300'
                  }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'sensitivity' && <SensitivityAdmin />}
        {activeTab === 'embed' && <EmbedCenter />}
        {activeTab === 'pipeline' && <StoryPipeline />}
        {activeTab === 'topics' && <TopicAdmin />}
      </main>
    </>
  )
}

// --- Auto-Build Topic ---
function AutoBuildTopic({ onComplete }) {
  const [topicInput, setTopicInput] = useState('')
  const [building, setBuilding] = useState(false)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(null)
  const abortRef = useRef(false)

  // Process queued articles one at a time via /api/process-invoke
  const processQueue = async (queued, topicSlug, topicTitle) => {
    abortRef.current = false
    for (let i = 0; i < queued && !abortRef.current; i++) {
      setProgress(p => ({
        ...p,
        stage: `Generating story-app ${i + 1} of ${queued}...`,
      }))

      try {
        const res = await fetch('/api/process-invoke')
        const text = await res.text()
        let data
        try { data = JSON.parse(text) } catch { data = {} }

        // Check how many stories exist now
        const stories = await fetchAllStoriesByTopic(topicSlug)
        setProgress(p => ({
          ...p,
          stories: stories.length,
          published: stories.filter(s => s.status === 'published').length,
          drafts: stories.filter(s => s.status === 'draft').length,
          total: stories.length,
          lastResult: data.results?.[0]?.storyId || data.results?.[0]?.reason || null,
        }))
      } catch (err) {
        console.error('Process error:', err)
      }
    }

    // Done
    const finalStories = await fetchAllStoriesByTopic(topicSlug)
    setProgress(p => ({
      ...p,
      stage: `Complete! ${finalStories.length} story-apps created.`,
      stories: finalStories.length,
      published: finalStories.filter(s => s.status === 'published').length,
      drafts: finalStories.filter(s => s.status === 'draft').length,
      total: finalStories.length,
      done: true,
      topicSlug,
      topicTitle,
    }))
    if (onComplete) onComplete()
  }

  useEffect(() => () => { abortRef.current = true }, [])

  const handleBuild = async () => {
    if (!topicInput.trim() || topicInput.length < 5) return
    setBuilding(true)
    setResult(null)
    setProgress({ stage: 'Designing topic & searching sources...', stories: 0, published: 0, drafts: 0, total: 0 })

    try {
      const res = await fetch('/api/build-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicInput.trim() }),
      })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { data = { error: 'Non-JSON response (status ' + res.status + ')' } }

      if (data.error) {
        setResult({ error: data.error })
        setProgress(null)
        setBuilding(false)
        return
      }

      setResult(data)
      setProgress(p => ({
        ...p,
        stage: `${data.articlesQueued} articles queued. Generating story-apps...`,
        topicTitle: data.design?.title,
        topicSlug: data.topicSlug,
        queued: data.articlesQueued,
      }))

      // Drive processing from frontend — one call per queued article
      await processQueue(data.articlesQueued || 4, data.topicSlug, data.design?.title)
    } catch (err) {
      setResult({ error: err.message })
      setProgress(null)
    }
    setBuilding(false)
  }

  return (
    <div className="mb-8 p-6 rounded-xl border-2 border-dashed border-rule bg-paper-warm">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-wcpo-red" />
        <h3 className="text-sm font-bold text-ink">Auto-Build Topic Page</h3>
      </div>
      <p className="text-xs text-ink-muted mb-4">
        Describe a topic and AI will design the page, search 30+ sources for articles, select 4-6 diverse angles, and generate interactive story-apps — all automatically.
      </p>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={topicInput}
          onChange={e => setTopicInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleBuild()}
          placeholder="e.g. Cincinnati housing affordability crisis"
          className="flex-1 px-4 py-2.5 rounded-lg border-2 border-rule bg-white text-ink text-sm focus:border-wcpo-red focus:outline-none transition-all"
          disabled={building}
        />
        <button
          onClick={handleBuild}
          disabled={building || topicInput.length < 5}
          className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg bg-ink text-white hover:bg-ink-light transition-colors disabled:opacity-50 shrink-0"
        >
          {building ? <><Loader2 size={14} className="animate-spin" />Sending...</> : <><Sparkles size={14} />Build Topic</>}
        </button>
      </div>

      {/* Progress tracker */}
      {progress && (
        <div className={`mt-4 p-4 rounded-lg bg-white border ${progress.done ? 'border-green-200' : 'border-blue-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            {progress.done
              ? <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              : <Loader2 size={18} className="text-blue-600 animate-spin shrink-0" />}
            <div>
              <p className={`text-sm font-bold ${progress.done ? 'text-green-700' : 'text-blue-700'}`}>
                {progress.stage}
              </p>
              {progress.topicTitle && (
                <p className="text-xs text-ink-muted mt-0.5">"{progress.topicTitle}"</p>
              )}
            </div>
          </div>

          {(progress.queued > 0 || progress.stories > 0) && (
            <div className="space-y-2">
              {/* Progress bar */}
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${progress.done ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min((progress.stories / (progress.queued || 6)) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>{progress.stories || 0} of {progress.queued || '?'} story-apps generated</span>
                <span>
                  {progress.published > 0 && <span className="text-green-600 font-medium">{progress.published} auto-published</span>}
                  {progress.published > 0 && progress.drafts > 0 && ' · '}
                  {progress.drafts > 0 && <span>{progress.drafts} drafts</span>}
                </span>
              </div>
            </div>
          )}

          {progress.done && progress.topicSlug && (
            <div className="mt-3 pt-3 border-t border-rule flex items-center gap-2">
              <p className="text-xs text-ink-muted flex-1">
                Topic is <span className="font-bold">{progress.topicStatus}</span>.
                {progress.topicStatus === 'draft' && ' Publish it below or approve stories in Story Pipeline → Drafts.'}
              </p>
            </div>
          )}
        </div>
      )}

      {result?.error && (
        <p className="mt-3 text-xs text-red-600">Error: {result.error}</p>
      )}
    </div>
  )
}

// --- Topic Admin ---
function TopicAdmin() {
  const [topics, setTopics] = useState([])
  const [stories, setStories] = useState([])
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [t, s] = await Promise.all([fetchAllTopics(), fetchAllGeneratedStories()])
    setTopics(t || [])
    setStories(s || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const newTopic = () => {
    setEditing({
      slug: '',
      title: '',
      subtitle: '',
      accent_color: '#dc2626',
      hero_stats: [],
      timeline_events: [],
      poll_question: '',
      status: 'draft',
    })
  }

  const handleSave = async () => {
    if (!editing.slug || !editing.title) return
    setSaving(true)
    await upsertTopic({ ...editing, updated_at: new Date().toISOString() })
    setSaving(false)
    setEditing(null)
    load()
  }

  const handleAssign = async (storyId, topicSlug) => {
    await assignStoryToTopic(storyId, topicSlug || null)
    load()
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-ink-muted" /></div>

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="text-sm text-ink-muted hover:text-ink mb-4 flex items-center gap-1">
          <ArrowLeft size={14} /> Back to topics
        </button>

        <div className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Slug</label>
              <input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="housing-crisis" className="w-full px-3 py-2 rounded-lg border border-rule text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Accent Color</label>
              <input type="color" value={editing.accent_color} onChange={e => setEditing({ ...editing, accent_color: e.target.value })}
                className="w-full h-10 rounded-lg border border-rule cursor-pointer" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Title</label>
            <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
              placeholder="The Cincinnati Housing Crisis" className="w-full px-3 py-2 rounded-lg border border-rule text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Subtitle</label>
            <input value={editing.subtitle || ''} onChange={e => setEditing({ ...editing, subtitle: e.target.value })}
              placeholder="55,000 units short. What it means for you." className="w-full px-3 py-2 rounded-lg border border-rule text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Poll Question</label>
            <input value={editing.poll_question || ''} onChange={e => setEditing({ ...editing, poll_question: e.target.value })}
              placeholder="How has housing affordability affected you?" className="w-full px-3 py-2 rounded-lg border border-rule text-sm" />
          </div>

          {/* Hero Stats Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Hero Stats</label>
              <button onClick={() => setEditing({ ...editing, hero_stats: [...(editing.hero_stats || []), { value: '', label: '' }] })}
                className="text-xs text-wcpo-red hover:underline flex items-center gap-1"><Plus size={12} />Add</button>
            </div>
            {(editing.hero_stats || []).map((stat, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={stat.value} onChange={e => { const s = [...editing.hero_stats]; s[i] = { ...s[i], value: e.target.value }; setEditing({ ...editing, hero_stats: s }) }}
                  placeholder="55,000" className="w-24 px-2 py-1.5 rounded border border-rule text-sm" />
                <input value={stat.label} onChange={e => { const s = [...editing.hero_stats]; s[i] = { ...s[i], label: e.target.value }; setEditing({ ...editing, hero_stats: s }) }}
                  placeholder="Unit Deficit" className="flex-1 px-2 py-1.5 rounded border border-rule text-sm" />
                <button onClick={() => setEditing({ ...editing, hero_stats: editing.hero_stats.filter((_, j) => j !== i) })}
                  className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          {/* Timeline Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Timeline Events</label>
              <button onClick={() => setEditing({ ...editing, timeline_events: [...(editing.timeline_events || []), { date: '', title: '', description: '' }] })}
                className="text-xs text-wcpo-red hover:underline flex items-center gap-1"><Plus size={12} />Add</button>
            </div>
            {(editing.timeline_events || []).map((ev, i) => (
              <div key={i} className="flex gap-2 mb-2 items-start">
                <input value={ev.date} onChange={e => { const t = [...editing.timeline_events]; t[i] = { ...t[i], date: e.target.value }; setEditing({ ...editing, timeline_events: t }) }}
                  placeholder="Mar 2026" className="w-28 px-2 py-1.5 rounded border border-rule text-sm" />
                <div className="flex-1 space-y-1">
                  <input value={ev.title} onChange={e => { const t = [...editing.timeline_events]; t[i] = { ...t[i], title: e.target.value }; setEditing({ ...editing, timeline_events: t }) }}
                    placeholder="Event title" className="w-full px-2 py-1.5 rounded border border-rule text-sm" />
                  <input value={ev.description || ''} onChange={e => { const t = [...editing.timeline_events]; t[i] = { ...t[i], description: e.target.value }; setEditing({ ...editing, timeline_events: t }) }}
                    placeholder="Brief description" className="w-full px-2 py-1.5 rounded border border-rule text-sm text-ink-muted" />
                </div>
                <button onClick={() => setEditing({ ...editing, timeline_events: editing.timeline_events.filter((_, j) => j !== i) })}
                  className="text-red-400 hover:text-red-600 mt-1.5"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          {/* Status + Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-rule">
            <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}
              className="px-3 py-2 rounded-lg border border-rule text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <button onClick={handleSave} disabled={saving || !editing.slug || !editing.title}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wcpo-red text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Topic
            </button>
            <button
              onClick={async () => {
                if (!editing.slug) return
                setSaving(true)
                await publishTopicAndStories(editing.slug)
                setSaving(false)
                setEditing(null)
                load()
              }}
              disabled={saving || !editing.slug}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
              Publish Topic + All Stories
            </button>
          </div>
        </div>

        {/* Story Assignment */}
        <div className="mt-8 pt-6 border-t border-rule">
          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Assign Stories to This Topic</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stories.filter(s => s.status === 'published' || s.status === 'draft').map(story => (
              <div key={story.id} className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={story.topic_slug === editing.slug}
                  onChange={() => handleAssign(story.id, story.topic_slug === editing.slug ? null : editing.slug)}
                  className="rounded" />
                <span className={`font-medium ${story.topic_slug === editing.slug ? 'text-ink' : 'text-ink-muted'}`}>
                  {story.headline || 'Untitled'}
                </span>
                <span className="text-[10px] text-ink-muted">{story.app_type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Auto-Build Section */}
      <AutoBuildTopic onComplete={load} />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-ink-muted">Or manually create and manage topic deep-dive pages.</p>
        <button onClick={newTopic} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-wcpo-red text-white hover:bg-red-700">
          <Plus size={13} />New Topic (Manual)
        </button>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-16 text-ink-muted">
          <Layers size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No topics yet. Create your first deep-dive topic page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map(topic => {
            const storyCount = stories.filter(s => s.topic_slug === topic.slug).length
            return (
              <div key={topic.id} className="flex items-center justify-between p-4 rounded-lg border border-rule bg-white hover:shadow-sm transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: topic.accent_color }} />
                    <span className="font-serif font-bold text-ink">{topic.title}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${topic.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {topic.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted">{storyCount} stories &middot; {topic.slug}</p>
                </div>
                <button onClick={() => setEditing(topic)} className="text-xs text-ink-muted hover:text-ink px-3 py-1.5 rounded border border-rule">
                  Edit
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
