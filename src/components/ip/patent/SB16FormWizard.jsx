// SB16FormWizard — 6-step modal wizard for PTO/SB/16 cover sheet

import { useState } from 'react'
import {
  X, ChevronLeft, ChevronRight, Plus, Trash2, Download,
  User, MapPin, Briefcase, Shield, DollarSign, FileText,
  CheckCircle2, AlertCircle, Eye, Loader2
} from 'lucide-react'
import { calculateFilingFee, formatCurrency, getEntityStatusDescription } from '../../../services/patent/filingFeeService'
import {
  downloadCoverSheet, downloadFeeTransmittal, generateCoverSheetHTML,
  createDefaultInventor, createDefaultCorrespondenceAddress
} from '../../../services/patent/coverSheetService'

const STEPS = [
  { id: 1, label: 'Title & Inventors', icon: User },
  { id: 2, label: 'Correspondence', icon: MapPin },
  { id: 3, label: 'Attorney/Agent', icon: Briefcase },
  { id: 4, label: 'Entity & Gov', icon: Shield },
  { id: 5, label: 'Fee Transmittal', icon: DollarSign },
  { id: 6, label: 'Review & Generate', icon: FileText },
]

const PAYMENT_METHODS = [
  { value: 'electronic', label: 'Electronic Payment (USPTO Patent Center)' },
  { value: 'credit_card', label: 'Credit Card (PTO-2038)' },
  { value: 'check', label: 'Check or Money Order' },
  { value: 'deposit_account', label: 'Deposit Account' },
]

export default function SB16FormWizard({ application, onClose }) {
  const [step, setStep] = useState(1)
  const [downloading, setDownloading] = useState({})
  const [showPreview, setShowPreview] = useState(false)
  const [previewHTML, setPreviewHTML] = useState('')

  // Step 1 data
  const [title] = useState(application.title || '')
  const [inventors, setInventors] = useState(
    application.inventors?.length > 0
      ? application.inventors.map(inv => ({ ...inv, id: inv.id || crypto.randomUUID() }))
      : [createDefaultInventor()]
  )

  // Step 2 data
  const [corrAddr, setCorrAddr] = useState(
    application.correspondence_address
      ? { ...createDefaultCorrespondenceAddress(), ...application.correspondence_address }
      : createDefaultCorrespondenceAddress()
  )

  // Step 3 data
  const [attorney, setAttorney] = useState(
    application.attorney_info || { name: '', registrationNumber: '', firm: '', docketNumber: '' }
  )

  // Step 4 data
  const [entityStatus, setEntityStatus] = useState(application.entity_status || 'small_entity')
  const [governmentInterest, setGovernmentInterest] = useState('')
  const [hasGovInterest, setHasGovInterest] = useState(false)

  // Step 5 data
  const [filingType, setFilingType] = useState(application.metadata?.filing_type || 'provisional')
  const [paymentMethod, setPaymentMethod] = useState('electronic')
  const [depositAccountNumber, setDepositAccountNumber] = useState('')

  // Computed fee
  const claims = application.claims || []
  const independentClaims = claims.filter(c => !c.depends_on && !c.parent_claim_id)
  const feeInput = {
    filingType,
    entityStatus,
    pageCount: 50,
    totalClaims: claims.length,
    independentClaims: independentClaims.length,
    multipleDependent: false,
  }
  const feeResult = calculateFilingFee(feeInput)

  const buildFormData = () => ({
    title,
    inventors,
    correspondenceAddress: corrAddr,
    attorneyInfo: attorney.name ? attorney : null,
    entityStatus,
    governmentInterest: hasGovInterest ? governmentInterest : null,
    docketNumber: attorney.docketNumber || '',
    filingDate: new Date(),
    filingType,
    paymentMethod,
    depositAccountNumber,
    totalFee: feeResult.totalFee,
    firstNamedInventor: inventors[0]?.fullName || '',
    feeLines: [
      { description: 'Basic Filing Fee', amount: feeResult.baseFee },
      { description: 'Search Fee', amount: feeResult.searchFee },
      { description: 'Examination Fee', amount: feeResult.examinationFee },
      { description: 'Excess Claims Fee', amount: feeResult.claimsFee },
      { description: 'Application Size Fee', amount: feeResult.applicationSizeFee },
    ],
  })

  const handleDownloadSB16 = async () => {
    setDownloading(d => ({ ...d, sb16: true }))
    try { downloadCoverSheet(buildFormData()) }
    catch (err) { console.error(err) }
    finally { setDownloading(d => ({ ...d, sb16: false })) }
  }

  const handleDownloadFeeTransmittal = async () => {
    setDownloading(d => ({ ...d, fee: true }))
    try { downloadFeeTransmittal(buildFormData()) }
    catch (err) { console.error(err) }
    finally { setDownloading(d => ({ ...d, fee: false })) }
  }

  const handlePreview = () => {
    setPreviewHTML(generateCoverSheetHTML(buildFormData()))
    setShowPreview(true)
  }

  const addInventor = () => setInventors(prev => [...prev, createDefaultInventor()])
  const removeInventor = (id) => setInventors(prev => prev.filter(i => i.id !== id))
  const updateInventor = (id, field, value) => {
    setInventors(prev => prev.map(inv => {
      if (inv.id !== id) return inv
      if (field.startsWith('residence.')) {
        const sub = field.split('.')[1]
        return { ...inv, residence: { ...inv.residence, [sub]: value } }
      }
      return { ...inv, [field]: value }
    }))
  }

  const inputCls = 'w-full px-3 py-2 text-xs border border-rule rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-blue-400'
  const labelCls = 'block text-xs font-medium text-ink-muted mb-1'

  const isStepValid = () => {
    if (step === 1) return title.trim().length > 0 && inventors.length > 0 && inventors[0].fullName.trim().length > 0
    if (step === 2) return corrAddr.street?.trim() && corrAddr.city?.trim() && corrAddr.zipCode?.trim() && corrAddr.country?.trim()
    return true
  }

  const entityDesc = getEntityStatusDescription(entityStatus)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-rule">
          <div>
            <h2 className="text-base font-bold text-ink">PTO/SB/16 Filing Wizard</h2>
            <p className="text-xs text-ink-muted mt-0.5">Provisional Application for Patent Cover Sheet</p>
          </div>
          <button onClick={onClose} className="p-2 text-ink-muted hover:text-ink hover:bg-paper-warm rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 py-3 border-b border-rule bg-paper-warm">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const isActive = step === s.id
              const isDone = step > s.id
              return (
                <div key={s.id} className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => isDone && setStep(s.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
                      isActive ? 'bg-wcpo-dark text-white' :
                      isDone ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200' :
                      'text-ink-muted cursor-default'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{s.id}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className={`w-3 h-3 shrink-0 ${step > s.id ? 'text-green-400' : 'text-ink-light'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* STEP 1: Title & Inventors */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink">Title & Inventors</h3>

              <div>
                <label className={labelCls}>Invention Title</label>
                <div className="px-3 py-2 text-xs bg-paper-warm border border-rule rounded-lg text-ink">
                  {title || <span className="text-ink-muted italic">No title set</span>}
                </div>
                <p className="text-xs text-ink-muted mt-1">Title is pulled from your application — edit it in the Overview tab.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-ink">Inventors</label>
                  <button onClick={addInventor}
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>

                <div className="space-y-3">
                  {inventors.map((inv, idx) => (
                    <div key={inv.id} className="border border-rule rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-ink-muted">Inventor {idx + 1}</span>
                        {inventors.length > 1 && (
                          <button onClick={() => removeInventor(inv.id)} className="p-1 text-red-400 hover:text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <label className={labelCls}>Full Name</label>
                          <input type="text" value={inv.fullName}
                            onChange={e => updateInventor(inv.id, 'fullName', e.target.value)}
                            placeholder="Given Name, Middle Initial, Family Name" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Citizenship</label>
                          <input type="text" value={inv.citizenship || ''}
                            onChange={e => updateInventor(inv.id, 'citizenship', e.target.value)}
                            placeholder="e.g. US" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>City</label>
                          <input type="text" value={inv.residence?.city || ''}
                            onChange={e => updateInventor(inv.id, 'residence.city', e.target.value)}
                            placeholder="City" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>State</label>
                          <input type="text" value={inv.residence?.state || ''}
                            onChange={e => updateInventor(inv.id, 'residence.state', e.target.value)}
                            placeholder="State" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Country</label>
                          <input type="text" value={inv.residence?.country || ''}
                            onChange={e => updateInventor(inv.id, 'residence.country', e.target.value)}
                            placeholder="Country" className={inputCls} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Correspondence Address */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink">Correspondence Address</h3>
              <p className="text-xs text-ink-muted">All USPTO correspondence will be sent to this address.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Name (Optional)</label>
                  <input type="text" value={corrAddr.name || ''}
                    onChange={e => setCorrAddr(a => ({ ...a, name: e.target.value }))}
                    placeholder="Attorney, firm, or individual name" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Street Address <span className="text-red-500">*</span></label>
                  <input type="text" value={corrAddr.street || ''}
                    onChange={e => setCorrAddr(a => ({ ...a, street: e.target.value }))}
                    placeholder="Street address" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>City <span className="text-red-500">*</span></label>
                  <input type="text" value={corrAddr.city || ''}
                    onChange={e => setCorrAddr(a => ({ ...a, city: e.target.value }))}
                    placeholder="City" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State / Province</label>
                  <input type="text" value={corrAddr.state || ''}
                    onChange={e => setCorrAddr(a => ({ ...a, state: e.target.value }))}
                    placeholder="State" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>ZIP / Postal Code <span className="text-red-500">*</span></label>
                  <input type="text" value={corrAddr.zipCode || ''}
                    onChange={e => setCorrAddr(a => ({ ...a, zipCode: e.target.value }))}
                    placeholder="ZIP Code" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Country <span className="text-red-500">*</span></label>
                  <input type="text" value={corrAddr.country || ''}
                    onChange={e => setCorrAddr(a => ({ ...a, country: e.target.value }))}
                    placeholder="Country" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone (Optional)</label>
                  <input type="tel" value={corrAddr.phone || ''}
                    onChange={e => setCorrAddr(a => ({ ...a, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email (Optional)</label>
                  <input type="email" value={corrAddr.email || ''}
                    onChange={e => setCorrAddr(a => ({ ...a, email: e.target.value }))}
                    placeholder="email@example.com" className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Attorney/Agent */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink">Attorney / Agent Information</h3>
              <p className="text-xs text-ink-muted">Optional. Leave blank if filing pro se (without representation).</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Attorney / Agent Name</label>
                  <input type="text" value={attorney.name || ''}
                    onChange={e => setAttorney(a => ({ ...a, name: e.target.value }))}
                    placeholder="Full name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>USPTO Registration Number</label>
                  <input type="text" value={attorney.registrationNumber || ''}
                    onChange={e => setAttorney(a => ({ ...a, registrationNumber: e.target.value }))}
                    placeholder="e.g. 12345" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Firm Name</label>
                  <input type="text" value={attorney.firm || ''}
                    onChange={e => setAttorney(a => ({ ...a, firm: e.target.value }))}
                    placeholder="Law firm name" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Docket Number (Optional)</label>
                  <input type="text" value={attorney.docketNumber || ''}
                    onChange={e => setAttorney(a => ({ ...a, docketNumber: e.target.value }))}
                    placeholder="Internal docket or reference number" className={inputCls} />
                </div>
              </div>

              {!attorney.name && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    Filing pro se (without an attorney) is allowed. Leave this section blank if you are the inventor filing on your own behalf.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Entity Status & Government Interest */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink">Entity Status</h3>

              <div className="space-y-2">
                {[
                  { value: 'micro_entity', label: 'Micro Entity (37 CFR 1.29)', detail: '75% reduction — attach PTO/SB/15A or 15B' },
                  { value: 'small_entity', label: 'Small Entity (37 CFR 1.27)', detail: '60% reduction from regular fees' },
                  { value: 'regular', label: 'Regular Undiscounted', detail: 'Standard USPTO fee schedule' },
                ].map(opt => (
                  <label key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      entityStatus === opt.value
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-rule hover:bg-paper-warm'
                    }`}>
                    <input type="radio" name="entityStatus" value={opt.value} checked={entityStatus === opt.value}
                      onChange={e => setEntityStatus(e.target.value)} className="mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-ink">{opt.label}</p>
                      <p className="text-xs text-ink-muted">{opt.detail}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="border-t border-rule pt-4">
                <h3 className="text-sm font-semibold text-ink mb-2">U.S. Government Interest</h3>

                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input type="checkbox" checked={hasGovInterest} onChange={e => setHasGovInterest(e.target.checked)} />
                  <span className="text-xs text-ink">The invention was made with U.S. government support</span>
                </label>

                {hasGovInterest && (
                  <div>
                    <label className={labelCls}>Government Interest Statement</label>
                    <textarea
                      value={governmentInterest}
                      onChange={e => setGovernmentInterest(e.target.value)}
                      rows={4}
                      placeholder="This invention was made with government support under contract number [XXX] awarded by [agency]. The government has certain rights in the invention."
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Fee Transmittal */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink">Fee Transmittal</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Filing Type</label>
                  <select value={filingType} onChange={e => setFilingType(e.target.value)}
                    className={inputCls}>
                    <option value="provisional">Provisional Application</option>
                    <option value="non_provisional">Non-Provisional Application</option>
                    <option value="continuation">Continuation</option>
                    <option value="divisional">Divisional</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Entity Status</label>
                  <div className="px-3 py-2 text-xs bg-paper-warm border border-rule rounded-lg text-ink">
                    {entityDesc.title}
                  </div>
                </div>
              </div>

              {/* Live fee breakdown */}
              <div className="border border-rule rounded-lg overflow-hidden">
                <div className="bg-paper-warm px-3 py-2 border-b border-rule">
                  <p className="text-xs font-semibold text-ink">Estimated Fee Breakdown</p>
                </div>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-rule">
                    <tr>
                      <td className="px-3 py-2 text-ink">Basic Filing Fee</td>
                      <td className="px-3 py-2 text-right text-ink">{formatCurrency(feeResult.baseFee)}</td>
                    </tr>
                    {feeResult.searchFee > 0 && (
                      <tr>
                        <td className="px-3 py-2 text-ink">Search Fee</td>
                        <td className="px-3 py-2 text-right text-ink">{formatCurrency(feeResult.searchFee)}</td>
                      </tr>
                    )}
                    {feeResult.examinationFee > 0 && (
                      <tr>
                        <td className="px-3 py-2 text-ink">Examination Fee</td>
                        <td className="px-3 py-2 text-right text-ink">{formatCurrency(feeResult.examinationFee)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-paper-warm border-t-2 border-rule">
                      <td className="px-3 py-2 font-bold text-ink">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-ink">{formatCurrency(feeResult.totalFee)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment method */}
              <div>
                <label className={labelCls}>Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputCls}>
                  {PAYMENT_METHODS.map(pm => (
                    <option key={pm.value} value={pm.value}>{pm.label}</option>
                  ))}
                </select>
              </div>

              {paymentMethod === 'deposit_account' && (
                <div>
                  <label className={labelCls}>Deposit Account Number</label>
                  <input type="text" value={depositAccountNumber}
                    onChange={e => setDepositAccountNumber(e.target.value)}
                    placeholder="Account number" className={inputCls} />
                </div>
              )}

              {paymentMethod === 'credit_card' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700">
                    Do not include credit card information on this form. Complete form PTO-2038 separately and submit it with your filing.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Review & Generate */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink">Review & Generate Documents</h3>
              <p className="text-xs text-ink-muted">Review all entered information before downloading your cover sheet and fee transmittal.</p>

              {/* Summary */}
              <div className="space-y-3">
                <ReviewRow label="Invention Title" value={title} />

                <div className="bg-paper-warm rounded-lg p-3 border border-rule">
                  <p className="text-xs font-semibold text-ink mb-2">Inventors ({inventors.length})</p>
                  {inventors.map((inv, i) => (
                    <div key={inv.id} className="text-xs text-ink-muted">
                      {i + 1}. {inv.fullName || 'Unnamed'} — {inv.residence?.city || '?'}, {inv.residence?.country || '?'} — {inv.citizenship || '?'}
                    </div>
                  ))}
                </div>

                <ReviewRow label="Correspondence" value={`${corrAddr.street}, ${corrAddr.city} ${corrAddr.state} ${corrAddr.zipCode}`.trim()} />
                {attorney.name && <ReviewRow label="Attorney/Agent" value={`${attorney.name}${attorney.registrationNumber ? ` (Reg. ${attorney.registrationNumber})` : ''}`} />}
                <ReviewRow label="Entity Status" value={entityDesc.title} />
                <ReviewRow label="Filing Type" value={filingType.replace('_', '-')} />
                <ReviewRow label="Payment Method" value={PAYMENT_METHODS.find(p => p.value === paymentMethod)?.label || paymentMethod} />
                <ReviewRow label="Estimated Fee" value={formatCurrency(feeResult.totalFee)} highlight />
                {hasGovInterest && <ReviewRow label="Gov't Interest" value="Yes — statement included" />}
              </div>

              {/* Download actions */}
              <div className="pt-2 border-t border-rule space-y-2">
                <button onClick={handlePreview}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-rule rounded-lg text-xs text-ink hover:bg-paper-warm transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Preview Cover Sheet
                </button>

                <button onClick={handleDownloadSB16} disabled={downloading.sb16}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-wcpo-red text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
                  {downloading.sb16 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download SB/16 Cover Sheet PDF
                </button>

                <button onClick={handleDownloadFeeTransmittal} disabled={downloading.fee}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-wcpo-dark text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
                  {downloading.fee ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download Fee Transmittal PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between p-5 border-t border-rule">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-xs border border-rule rounded-lg text-ink hover:bg-paper-warm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map(s => (
              <div key={s.id} className={`w-2 h-2 rounded-full transition-colors ${
                step === s.id ? 'bg-wcpo-dark' :
                step > s.id ? 'bg-green-400' :
                'bg-paper-warm border border-rule'
              }`} />
            ))}
          </div>

          {step < 6 ? (
            <button
              onClick={() => setStep(s => Math.min(6, s + 1))}
              disabled={!isStepValid()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs bg-wcpo-dark text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 text-xs border border-rule rounded-lg text-ink hover:bg-paper-warm">
              Done
            </button>
          )}
        </div>
      </div>

      {/* HTML Preview overlay */}
      {showPreview && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-rule">
              <h3 className="font-semibold text-ink text-sm">SB/16 Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-ink-muted hover:text-ink text-lg font-bold">×</button>
            </div>
            <div className="flex-1 overflow-auto p-4" dangerouslySetInnerHTML={{ __html: previewHTML }} />
            <div className="p-4 border-t border-rule flex justify-end gap-2">
              <button onClick={() => setShowPreview(false)}
                className="px-3 py-1.5 text-xs border border-rule rounded-lg text-ink-muted hover:bg-paper-warm">Close</button>
              <button onClick={handleDownloadSB16}
                className="px-3 py-1.5 text-xs bg-wcpo-red text-white rounded-lg hover:opacity-90">Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewRow({ label, value, highlight }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-rule last:border-0">
      <span className="text-xs font-medium text-ink-muted shrink-0 w-32">{label}</span>
      <span className={`text-xs text-right ${highlight ? 'font-bold text-green-700' : 'text-ink'}`}>
        {value || <span className="text-ink-muted italic">—</span>}
      </span>
    </div>
  )
}
