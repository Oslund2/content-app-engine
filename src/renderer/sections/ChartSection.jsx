import { useConfig } from '../ConfigContext'
import { ConfigBarChart, ConfigAreaChart, ConfigRadarChart, ConfigPieChart } from '../charts'
import { resolvePath } from '../FormulaEngine'

const chartComponents = {
  bar: ConfigBarChart,
  area: ConfigAreaChart,
  radar: ConfigRadarChart,
  pie: ConfigPieChart,
  donut: ConfigPieChart,
}

/**
 * Resolve chart data: either an inline array or a reference to a calculation key.
 */
function resolveData(dataDef, calculations, inputState) {
  if (Array.isArray(dataDef)) return dataDef
  if (typeof dataDef === 'string') {
    // Try calculations first, then full context lookup
    const fromCalc = calculations[dataDef]
    if (Array.isArray(fromCalc)) return fromCalc
    const fromCtx = resolvePath(dataDef, { inputs: inputState, calculations })
    if (Array.isArray(fromCtx)) return fromCtx
  }
  return []
}

export default function ChartSection({ charts }) {
  const { calculations, inputState } = useConfig()

  if (!Array.isArray(charts) || charts.length === 0) return null

  return (
    <section className="mb-10">
      <div
        className={`grid gap-4 ${
          charts.length === 1
            ? 'grid-cols-1'
            : 'grid-cols-1 lg:grid-cols-2'
        }`}
      >
        {charts.map((chartDef, i) => {
          const Component = chartComponents[chartDef.type]
          if (!Component) return null

          const data = resolveData(chartDef.data, calculations, inputState)

          // Spread all chart props except type and data
          const { type, data: _data, ...rest } = chartDef

          return <Component key={chartDef.id || i} data={data} {...rest} />
        })}
      </div>
    </section>
  )
}
