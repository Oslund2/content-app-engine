import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Area, AreaChart } from 'recharts'
import { TrendingUp } from 'lucide-react'

export default function ProjectionChart({ breakdown, yearlyProjection, cityName }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-teal-bg flex items-center justify-center">
          <TrendingUp size={18} className="text-teal" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">The Data</h2>
      </div>

      {/* Monthly Breakdown Bar Chart */}
      <div className="bg-white border border-rule rounded-xl p-5 sm:p-8 mb-8">
        <h3 className="text-sm font-medium uppercase tracking-wide text-ink-muted mb-6">
          Monthly Spending: Now vs. 2030 Projection
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakdown} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#8a8a8a' }}
                axisLine={{ stroke: '#d4d0c8' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#8a8a8a' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, '']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #d4d0c8',
                  fontSize: '13px',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
              <Bar dataKey="current" fill="#0d7377" radius={[4, 4, 0, 0]} name="Current" />
              <Bar dataKey="projected" fill="#c43d2e" radius={[4, 4, 0, 0]} opacity={0.7} name="2030" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 justify-center mt-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-teal" /> Current
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-accent opacity-70" /> 2030 Projected
          </span>
        </div>
      </div>

      {/* Yearly Trajectory */}
      <div className="bg-white border border-rule rounded-xl p-5 sm:p-8">
        <h3 className="text-sm font-medium uppercase tracking-wide text-ink-muted mb-6">
          Total Monthly Cost Trajectory in {cityName}
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yearlyProjection} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c43d2e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#c43d2e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: '#8a8a8a' }}
                axisLine={{ stroke: '#d4d0c8' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#8a8a8a' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}/mo`, 'Projected']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #d4d0c8',
                  fontSize: '13px',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#c43d2e"
                strokeWidth={2.5}
                fill="url(#colorTotal)"
                dot={{ fill: '#c43d2e', r: 4, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
