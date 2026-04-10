// PatentApplication — Multi-tab patent application view
// Manages state for a single application and renders tab content

import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import {
  getPatentApplication,
  updatePatentApplication,
  countWords,
} from '../../../services/patent/patentApplicationService'

import PatentOverviewTab from './PatentOverviewTab'
import PatentApplicantTab from './PatentApplicantTab'
import PatentSpecificationTab from './PatentSpecificationTab'
import PatentClaimsTab from './PatentClaimsTab'
import PatentDrawingsTab from './PatentDrawingsTab'
import PatentAbstractTab from './PatentAbstractTab'
import PatentPriorArtTab from './PatentPriorArtTab'
import PatentAnalysisTab from './PatentAnalysisTab'
import PatentFilingTab from './PatentFilingTab'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'specification', label: 'Specification' },
  { id: 'claims', label: 'Claims' },
  { id: 'drawings', label: 'Drawings' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'prior-art', label: 'Prior Art' },
  { id: 'analysis', label: 'AI Analysis' },
  { id: 'filing', label: 'Filing' },
]

export default function PatentApplication({ applicationId, onUpdate }) {
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [generating, setGenerating] = useState({})
  const [saving, setSaving] = useState(false)

  const loadApp = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPatentApplication(applicationId)
      setApp(data)
    } catch (err) {
      console.error('Failed to load application:', err)
    } finally {
      setLoading(false)
    }
  }, [applicationId])

  useEffect(() => { loadApp() }, [loadApp])

  const handleSave = async (updates) => {
    try {
      setSaving(true)
      await updatePatentApplication(applicationId, updates)
      setApp(prev => ({ ...prev, ...updates }))
      onUpdate?.()
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async (type) => {
    if (!app) return
    setGenerating(prev => ({ ...prev, [type]: true }))
    try {
      const res = await fetch('/.netlify/functions/patent-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, applicationData: app }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      let updates = {}
      if (type === 'specification') {
        try {
          const spec = JSON.parse(data.result)
          updates = {
            field_of_invention: spec.field_of_invention,
            background_art: spec.background_art,
            summary_invention: spec.summary_invention,
            detailed_description: spec.detailed_description,
            specification: [spec.field_of_invention, spec.background_art, spec.summary_invention, spec.detailed_description].filter(Boolean).join('\n\n'),
            specification_generation_status: 'completed',
          }
        } catch {
          updates = { specification: data.result, specification_generation_status: 'completed' }
        }
      } else if (type === 'abstract') {
        updates = { abstract: data.result }
      } else if (type === 'claims') {
        // Claims are saved separately via the claims tab
        return data.result
      } else if (type === 'drawings') {
        return data.result
      }

      if (Object.keys(updates).length) {
        await handleSave(updates)
      }
      return data.result
    } catch (err) {
      console.error(`Generate ${type} failed:`, err)
      throw err
    } finally {
      setGenerating(prev => ({ ...prev, [type]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!app) {
    return (
      <div className="flex items-center justify-center h-64 text-ink-muted">
        Application not found
      </div>
    )
  }

  const specWords = countWords(app.specification)
  const abstractWords = countWords(app.abstract)

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="border-b border-rule bg-white px-4 flex items-center gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-rule'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={loadApp}
          className="p-1.5 text-ink-muted hover:text-ink transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 ml-2" />}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <PatentOverviewTab
            application={app}
            specWords={specWords}
            abstractWords={abstractWords}
            onSave={handleSave}
            onGenerate={handleGenerate}
            generating={generating}
          />
        )}
        {activeTab === 'specification' && (
          <PatentSpecificationTab
            application={app}
            onSave={handleSave}
            onGenerate={() => handleGenerate('specification')}
            generating={generating.specification}
          />
        )}
        {activeTab === 'claims' && (
          <PatentClaimsTab
            application={app}
            onGenerate={() => handleGenerate('claims')}
            generating={generating.claims}
            onReload={loadApp}
          />
        )}
        {activeTab === 'drawings' && (
          <PatentDrawingsTab
            application={app}
            onGenerate={() => handleGenerate('drawings')}
            generating={generating.drawings}
            onReload={loadApp}
          />
        )}
        {activeTab === 'abstract' && (
          <PatentAbstractTab
            application={app}
            onSave={handleSave}
            onGenerate={() => handleGenerate('abstract')}
            generating={generating.abstract}
          />
        )}
        {activeTab === 'prior-art' && (
          <PatentPriorArtTab
            application={app}
            onReload={loadApp}
          />
        )}
        {activeTab === 'analysis' && (
          <PatentAnalysisTab
            application={app}
            onReload={loadApp}
          />
        )}
        {activeTab === 'filing' && (
          <PatentFilingTab
            application={app}
            onSave={handleSave}
            onReload={loadApp}
          />
        )}
      </div>
    </div>
  )
}
