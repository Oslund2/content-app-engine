import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  ResponsiveContainer,
} from 'recharts'

function AllKeysTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        fontSize: '13px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        background: '#fff',
        padding: '8px 12px',
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: 0, lineHeight: 1.6 }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

export default function ConfigBarChart({
  title,
  data,
  xKey,
  yKey,
  color = '#0d7377',
  height = 300,
  yLabel,
  secondaryYKey,
  secondaryColor = '#94a3b8',
  referenceLines = [],
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
    >
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: '#8a8a8a' }}
            axisLine={{ stroke: '#d4d0c8' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#8a8a8a' }}
            axisLine={false}
            tickLine={false}
            label={
              yLabel
                ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#6b7280' }
                : undefined
            }
          />
          <Tooltip content={<AllKeysTooltip />} />
          {secondaryYKey && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {referenceLines.map((line, i) => (
            <ReferenceLine
              key={i}
              y={line.y}
              stroke={line.color || '#ef4444'}
              strokeDasharray="4 4"
              label={{
                value: line.label,
                position: 'right',
                fontSize: 11,
                fill: line.color || '#ef4444',
              }}
            />
          ))}
          <Bar
            dataKey={yKey}
            fill={color}
            radius={[4, 4, 0, 0]}
            name={yKey}
          />
          {secondaryYKey && (
            <Bar
              dataKey={secondaryYKey}
              fill={secondaryColor}
              radius={[4, 4, 0, 0]}
              opacity={0.7}
              name={secondaryYKey}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
