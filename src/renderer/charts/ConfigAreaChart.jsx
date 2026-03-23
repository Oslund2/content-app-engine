import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

export default function ConfigAreaChart({
  title,
  data,
  xKey,
  yKey,
  color = '#0d7377',
  height = 300,
  yLabel,
  xLabel,
  referenceLines = [],
  tooltip,
}) {
  const gradientId = `area-gradient-${yKey}`

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
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: '#8a8a8a' }}
            axisLine={{ stroke: '#d4d0c8' }}
            tickLine={false}
            label={
              xLabel
                ? { value: xLabel, position: 'insideBottom', offset: -2, fontSize: 11, fill: '#6b7280' }
                : undefined
            }
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
          {tooltip ? (
            <Tooltip content={tooltip} />
          ) : (
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            />
          )}
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
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={{ fill: color, r: 3, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
