import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export default function RadioGroupInput({
  id,
  label,
  options = [],
  value,
  onChange,
  helpText,
}) {
  return (
    <div className="mb-6" id={id}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {options.map((opt) => {
          const isSelected = value === opt.id || (value && typeof value === 'object' && value.id === opt.id)
          const Icon = opt.icon

          return (
            <motion.div key={opt.id} variants={item}>
              <button
                type="button"
                onClick={() => onChange?.(opt.id, opt)}
                style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                className={`w-full text-left px-4 py-4 sm:py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none
                  ${isSelected
                    ? 'border-accent bg-accent-bg shadow-sm ring-1 ring-accent/20'
                    : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-sm active:scale-[0.98] active:bg-gray-50'
                  }`}
              >
                <div className="flex items-start gap-3">
                  {/* Radio indicator — hidden on mobile, shown on sm+ */}
                  <div
                    className={`hidden sm:flex w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 items-center justify-center transition-all duration-200
                      ${isSelected ? 'border-accent' : 'border-gray-300'}`}
                  >
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-accent block" />
                    )}
                  </div>

                  {/* Selected check on mobile only */}
                  {isSelected && (
                    <span className="sm:hidden w-5 h-5 rounded-full bg-accent shrink-0 mt-0.5 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}

                  <div className="flex items-start gap-2 flex-1">
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
