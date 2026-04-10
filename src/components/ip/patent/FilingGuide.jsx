// FilingGuide — Step-by-step provisional patent filing guide

import { useState } from 'react'
import {
  BookOpen, ExternalLink, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, Info, X, DollarSign
} from 'lucide-react'

const FILING_STEPS = [
  {
    step: 1,
    title: 'Create a USPTO Patent Center Account',
    description: 'Visit USPTO Patent Center and create or sign in to your USPTO.gov account. You will need this account to file online, pay fees, and track your application status.',
    tip: 'If you already have a USPTO.gov account from previous filings, use the same login.',
    link: { href: 'https://patentcenter.uspto.gov', label: 'USPTO Patent Center' },
  },
  {
    step: 2,
    title: 'Select "New Provisional Application"',
    description: 'In Patent Center, navigate to "File" in the top menu, then select "Patent Application." Choose "Provisional" as the application type. You will be guided through the electronic filing system.',
  },
  {
    step: 3,
    title: 'Upload Your Application Documents',
    description: 'Upload your documents in this recommended order: (1) Cover Sheet or ADS Form, (2) Specification, (3) Claims, (4) Abstract, (5) Drawings or figures. Each document should be a separate PDF file.',
    tip: 'PDF files must be text-searchable (not scanned images). Drawings should be clear black-and-white line art.',
  },
  {
    step: 4,
    title: 'Pay the Filing Fee',
    description: 'After uploading documents, proceed to fee payment. Your fee depends on your entity status. Accepted payment methods include credit card, electronic funds transfer, or USPTO deposit account.',
    fees: [
      { label: 'Micro Entity', amount: '$65', detail: '75% reduction — see 37 CFR 1.29 for qualifications' },
      { label: 'Small Entity', amount: '$130', detail: '60% reduction — individuals, small businesses, nonprofits' },
      { label: 'Regular Entity', amount: '$325', detail: 'Large corporations and other entities' },
    ],
  },
  {
    step: 5,
    title: 'Receive Your Provisional Patent Number',
    description: 'After filing and payment, USPTO will issue an immediate filing receipt with your provisional application number (e.g., 63/XXX,XXX) and the official filing date. Save this receipt — the filing date is your priority date.',
    tip: 'You will receive the receipt by email if you provided an email address on your cover sheet.',
  },
  {
    step: 6,
    title: 'File Non-Provisional Within 12 Months',
    description: 'A provisional application automatically expires 12 months after the filing date and cannot be renewed or extended. You must file a non-provisional (utility) application within that window to claim priority back to the provisional filing date.',
    tip: 'Mark your calendar at 6 months and again at 10 months after filing to stay on track.',
    isWarning: true,
  },
]

const FILING_TIPS = [
  'Write your specification as if explaining to someone skilled in your field — be thorough and detailed.',
  'Include all variations and embodiments of your invention, even ones you may not build initially.',
  'Drawings do not need to be professional illustrations — clear hand-drawn figures are acceptable for provisionals.',
  'Claims in a provisional are not required but including them helps establish the scope of your invention.',
  'The specification should fully describe how to make and use the invention (enablement requirement).',
  'Consider having a registered patent attorney or agent review your application before filing.',
]

const COMMON_MISTAKES = [
  { text: 'Filing an incomplete specification that doesn\'t fully describe the invention', severity: 'high' },
  { text: 'Missing the 12-month deadline to convert to a non-provisional application', severity: 'high' },
  { text: 'Not documenting all inventors — omitting an inventor can invalidate the patent', severity: 'high' },
  { text: 'Publicly disclosing the invention more than 12 months before filing', severity: 'high' },
  { text: 'Using scanned image PDFs instead of text-searchable PDFs', severity: 'medium' },
  { text: 'Forgetting to claim the provisional priority date in the later non-provisional filing', severity: 'medium' },
  { text: 'Incorrect entity status claim — overstating your status may invalidate fees paid', severity: 'medium' },
]

export default function FilingGuide({ onClose }) {
  const [expandedStep, setExpandedStep] = useState(null)
  const [showTips, setShowTips] = useState(false)
  const [showMistakes, setShowMistakes] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-rule overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-rule bg-paper-warm">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-ink-muted" />
          <h2 className="text-sm font-bold text-ink">Provisional Patent Application Filing Guide</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-ink-muted hover:text-ink hover:bg-white/80 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info box */}
      <div className="mx-5 mt-4 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          A provisional patent application establishes an early filing date and gives you 12 months to develop your invention and prepare a full non-provisional application. It is <strong>not examined</strong> by the USPTO and does not automatically become a patent.
        </p>
      </div>

      <div className="p-5 space-y-3">

        {/* Steps */}
        {FILING_STEPS.map(item => (
          <div key={item.step}
            className={`border rounded-xl overflow-hidden transition-colors ${item.isWarning ? 'border-amber-300' : 'border-rule'}`}>
            <button
              onClick={() => setExpandedStep(expandedStep === item.step ? null : item.step)}
              className={`w-full flex items-center justify-between p-4 text-left hover:bg-paper-warm transition-colors ${item.isWarning ? 'bg-amber-50 hover:bg-amber-100' : 'bg-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  item.isWarning ? 'bg-amber-400 text-white' : 'bg-wcpo-dark text-white'
                }`}>
                  {item.step}
                </div>
                <span className={`text-sm font-semibold ${item.isWarning ? 'text-amber-800' : 'text-ink'}`}>
                  {item.title}
                </span>
              </div>
              {expandedStep === item.step
                ? <ChevronDown className="w-4 h-4 text-ink-muted shrink-0" />
                : <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />}
            </button>

            {expandedStep === item.step && (
              <div className={`px-4 pb-4 border-t ${item.isWarning ? 'border-amber-200 bg-amber-50' : 'border-rule bg-white'}`}>
                <p className="text-xs text-ink-muted mt-3 leading-relaxed">{item.description}</p>

                {item.fees && (
                  <div className="mt-3 border border-rule rounded-lg overflow-hidden">
                    <div className="bg-paper-warm px-3 py-2 border-b border-rule flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3 text-ink-muted" />
                      <span className="text-xs font-semibold text-ink">2024 Provisional Filing Fees</span>
                    </div>
                    {item.fees.map(fee => (
                      <div key={fee.label} className="flex items-center justify-between px-3 py-2 border-b border-rule last:border-0">
                        <div>
                          <p className="text-xs font-medium text-ink">{fee.label}</p>
                          <p className="text-xs text-ink-muted">{fee.detail}</p>
                        </div>
                        <span className="text-sm font-bold text-green-700">{fee.amount}</span>
                      </div>
                    ))}
                  </div>
                )}

                {item.tip && (
                  <div className="mt-3 flex items-start gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-green-700">{item.tip}</p>
                  </div>
                )}

                {item.link && (
                  <a
                    href={item.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {item.link.label}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Filing Tips */}
        <div className="border border-rule rounded-xl overflow-hidden">
          <button
            onClick={() => setShowTips(!showTips)}
            className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-paper-warm transition-colors"
          >
            <span className="text-sm font-semibold text-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Application Tips for Provisional Filings
            </span>
            {showTips ? <ChevronDown className="w-4 h-4 text-ink-muted" /> : <ChevronRight className="w-4 h-4 text-ink-muted" />}
          </button>

          {showTips && (
            <div className="px-4 pb-4 pt-2 border-t border-rule bg-white">
              <ul className="space-y-2">
                {FILING_TIPS.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Common Mistakes */}
        <div className="border border-amber-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowMistakes(!showMistakes)}
            className="w-full flex items-center justify-between p-4 text-left bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <span className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Common Mistakes to Avoid
            </span>
            {showMistakes ? <ChevronDown className="w-4 h-4 text-amber-500" /> : <ChevronRight className="w-4 h-4 text-amber-500" />}
          </button>

          {showMistakes && (
            <div className="px-4 pb-4 pt-2 border-t border-amber-200 bg-amber-50">
              <ul className="space-y-2">
                {COMMON_MISTAKES.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${item.severity === 'high' ? 'text-red-500' : 'text-amber-400'}`} />
                    <span className={item.severity === 'high' ? 'text-red-700' : 'text-amber-700'}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* External links footer */}
        <div className="pt-2 flex flex-wrap gap-3">
          <a href="https://patentcenter.uspto.gov" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
            <ExternalLink className="w-3 h-3" />
            USPTO Patent Center
          </a>
          <a href="https://mpep.uspto.gov" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
            <ExternalLink className="w-3 h-3" />
            MPEP Guidelines
          </a>
          <a href="https://www.uspto.gov/patents/basics/apply" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
            <ExternalLink className="w-3 h-3" />
            USPTO How to Apply
          </a>
        </div>
      </div>
    </div>
  )
}
