import { Check } from 'lucide-react'
import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export default function CheckboxGroupInput({
  id,
  label,
  options = [],
  value,
  values,
  onChange,
  columns = 2,
  helpText,
  maxSelections,
}) {
  // Accept either "value" or "values" prop (InputSection passes "value")
  const selected = values ?? (Array.isArray(value) ? value : [])

  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2'

  const valueIds = selected.map(v => typeof v === 'object' ? v.id : v)
  const atLimit = maxSelections != null && selected.length >= maxSelections

  const handleToggle = (optId) => {
    const currentIds = selected.map(v => typeof v === 'object' ? v.id : v)
    const isSelected = currentIds.includes(optId)
    let next

    if (isSelected) {
      next = selected.filter((v) => (typeof v === 'object' ? v.id : v) !== optId)
    } else {
      if (atLimit) return
      const opt = options.find(o => o.id === optId)
      next = [...selected, opt || optId]
    }

    onChange?.(next)
  }

  return (
    <div className="mb-6" id={id}>
      {label && (
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">{label}</label>
          {maxSelections != null && (
            <span className="text-xs text-ink-muted">
              {selected.length} / {maxSelections} selected
            </span>
          )}
        </div>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className={`grid ${gridClass} gap-3`}
      >
        {options.map((opt) => {
          const isSelected = valueIds.includes(opt.id)
          const isDisabled = !isSelected && atLimit
          const Icon = opt.icon

          return (
            <motion.div key={opt.id} variants={item}>
              <button
                type="button"
                onClick={() => handleToggle(opt.id)}
                disabled={isDisabled}
                style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                className={`relative w-full text-left px-4 py-4 sm:py-3 rounded-xl border-2 transition-all duration-200 select-none
                  ${isSelected
                    ? 'border-accent bg-accent-bg shadow-sm'
                    : isDisabled
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-sm active:scale-[0.98] active:bg-gray-50'
                  }`}
              >
                {/* Check indicator */}
                <div
                  className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200
                    ${isSelected
                      ? 'bg-accent text-white'
                      : 'border-2 border-gray-200'
                    }`}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>

                <div className="flex items-start gap-2 pr-6">
                  {Icon && (
                    <Icon
                      size={16}
                      className={`shrink-0 mt-0.5 ${isSelected ? 'text-accent' : 'text-ink-muted'}`}
                    />
                  )}
                  <div>
                    <span className={`text-sm font-medium block ${isSelected ? 'text-ink' : 'text-ink-light'}`}>
                      {opt.label}
                    </span>
                    {opt.description && (
                      <span className="text-xs text-ink-muted block mt-0.5">
                        {opt.description}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </motion.div>
          )
        })}
      </motion.div>

      {helpText && (
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  )
}
