import { motion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'

/**
 * StepGuide — Numbered step-by-step with icons.
 *
 * Config:
 * {
 *   type: "step-guide",
 *   title: "What To Do Next",
 *   description: "Follow these steps to protect your family.",
 *   variant: "numbered" | "checklist" | "timeline",
 *   steps: [
 *     {
 *       title: "Check your smoke detectors",
 *       description: "Press the test button until it beeps.",
 *       icon: "ShieldCheck",
 *       highlight: false
 *     }
 *   ]
 * }
 */

export default function StepGuide({ title, description, steps = [], variant = 'numbered' }) {
  if (!steps.length) return null

  return (
    <div className="mb-8">
      {title && <h2 className="font-serif text-2xl font-bold text-ink mb-2">{title}</h2>}
      {description && <p className="text-sm text-ink-muted mb-6">{description}</p>}

      <div className="space-y-0">
        {steps.map((step, i) => {
          const Icon = step.icon ? LucideIcons[step.icon] : null
          const isLast = i === steps.length - 1

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4"
            >
              {/* Step indicator with connecting line */}
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  step.highlight
                    ? 'bg-wcpo-red text-white'
                    : 'bg-paper-warm border-2 border-rule text-ink-muted'
                }`}>
                  {variant === 'checklist' ? (
                    Icon ? <Icon size={16} /> : <LucideIcons.Check size={16} />
                  ) : variant === 'numbered' ? (
                    <span className="text-sm font-bold">{i + 1}</span>
                  ) : (
                    Icon ? <Icon size={16} /> : <span className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-rule my-1 min-h-[16px]" />
                )}
              </div>

              {/* Step content */}
              <div className={`pb-6 ${isLast ? '' : ''}`}>
                <p className="text-sm font-bold text-ink">{step.title}</p>
                {step.description && (
                  <p className="text-sm text-ink-light mt-1 leading-relaxed">{step.description}</p>
                )}
                {step.cta && (
                  <a
                    href={step.ctaUrl || '#'}
                    target={step.ctaUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-wcpo-red mt-2 hover:underline"
                  >
                    {step.cta} <LucideIcons.ExternalLink size={10} />
                  </a>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
