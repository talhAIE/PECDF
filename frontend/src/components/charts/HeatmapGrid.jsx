import { clsx } from 'clsx'

function interpolateColor(minVal, maxVal, value) {
  const ratio = maxVal === minVal ? 0.5 : (value - minVal) / (maxVal - minVal)
  const clamped = Math.max(0, Math.min(1, ratio))

  // Red #DC2626 → Amber #F59E0B → Green #16A34A
  let r, g, b
  if (clamped < 0.5) {
    const t = clamped * 2
    r = Math.round(220 + (245 - 220) * t)
    g = Math.round(38  + (158 - 38)  * t)
    b = Math.round(38  + (11  - 38)  * t)
  } else {
    const t = (clamped - 0.5) * 2
    r = Math.round(245 + (22  - 245) * t)
    g = Math.round(158 + (163 - 158) * t)
    b = Math.round(11  + (74  - 11)  * t)
  }

  return `rgb(${r},${g},${b})`
}

export default function HeatmapGrid({
  matrix    = {},     // { pkr: { oil: value } }
  pkrValues = [],
  oilValues = [],
  bestCase  = null,   // { pkr, oil }
  worstCase = null,
  variable1Label = 'USD/PKR',
  variable2Label = 'Brent Oil',
  className = ''
}) {
  if (!pkrValues.length || !oilValues.length) return null

  // Collect all values to determine min/max for color scale
  const allValues = pkrValues.flatMap((pkr) =>
    oilValues.map((oil) => matrix[pkr]?.[oil] ?? 0)
  )
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full border-separate border-spacing-1">
        <thead>
          <tr>
            {/* Corner cell */}
            <th className="w-16" />
            {/* Oil column headers */}
            {oilValues.map((oil) => (
              <th key={oil} className="text-center">
                <span className="text-xs text-slate-500 font-medium">
                  {variable2Label === 'Brent Oil' ? `$${oil}` : oil}
                </span>
              </th>
            ))}
          </tr>
          <tr>
            <th />
            <th
              colSpan={oilValues.length}
              className="text-center pb-1"
            >
              <span className="text-xs text-slate-400 italic">{variable2Label}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {pkrValues.map((pkr) => (
            <tr key={pkr}>
              {/* PKR row header */}
              <td className="text-right pr-2">
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                  {variable1Label === 'USD/PKR' ? pkr : pkr}
                </span>
              </td>
              {oilValues.map((oil) => {
                const val = matrix[pkr]?.[oil]
                const isBest  = bestCase?.pkr  === pkr && bestCase?.oil  === oil
                const isWorst = worstCase?.pkr === pkr && worstCase?.oil === oil
                const bg = val != null ? interpolateColor(minVal, maxVal, val) : '#F1F5F9'

                return (
                  <td key={oil} className="p-0">
                    <div
                      className={clsx(
                        'rounded-lg p-3 text-center text-white font-semibold transition-all',
                        isBest  && 'ring-2 ring-offset-1 ring-green-700 scale-105',
                        isWorst && 'ring-2 ring-offset-1 ring-red-900 scale-105',
                      )}
                      style={{ backgroundColor: bg }}
                      title={`PKR ${pkr} | Oil $${oil} → $${val?.toFixed(1)}M`}
                    >
                      <p className="text-xs opacity-80 font-normal">
                        PKR {pkr} · ${oil}
                      </p>
                      <p className="text-sm mt-0.5">
                        {val != null ? `$${val.toFixed(1)}M` : '—'}
                      </p>
                      {isBest  && <p className="text-xs mt-0.5 opacity-90">★ Best</p>}
                      {isWorst && <p className="text-xs mt-0.5 opacity-90">✗ Worst</p>}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Axis labels */}
      <div className="text-center mt-1">
        <span className="text-xs text-slate-400 italic">{variable1Label} (rows)</span>
      </div>

      {/* Color scale legend */}
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">
        <span className="text-red-600 font-medium">Low</span>
        <div className="w-24 h-2 rounded-full" style={{
          background: 'linear-gradient(to right, #DC2626, #F59E0B, #16A34A)'
        }} />
        <span className="text-green-700 font-medium">High</span>
      </div>
    </div>
  )
}
