import { useState, useEffect } from 'react'
import { ArrowLeft, Shield, Code2, Newspaper } from 'lucide-react'
import SensitivityAdmin from './SensitivityAdmin'
import StoryPipeline from './StoryPipeline'
import storyData from '../storyData.json'
import { fetchAllGeneratedStories } from '../lib/supabase'

const tabs = [
  { id: 'sensitivity', label: 'Sensitivity Analysis', icon: Shield },
  { id: 'embed', label: 'Embed Center', icon: Code2 },
  { id: 'pipeline', label: 'Story Pipeline', icon: Newspaper },
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
      </main>
    </>
  )
}
