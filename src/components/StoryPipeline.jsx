import { useState, useEffect, lazy, Suspense } from 'react'
import {
  Rss, FileEdit, CheckCircle2, XCircle, Eye, ThumbsUp, ThumbsDown,
  RefreshCw, Clock, AlertTriangle, Loader2, Undo2, Link, ExternalLink,
  Sparkles, Zap, ImageIcon, Search, Trash2, X
} from 'lucide-react'

const NEWS_FEED_COUNT = 3
import {
  fetchRssItems, fetchSkippedRssItems, fetchAllGeneratedStories,
  updateGeneratedStoryStatus, updateGeneratedStoryConfig,
  updateGeneratedStoryImage, fetchAllTopics,
  fetchRssItemById, fetchGeneratedStoryByRssItemId
} from '../lib/supabase'

const StoryRenderer = lazy(() => import('../renderer/StoryRenderer'))

const subTabs = [
  { id: 'rss', label: 'RSS Queue', icon: Rss },
  { id: 'drafts', label: 'Drafts', icon: FileEdit },
  { id: 'published', label: 'Published', icon: CheckCircle2 },
  { id: 'external', label: 'Add URL', icon: Link },
  { id: 'rejected', label: 'Rejected', icon: XCircle },
  { id: 'skipped', label: 'Skipped', icon: AlertTriangle },
]

function WorthinessBadge({ score }) {
  if (score == null) return <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">Unscored</span>
  let colors = 'bg-red-100 text-red-700'
  if (score >= 60) colors = 'bg-green-100 text-green-700'
  else if (score >= 40) colors = 'bg-yellow-100 text-yellow-700'
  return <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${colors}`}>{score}</span>
}

function StatusBadge({ status }) {
  const map = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${map[status] || map.draft}`}>
      {status}
    </span>
  )
}

function SensitivityBadge({ level }) {
  if (!level) return null
  const map = {
    low: 'bg-green-100 text-green-700',
    moderate: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${map[level] || 'bg-gray-100 text-gray-500'}`}>
      {level}
    </span>
  )
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
      <Icon size={32} className="mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// --- RSS Queue View ---
function RssQueue({ items, loading, onRefresh }) {
  const [processing, setProcessing] = useState(false)
  const [processingItemId, setProcessingItemId] = useState(null)
  const [processResult, setProcessResult] = useState(null)

  const handleProcess = async (itemId = null, force = false) => {
    setProcessing(true)
    setProcessingItemId(itemId)
    setProcessResult(null)
    try {
      const url = itemId ? `/api/process-invoke?itemId=${itemId}${force ? '&force=true' : ''}` : '/api/process-invoke'
      const res = await fetch(url)
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { data = { error: 'Non-JSON response (status ' + res.status + ')' } }
      setProcessResult(data)

      // Background processing takes ~30-60s. Poll the specific RSS item + generated story.
      if (res.status === 202 && data.item) {
        const storyTitle = data.item.title
        const rssItemId = data.item.id
        setProcessResult({ building: true, title: storyTitle, message: `Building story app for "${storyTitle}"...` })

        let foundStory = null
        let skipped = false
        let skipReason = ''
        for (let attempt = 0; attempt < 9; attempt++) {
          await new Promise(r => setTimeout(r, 10000))
          setProcessResult({ building: true, title: storyTitle, message: `Building story app for "${storyTitle}"... (${(attempt + 1) * 10}s)` })

          // Check if a generated story was created for this RSS item
          const story = await fetchGeneratedStoryByRssItemId(rssItemId)
          if (story) {
            foundStory = story
            break
          }

          // Check if the RSS item was processed and skipped
          const rssItem = await fetchRssItemById(rssItemId)
          if (rssItem && rssItem.processed && rssItem.skip_reason) {
            skipped = true
            skipReason = rssItem.skip_reason
            break
          }
        }
        if (onRefresh) onRefresh()
        if (foundStory) {
          const draftHeadline = foundStory.headline || storyTitle
          setProcessResult({ success: true, title: draftHeadline, message: `"${draftHeadline}" is ready! It's now in Drafts awaiting your approval before publishing.` })
        } else if (skipped) {
          setProcessResult({ error: `"${storyTitle}" was skipped by the AI: ${skipReason}`, skippedItemId: rssItemId, title: storyTitle })
        } else {
          setProcessResult({ building: false, title: storyTitle, message: `Still processing "${storyTitle}". It may take another minute — check the Drafts tab shortly.` })
        }
      } else {
        if (onRefresh) onRefresh()
      }
    } catch (err) {
      setProcessResult({ error: err.message })
    }
    setProcessing(false)
    setProcessingItemId(null)
  }

  if (loading) return <LoadingSpinner />
  if (!items.length) return <EmptyState icon={Rss} message="No unprocessed RSS items in the queue." />

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => handleProcess()}
          disabled={processing}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-wcpo-red text-white hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {processing && !processingItemId ? <><Loader2 size={13} className="animate-spin" />Processing...</> : <><Rss size={13} />Process Next Story</>}
        </button>
      </div>
      {processResult && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-start gap-2 ${
          processResult.error ? 'bg-red-50 border border-red-200 text-red-700'
            : processResult.building ? 'bg-blue-50 border border-blue-200 text-blue-700'
            : processResult.success ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-slate-50 border border-rule text-ink'
        }`}>
          {processResult.building && <Loader2 size={14} className="animate-spin shrink-0 mt-0.5" />}
          {processResult.success && <CheckCircle2 size={14} className="shrink-0 mt-0.5" />}
          <div className="flex-1">
            <span>{processResult.error ? `${processResult.error}` : processResult.message || 'Done'}</span>
            {processResult.skippedItemId && !processing && (
              <button
                onClick={() => handleProcess(processResult.skippedItemId, true)}
                className="ml-3 inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors"
              >
                <Zap size={11} /> Build Anyway
              </button>
            )}
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rule text-left text-xs text-ink-muted uppercase tracking-wider">
            <th className="pb-2 pr-4">Title</th>
            <th className="pb-2 pr-4">Feed</th>
            <th className="pb-2 pr-4">Published</th>
            <th className="pb-2 pr-4">Worthiness</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-rule/50 hover:bg-slate-50 transition-colors">
              <td className="py-3 pr-4 max-w-xs">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-wcpo-red font-medium line-clamp-2">
                  {item.title}
                </a>
              </td>
              <td className="py-3 pr-4 text-ink-muted whitespace-nowrap">{item.feed_name || '-'}</td>
              <td className="py-3 pr-4 text-ink-muted whitespace-nowrap">{formatDate(item.pub_date)}</td>
              <td className="py-3 pr-4"><WorthinessBadge score={item.worthiness_score} /></td>
              <td className="py-3">
                <button
                  onClick={() => handleProcess(item.id)}
                  disabled={processing}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-ink hover:bg-emerald-100 hover:text-emerald-700 border border-rule transition-all disabled:opacity-40"
                >
                  {processingItemId === item.id
                    ? <><Loader2 size={11} className="animate-spin" /> Building...</>
                    : <><Zap size={11} /> Build This</>}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

// --- Skipped Items View ---
function SkippedView({ items, loading, onRefresh }) {
  const [processing, setProcessing] = useState(false)
  const [processingItemId, setProcessingItemId] = useState(null)
  const [processResult, setProcessResult] = useState(null)

  const handleForceBuild = async (itemId) => {
    setProcessing(true)
    setProcessingItemId(itemId)
    setProcessResult(null)
    try {
      const res = await fetch(`/api/process-invoke?itemId=${itemId}&force=true`)
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { data = { error: 'Non-JSON response (status ' + res.status + ')' } }
      setProcessResult(data)

      if (res.status === 202 && data.item) {
        const storyTitle = data.item.title
        const rssItemId = data.item.id
        setProcessResult({ building: true, title: storyTitle, message: `Force-building "${storyTitle}"...` })

        let foundStory = null
        for (let attempt = 0; attempt < 9; attempt++) {
          await new Promise(r => setTimeout(r, 10000))
          setProcessResult({ building: true, title: storyTitle, message: `Force-building "${storyTitle}"... (${(attempt + 1) * 10}s)` })

          const story = await fetchGeneratedStoryByRssItemId(rssItemId)
          if (story) {
            foundStory = story
            break
          }
        }
        if (onRefresh) onRefresh()
        if (foundStory) {
          const draftHeadline = foundStory.headline || storyTitle
          setProcessResult({ success: true, message: `"${draftHeadline}" is ready! It's now in Drafts awaiting your approval before publishing.` })
        } else {
          setProcessResult({ building: false, title: storyTitle, message: `Still processing "${storyTitle}". It may take another minute — check the Drafts tab shortly.` })
        }
      } else {
        if (onRefresh) onRefresh()
      }
    } catch (err) {
      setProcessResult({ error: err.message })
    }
    setProcessing(false)
    setProcessingItemId(null)
  }

  if (loading) return <LoadingSpinner />
  if (!items.length) return <EmptyState icon={AlertTriangle} message="No skipped stories." />

  return (
    <div>
      <p className="text-xs text-ink-muted mb-4">
        Stories the AI scored too low for automatic processing. You can force-build any of these into a Story-App.
      </p>
      {processResult && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-start gap-2 ${
          processResult.error ? 'bg-red-50 border border-red-200 text-red-700'
            : processResult.building ? 'bg-blue-50 border border-blue-200 text-blue-700'
            : processResult.success ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-slate-50 border border-rule text-ink'
        }`}>
          {processResult.building && <Loader2 size={14} className="animate-spin shrink-0 mt-0.5" />}
          {processResult.success && <CheckCircle2 size={14} className="shrink-0 mt-0.5" />}
          <span>{processResult.error ? `Error: ${processResult.error}` : processResult.message || 'Done'}</span>
        </div>
      )}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="border border-rule rounded-lg bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-ink hover:text-wcpo-red line-clamp-1">
                    {item.title}
                  </a>
                  <WorthinessBadge score={item.worthiness_score} />
                </div>
                <div className="flex gap-2 items-center text-xs text-ink-muted mb-2">
                  {item.feed_name && <span className="bg-slate-100 px-2 py-0.5 rounded">{item.feed_name}</span>}
                  <span>{formatDate(item.pub_date)}</span>
                </div>
                {item.skip_reason && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
                    <AlertTriangle size={11} className="inline mr-1 -mt-0.5" />
                    {item.skip_reason}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleForceBuild(item.id)}
                disabled={processing}
                className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 transition-all disabled:opacity-40 shrink-0"
              >
                {processingItemId === item.id
                  ? <><Loader2 size={11} className="animate-spin" /> Building...</>
                  : <><Zap size={11} /> Build Anyway</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Image Manager Panel ---
function ImageManager({ story, onUpdate }) {
  const [mode, setMode] = useState(null) // null | 'search' | 'url'
  const [query, setQuery] = useState(story.headline || '')
  const [urlInput, setUrlInput] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const currentImage = story.image_url || story.config?.hero?.image || null

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    try {
      const res = await fetch('/api/image-search?q=' + encodeURIComponent(query.trim()) + '&count=12')
      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      console.error('Image search error:', err)
    }
    setSearching(false)
  }

  const selectImage = async (imageUrl) => {
    setSaving(true)
    const ok = await updateGeneratedStoryImage(story.id, imageUrl, story.config)
    if (ok) {
      setMode(null)
      setResults([])
      onUpdate()
    }
    setSaving(false)
  }

  const removeImage = async () => {
    setSaving(true)
    await updateGeneratedStoryImage(story.id, null, story.config)
    setSaving(false)
    onUpdate()
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim() && urlInput.startsWith('http')) {
      selectImage(urlInput.trim())
    }
  }

  return (
    <div className="px-4 py-3 bg-slate-50 border-t border-rule">
      {/* Current image preview */}
      <div className="flex items-start gap-4 mb-3">
        <div className="w-32 h-20 rounded-lg overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
          {currentImage ? (
            <img src={currentImage} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <ImageIcon size={20} className="text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-ink mb-1">
            {currentImage ? 'Hero Image' : 'No hero image'}
          </p>
          {currentImage && (
            <p className="text-[10px] text-ink-muted truncate mb-2">{currentImage}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setMode(mode === 'search' ? null : 'search')}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded bg-white border border-rule hover:bg-slate-50 transition-colors"
            >
              <Search size={11} />Search Images
            </button>
            <button
              onClick={() => setMode(mode === 'url' ? null : 'url')}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded bg-white border border-rule hover:bg-slate-50 transition-colors"
            >
              <Link size={11} />Paste URL
            </button>
            {currentImage && (
              <button
                onClick={removeImage}
                disabled={saving}
                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Trash2 size={11} />Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search panel */}
      {mode === 'search' && (
        <div className="mt-3">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for images..."
              className="flex-1 text-sm border border-rule rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-400"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg bg-ink text-white hover:bg-ink-light transition-colors disabled:opacity-50"
            >
              {searching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
              Search
            </button>
            <button onClick={() => { setMode(null); setResults([]) }} className="p-2 text-ink-muted hover:text-ink">
              <X size={14} />
            </button>
          </div>
          {results.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {results.map((img, i) => (
                <button
                  key={i}
                  onClick={() => selectImage(img.url)}
                  disabled={saving}
                  className="group relative aspect-video rounded-lg overflow-hidden bg-slate-200 hover:ring-2 hover:ring-wcpo-red transition-all disabled:opacity-50"
                >
                  <img
                    src={img.thumbnail || img.url}
                    alt={img.title || ''}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.parentElement.style.display = 'none' }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                  </div>
                  {img.source && (
                    <span className="absolute bottom-0.5 right-0.5 text-[8px] text-white bg-black/50 px-1 rounded">{img.source}</span>
                  )}
                </button>
              ))}
            </div>
          )}
          {searching && (
            <div className="flex items-center justify-center py-8 text-ink-muted text-sm">
              <Loader2 size={16} className="animate-spin mr-2" />Searching...
            </div>
          )}
          {!searching && results.length === 0 && query && (
            <p className="text-xs text-ink-muted text-center py-4">Click Search to find images</p>
          )}
        </div>
      )}

      {/* URL input panel */}
      {mode === 'url' && (
        <div className="mt-3 flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 text-sm border border-rule rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-400"
            onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
          />
          <button
            onClick={handleUrlSubmit}
            disabled={saving || !urlInput.trim()}
            className="text-xs font-medium px-3 py-2 rounded-lg bg-ink text-white hover:bg-ink-light transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : 'Use Image'}
          </button>
          <button onClick={() => setMode(null)} className="p-2 text-ink-muted hover:text-ink">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// Rights-free image domain whitelist
const RIGHTS_FREE_DOMAINS = ['unsplash.com', 'images.unsplash.com', 'images-assets.nasa.gov', 'pixabay.com', 'cdn.pixabay.com', 'upload.wikimedia.org']

function isImageRightsFree(imageUrl) {
  if (!imageUrl) return false
  try {
    const hostname = new URL(imageUrl).hostname.replace('www.', '')
    return RIGHTS_FREE_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))
  } catch {
    return false
  }
}

// --- Drafts View ---
function DraftsView({ stories, onRefresh }) {
  const [previewId, setPreviewId] = useState(null)
  const [rejectId, setRejectId] = useState(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [acting, setActing] = useState(null)
  const [imageId, setImageId] = useState(null)
  const [imageWarningId, setImageWarningId] = useState(null)

  const drafts = stories.filter(s => s.status === 'draft')

  const handleApprove = async (story) => {
    const imageUrl = story.image_url || story.config?.hero?.image
    // Check if image is rights-free or absent
    if (imageUrl && !isImageRightsFree(imageUrl)) {
      // Show warning — don't publish yet
      setImageWarningId(story.id)
      return
    }
    doPublish(story)
  }

  const doPublish = async (story) => {
    setImageWarningId(null)
    setActing(story.id)
    await updateGeneratedStoryStatus(story.id, 'published')
    setActing(null)
    onRefresh()
  }

  const publishWithoutImage = async (story) => {
    setImageWarningId(null)
    setActing(story.id)
    await updateGeneratedStoryImage(story.id, null, story.config)
    await updateGeneratedStoryStatus(story.id, 'published')
    setActing(null)
    onRefresh()
  }

  const handleReject = async (story) => {
    if (!rejectNotes.trim()) return
    setActing(story.id)
    await updateGeneratedStoryStatus(story.id, 'rejected', rejectNotes.trim())
    setRejectId(null)
    setRejectNotes('')
    setActing(null)
    onRefresh()
  }

  if (!drafts.length) return <EmptyState icon={FileEdit} message="No drafts awaiting review." />

  return (
    <div className="space-y-4">
      {drafts.map(story => {
        const config = story.config || {}
        const sensitivity = config.sensitivity || {}
        const isPreview = previewId === story.id
        const isRejecting = rejectId === story.id
        const isImageOpen = imageId === story.id
        const isImageWarning = imageWarningId === story.id
        const hasImage = !!(story.image_url || config.hero?.image)

        return (
          <div key={story.id} className="border border-rule rounded-lg overflow-hidden bg-white">
            {/* Card header */}
            <div className="px-4 py-3 flex items-start justify-between gap-4">
              {hasImage && (
                <div className="w-16 h-10 rounded overflow-hidden bg-slate-100 shrink-0 mt-0.5">
                  <img src={story.image_url || config.hero?.image} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-bold text-ink text-base leading-snug mb-1">
                  {story.headline || config.hero?.headline || 'Untitled'}
                </h3>
                <div className="flex flex-wrap gap-2 items-center text-xs text-ink-muted">
                  {story.category && <span className="bg-slate-100 px-2 py-0.5 rounded">{story.category}</span>}
                  {story.app_type && <span className="bg-slate-100 px-2 py-0.5 rounded">{story.app_type}</span>}
                  <span className="flex items-center gap-1"><Clock size={11} />{formatDate(story.created_at)}</span>
                </div>
                {/* Sensitivity badges */}
                {sensitivity.level && (
                  <div className="flex gap-2 mt-2 items-center">
                    <SensitivityBadge level={sensitivity.level} />
                    {sensitivity.flags?.map((flag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={10} />{flag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Action buttons */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setImageId(isImageOpen ? null : story.id)}
                  className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded border transition-colors ${
                    hasImage
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-rule hover:bg-slate-50'
                  }`}
                >
                  <ImageIcon size={13} />{isImageOpen ? 'Close' : 'Image'}
                </button>
                <button
                  onClick={() => setPreviewId(isPreview ? null : story.id)}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded border border-rule hover:bg-slate-50 transition-colors"
                >
                  <Eye size={13} />{isPreview ? 'Close' : 'Preview'}
                </button>
                <button
                  onClick={() => handleApprove(story)}
                  disabled={acting === story.id}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <ThumbsUp size={13} />Approve
                </button>
                <button
                  onClick={() => { setRejectId(isRejecting ? null : story.id); setRejectNotes('') }}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                >
                  <ThumbsDown size={13} />Reject
                </button>
              </div>
            </div>

            {/* Reject notes input */}
            {isRejecting && (
              <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex gap-2">
                <input
                  type="text"
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  placeholder="Rejection reason..."
                  className="flex-1 text-sm border border-red-200 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-400"
                  onKeyDown={e => e.key === 'Enter' && handleReject(story)}
                />
                <button
                  onClick={() => handleReject(story)}
                  disabled={!rejectNotes.trim() || acting === story.id}
                  className="text-xs font-medium px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            )}

            {/* Image rights warning */}
            {isImageWarning && (
              <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">No rights-free image found</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      The current image appears to be from a copyrighted source. Search for a rights-free image, paste your own URL, or publish without an image.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setImageWarningId(null); setImageId(story.id) }}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                  >
                    <Search size={11} /> Find Rights-Free Image
                  </button>
                  <button
                    onClick={() => publishWithoutImage(story)}
                    disabled={acting === story.id}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded bg-white text-ink border border-rule hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Publish Without Image
                  </button>
                  <button
                    onClick={() => setImageWarningId(null)}
                    className="text-xs text-amber-600 hover:text-amber-800 px-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Image manager panel */}
            {isImageOpen && (
              <ImageManager story={story} onUpdate={() => { setImageWarningId(null); onRefresh() }} />
            )}

            {/* Preview pane */}
            {isPreview && config && (
              <div className="border-t border-rule bg-slate-50 p-4 max-h-[600px] overflow-y-auto">
                <Suspense fallback={<LoadingSpinner />}>
                  <StoryRenderer config={config} storyId={story.story_id} />
                </Suspense>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- Published View ---
function PublishedView({ stories, onRefresh }) {
  const [acting, setActing] = useState(null)
  const published = stories.filter(s => s.status === 'published')

  const handleUnpublish = async (story) => {
    setActing(story.id)
    await updateGeneratedStoryStatus(story.id, 'draft')
    setActing(null)
    onRefresh()
  }

  if (!published.length) return <EmptyState icon={CheckCircle2} message="No published stories yet." />

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rule text-left text-xs text-ink-muted uppercase tracking-wider">
            <th className="pb-2 pr-4">Headline</th>
            <th className="pb-2 pr-4">Category</th>
            <th className="pb-2 pr-4">Published</th>
            <th className="pb-2 pr-4">Approved By</th>
            <th className="pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {published.map(story => (
            <tr key={story.id} className="border-b border-rule/50 hover:bg-slate-50 transition-colors">
              <td className="py-3 pr-4 font-medium text-ink max-w-xs">
                <span className="line-clamp-1">{story.headline || 'Untitled'}</span>
              </td>
              <td className="py-3 pr-4 text-ink-muted whitespace-nowrap">{story.category || '-'}</td>
              <td className="py-3 pr-4 text-ink-muted whitespace-nowrap">{formatDate(story.publish_date || story.approved_at)}</td>
              <td className="py-3 pr-4 text-ink-muted whitespace-nowrap">{story.approved_by || '-'}</td>
              <td className="py-3">
                <button
                  onClick={() => handleUnpublish(story)}
                  disabled={acting === story.id}
                  className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors disabled:opacity-50"
                >
                  <Undo2 size={12} />Unpublish
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- Rejected View ---
function RejectedView({ stories }) {
  const rejected = stories.filter(s => s.status === 'rejected')

  if (!rejected.length) return <EmptyState icon={XCircle} message="No rejected stories." />

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rule text-left text-xs text-ink-muted uppercase tracking-wider">
            <th className="pb-2 pr-4">Headline</th>
            <th className="pb-2 pr-4">Rejection Reason</th>
            <th className="pb-2">Rejected</th>
          </tr>
        </thead>
        <tbody>
          {rejected.map(story => (
            <tr key={story.id} className="border-b border-rule/50 hover:bg-slate-50 transition-colors">
              <td className="py-3 pr-4 font-medium text-ink max-w-xs">
                <span className="line-clamp-1">{story.headline || 'Untitled'}</span>
              </td>
              <td className="py-3 pr-4 text-ink-muted max-w-sm">
                <span className="line-clamp-2">{story.editor_notes || '-'}</span>
              </td>
              <td className="py-3 text-ink-muted whitespace-nowrap">{formatDate(story.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- External URL Ingestion ---
function ExternalIngest({ onRefresh }) {
  const [url, setUrl] = useState('')
  const [topicSlug, setTopicSlug] = useState('')
  const [topics, setTopics] = useState([])
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [finding, setFinding] = useState(false)
  const [recommendation, setRecommendation] = useState(null)

  useEffect(() => {
    fetchAllTopics().then(t => setTopics(t || []))
  }, [])

  const handleFindStory = async () => {
    setFinding(true)
    setRecommendation(null)
    try {
      const res = await fetch('/api/find-story' + (topicSlug ? '?topic=' + topicSlug : ''))
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { data = { error: 'Non-JSON response' } }
      if (data.error) {
        setRecommendation({ error: data.error })
      } else {
        setRecommendation(data)
        if (data.recommendation?.chosen_url) {
          setUrl(data.recommendation.chosen_url)
        }
      }
    } catch (err) {
      setRecommendation({ error: err.message })
    }
    setFinding(false)
  }

  const handleSubmit = async () => {
    if (!url.trim() || !url.startsWith('http')) return
    setProcessing(true)
    setResult(null)
    try {
      const res = await fetch('/api/ingest-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), topic_slug: topicSlug || null }),
      })
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        data = { error: 'Server returned non-JSON response (status ' + res.status + '). The URL may be unreachable or the function timed out.' }
      }
      setResult(data)
      if (data.success && onRefresh) onRefresh()
    } catch (err) {
      setResult({ error: err.message })
    }
    setProcessing(false)
  }

  return (
    <div>
      <p className="text-sm text-ink-muted mb-6">
        Paste any news article URL, or let AI find a great story to localize for Cincinnati.
      </p>

      {/* AI Story Finder */}
      <div className="mb-8 p-5 rounded-xl border-2 border-dashed border-rule bg-paper-warm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-wcpo-red" />
          <h3 className="text-sm font-bold text-ink">AI Story Finder</h3>
        </div>
        <p className="text-xs text-ink-muted mb-4">
          Scans AP, Reuters, NPR, PBS, and USA Today for trending stories, then picks the one that would make the best interactive Story-App for Cincinnati readers.
        </p>
        <button
          onClick={handleFindStory}
          disabled={finding}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg bg-ink text-white hover:bg-ink-light transition-colors disabled:opacity-50"
        >
          {finding ? <><Loader2 size={14} className="animate-spin" />Scanning {NEWS_FEED_COUNT} feeds...</> : <><Sparkles size={14} />Find Me a Great Story</>}
        </button>

        {/* Recommendation Card */}
        {recommendation && !recommendation.error && recommendation.recommendation && (
          <div className="mt-4 p-4 rounded-lg bg-white border border-rule">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 size={16} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink-muted mb-1">
                  Scanned {recommendation.totalScanned} articles from {recommendation.feedsScanned} feeds
                </p>
                <h4 className="text-sm font-bold text-ink mb-1">{recommendation.recommendation.chosen_title}</h4>
                <p className="text-xs text-ink-muted mb-2">
                  Source: {recommendation.recommendation.chosen_source}
                </p>
                <p className="text-sm text-ink-light leading-relaxed mb-3">
                  {recommendation.recommendation.localization_angle}
                </p>
                {recommendation.recommendation.interactive_ideas && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">Interactive Ideas</p>
                    <ul className="space-y-1">
                      {recommendation.recommendation.interactive_ideas.map((idea, i) => (
                        <li key={i} className="text-xs text-ink-light flex items-start gap-1.5">
                          <Zap size={10} className="text-wcpo-red shrink-0 mt-0.5" />
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-ink-muted italic mb-3">{recommendation.recommendation.why_this_story}</p>
                <p className="text-xs text-green-600 font-medium">URL loaded below — click "Process URL" to create the Story-App.</p>
              </div>
            </div>
          </div>
        )}
        {recommendation?.error && (
          <p className="mt-3 text-xs text-red-600">Error: {recommendation.error}</p>
        )}
      </div>

      <div className="space-y-4 max-w-xl">
        <div>
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Article URL</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.example.com/article..."
            className="w-full px-4 py-3 rounded-lg border-2 border-rule bg-white text-ink text-sm focus:border-wcpo-red focus:outline-none transition-all"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {topics.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Assign to Topic (optional)</label>
            <select
              value={topicSlug}
              onChange={e => setTopicSlug(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-rule bg-white text-ink text-sm focus:border-wcpo-red focus:outline-none"
            >
              <option value="">No topic</option>
              {topics.map(t => (
                <option key={t.slug} value={t.slug}>{t.title}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={processing || !url.trim()}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg bg-wcpo-red text-white hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {processing ? <><Loader2 size={14} className="animate-spin" />Processing...</> : <><ExternalLink size={14} />Process URL</>}
        </button>
      </div>

      {result && (
        <div className={`mt-6 p-4 rounded-lg border ${result.error ? 'bg-red-50 border-red-200' : result.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          {result.error ? (
            <p className="text-sm text-red-700">Error: {result.error}</p>
          ) : result.success ? (
            <div>
              <p className="text-sm font-semibold text-green-700 mb-1">
                {result.queued ? 'Article queued for AI processing!' : 'Story created as draft!'}
              </p>
              <p className="text-xs text-green-600">
                {result.title && <>{result.title}<br /></>}
                {result.sourceName && <>Source: {result.sourceName} &middot; </>}
                {result.storyId && <>ID: {result.storyId} &middot; </>}
                {result.appType && <>Type: {result.appType}</>}
              </p>
              <p className="text-xs text-green-600 mt-1 font-medium">
                {result.queued
                  ? 'AI is generating the interactive Story-App now. Check the Drafts tab in 30-60 seconds.'
                  : 'Switch to the Drafts tab to preview and approve.'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-yellow-700">Skipped: {result.reason || 'Article not suitable for interactive treatment'}</p>
          )}
        </div>
      )}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={24} className="animate-spin text-ink-muted" />
    </div>
  )
}

// --- Main Component ---
export default function StoryPipeline() {
  const [activeTab, setActiveTab] = useState('rss')
  const [rssItems, setRssItems] = useState([])
  const [skippedItems, setSkippedItems] = useState([])
  const [stories, setStories] = useState([])
  const [loadingRss, setLoadingRss] = useState(true)
  const [loadingSkipped, setLoadingSkipped] = useState(true)
  const [loadingStories, setLoadingStories] = useState(true)

  const loadRss = async () => {
    setLoadingRss(true)
    const data = await fetchRssItems(false)
    setRssItems(data)
    setLoadingRss(false)
  }

  const loadSkipped = async () => {
    setLoadingSkipped(true)
    const data = await fetchSkippedRssItems()
    setSkippedItems(data)
    setLoadingSkipped(false)
  }

  const loadStories = async () => {
    setLoadingStories(true)
    const data = await fetchAllGeneratedStories()
    setStories(data)
    setLoadingStories(false)
  }

  useEffect(() => {
    loadRss()
    loadSkipped()
    loadStories()
  }, [])

  const refresh = () => {
    loadRss()
    loadSkipped()
    loadStories()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-ink-muted">
          Editorial dashboard for the RSS-to-Story pipeline. Review, approve, or reject generated stories.
        </p>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-rule hover:bg-slate-50 text-ink-muted hover:text-ink transition-colors"
        >
          <RefreshCw size={13} />Refresh
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 border-b border-rule">
        {subTabs.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          let count = 0
          if (tab.id === 'rss') count = rssItems.length
          else if (tab.id === 'skipped') count = skippedItems.length
          else if (tab.id === 'drafts') count = stories.filter(s => s.status === 'draft').length
          else if (tab.id === 'published') count = stories.filter(s => s.status === 'published').length
          else if (tab.id === 'rejected') count = stories.filter(s => s.status === 'rejected').length

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors
                ${active
                  ? 'border-slate-800 text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-slate-300'
                }`}
            >
              <Icon size={14} />
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-slate-800 text-white' : 'bg-slate-200 text-ink-muted'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'rss' && <RssQueue items={rssItems} loading={loadingRss} onRefresh={refresh} />}
      {activeTab === 'skipped' && (
        loadingSkipped ? <LoadingSpinner /> : <SkippedView items={skippedItems} loading={loadingSkipped} onRefresh={refresh} />
      )}
      {activeTab === 'external' && <ExternalIngest onRefresh={refresh} />}
      {activeTab === 'drafts' && (
        loadingStories ? <LoadingSpinner /> : <DraftsView stories={stories} onRefresh={refresh} />
      )}
      {activeTab === 'published' && (
        loadingStories ? <LoadingSpinner /> : <PublishedView stories={stories} onRefresh={refresh} />
      )}
      {activeTab === 'rejected' && (
        loadingStories ? <LoadingSpinner /> : <RejectedView stories={stories} />
      )}
    </div>
  )
}
