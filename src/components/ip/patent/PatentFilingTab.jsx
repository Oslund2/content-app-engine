// PatentFilingTab — Core filing preparation tab

import { useState, useEffect } from 'react'
import {
  CheckCircle2, AlertCircle, AlertTriangle, Download, ExternalLink,
  ChevronDown, ChevronRight, FileText, DollarSign, Calendar, Info,
  ClipboardList, Shield, Loader2, RefreshCw
} from 'lucide-react'
import { countWords } from '../../../services/patent/patentApplicationService'
import {
  calculateFilingFee, estimatePageCount, formatCurrency,
  getEntityStatusDescription, compareEntityFees, calculateFilingDeadlines
} from '../../../services/patent/filingFeeService'
import {
  generateCoverSheetHTML, downloadCoverSheet,
  createDefaultInventor, createDefaultCorrespondenceAddress
} from '../../../services/patent/coverSheetService'
import { extractADSDataFromApplication, generateADSForm } from '../../../services/patent/adsFormService'
import { generateAllDeclarations } from '../../../services/patent/declarationFormService'
import { generateMicroEntityCert } from '../../../services/patent/microEntityCertService'
import { getPatentStrength } from '../../../services/patent/patentWorkflowOrchestrator'

export default function PatentFilingTab({ application, onSave, onReload }) {
  const [entityStatus, setEntityStatus] = useState(application.entity_status || 'small_entity')
  const [filingType, setFilingType] = useState(application.metadata?.filing_type || 'provisional')
  const [feeBreakdown, setFeeBreakdown] = useState(null)
  const [entityComparison, setEntityComparison] = useState(null)
  const [showFilingGuide, setShowFilingGuide] = useState(false)
  const [showSB16Wizard, setShowSB16Wizard] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHTML, setPreviewHTML] = useState('')
  const [downloading, setDownloading] = useState({})
  const [deadlines, setDeadlines] = useState([])

  const specWords = countWords(application.specification)
  const abstractWords = countWords(application.abstract)
  const claims = application.claims || []
  const independentClaims = claims.filter(c => !c.depends_on && !c.parent_claim_id)
  const drawings = application.drawings || []
  const inventors = application.inventors || []
  const corrAddr = application.correspondence_address

  // Build checklist
  const checklistItems = [
    {
      id: 'title',
      label: 'Invention Title',
      detail: application.title ? `"${application.title.substring(0, 50)}${application.title.length > 50 ? '...' : ''}"` : 'Not set',
      passed: !!(application.title && application.title.trim().length > 0),
      required: true,
    },
    {
      id: 'specification',
      label: 'Specification',
      detail: specWords > 0 ? `${specWords.toLocaleString()} words` : 'Not started',
      passed: specWords > 100,
      required: true,
    },
    {
      id: 'abstract',
      label: 'Abstract',
      detail: abstractWords > 0 ? `${abstractWords}/150 words${abstractWords > 150 ? ' — too long' : ''}` : 'Not started',
      passed: abstractWords >= 20 && abstractWords <= 150,
      required: true,
    },
    {
      id: 'claims',
      label: 'Claims (at least 1 independent)',
      detail: claims.length > 0
        ? `${claims.length} claim${claims.length !== 1 ? 's' : ''}, ${independentClaims.length} independent`
        : 'No claims added',
      passed: claims.length > 0 && independentClaims.length >= 1,
      required: true,
    },
    {
      id: 'drawings',
      label: 'Drawings',
      detail: drawings.length > 0 ? `${drawings.length} figure${drawings.length !== 1 ? 's' : ''}` : 'No drawings added',
      passed: drawings.length > 0,
      required: true,
    },
    {
      id: 'inventors',
      label: 'Inventor Information',
      detail: inventors.length > 0 ? `${inventors.length} inventor${inventors.length !== 1 ? 's' : ''}` : 'No inventors listed',
      passed: inventors.length > 0,
      required: true,
      warning: inventors.length === 0,
    },
    {
      id: 'address',
      label: 'Correspondence Address',
      detail: corrAddr?.street ? `${corrAddr.city || ''}, ${corrAddr.state || ''} ${corrAddr.zipCode || ''}`.trim().replace(/^,\s*/, '') || 'Address on file' : 'Not set',
      passed: !!(corrAddr?.street && corrAddr?.city && corrAddr?.zipCode),
      required: true,
    },
    {
      id: 'cpc',
      label: 'CPC Classification',
      detail: application.cpc_classification ? application.cpc_classification : 'Optional — not set',
      passed: !!application.cpc_classification,
      required: false,
      optional: true,
    },
  ]

  const requiredPassed = checklistItems.filter(i => i.required && i.passed).length
  const requiredTotal = checklistItems.filter(i => i.required).length
  const readinessScore = requiredPassed
  const readinessPercent = Math.round((requiredPassed / requiredTotal) * 100)

  useEffect(() => {
    recalcFees()
  }, [entityStatus, filingType, specWords, claims.length])

  useEffect(() => {
    if (application.metadata?.provisional_filing_date) {
      setDeadlines(calculateFilingDeadlines(new Date(application.metadata.provisional_filing_date)))
    }
  }, [application.metadata?.provisional_filing_date])

  const recalcFees = () => {
    const pageCount = estimatePageCount(specWords, abstractWords, claims.length, drawings.length)
    const fee = calculateFilingFee({
      filingType,
      entityStatus,
      pageCount,
      totalClaims: claims.length,
      independentClaims: independentClaims.length,
      multipleDependent: false,
    })
    setFeeBreakdown(fee)
    setEntityComparison(compareEntityFees(filingType, pageCount, claims.length, independentClaims.length))
  }

  const buildCoverSheetData = () => ({
    title: application.title || '',
    inventors: inventors.length > 0 ? inventors : [createDefaultInventor()],
    correspondenceAddress: corrAddr || createDefaultCorrespondenceAddress(),
    attorneyInfo: application.attorney_info || null,
    entityStatus,
    governmentInterest: application.metadata?.government_interest || null,
    docketNumber: application.metadata?.docket_number || '',
    filingDate: new Date(),
  })

  const handleDownloadADS = async () => {
    setDownloading(d => ({ ...d, ads: true }))
    try {
      const adsData = extractADSDataFromApplication(application)
      const doc = generateADSForm(adsData)
      doc.save('ADS_Form.pdf')
    } catch (err) {
      console.error('ADS download failed:', err)
    } finally {
      setDownloading(d => ({ ...d, ads: false }))
    }
  }

  const handleDownloadSB16 = async () => {
    setDownloading(d => ({ ...d, sb16: true }))
    try {
      downloadCoverSheet(buildCoverSheetData())
    } catch (err) {
      console.error('SB/16 download failed:', err)
    } finally {
      setDownloading(d => ({ ...d, sb16: false }))
    }
  }

  const handleDownloadDeclarations = async () => {
    setDownloading(d => ({ ...d, declarations: true }))
    try {
      const doc = generateAllDeclarations(application)
      doc.save('Declarations.pdf')
    } catch (err) {
      console.error('Declarations download failed:', err)
    } finally {
      setDownloading(d => ({ ...d, declarations: false }))
    }
  }

  const handleDownloadMicroEntity = async () => {
    setDownloading(d => ({ ...d, microEntity: true }))
    try {
      const doc = generateMicroEntityCert(application)
      doc.save('Micro_Entity_Cert.pdf')
    } catch (err) {
      console.error('Micro entity cert download failed:', err)
    } finally {
      setDownloading(d => ({ ...d, microEntity: false }))
    }
  }

  const handlePreviewSB16 = () => {
    const html = generateCoverSheetHTML(buildCoverSheetData())
    setPreviewHTML(html)
    setShowPreview(true)
  }

  const entityDesc = getEntityStatusDescription(entityStatus)

  const scoreColor = readinessPercent >= 80
    ? 'text-green-600'
    : readinessPercent >= 50
    ? 'text-amber-600'
    : 'text-red-500'

  const barColor = readinessPercent >= 80
    ? 'bg-green-500'
    : readinessPercent >= 50
    ? 'bg-amber-400'
    : 'bg-red-400'

  return (
    <div className="p-6 max-w-4xl space-y-6">

      {/* Filing Readiness */}
      <div className="bg-white rounded-xl border border-rule p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-ink-muted" />
            Filing Readiness
          </h2>
          <div className={`text-2xl font-bold ${scoreColor}`}>
            {readinessScore}/{requiredTotal}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-ink-muted">
              {readinessPercent >= 80 ? 'Nearly ready to file' : readinessPercent >= 50 ? 'Making progress' : 'Needs more work'}
            </span>
            <span className={`text-xs font-semibold ${scoreColor}`}>{readinessPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-paper-warm overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {checklistItems.map(item => (
            <div key={item.id} className={`flex items-start justify-between py-2 px-3 rounded-lg ${item.passed ? 'bg-green-50' : item.optional ? 'bg-blue-50/50' : 'bg-amber-50'}`}>
              <div className="flex items-start gap-2.5">
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                ) : item.optional ? (
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-medium text-ink">{item.label}</span>
                  {item.optional && !item.passed && (
                    <span className="ml-1.5 text-xs text-blue-500 font-normal">(optional)</span>
                  )}
                </div>
              </div>
              <span className={`text-xs ml-4 text-right ${item.passed ? 'text-green-600' : item.optional ? 'text-blue-500' : 'text-amber-600'}`}>
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filing Deadlines */}
      {deadlines.length > 0 && (
        <div className="bg-white rounded-xl border border-rule p-5">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-ink-muted" />
            Filing Deadlines
          </h3>
          <div className="space-y-2">
            {deadlines.map((d, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  d.isPast ? 'bg-red-50 border-red-200' :
                  d.isUrgent ? 'bg-amber-50 border-amber-200' :
                  'bg-green-50 border-green-200'
                }`}
              >
                <div>
                  <p className="text-xs font-medium text-ink">{d.type}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{d.deadline.toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  d.isPast ? 'text-red-700 bg-red-100' :
                  d.isUrgent ? 'text-amber-700 bg-amber-100' :
                  'text-green-700 bg-green-100'
                }`}>
                  {d.isPast ? 'EXPIRED' : `${d.daysRemaining} days`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Filing Options Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Two Required USPTO Filing Forms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-xs font-bold text-blue-700 mb-1">PTO/SB/16 — Cover Sheet</p>
                <p className="text-xs text-ink-muted">Required cover sheet identifying the invention title, inventors, correspondence address, entity status, and enclosed parts.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-xs font-bold text-blue-700 mb-1">ADS — Application Data Sheet</p>
                <p className="text-xs text-ink-muted">Standardized form (37 CFR 1.76) with bibliographic data. Can be submitted in lieu of the cover sheet or separately.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Forms */}
      <div className="bg-white rounded-xl border border-rule p-5">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4">
          <Download className="w-4 h-4 text-ink-muted" />
          Download Filing Forms
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleDownloadADS}
            disabled={downloading.ads}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-wcpo-dark text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {downloading.ads ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download ADS Form
          </button>

          <button
            onClick={handleDownloadSB16}
            disabled={downloading.sb16}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-wcpo-red text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {downloading.sb16 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download SB/16 Cover Sheet
          </button>

          <button
            onClick={handleDownloadDeclarations}
            disabled={downloading.declarations}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-paper-warm border border-rule text-ink text-xs font-semibold rounded-lg hover:bg-paper transition-colors disabled:opacity-60"
          >
            {downloading.declarations ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            Download Declarations
          </button>

          {entityStatus === 'micro_entity' && (
            <button
              onClick={handleDownloadMicroEntity}
              disabled={downloading.microEntity}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-paper-warm border border-rule text-ink text-xs font-semibold rounded-lg hover:bg-paper transition-colors disabled:opacity-60"
            >
              {downloading.microEntity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              Micro Entity Certificate
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-rule">
          <button
            onClick={handlePreviewSB16}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <FileText className="w-3 h-3" />
            Preview SB/16
          </button>
          <a
            href="https://www.uspto.gov/patents/apply/filing-online/patent-center"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-ink-muted border border-rule rounded-lg hover:bg-paper-warm transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            USPTO Patent Center
          </a>
          <a
            href="https://www.uspto.gov/patents/basics/apply"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-ink-muted border border-rule rounded-lg hover:bg-paper-warm transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            USPTO Filing Guide
          </a>
        </div>
      </div>

      {/* Fee Calculator */}
      <div className="bg-white rounded-xl border border-rule p-5">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-ink-muted" />
          Fee Calculator
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">Entity Status</label>
            <select
              value={entityStatus}
              onChange={e => setEntityStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-rule rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="micro_entity">Micro Entity (75% reduction)</option>
              <option value="small_entity">Small Entity (60% reduction)</option>
              <option value="regular">Regular Entity</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">Filing Type</label>
            <select
              value={filingType}
              onChange={e => setFilingType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-rule rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="provisional">Provisional Application</option>
              <option value="non_provisional">Non-Provisional Application</option>
              <option value="continuation">Continuation</option>
              <option value="divisional">Divisional</option>
            </select>
          </div>
        </div>

        {/* Entity status description */}
        <div className="mb-4 p-3 bg-paper-warm rounded-lg border border-rule">
          <p className="text-xs font-semibold text-ink">{entityDesc.title}</p>
          <p className="text-xs text-ink-muted mt-0.5 mb-1.5">{entityDesc.description}</p>
          <ul className="space-y-0.5">
            {entityDesc.qualifications.map((q, i) => (
              <li key={i} className="text-xs text-ink-muted flex items-start gap-1.5">
                <span className="text-green-500 mt-0.5">•</span>
                {q}
              </li>
            ))}
          </ul>
        </div>

        {/* Fee breakdown table */}
        {feeBreakdown && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-ink mb-2">Fee Breakdown</p>
            <div className="border border-rule rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-paper-warm">
                    <th className="text-left px-3 py-2 text-ink-muted font-medium">Fee Type</th>
                    <th className="text-right px-3 py-2 text-ink-muted font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  <tr>
                    <td className="px-3 py-2 text-ink">Basic Filing Fee</td>
                    <td className="px-3 py-2 text-right text-ink">{formatCurrency(feeBreakdown.baseFee)}</td>
                  </tr>
                  {feeBreakdown.searchFee > 0 && (
                    <tr>
                      <td className="px-3 py-2 text-ink">Search Fee</td>
                      <td className="px-3 py-2 text-right text-ink">{formatCurrency(feeBreakdown.searchFee)}</td>
                    </tr>
                  )}
                  {feeBreakdown.examinationFee > 0 && (
                    <tr>
                      <td className="px-3 py-2 text-ink">Examination Fee</td>
                      <td className="px-3 py-2 text-right text-ink">{formatCurrency(feeBreakdown.examinationFee)}</td>
                    </tr>
                  )}
                  {feeBreakdown.claimsFee > 0 && (
                    <tr>
                      <td className="px-3 py-2 text-ink">Excess Claims Fee</td>
                      <td className="px-3 py-2 text-right text-ink">{formatCurrency(feeBreakdown.claimsFee)}</td>
                    </tr>
                  )}
                  {feeBreakdown.applicationSizeFee > 0 && (
                    <tr>
                      <td className="px-3 py-2 text-ink">Application Size Fee</td>
                      <td className="px-3 py-2 text-right text-ink">{formatCurrency(feeBreakdown.applicationSizeFee)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-paper-warm border-t-2 border-rule">
                    <td className="px-3 py-2 font-bold text-ink">Total</td>
                    <td className="px-3 py-2 text-right font-bold text-ink">{formatCurrency(feeBreakdown.totalFee)}</td>
                  </tr>
                  {feeBreakdown.savings.fromRegular > 0 && (
                    <tr className="bg-green-50">
                      <td className="px-3 py-1.5 text-xs text-green-700">Savings vs. Regular</td>
                      <td className="px-3 py-1.5 text-right text-xs text-green-700 font-semibold">
                        -{formatCurrency(feeBreakdown.savings.fromRegular)} ({feeBreakdown.savings.percentage}%)
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Entity comparison grid */}
        {entityComparison && (
          <div>
            <p className="text-xs font-semibold text-ink mb-2">Entity Status Comparison</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'microEntity', label: 'Micro Entity', amount: entityComparison.microEntity },
                { key: 'smallEntity', label: 'Small Entity', amount: entityComparison.smallEntity },
                { key: 'regular', label: 'Regular', amount: entityComparison.regular },
              ].map(row => (
                <div
                  key={row.key}
                  className={`p-2.5 rounded-lg border text-center ${
                    (row.key === 'microEntity' && entityStatus === 'micro_entity') ||
                    (row.key === 'smallEntity' && entityStatus === 'small_entity') ||
                    (row.key === 'regular' && entityStatus === 'regular')
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-rule bg-paper-warm'
                  }`}
                >
                  <p className="text-xs text-ink-muted mb-1">{row.label}</p>
                  <p className="text-sm font-bold text-ink">{formatCurrency(row.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filing Guide Collapsible */}
      <div className="bg-white rounded-xl border border-rule overflow-hidden">
        <button
          onClick={() => setShowFilingGuide(!showFilingGuide)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-paper-warm transition-colors"
        >
          <span className="text-sm font-semibold text-ink flex items-center gap-2">
            <FileText className="w-4 h-4 text-ink-muted" />
            Filing Guide — Step-by-Step Instructions
          </span>
          {showFilingGuide
            ? <ChevronDown className="w-4 h-4 text-ink-muted" />
            : <ChevronRight className="w-4 h-4 text-ink-muted" />}
        </button>

        {showFilingGuide && (
          <div className="px-5 pb-5 border-t border-rule">
            <div className="space-y-4 mt-4">
              {[
                {
                  step: 1,
                  title: 'Create a USPTO Patent Center account',
                  desc: 'Visit patentcenter.uspto.gov and create a USPTO.gov account if you don\'t have one. You\'ll need this to file online.',
                  link: { href: 'https://patentcenter.uspto.gov', label: 'Go to USPTO Patent Center' },
                },
                {
                  step: 2,
                  title: 'Prepare your application documents',
                  desc: 'Export your specification, abstract, claims, and drawings. Use the Download Forms section above to generate the SB/16 Cover Sheet and ADS form.',
                },
                {
                  step: 3,
                  title: 'Start a new application submission',
                  desc: 'In Patent Center, select "File" → "Patent Application." Choose Provisional or Non-Provisional based on your filing type.',
                },
                {
                  step: 4,
                  title: 'Upload documents in order',
                  desc: 'Upload: (1) Cover Sheet / ADS Form, (2) Specification, (3) Claims, (4) Abstract, (5) Drawings. Each document should be a separate PDF.',
                },
                {
                  step: 5,
                  title: 'Select entity status and pay filing fee',
                  desc: `Based on your selection, your estimated ${filingType} filing fee is ${feeBreakdown ? formatCurrency(feeBreakdown.totalFee) : '—'} as a ${getEntityStatusDescription(entityStatus).title}.`,
                },
                {
                  step: 6,
                  title: 'Receive your filing confirmation',
                  desc: 'After payment, you\'ll receive a filing receipt with your application number. For provisional filings, you have 12 months to file the non-provisional.',
                },
              ].map(item => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-wcpo-dark text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink mb-0.5">{item.title}</p>
                    <p className="text-xs text-ink-muted">{item.desc}</p>
                    {item.link && (
                      <a href={item.link.href} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                        <ExternalLink className="w-3 h-3" />
                        {item.link.label}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SB/16 HTML Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-rule">
              <h3 className="font-semibold text-ink">SB/16 Cover Sheet Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-ink-muted hover:text-ink text-lg font-bold">×</button>
            </div>
            <div
              className="flex-1 overflow-auto p-4"
              dangerouslySetInnerHTML={{ __html: previewHTML }}
            />
            <div className="p-4 border-t border-rule flex justify-end gap-2">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 text-xs border border-rule rounded-lg text-ink hover:bg-paper-warm">Close</button>
              <button onClick={handleDownloadSB16} className="px-4 py-2 text-xs bg-wcpo-red text-white rounded-lg hover:opacity-90">Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
