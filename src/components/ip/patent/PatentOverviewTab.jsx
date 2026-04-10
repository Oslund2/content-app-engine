// PatentOverviewTab — Application overview with strength metrics and basic info

import { useState, useEffect } from 'react'
import { FileText, Sparkles, Loader2, CheckCircle2, AlertCircle, Edit3, Save } from 'lucide-react'
import { getPatentStrength } from '../../../services/patent/patentWorkflowOrchestrator'
import { getStatusLabel, getStatusColor, getFilingTypeLabel, countWords } from '../../../services/patent/patentApplicationService'

export default function PatentOverviewTab({ application, specWords, abstractWords, onSave, onGenerate, generating }) {
  const [strength, setStrength] = useState(null)
  const [loadingStrength, setLoadingStrength] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({ title: application.title })

  useEffect(() => {
    loadStrength()
  }, [application.id])

  const loadStrength = async () => {
    try {
      setLoadingStrength(true)
      const s = await getPatentStrength(application.id)
      setStrength(s)
    } catch (err) {
      console.error('Failed to load strength:', err)
    } finally {
      setLoadingStrength(false)
    }
  }

  const handleSaveTitle = async () => {
    if (editData.title.trim() && editData.title !== application.title) {
      await onSave({ title: editData.title.trim() })
    }
    setEditing(false)
  }

  const meta = application.metadata || {}

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Title & Status */}
      <div className="bg-white rounded-xl border border-rule p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="flex-1 px-2 py-1 border border-rule rounded text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button onClick={handleSaveTitle} className="p-1 text-green-600 hover:text-green-700"><Save className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">{application.title}</h2>
                <button onClick={() => setEditing(true)} className="p-1 text-ink-muted hover:text-ink"><Edit3 className="w-3.5 h-3.5" /></button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(application.status)}`}>
                {getStatusLabel(application.status)}
              </span>
              <span className="text-xs text-ink-muted">{getFilingTypeLabel(meta.filing_type || 'provisional')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strength & Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-rule p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">Filing Readiness</h3>
            <button onClick={loadStrength} className="p-1 text-ink-muted hover:text-ink">
              {loadingStrength ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            </button>
          </div>
          {strength ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke={strength.readinessPercentage >= 80 ? '#22c55e' : strength.readinessPercentage >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3" strokeDasharray={`${strength.readinessPercentage}, 100`} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{strength.readinessPercentage}%</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{7 - strength.missingItems.length}/7 sections complete</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {strength.readinessPercentage >= 80 ? 'Nearly ready to file' : strength.readinessPercentage >= 50 ? 'Making progress' : 'Needs more work'}
                  </p>
                </div>
              </div>
              {strength.missingItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-ink-muted">Missing:</p>
                  {strength.missingItems.map(item => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertCircle className="w-3 h-3" />
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-ink-muted">Click to check readiness</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-rule p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">Content Summary</h3>
          <div className="space-y-2">
            {[
              { label: 'Specification', value: specWords > 0 ? `${specWords} words` : 'Not started', done: specWords > 100 },
              { label: 'Abstract', value: abstractWords > 0 ? `${abstractWords}/150 words` : 'Not started', done: abstractWords >= 50 && abstractWords <= 150 },
              { label: 'Claims', value: `${application.claims?.length || 0} claims`, done: (application.claims?.length || 0) > 0 },
              { label: 'Drawings', value: `${application.drawings?.length || 0} figures`, done: (application.drawings?.length || 0) > 0 },
              { label: 'Inventors', value: `${application.inventors?.length || 0} inventor(s)`, done: (application.inventors?.length || 0) > 0 },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {item.done ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <AlertCircle className="w-3.5 h-3.5 text-ink-muted/40" />}
                  <span className="text-ink">{item.label}</span>
                </div>
                <span className="text-ink-muted">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Generate */}
      <div className="bg-white rounded-xl border border-rule p-5">
        <h3 className="text-sm font-semibold text-ink mb-3">AI-Powered Generation</h3>
        <p className="text-xs text-ink-muted mb-4">Generate patent documentation sections using AI. Review and edit all generated content before filing.</p>
        <div className="flex flex-wrap gap-2">
          {['specification', 'abstract', 'claims', 'drawings'].map(type => (
            <button
              key={type}
              onClick={() => onGenerate(type)}
              disabled={generating[type]}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
            >
              {generating[type] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
