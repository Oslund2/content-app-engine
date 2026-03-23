import { motion } from 'framer-motion'

export default function SliderInput({
  id,
  label,
  min = 0,
  max = 100,
  step = 1,
  defaultValue,
  value,
  onChange,
  helpText,
  unit = '',
  showValue = true,
}) {
  const current = value ?? defaultValue ?? min

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <div className="flex items-baseline justify-between mb-2">
        <label htmlFor={id} className="text-sm font-semibold text-gray-700">
          {label}
        </label>
        {showValue && (
          <span className="text-lg font-bold font-mono text-accent">
            {current}
            {unit && <span className="text-sm text-ink-muted ml-1">{unit}</span>}
          </span>
        )}
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-ink-muted mt-1">
        <span>{min}{unit && ` ${unit}`}</span>
        <span>{max}{unit && ` ${unit}`}</span>
      </div>

      {helpText && (
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
      )}
    </motion.div>
  )
}
