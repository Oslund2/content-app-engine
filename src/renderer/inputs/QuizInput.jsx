import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function QuizInput({
  id,
  label,
  questions = [],
  answers: controlledAnswers,
  onAnswer,
  currentStep: controlledStep,
  helpText,
}) {
  const [internalStep, setInternalStep] = useState(0)
  const [internalAnswers, setInternalAnswers] = useState({})

  const step = controlledStep ?? internalStep
  const answers = controlledAnswers ?? internalAnswers
  const total = questions.length
  const current = questions[step]
  const isComplete = step >= total

  const handleAnswer = useCallback(
    (questionId, value, option) => {
      const updated = { ...answers, [questionId]: value }

      if (!controlledAnswers) {
        setInternalAnswers(updated)
      }

      onAnswer?.(questionId, value, option, updated)

      if (controlledStep == null && step < total - 1) {
        setTimeout(() => setInternalStep((s) => s + 1), 300)
      }
    },
    [answers, controlledAnswers, controlledStep, onAnswer, step, total]
  )

  if (isComplete) return null

  return (
    <div className="mb-6" id={id}>
      {label && (
        <p className="text-sm font-semibold text-gray-700 mb-3">{label}</p>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-ink-muted">
            Question {step + 1} of {total}
          </span>
          <span className="text-xs font-mono text-ink-muted">
            {Math.round(((step) / total) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-rule-light rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / total) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              {current.icon && (
                <current.icon size={16} className="text-accent" />
              )}
              <p className="text-sm font-medium text-ink">
                <span className="text-accent font-bold">Q{step + 1}.</span>{' '}
                {current.question}
              </p>
            </div>

            {current.helpText && (
              <p className="text-xs text-gray-500 mb-3">{current.helpText}</p>
            )}

            <div className="space-y-2">
              {current.options.map((opt) => {
                const isSelected = answers[current.id] === opt.value
                const Icon = opt.icon

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleAnswer(current.id, opt.value, opt)}
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                    className={`w-full text-left px-4 py-4 sm:py-3 rounded-lg border-2 text-sm transition-all duration-200 cursor-pointer select-none
                      ${isSelected
                        ? 'border-accent bg-accent-bg'
                        : 'border-rule bg-white hover:border-red-300 active:scale-[0.98]'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {Icon && (
                        <Icon
                          size={14}
                          className={isSelected ? 'text-accent' : 'text-ink-muted'}
                        />
                      )}
                      <span>{opt.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {helpText && (
        <p className="text-xs text-gray-500 mt-2">{helpText}</p>
      )}
    </div>
  )
}
