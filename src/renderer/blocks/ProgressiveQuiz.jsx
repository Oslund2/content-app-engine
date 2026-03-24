import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { useConfig } from '../ConfigContext'

/**
 * ProgressiveQuiz — One question at a time with per-answer feedback/tips.
 * Inspired by FireCrisis safety quiz. Unlike the basic QuizInput, this renders
 * ALL answered questions visibly (not just current) and shows contextual tips.
 *
 * Config:
 * {
 *   type: "progressive-quiz",
 *   id: "safety_quiz",
 *   title: "Is Your Home Fire-Safe?",
 *   subtitle: "Five questions. Two minutes.",
 *   questions: [
 *     {
 *       id: "detectors",
 *       question: "Do you have working smoke detectors?",
 *       icon: "ShieldCheck",
 *       options: [
 *         { label: "Yes, all levels", value: "all", score: 3, tip: "Good. Test monthly." },
 *         { label: "Some floors", value: "some", score: 1, tip: "Every level needs one." },
 *         { label: "No", value: "none", score: 0, tip: "Call 311 for free detectors." }
 *       ]
 *     }
 *   ],
 *   grading: { A: [90,100], B: [70,89], C: [50,69], D: [30,49], F: [0,29] }
 * }
 */

export default function ProgressiveQuiz({ id, title, subtitle, questions = [], grading }) {
  const { setInput } = useConfig()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})

  const handleAnswer = (qId, value, option) => {
    const updated = { ...answers, [qId]: { value, score: option.score ?? 0, tip: option.tip } }
    setAnswers(updated)

    // Update config context with all answers
    if (id) setInput(id, updated)

    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(s => s + 1), 350)
    }
  }

  const allAnswered = Object.keys(answers).length === questions.length

  const results = useMemo(() => {
    if (!allAnswered) return null
    const maxScore = questions.length * Math.max(...questions.flatMap(q => q.options.map(o => o.score ?? 0)))
    const totalScore = Object.values(answers).reduce((sum, a) => sum + a.score, 0)
    const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

    let grade = ''
    const scale = grading || { A: [90, 100], B: [70, 89], C: [50, 69], D: [30, 49], F: [0, 29] }
    for (const [g, range] of Object.entries(scale)) {
      if (Array.isArray(range) && pct >= range[0] && pct <= range[1]) {
        grade = g
        break
      }
    }
    if (!grade) grade = pct >= 70 ? 'A' : pct >= 50 ? 'C' : 'F'

    const gradeColor = pct >= 70 ? 'text-green-700' : pct >= 50 ? 'text-amber-700' : 'text-red-700'
    const gradeBg = pct >= 70 ? 'bg-green-50 border-green-200' : pct >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

    return { totalScore, maxScore, pct, grade, gradeColor, gradeBg }
  }, [allAnswered, answers, questions, grading])

  return (
    <div className="mb-8">
      {title && <h2 className="font-serif text-2xl font-bold text-ink mb-2">{title}</h2>}
      {subtitle && <p className="text-ink-light text-sm mb-6">{subtitle}</p>}

      {/* Render all questions up to current step */}
      {questions.slice(0, currentStep + 1).map((q, qi) => {
        const Icon = q.icon ? LucideIcons[q.icon] : HelpCircle
        const answer = answers[q.id]

        return (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              {Icon && <Icon size={16} className="text-accent" />}
              <p className="text-sm font-medium text-ink">
                <span className="text-accent font-bold">Q{qi + 1}.</span> {q.question}
              </p>
            </div>
            <div className="space-y-2">
              {q.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => !answer && handleAnswer(q.id, opt.value, opt)}
                  disabled={!!answer}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all
                    ${answer?.value === opt.value
                      ? 'border-accent bg-accent-bg'
                      : answer
                        ? 'border-rule bg-white opacity-50'
                        : 'border-rule bg-white hover:border-red-300 cursor-pointer'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Per-answer tip */}
            {answer?.tip && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 bg-paper-warm rounded-lg p-3 border border-rule"
              >
                <p className="text-sm text-ink-light">{answer.tip}</p>
              </motion.div>
            )}
          </motion.div>
        )
      })}

      {/* Grade display after all answered */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={`rounded-xl p-8 text-center mb-6 border-2 ${results.gradeBg}`}>
              <p className={`text-6xl font-bold font-mono ${results.gradeColor}`}>{results.grade}</p>
              <p className="text-sm text-ink-muted mt-2">
                {results.totalScore} / {results.maxScore} points ({results.pct}%)
              </p>
            </div>

            {/* Color-coded action items from tips */}
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">Your Results</h3>
            <div className="space-y-3">
              {questions.map(q => {
                const a = answers[q.id]
                if (!a) return null
                const scoreClass = a.score >= 2 ? 'bg-green-50 border-green-200' : a.score === 1 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
                const iconClass = a.score >= 2 ? 'text-green-600' : a.score === 1 ? 'text-amber-600' : 'text-red-600'
                return (
                  <div key={q.id} className={`rounded-lg p-4 border ${scoreClass}`}>
                    <div className="flex items-start gap-2">
                      {a.score >= 2
                        ? <CheckCircle2 size={16} className={`${iconClass} shrink-0 mt-0.5`} />
                        : <AlertTriangle size={16} className={`${iconClass} shrink-0 mt-0.5`} />}
                      <div>
                        <p className="text-xs font-semibold text-ink mb-0.5">{q.question}</p>
                        {a.tip && <p className="text-sm text-ink-light">{a.tip}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
