// PatentSpecificationTab — View/edit patent specification sections

import { useState } from 'react'
import { Sparkles, Loader2, Save, Edit3, X } from 'lucide-react'
import { countWords } from '../../../services/patent/patentApplicationService'

const SECTIONS = [
  { key: 'field_of_invention', label: 'Field of the Invention', placeholder: 'Describe the technical field of the invention...' },
  { key: 'background_art', label: 'Background of the Invention', placeholder: 'Describe existing solutions, their limitations, and the problems they fail to solve...' },
  { key: 'summary_invention', label: 'Summary of the Invention', placeholder: 'Provide a concise overview of the invention and its key innovative aspects...' },
  { key: 'detailed_description', label: 'Detailed Description', placeholder: 'Provide comprehensive technical details, system architecture, embodiments...' },
]

export default function PatentSpecificationTab({ application, onSave, onGenerate, generating }) {
  const [editingSection, setEditingSection] = useState(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  const handleEdit = (sectionKey) => {
    setEditingSection(sectionKey)
    setEditText(application[sectionKey] || '')
  }

  const handleSaveSection = async () => {
    if (!editingSection) return
    setSaving(true)
    await onSave({ [editingSection]: editText })
    setEditingSection(null)
    setSaving(false)
  }

  const totalWords = SECTIONS.reduce((sum, s) => sum + countWords(application[s.key]), 0)

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Specification</h2>
          <p className="text-xs text-ink-muted mt-0.5">{totalWords} words total across all sections</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {generating ? 'Generating...' : 'Generate All Sections'}
        </button>
      </div>

      {SECTIONS.map(section => {
        const text = application[section.key] || ''
        const words = countWords(text)
        const isEditing = editingSection === section.key

        return (
          <div key={section.key} className="bg-white rounded-xl border border-rule overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-rule">
              <div>
                <h3 className="text-sm font-medium text-ink">{section.label}</h3>
                <span className="text-[10px] text-ink-muted">{words} words</span>
              </div>
              {!isEditing && (
                <button onClick={() => handleEdit(section.key)} className="flex items-center gap-1 px-2 py-1 text-xs text-ink-muted hover:text-ink">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>
            <div className="p-4">
              {isEditing ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-rule rounded-lg text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    placeholder={section.placeholder}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={handleSaveSection} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                    </button>
                    <button onClick={() => setEditingSection(null)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-ink-muted hover:text-ink">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <span className="text-[10px] text-ink-muted ml-auto">{countWords(editText)} words</span>
                  </div>
                </div>
              ) : text ? (
                <div className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{text}</div>
              ) : (
                <p className="text-sm text-ink-muted italic">{section.placeholder}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
