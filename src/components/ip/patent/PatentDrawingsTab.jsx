// PatentDrawingsTab — View/manage patent drawings (SVG diagrams)

import { useState } from 'react'
import { Sparkles, Loader2, Trash2, Eye, EyeOff } from 'lucide-react'
import { createPatentDrawing, deletePatentDrawing, deleteAllDrawingsForApplication } from '../../../services/patent/patentApplicationService'

export default function PatentDrawingsTab({ application, onGenerate, generating, onReload }) {
  const [generatingDrawings, setGeneratingDrawings] = useState(false)
  const [expandedDrawing, setExpandedDrawing] = useState(null)

  const drawings = application.drawings || []

  const handleGenerate = async () => {
    setGeneratingDrawings(true)
    try {
      const result = await onGenerate()
      if (result) {
        let parsed
        try {
          const jsonMatch = result.match(/\[[\s\S]*\]/)
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : []
        } catch { parsed = [] }

        // Clear existing drawings first
        if (drawings.length > 0) {
          await deleteAllDrawingsForApplication(application.id)
        }

        for (const drawing of parsed) {
          await createPatentDrawing(application.id, {
            figure_number: drawing.figure_number || 1,
            title: drawing.title || 'Untitled',
            description: drawing.description || '',
            drawing_type: drawing.drawing_type || 'block_diagram',
            callouts: drawing.callouts || [],
            svg_content: drawing.svg_content || null,
          })
        }
        onReload()
      }
    } catch (err) {
      console.error('Generate drawings failed:', err)
    } finally {
      setGeneratingDrawings(false)
    }
  }

  const handleDelete = async (drawingId) => {
    if (!confirm('Delete this drawing?')) return
    try {
      await deletePatentDrawing(drawingId)
      onReload()
    } catch (err) {
      console.error('Delete drawing failed:', err)
    }
  }

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Drawings</h2>
          <p className="text-xs text-ink-muted mt-0.5">{drawings.length} figures</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generatingDrawings || generating}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generatingDrawings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Generate Drawings
        </button>
      </div>

      {drawings.length === 0 ? (
        <div className="bg-white rounded-xl border border-rule p-8 text-center">
          <p className="text-sm text-ink-muted">No drawings yet. Generate drawings with AI to create block diagrams, flowcharts, and system diagrams.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drawings.map(drawing => (
            <div key={drawing.id} className="bg-white rounded-xl border border-rule overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-rule">
                <div>
                  <h3 className="text-xs font-semibold text-ink">FIG. {drawing.figure_number} — {drawing.title}</h3>
                  <span className="text-[10px] text-ink-muted">{drawing.drawing_type?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedDrawing(expandedDrawing === drawing.id ? null : drawing.id)}
                    className="p-1 text-ink-muted hover:text-ink"
                  >
                    {expandedDrawing === drawing.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleDelete(drawing.id)} className="p-1 text-red-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {drawing.svg_content && (
                <div className="p-4 bg-white flex items-center justify-center" dangerouslySetInnerHTML={{ __html: drawing.svg_content }} />
              )}

              {expandedDrawing === drawing.id && (
                <div className="px-4 pb-3 border-t border-rule/50">
                  {drawing.description && (
                    <p className="text-xs text-ink mt-2">{drawing.description}</p>
                  )}
                  {drawing.callouts?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] font-semibold text-ink-muted uppercase">Reference Numerals</p>
                      {drawing.callouts.map((callout, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[10px]">
                          <span className="font-mono font-bold text-blue-700 shrink-0">{callout.number}</span>
                          <span className="text-ink"><strong>{callout.label}</strong> — {callout.description}</span>
                        </div>
                      ))}
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
