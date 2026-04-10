// IP Protection — Patent filing preparation tool
// Top-level container with sidebar (application list) + main content area

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Plus, FileText, ChevronLeft, Trash2, Loader2,
  AlertCircle, Clock
} from 'lucide-react'
import PatentApplication from './patent/PatentApplication'
import {
  getPatentApplications,
  createPatentApplication,
  deletePatentApplication,
  getStatusLabel,
  getStatusColor,
} from '../../services/patent/patentApplicationService'

export default function IPProtection({ onBack }) {
  const [applications, setApplications] = useState([])
  const [selectedAppId, setSelectedAppId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [error, setError] = useState(null)

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true)
      const apps = await getPatentApplications()
      setApplications(apps)
    } catch (err) {
      console.error('Failed to load applications:', err)
      setError(`Failed to load applications: ${err?.message || err?.code || JSON.stringify(err)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadApplications() }, [loadApplications])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    try {
      setCreating(true)
      const app = await createPatentApplication({ title: newTitle.trim() })
      setApplications(prev => [app, ...prev])
      setSelectedAppId(app.id)
      setNewTitle('')
      setShowNewForm(false)
    } catch (err) {
      console.error('Failed to create application:', err)
      setError('Failed to create application')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (appId, e) => {
    e.stopPropagation()
    if (!confirm('Delete this patent application? This cannot be undone.')) return
    try {
      await deletePatentApplication(appId)
      setApplications(prev => prev.filter(a => a.id !== appId))
      if (selectedAppId === appId) setSelectedAppId(null)
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleAppUpdate = () => {
    loadApplications()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <header className="bg-wcpo-dark/95 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-white/70 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Shield className="w-5 h-5 text-blue-400" />
        <div>
          <h1 className="text-white font-semibold text-sm">IP Protection</h1>
          <p className="text-white/50 text-xs">Manage patent applications and intellectual property documentation</p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setShowNewForm(true); setSelectedAppId(null) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Application
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-rule flex flex-col overflow-hidden shrink-0">
          <div className="p-3 border-b border-rule">
            <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Applications</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />
              </div>
            ) : applications.length === 0 ? (
              <div className="p-4 text-center text-ink-muted text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No applications yet</p>
                <p className="mt-1">Click "New Application" to start</p>
              </div>
            ) : (
              applications.map(app => (
                <button
                  key={app.id}
                  onClick={() => { setSelectedAppId(app.id); setShowNewForm(false) }}
                  className={`w-full text-left p-3 border-b border-rule/50 hover:bg-paper-warm transition-colors group ${
                    selectedAppId === app.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-ink truncate">{app.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${getStatusColor(app.status)}`}>
                          {getStatusLabel(app.status)}
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-muted mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(app.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(app.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {showNewForm && !selectedAppId ? (
              <motion.div
                key="new-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-lg mx-auto mt-16 p-6"
              >
                <div className="bg-white rounded-xl border border-rule p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-ink mb-1">New Patent Application</h2>
                  <p className="text-sm text-ink-muted mb-4">Enter a title for your invention to get started.</p>

                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="e.g., System and Method for AI-Assisted Content Generation"
                    className="w-full px-3 py-2 border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={handleCreate}
                      disabled={!newTitle.trim() || creating}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Create Application
                    </button>
                    <button
                      onClick={() => { setShowNewForm(false); setNewTitle('') }}
                      className="px-4 py-2 text-sm text-ink-muted hover:text-ink transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : selectedAppId ? (
              <motion.div
                key={selectedAppId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PatentApplication
                  applicationId={selectedAppId}
                  onUpdate={handleAppUpdate}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center p-8"
              >
                <Shield className="w-12 h-12 text-ink-muted/30 mb-3" />
                <h2 className="text-lg font-semibold text-ink mb-1">Patent Filing Preparation</h2>
                <p className="text-sm text-ink-muted max-w-md">
                  Create a new patent application or select an existing one from the sidebar
                  to begin preparing your USPTO filing.
                </p>
                <button
                  onClick={() => setShowNewForm(true)}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Application
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
