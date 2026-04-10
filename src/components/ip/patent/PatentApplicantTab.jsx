// PatentApplicantTab — Inventor info, entity status, correspondence address, attorney info

import { useState } from 'react'
import {
  User, MapPin, Mail, Phone, Briefcase, Plus, Trash2,
  Edit3, Save, X, ChevronDown, Info, CheckCircle2, AlertCircle
} from 'lucide-react'
import { getEntityStatusDescription } from '../../../services/patent/filingFeeService'
import { createDefaultInventor, createDefaultCorrespondenceAddress } from '../../../services/patent/coverSheetService'

export default function PatentApplicantTab({ application, onSave }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Local editable state
  const [entityStatus, setEntityStatus] = useState(application.entity_status || 'small_entity')
  const [inventors, setInventors] = useState(
    application.inventors?.length > 0
      ? application.inventors
      : []
  )
  const [corrAddr, setCorrAddr] = useState(
    application.correspondence_address || createDefaultCorrespondenceAddress()
  )
  const [attorney, setAttorney] = useState(
    application.attorney_info || { name: '', registrationNumber: '', firm: '' }
  )

  const entityDesc = getEntityStatusDescription(entityStatus)

  const addInventor = () => {
    setInventors(prev => [...prev, createDefaultInventor()])
  }

  const removeInventor = (id) => {
    setInventors(prev => prev.filter(inv => inv.id !== id))
  }

  const updateInventor = (id, field, value) => {
    setInventors(prev => prev.map(inv => {
      if (inv.id !== id) return inv
      if (field.startsWith('residence.')) {
        const subField = field.split('.')[1]
        return { ...inv, residence: { ...inv.residence, [subField]: value } }
      }
      return { ...inv, [field]: value }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await onSave({
        entity_status: entityStatus,
        inventors,
        correspondence_address: corrAddr,
        attorney_info: attorney.name ? attorney : null,
      })
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEntityStatus(application.entity_status || 'small_entity')
    setInventors(application.inventors || [])
    setCorrAddr(application.correspondence_address || createDefaultCorrespondenceAddress())
    setAttorney(application.attorney_info || { name: '', registrationNumber: '', firm: '' })
    setEditing(false)
    setError(null)
  }

  const inputCls = `w-full px-3 py-2 text-xs border rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-blue-400 ${editing ? 'border-rule' : 'border-transparent bg-paper-warm'}`
  const readOnlyCls = 'w-full px-3 py-2 text-xs bg-paper-warm rounded-lg text-ink'

  return (
    <div className="p-6 max-w-3xl space-y-6">

      {/* Header with edit toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Applicant Information</h2>
        <div className="flex items-center gap-2">
          {success && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </span>
          )}
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-rule rounded-lg text-ink-muted hover:bg-paper-warm"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-wcpo-dark text-white rounded-lg hover:opacity-90 disabled:opacity-60"
              >
                <Save className="w-3 h-3" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-rule rounded-lg text-ink hover:bg-paper-warm"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Entity Status */}
      <div className="bg-white rounded-xl border border-rule p-5">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-ink-muted" />
          Entity Status
        </h3>

        {editing ? (
          <div className="space-y-3">
            <select
              value={entityStatus}
              onChange={e => setEntityStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-rule rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="micro_entity">Micro Entity — 75% reduction from regular fees</option>
              <option value="small_entity">Small Entity — 60% reduction from regular fees</option>
              <option value="regular">Regular Entity — Standard USPTO fees</option>
            </select>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-1">{entityDesc.title} Qualifications</p>
              <ul className="space-y-0.5">
                {entityDesc.qualifications.map((q, i) => (
                  <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                    <span className="mt-0.5">•</span>{q}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{entityDesc.title}</p>
              <p className="text-xs text-ink-muted mt-0.5">{entityDesc.description}</p>
            </div>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
              entityStatus === 'micro_entity' ? 'bg-green-100 text-green-700' :
              entityStatus === 'small_entity' ? 'bg-blue-100 text-blue-700' :
              'bg-paper-warm text-ink-muted'
            }`}>
              {entityDesc.title}
            </span>
          </div>
        )}
      </div>

      {/* Inventors */}
      <div className="bg-white rounded-xl border border-rule p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <User className="w-4 h-4 text-ink-muted" />
            Inventors
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-paper-warm rounded-md text-ink-muted">{inventors.length}</span>
          </h3>
          {editing && (
            <button
              onClick={addInventor}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              <Plus className="w-3 h-3" /> Add Inventor
            </button>
          )}
        </div>

        {inventors.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">At least one inventor is required for filing.</p>
          </div>
        )}

        <div className="space-y-4">
          {inventors.map((inv, idx) => (
            <div key={inv.id} className="border border-rule rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Inventor {idx + 1}</span>
                {editing && inventors.length > 1 && (
                  <button
                    onClick={() => removeInventor(inv.id)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-ink-muted mb-1">Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={inv.fullName}
                      onChange={e => updateInventor(inv.id, 'fullName', e.target.value)}
                      placeholder="Given Name, Middle Initial, Family Name"
                      className={inputCls}
                    />
                  ) : (
                    <p className={readOnlyCls}>{inv.fullName || <span className="text-ink-muted italic">Not set</span>}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Citizenship</label>
                  {editing ? (
                    <input
                      type="text"
                      value={inv.citizenship}
                      onChange={e => updateInventor(inv.id, 'citizenship', e.target.value)}
                      placeholder="e.g. US"
                      className={inputCls}
                    />
                  ) : (
                    <p className={readOnlyCls}>{inv.citizenship || <span className="text-ink-muted italic">Not set</span>}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Residence City</label>
                  {editing ? (
                    <input
                      type="text"
                      value={inv.residence?.city || ''}
                      onChange={e => updateInventor(inv.id, 'residence.city', e.target.value)}
                      placeholder="City"
                      className={inputCls}
                    />
                  ) : (
                    <p className={readOnlyCls}>{inv.residence?.city || <span className="text-ink-muted italic">Not set</span>}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Residence State</label>
                  {editing ? (
                    <input
                      type="text"
                      value={inv.residence?.state || ''}
                      onChange={e => updateInventor(inv.id, 'residence.state', e.target.value)}
                      placeholder="State / Province"
                      className={inputCls}
                    />
                  ) : (
                    <p className={readOnlyCls}>{inv.residence?.state || <span className="text-ink-muted italic">—</span>}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Residence Country</label>
                  {editing ? (
                    <input
                      type="text"
                      value={inv.residence?.country || ''}
                      onChange={e => updateInventor(inv.id, 'residence.country', e.target.value)}
                      placeholder="Country"
                      className={inputCls}
                    />
                  ) : (
                    <p className={readOnlyCls}>{inv.residence?.country || <span className="text-ink-muted italic">Not set</span>}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {editing && inventors.length === 0 && (
            <button
              onClick={addInventor}
              className="w-full p-4 border-2 border-dashed border-rule rounded-lg text-xs text-ink-muted hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mx-auto mb-1" />
              Add first inventor
            </button>
          )}
        </div>
      </div>

      {/* Correspondence Address */}
      <div className="bg-white rounded-xl border border-rule p-5">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-ink-muted" />
          Correspondence Address
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-ink-muted mb-1">Name (Optional)</label>
            {editing ? (
              <input type="text" value={corrAddr.name || ''} onChange={e => setCorrAddr(a => ({ ...a, name: e.target.value }))}
                placeholder="Organization or person name" className={inputCls} />
            ) : <p className={readOnlyCls}>{corrAddr.name || <span className="text-ink-muted italic">—</span>}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-ink-muted mb-1">Street Address</label>
            {editing ? (
              <input type="text" value={corrAddr.street || ''} onChange={e => setCorrAddr(a => ({ ...a, street: e.target.value }))}
                placeholder="Street address" className={inputCls} />
            ) : <p className={readOnlyCls}>{corrAddr.street || <span className="text-ink-muted italic">Not set</span>}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">City</label>
            {editing ? (
              <input type="text" value={corrAddr.city || ''} onChange={e => setCorrAddr(a => ({ ...a, city: e.target.value }))}
                placeholder="City" className={inputCls} />
            ) : <p className={readOnlyCls}>{corrAddr.city || <span className="text-ink-muted italic">Not set</span>}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">State / Province</label>
            {editing ? (
              <input type="text" value={corrAddr.state || ''} onChange={e => setCorrAddr(a => ({ ...a, state: e.target.value }))}
                placeholder="State" className={inputCls} />
            ) : <p className={readOnlyCls}>{corrAddr.state || <span className="text-ink-muted italic">—</span>}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">ZIP / Postal Code</label>
            {editing ? (
              <input type="text" value={corrAddr.zipCode || ''} onChange={e => setCorrAddr(a => ({ ...a, zipCode: e.target.value }))}
                placeholder="ZIP Code" className={inputCls} />
            ) : <p className={readOnlyCls}>{corrAddr.zipCode || <span className="text-ink-muted italic">Not set</span>}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">Country</label>
            {editing ? (
              <input type="text" value={corrAddr.country || ''} onChange={e => setCorrAddr(a => ({ ...a, country: e.target.value }))}
                placeholder="Country" className={inputCls} />
            ) : <p className={readOnlyCls}>{corrAddr.country || <span className="text-ink-muted italic">Not set</span>}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone (Optional)</span>
            </label>
            {editing ? (
              <input type="tel" value={corrAddr.phone || ''} onChange={e => setCorrAddr(a => ({ ...a, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000" className={inputCls} />
            ) : <p className={readOnlyCls}>{corrAddr.phone || <span className="text-ink-muted italic">—</span>}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email (Optional)</span>
            </label>
            {editing ? (
              <input type="email" value={corrAddr.email || ''} onChange={e => setCorrAddr(a => ({ ...a, email: e.target.value }))}
                placeholder="email@example.com" className={inputCls} />
            ) : <p className={readOnlyCls}>{corrAddr.email || <span className="text-ink-muted italic">—</span>}</p>}
          </div>
        </div>
      </div>

      {/* Attorney / Agent */}
      <div className="bg-white rounded-xl border border-rule p-5">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-1">
          <Briefcase className="w-4 h-4 text-ink-muted" />
          Attorney / Agent
          <span className="text-xs font-normal text-ink-muted">(Optional)</span>
        </h3>
        <p className="text-xs text-ink-muted mb-4">If you are represented by a registered patent attorney or agent, enter their information here.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-ink-muted mb-1">Attorney / Agent Name</label>
            {editing ? (
              <input type="text" value={attorney.name || ''} onChange={e => setAttorney(a => ({ ...a, name: e.target.value }))}
                placeholder="Full name" className={inputCls} />
            ) : <p className={readOnlyCls}>{attorney.name || <span className="text-ink-muted italic">Not set</span>}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">USPTO Registration Number</label>
            {editing ? (
              <input type="text" value={attorney.registrationNumber || ''} onChange={e => setAttorney(a => ({ ...a, registrationNumber: e.target.value }))}
                placeholder="e.g. 12345" className={inputCls} />
            ) : <p className={readOnlyCls}>{attorney.registrationNumber || <span className="text-ink-muted italic">—</span>}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">Firm Name</label>
            {editing ? (
              <input type="text" value={attorney.firm || ''} onChange={e => setAttorney(a => ({ ...a, firm: e.target.value }))}
                placeholder="Law firm name" className={inputCls} />
            ) : <p className={readOnlyCls}>{attorney.firm || <span className="text-ink-muted italic">—</span>}</p>}
          </div>
        </div>
      </div>

      {/* Save button at bottom when editing */}
      {editing && (
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={handleCancel}
            className="px-4 py-2 text-xs border border-rule rounded-lg text-ink-muted hover:bg-paper-warm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-xs bg-wcpo-dark text-white rounded-lg hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5">
            <Save className="w-3 h-3" />
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      )}
    </div>
  )
}
