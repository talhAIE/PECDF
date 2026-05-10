import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer, Line, ComposedChart, Legend
} from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const YEAR_COLORS = ['#2563EB', '#16A34A', '#F59E0B']

function buildBarData(monthlyAverages, peakMonth, troughMonth) {
  return MONTHS.map((name, i) => {
    const monthNum = i + 1
    return {
      name,
      value: monthlyAverages?.[monthNum] ?? 0,
      isPeak:   monthNum === peakMonth,
      isTrough: monthNum === troughMonth,
    }
  })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color ?? p.fill }}>
          {p.name}: <span className="font-mono font-semibold">${Number(p.value).toFixed(1)}M</span>
        </p>
      ))}
    </div>
  )
}

export default function SeasonalityChart({
  monthlyAverages = {},
  peakMonth       = null,
  troughMonth     = null,
  yearData        = [],   // [{year, data: {1: 45.2, ...}}]
  className       = ''
}) {
  const barData = buildBarData(monthlyAverages, peakMonth, troughMonth)

  if (yearData.length > 0) {
    // Overlay mode — ComposedChart with bars + year lines
    const combinedData = MONTHS.map((name, i) => {
      const m = i + 1
      const row = { name, avg: monthlyAverages?.[m] ?? 0 }
      yearData.forEach(({ year, data }) => {
        row[String(year)] = data?.[m] ?? null
      })
      return row
    })

    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={combinedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
            <YAxis tickFormatter={(v) => `$${v}M`} tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} width={48} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="avg" name="Historical Avg" fill="#BFDBFE" radius={[3,3,0,0]} />
            {yearData.map(({ year }, i) => (
              <Line
                key={year}
                type="monotone"
                dataKey={String(year)}
                name={String(year)}
                stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Base mode — simple bar chart with peak/trough highlighting
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <YAxis
            tickFormatter={(v) => `$${v}M`}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Avg Export" radius={[3, 3, 0, 0]}>
            {barData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.isPeak   ? '#16A34A' :
                  entry.isTrough ? '#DC2626' :
                  '#3B82F6'
                }
                fillOpacity={entry.isPeak || entry.isTrough ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Peak / Trough legend */}
      <div className="flex items-center gap-4 justify-center mt-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-green-600 inline-block" /> Peak month
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-red-600 inline-block" /> Trough month
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" /> Other months
        </span>
      </div>
    </div>
  )
}
