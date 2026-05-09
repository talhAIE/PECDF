import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
  ReferenceArea,
} from 'recharts'

function CustomTooltip({ active, payload, label, variable }) {
  if (!active || !payload?.length) return null
  const varLabel =
    variable === 'pkr'  ? `USD/PKR: ${Number(label).toFixed(1)}`  :
    variable === 'oil'  ? `Brent Oil: $${Number(label).toFixed(1)}/bbl` :
                          `US Confidence: ${Number(label).toFixed(1)}`
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-slate-700 mb-1.5 border-b border-slate-100 pb-1.5">{varLabel}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-3">
          <span style={{ color: p.stroke }}>{p.name === 'a' ? 'Scenario A' : p.name === 'b' ? 'Scenario B' : 'Forecast'}</span>
          <span className="font-mono font-semibold text-slate-900">${Number(p.value).toFixed(2)}M</span>
        </p>
      ))}
    </div>
  )
}

const VARIABLE_LABELS = {
  pkr:  'USD/PKR Rate',
  oil:  'Brent Oil ($/bbl)',
  conf: 'US Consumer Confidence Index',
}

function computeDomain(values, padPct = 0.08) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || max * 0.1 || 1
  const pad = range * padPct
  return [
    Math.max(0, Math.floor((min - pad) * 10) / 10),
    Math.ceil((max + pad) * 10) / 10,
  ]
}

export default function ScenarioChart({
  points        = [],    // [{input_value, predicted_m}]
  variable      = 'pkr',
  currentValue  = null,
  annotation    = '',
  comparePoints = null,  // optional second series for compare mode
  className     = '',
}) {
  if (!points.length) return null

  const data = points.map((p) => ({
    x: p.input_value,
    a: p.predicted_m,
    b: comparePoints
      ? comparePoints.find((c) => c.input_value === p.input_value)?.predicted_m
      : undefined,
  }))

  const allY = [
    ...data.map((d) => d.a),
    ...(comparePoints ? data.map((d) => d.b).filter(Boolean) : []),
  ]
  const yDomain = computeDomain(allY)

  const yFormatter = (v) => `$${Number(v).toFixed(1)}M`

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 12, right: 24, left: 8, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />

          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v) =>
              variable === 'oil'  ? `$${Number(v).toFixed(0)}` :
              variable === 'pkr'  ? Number(v).toFixed(0) :
              Number(v).toFixed(0)
            }
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
            label={{
              value: VARIABLE_LABELS[variable] ?? variable,
              position: 'insideBottom',
              offset: -16,
              fontSize: 11,
              fill: '#94A3B8',
            }}
          />

          <YAxis
            domain={yDomain}
            tickFormatter={yFormatter}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={false}
            width={60}
          />

          <Tooltip content={<CustomTooltip variable={variable} />} />

          {comparePoints && (
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => value === 'a' ? 'Scenario A' : 'Scenario B'}
            />
          )}

          {/* Scenario A (or single) */}
          <Line
            type="monotone"
            dataKey="a"
            name="a"
            stroke="#2563EB"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#2563EB', strokeWidth: 0 }}
            activeDot={{ r: 5.5, fill: '#1D4ED8' }}
          />

          {/* Scenario B (compare mode) */}
          {comparePoints && (
            <Line
              type="monotone"
              dataKey="b"
              name="b"
              stroke="#DC2626"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={{ r: 3.5, fill: '#DC2626', strokeWidth: 0 }}
              activeDot={{ r: 5.5, fill: '#B91C1C' }}
            />
          )}

          {/* Current value reference line */}
          {currentValue != null && (
            <ReferenceLine
              x={currentValue}
              stroke="#64748B"
              strokeDasharray="5 3"
              strokeWidth={1.5}
              label={{
                value: 'Current',
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#64748B',
                dy: -4,
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Annotation */}
      {annotation && (
        <p className="text-xs text-slate-500 text-center mt-2 italic leading-snug">{annotation}</p>
      )}
    </div>
  )
}
