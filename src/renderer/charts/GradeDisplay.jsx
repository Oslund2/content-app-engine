import { motion } from 'framer-motion'

const defaultGradeColors = {
  A: '#16a34a',
  B: '#2563eb',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
}

export default function GradeDisplay({
  grade,
  label,
  description,
  scale,
  color,
}) {
  const resolvedColor = color || defaultGradeColors[grade?.charAt(0)?.toUpperCase()] || '#6b7280'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
        style={{
          backgroundColor: `${resolvedColor}15`,
          border: `3px solid ${resolvedColor}`,
        }}
      >
        <span
          className="text-3xl font-bold leading-none"
          style={{ color: resolvedColor }}
        >
          {grade}
        </span>
      </div>
      {label && (
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
      )}
      {description && (
        <p className="text-xs text-gray-500 mt-1 max-w-xs">{description}</p>
      )}
      {scale && (
        <p className="text-xs text-gray-400 mt-2">Scale: {scale}</p>
      )}
    </motion.div>
  )
}
