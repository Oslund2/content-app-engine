import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const DEFAULT_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#9333ea', '#0891b2', '#ea580c', '#6366f1']

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-rule text-sm">
      <span className="font-semibold text-ink">{d.name}</span>
      <span className="text-ink-muted ml-2">{d.value.toLocaleString()}</span>
    </div>
  )
}

export default function ConfigPieChart({ data = [], title, variant = 'donut', height = 280, showLabels = true, color }) {
  if (!data.length) return null
  const innerRadius = variant === 'donut' ? '50%' : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl border border-rule p-4 mb-2"
    >
      {title && (
        <h4 className="text-sm font-bold text-ink mb-3">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius="80%"
            paddingAngle={2}
            label={showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
            labelLine={showLabels}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(val) => <span className="text-xs text-ink-muted">{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
