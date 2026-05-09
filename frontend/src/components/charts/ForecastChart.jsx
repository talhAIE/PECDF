import { useMemo, useState } from 'react'
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer
} from 'recharts'
import { clsx } from 'clsx'

function formatLabel(yyyymm) {
  const y = Math.floor(yyyymm / 100)
  const m = yyyymm % 100
  return new Date(y, m - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' })
}

function formatY(v) {
  if (v == null) return ''
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}B`
  return `$${v}M`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1">{label}</p>
      {d.historical != null && (
        <p className="text-slate-600">
          Actual: <span className="font-mono font-semibold text-slate-900">{formatY(d.historical)}</span>
        </p>
      )}
      {d.forecast != null && d.historical == null && (
        <>
          <p className="text-red-600">
            Forecast: <span className="font-mono font-semibold">{formatY(d.forecast)}</span>
          </p>
          {d.lower != null && (
            <p className="text-slate-400 mt-0.5">
              Range: {formatY(d.lower)} – {formatY(d.upper)}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-6 h-0.5 bg-[#1A252F]" />
        Historical
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-6 border-t-2 border-dashed border-[#DC2626]" />
        Forecast
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-4 h-3 bg-red-200 opacity-60 rounded-sm" />
        Confidence Band
      </span>
    </div>
  )
}

export default function ForecastChart({
  historicalData = [],
  forecastData   = [],
  commodityName  = '',
  mape           = null,
  showBands      = true,
  compact        = false,
  className      = ''
}) {
  const cutoffLabel = useMemo(() => {
    if (!historicalData.length) return null
    const last = historicalData[historicalData.length - 1]
    return formatLabel(last.month)
  }, [historicalData])

  const chartData = useMemo(() => {
    if (!historicalData.length) return []

    const hist = historicalData.map((d) => ({
      label:      formatLabel(d.month),
      historical: d.export_value_m ?? d.value_m ?? null,
      forecast:   null,
      lower:      null,
      upper:      null,
    }))

    if (!forecastData.length) return hist

    // Bridge: last historical point also seeds the forecast line so lines connect
    const last = hist[hist.length - 1]
    hist[hist.length - 1] = {
      ...last,
      forecast: last.historical,
      lower:    last.historical,
      upper:    last.historical,
    }

    const fore = forecastData.map((d) => ({
      label:      formatLabel(d.month),
      historical: null,
      forecast:   d.predicted_m ?? null,
      lower:      d.lower_bound ?? null,
      upper:      d.upper_bound ?? null,
    }))

    return [...hist, ...fore]
  }, [historicalData, forecastData])

  const height = compact ? 200 : 400

  if (!chartData.length) {
    return (
      <div className={clsx('flex items-center justify-center bg-white rounded-xl border border-slate-200', className)}
           style={{ height }}>
        <p className="text-slate-400 text-sm">No data to display</p>
      </div>
    )
  }

  return (
    <div className={clsx('bg-white rounded-xl border border-slate-200 shadow-sm', compact ? 'p-3' : 'p-5', className)}>
      {!compact && commodityName && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">{commodityName} — Export Forecast</h3>
          {mape != null && (
            <span className="text-xs text-slate-400 font-mono">Model MAPE: {mape}%</span>
          )}
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: compact ? 0 : 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />

          <XAxis
            dataKey="label"
            tick={{ fontSize: compact ? 9 : 11, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
            interval={compact ? 'preserveStartEnd' : Math.floor(chartData.length / 8)}
          />

          <YAxis
            tickFormatter={formatY}
            tick={{ fontSize: compact ? 9 : 11, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={false}
            width={compact ? 45 : 55}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Confidence band — upper fill */}
          {showBands && (
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="#FECACA"
              fillOpacity={0.35}
              legendType="none"
              connectNulls={false}
            />
          )}

          {/* Confidence band — lower mask (erases below lower bound) */}
          {showBands && (
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#FFFFFF"
              fillOpacity={1}
              legendType="none"
              connectNulls={false}
            />
          )}

          {/* Historical line */}
          <Line
            type="monotone"
            dataKey="historical"
            stroke="#1A252F"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#1A252F' }}
            connectNulls={false}
            legendType="none"
          />

          {/* Forecast line */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#DC2626"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: '#DC2626', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#DC2626' }}
            connectNulls={false}
            legendType="none"
          />

          {/* Vertical cutoff separator */}
          {cutoffLabel && (
            <ReferenceLine
              x={cutoffLabel}
              stroke="#CBD5E1"
              strokeDasharray="4 4"
              label={
                compact ? undefined : {
                  value: 'FORECAST →',
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: '#94A3B8',
                  offset: 6,
                }
              }
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {!compact && <CustomLegend />}
    </div>
  )
}
