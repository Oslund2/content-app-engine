import { motion } from 'framer-motion'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function ConfigRadarChart({
  title,
  data,
  dataKeys = [],
  colors,
  height = 300,
}) {
  // Support legacy `colors` array prop mapped to dataKeys by index
  const resolvedKeys = dataKeys.map((dk, i) => ({
    ...dk,
    color: dk.color || (colors && colors[i]) || '#0d7377',
  }))

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
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#6b7280' }}
          />
          <PolarRadiusAxis
            angle={90}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
          />
          {resolvedKeys.map((dk) => (
            <Radar
              key={dk.key}
              name={dk.label || dk.key}
              dataKey={dk.key}
              stroke={dk.color}
              fill={dk.color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            verticalAlign="bottom"
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
