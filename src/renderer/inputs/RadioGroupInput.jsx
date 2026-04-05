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
            <motion.button
              key={opt.id}
              variants={item}
              type="button"
              onClick={() => onChange?.(opt.id, opt)}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
              className={`w-full text-left px-4 py-4 sm:py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none
                ${isSelected
                  ? 'border-accent bg-accent-bg shadow-sm'
                  : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-sm active:scale-[0.98]'
                }`}
            >
              <div className="flex items-start gap-3">
                {/* Radio indicator */}
                <div
                  className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200
                    ${isSelected ? 'border-accent' : 'border-gray-300'}`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 rounded-full bg-accent"
                    />
                  )}
                </div>

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
            </motion.button>
          )
        })}
      </motion.div>

      {helpText && (
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  )
}
