import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

function parseNumeric(val) {
  if (typeof val === 'number') return val
  if (typeof val !== 'string') return 0
  return parseFloat(val.replace(/[^0-9.\-]/g, '')) || 0
}

function formatValue(num, original) {
  if (typeof original === 'number') return num.toLocaleString()
  if (typeof original !== 'string') return String(num)
  // Preserve original formatting style (commas, decimals)
  if (original.includes('.')) {
    const decimals = original.split('.')[1]?.replace(/[^0-9]/g, '').length || 0
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }
  return Math.round(num).toLocaleString()
}

export default function Counter({ value, prefix = '', suffix = '', label, description, duration = 2000, color }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [display, setDisplay] = useState('0')
  const target = parseNumeric(value)

  useEffect(() => {
    if (!inView || target === 0) return
    const start = performance.now()
    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(formatValue(target * eased, value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target, duration, value])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center py-8 mb-8"
    >
      <p
        className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight"
        style={color ? { color } : undefined}
      >
        {prefix}{inView ? display : '0'}{suffix}
      </p>
      {label && (
        <p className="text-sm font-bold uppercase tracking-wider text-ink-muted mt-2">{label}</p>
      )}
      {description && (
        <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">{description}</p>
      )}
    </motion.div>
  )
}
