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

export default function ButtonArrayInput({
  id,
  label,
  options = [],
  value,
  onChange,
  columns = 3,
  helpText,
}) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-2 sm:grid-cols-3'

  return (
    <div className="mb-6">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className={`grid ${gridClass} gap-3`}
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
              className={`group relative px-4 py-4 sm:py-3 rounded-lg border-2 text-left transition-all duration-200 cursor-pointer select-none
                ${isSelected
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-red-300 hover:shadow-sm active:scale-[0.98]'
                }`}
            >
              <div className="flex items-center gap-2">
                {Icon && (
                  <Icon
                    size={16}
                    className={isSelected ? 'text-white' : 'text-ink-muted'}
                  />
                )}
                <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-ink'}`}>
                  {opt.label}
                </span>
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
