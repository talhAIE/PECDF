import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { COMMODITY_COLORS } from '../../config/commodities'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 text-xs">
      <p className="font-semibold text-slate-700">{d.name}</p>
      <p className="text-slate-500 mt-0.5">
        ${d.value}M &nbsp;·&nbsp;
        <span className="font-semibold">{d.payload.share_pct?.toFixed(1)}%</span>
      </p>
    </div>
  )
}

export default function PortfolioDonut({ data = [], totalM = 0, className = '' }) {
  if (!data.length) return null

  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="shrink-0" style={{ width: 160, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                dataKey="predicted_m"
                nameKey="commodity"
                paddingAngle={2}
                isAnimationActive={false}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.hs_code}
                    fill={COMMODITY_COLORS[entry.hs_code] ?? '#94A3B8'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 min-w-0 space-y-1">
          {data.map((entry) => (
            <div key={entry.hs_code} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="shrink-0 w-2 h-2 rounded-full"
                  style={{ background: COMMODITY_COLORS[entry.hs_code] ?? '#94A3B8' }}
                />
                <span className="text-slate-600 truncate">{entry.commodity}</span>
              </div>
              <span className="font-mono text-slate-500 shrink-0">
                {entry.share_pct?.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      {totalM > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Total Forecast</p>
          <p className="text-xl font-bold text-slate-900 font-mono">${totalM.toFixed(1)}M</p>
        </div>
      )}
    </div>
  )
}
