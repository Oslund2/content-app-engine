// PatentAbstractTab — View/edit patent abstract (150 word max)

import { useState } from 'react'
import { Sparkles, Loader2, Save, Edit3, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { countWords, validateAbstract } from '../../../services/patent/patentApplicationService'

export default function PatentAbstractTab({ application, onSave, onGenerate, generating }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(application.abstract || '')
  const [saving, setSaving] = useState(false)

  const validation = validateAbstract(editText || application.abstract || '')
  const wordCount = countWords(editing ? editText : application.abstract)

  const handleSave = async () => {
    setSaving(true)
    await onSave({ abstract: editText })
    setEditing(false)
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Abstract</h2>
          <p className="text-xs text-ink-muted mt-0.5">Maximum 150 words — concise summary of the invention</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={() => { setEditing(true); setEditText(application.abstract || '') }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-ink border border-rule rounded-lg hover:bg-gray-50"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generate Abstract
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-rule p-5">
        {/* Word count indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            {validation.valid ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : wordCount > 0 ? (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-ink-muted/40" />
            )}
            <span className={`text-xs font-medium ${validation.valid ? 'text-green-600' : wordCount > 150 ? 'text-red-600' : 'text-ink-muted'}`}>
              {validation.message}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${wordCount > 150 ? 'bg-red-500' : wordCount >= 50 ? 'bg-green-500' : 'bg-amber-400'}`}
              style={{ width: `${Math.min((wordCount / 150) * 100, 100)}%` }}
            />
          </div>
        </div>

        {editing ? (
          <div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={8}
              placeholder="A [type of system/method] for [primary function]. The [invention] comprises [key components]. The system [performs key action] by [method]. [Key advantage or improvement over prior art]."
              className="w-full px-3 py-2 border border-rule rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <div className="flex items-center gap-2 mt-3">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
              </button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-ink-muted">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : application.abstract ? (
          <div className="text-sm text-ink leading-relaxed">{application.abstract}</div>
        ) : (
          <p className="text-sm text-ink-muted italic">
            No abstract yet. Click "Generate Abstract" to create one from your specification, or "Edit" to write manually.
          </p>
        )}
      </div>

      {/* Guidelines */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="text-xs font-semibold text-amber-800 mb-1">USPTO Abstract Guidelines</h3>
        <ul className="text-[10px] text-amber-700 space-y-0.5 list-disc list-inside">
          <li>Must not exceed 150 words</li>
          <li>Should state the nature and gist of the invention</li>
          <li>Must include the technical disclosure of the improvement</li>
          <li>Should describe the principal elements of the key claim(s)</li>
          <li>Should not contain legal phraseology typical of claims</li>
          <li>Recommended: 50-150 words for completeness</li>
        </ul>
      </div>
    </div>
  )
}
