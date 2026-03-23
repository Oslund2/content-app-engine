import { motion } from 'framer-motion'

export default function DropdownInput({
  id,
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  helpText,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          {label}
        </label>
      )}

      <select
        id={id}
        value={typeof value === 'object' ? value?.id : (value ?? '')}
        onChange={(e) => {
          const selectedId = e.target.value || null
          const opt = options.find((o) => o.id === selectedId)
          onChange?.(selectedId, opt || null)
        }}
        className="w-full px-4 py-3 rounded-lg border-2 border-rule bg-white text-ink text-sm
          focus:border-accent focus:outline-none transition-all duration-200"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>

      {helpText && (
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
      )}
    </motion.div>
  )
}
