// PatentClaimsTab — View/edit/generate patent claims

import { useState } from 'react'
import { Sparkles, Loader2, Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronRight } from 'lucide-react'
import { createPatentClaim, updatePatentClaim, deletePatentClaim } from '../../../services/patent/patentApplicationService'

export default function PatentClaimsTab({ application, onGenerate, generating, onReload }) {
  const [expandedClaim, setExpandedClaim] = useState(null)
  const [editingClaim, setEditingClaim] = useState(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingClaim, setAddingClaim] = useState(false)
  const [newClaim, setNewClaim] = useState({ claim_type: 'independent', claim_text: '', category: 'method' })
  const [generatingClaims, setGeneratingClaims] = useState(false)

  const claims = application.claims || []
  const independentClaims = claims.filter(c => c.claim_type === 'independent')
  const dependentClaims = claims.filter(c => c.claim_type === 'dependent')

  const handleGenerateClaims = async () => {
    setGeneratingClaims(true)
    try {
      const result = await onGenerate()
      if (result) {
        let parsed
        try {
          const jsonMatch = result.match(/\[[\s\S]*\]/)
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : []
        } catch { parsed = [] }

        for (const claim of parsed) {
          await createPatentClaim(application.id, {
            claim_number: claim.claim_number || claims.length + 1,
            claim_type: claim.claim_type || 'independent',
            claim_text: claim.claim_text,
            category: claim.category || 'method',
            status: 'draft',
          })
        }
        onReload()
      }
    } catch (err) {
      console.error('Generate claims failed:', err)
    } finally {
      setGeneratingClaims(false)
    }
  }

  const handleAddClaim = async () => {
    if (!newClaim.claim_text.trim()) return
    setSaving(true)
    try {
      await createPatentClaim(application.id, {
        claim_number: claims.length + 1,
        ...newClaim,
        status: 'draft',
      })
      setNewClaim({ claim_type: 'independent', claim_text: '', category: 'method' })
      setAddingClaim(false)
      onReload()
    } catch (err) {
      console.error('Add claim failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleEditClaim = async (claimId) => {
    setSaving(true)
    try {
      await updatePatentClaim(claimId, { claim_text: editText })
      setEditingClaim(null)
      onReload()
    } catch (err) {
      console.error('Edit claim failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClaim = async (claimId) => {
    if (!confirm('Delete this claim?')) return
    try {
      await deletePatentClaim(claimId)
      onReload()
    } catch (err) {
      console.error('Delete claim failed:', err)
    }
  }

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Claims</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            {claims.length} total — {independentClaims.length} independent, {dependentClaims.length} dependent
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddingClaim(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-ink border border-rule rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add Claim
          </button>
          <button
            onClick={handleGenerateClaims}
            disabled={generatingClaims || generating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generatingClaims ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generate Claims
          </button>
        </div>
      </div>

      {/* Add claim form */}
      {addingClaim && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <select value={newClaim.claim_type} onChange={(e) => setNewClaim({ ...newClaim, claim_type: e.target.value })} className="px-2 py-1 text-xs border border-rule rounded bg-white">
              <option value="independent">Independent</option>
              <option value="dependent">Dependent</option>
            </select>
            <select value={newClaim.category} onChange={(e) => setNewClaim({ ...newClaim, category: e.target.value })} className="px-2 py-1 text-xs border border-rule rounded bg-white">
              <option value="method">Method</option>
              <option value="system">System</option>
              <option value="apparatus">Apparatus</option>
            </select>
          </div>
          <textarea
            value={newClaim.claim_text}
            onChange={(e) => setNewClaim({ ...newClaim, claim_text: e.target.value })}
            rows={4}
            placeholder="Enter claim text..."
            className="w-full px-3 py-2 border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleAddClaim} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
            </button>
            <button onClick={() => setAddingClaim(false)} className="px-3 py-1.5 text-xs text-ink-muted">Cancel</button>
          </div>
        </div>
      )}

      {/* Claims list */}
      {claims.length === 0 ? (
        <div className="bg-white rounded-xl border border-rule p-8 text-center">
          <p className="text-sm text-ink-muted">No claims yet. Add claims manually or generate them with AI.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {claims.map(claim => (
            <div key={claim.id} className="bg-white rounded-lg border border-rule overflow-hidden">
              <button
                onClick={() => setExpandedClaim(expandedClaim === claim.id ? null : claim.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50"
              >
                {expandedClaim === claim.id ? <ChevronDown className="w-3.5 h-3.5 text-ink-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />}
                <span className="text-xs font-mono font-bold text-blue-700">Claim {claim.claim_number}</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${claim.claim_type === 'independent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {claim.claim_type}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">{claim.category}</span>
                <span className="flex-1 text-xs text-ink-muted truncate ml-2">{claim.claim_text.substring(0, 80)}...</span>
              </button>
              {expandedClaim === claim.id && (
                <div className="px-4 pb-3 border-t border-rule/50">
                  {editingClaim === claim.id ? (
                    <div className="mt-2">
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={6} className="w-full px-3 py-2 border border-rule rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleEditClaim(claim.id)} disabled={saving} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-[10px] rounded">
                          <Save className="w-3 h-3" /> Save
                        </button>
                        <button onClick={() => setEditingClaim(null)} className="px-2 py-1 text-[10px] text-ink-muted"><X className="w-3 h-3 inline" /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{claim.claim_text}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => { setEditingClaim(claim.id); setEditText(claim.claim_text) }} className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => handleDeleteClaim(claim.id)} className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
