import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { clsx } from 'clsx'
import { useMacroStore } from '../store/macroStore'
import { COMMODITY_META } from '../config/commodities'
import { fetchHistorical, fetchCommodityMomentum } from '../api/analytics'
import { fetchSingleVariable } from '../api/scenario'
import { fetchMultiHorizon } from '../api/forecast'
import { useSeasonality } from '../hooks/useSeasonality'
import { useCurrencySensitivity } from '../hooks/useCurrencySensitivity'
import { useHistorical } from '../hooks/useHistorical'
import { useMultiHorizonForecast, computeForecastWindow } from '../hooks/useMultiHorizonForecast'
import { useModelInfo, useCommodityMapes, nextMonth, fmtMonthYear } from '../hooks/useModelInfo'
import ForecastChart    from '../components/charts/ForecastChart'
import SeasonalityChart from '../components/charts/SeasonalityChart'
import ScenarioChart    from '../components/charts/ScenarioChart'
import CommoditySelector from '../components/forms/CommoditySelector'
import HorizonSelector   from '../components/forms/HorizonSelector'
import ConfidenceBar     from '../components/ui/ConfidenceBar'
import MomentumBadge     from '../components/ui/MomentumBadge'
import SkeletonLoader, { SkeletonCard } from '../components/ui/SkeletonLoader'
import ErrorState        from '../components/ui/ErrorState'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMonth(yyyymm) {
  const y = Math.floor(yyyymm / 100)
  const m = yyyymm % 100
  return new Date(y, m - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' })
}

function getTargetMonth() {
  const now = new Date()
  return now.getFullYear() * 100 + (now.getMonth() + 1)
}

const SWEEP_RANGES = {
  pkr:  { min: 250, max: 350 },
  oil:  { min: 40,  max: 130 },
  conf: { min: 70,  max: 140 },
}

const VARIABLE_LABELS = { pkr: 'USD/PKR', oil: 'Brent Oil', conf: 'US Confidence' }

// MAPE → reliability label
function reliabilityLabel(mape) {
  if (mape <= 15) return { label: 'Excellent', color: 'text-green-700' }
  if (mape <= 25) return { label: 'Good',      color: 'text-green-600' }
  if (mape <= 40) return { label: 'Moderate',  color: 'text-amber-600' }
  if (mape <= 80) return { label: 'Low',        color: 'text-red-500'   }
  return              { label: 'Very Low',   color: 'text-red-700'   }
}

// ── Shared chrome ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',     label: 'Overview'          },
  { id: 'forecast',     label: 'Forecast'          },
  { id: 'seasonality',  label: 'Seasonality'       },
  { id: 'sensitivity',  label: 'Sensitivity'       },
  { id: 'performance',  label: 'Model Performance' },
]

function TabBar({ active, onChange }) {
  return (
    <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={clsx(
            'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
            active === t.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function SectionCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={clsx('bg-white rounded-xl border border-slate-200 shadow-sm p-5', className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title    && <h3 className="text-sm font-semibold text-slate-700">{title}</h3>}
          {subtitle && <p  className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Tab 1: Overview ───────────────────────────────────────────────────────────

function OverviewTab({ hs, meta }) {
  const { data: histResp, isLoading, isError, refetch } = useHistorical(hs, 186)
  const { data: commodityMapes } = useCommodityMapes()
  const mape = commodityMapes?.[hs] ?? meta.mape
  const historical = histResp?.data ?? []

  const stats = useMemo(() => {
    if (!historical.length) return null
    const vals    = historical.map((d) => d.export_value_m)
    const nonZero = vals.filter((v) => v > 0)
    const high    = Math.max(...vals)
    const low     = nonZero.length ? Math.min(...nonZero) : null

    // Average annual YoY growth
    const byYear  = {}
    historical.forEach((d) => {
      const y = Math.floor(d.month / 100)
      byYear[y] = (byYear[y] ?? 0) + d.export_value_m
    })
    const years = Object.keys(byYear).map(Number).sort()
    const rates = []
    for (let i = 1; i < years.length; i++) {
      if (byYear[years[i - 1]] > 0) {
        rates.push((byYear[years[i]] - byYear[years[i - 1]]) / byYear[years[i - 1]] * 100)
      }
    }
    const avgGrowth = rates.length ? rates.reduce((s, r) => s + r, 0) / rates.length : null

    return { high, low, avgGrowth }
  }, [historical])

  if (isLoading) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
  if (isError)   return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'All-Time High',      value: stats?.high != null ? `$${stats.high.toFixed(1)}M`   : '—' },
          { label: 'All-Time Low',       value: stats?.low  != null ? `$${stats.low.toFixed(1)}M`    : '—' },
          { label: 'Avg Annual Growth',  value: stats?.avgGrowth != null ? `${stats.avgGrowth >= 0 ? '+' : ''}${stats.avgGrowth.toFixed(1)}%` : '—' },
          { label: 'Best Quarter',       value: meta.bestQuarter ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-bold text-slate-900 font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Full history chart */}
      <SectionCard title="Full Export History" subtitle={`${historical.length} monthly data points`}>
        <ForecastChart historicalData={historical} forecastData={[]} commodityName="" mape={null} />
      </SectionCard>

      {/* About */}
      {meta.about && (
        <SectionCard title="About This Commodity">
          <p className="text-sm text-slate-600 leading-relaxed">{meta.about}</p>
          <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>Sector: <span className="font-semibold text-slate-700">{meta.sector}</span></span>
            <span>MAPE: <span className="font-semibold text-slate-700">{mape ?? '—'}%</span></span>
            <span>R²: <span className="font-semibold text-slate-700">{meta.r2 ?? '—'}</span></span>
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ── Tab 2: Forecast ───────────────────────────────────────────────────────────

function ForecastTab({ hs }) {
  const [horizon, setHorizon] = useState(3)
  const meta = COMMODITY_META[hs] ?? {}
  const { data: commodityMapes } = useCommodityMapes()
  const { data: modelInfo } = useModelInfo()
  const mape = commodityMapes?.[hs] ?? meta.mape

  const dataEnd = modelInfo?.data_end
  const { startMonth, totalMonths, endMonth } = dataEnd
    ? computeForecastWindow(dataEnd, horizon)
    : { startMonth: 0, totalMonths: horizon, endMonth: 0 }

  const fmtFull = (yyyymm) => {
    if (!yyyymm) return '—'
    const y = Math.floor(yyyymm / 100), m = yyyymm % 100
    return new Date(y, m - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
  }

  const { data: histResp,  isLoading: histL  } = useHistorical(hs, 24)
  const { data: fcResp,    isLoading: fcL,  isError: fcErr, refetch: fcRefetch } = useMultiHorizonForecast(hs, horizon)

  const historical = histResp?.data ?? []
  const forecast   = fcResp?.forecast ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{fcResp?.commodity ?? meta.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {startMonth ? `${fmtFull(startMonth)} – ${fmtFull(endMonth)}` : `${horizon}-month outlook`}
            {` · ${horizon} month${horizon > 1 ? 's' : ''} ahead`}
          </p>
        </div>
        <div className="w-56">
          <HorizonSelector value={horizon} onChange={setHorizon} />
        </div>
      </div>

      {fcErr ? (
        <ErrorState message="Could not load forecast." onRetry={fcRefetch} />
      ) : (histL || fcL) ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="h-96 animate-pulse bg-slate-100 rounded-lg" />
        </div>
      ) : (
        <ForecastChart
          historicalData={historical}
          forecastData={forecast}
          commodityName={fcResp?.commodity ?? meta.name}
          mape={mape}
        />
      )}

      {/* Metrics strip */}
      {fcResp && (
        <div className="grid grid-cols-3 gap-4">
          <SectionCard>
            <p className="text-xs text-slate-400 mb-1">Total ({totalMonths}m)</p>
            <p className="text-xl font-bold font-mono text-slate-900">${fcResp.total_predicted_m.toFixed(1)}M</p>
          </SectionCard>
          <SectionCard>
            <p className="text-xs text-slate-400 mb-1">Avg / month</p>
            <p className="text-xl font-bold font-mono text-slate-900">${(fcResp.total_predicted_m / totalMonths).toFixed(1)}M</p>
          </SectionCard>
          <SectionCard>
            <ConfidenceBar mape={mape} horizon={horizon} />
          </SectionCard>
        </div>
      )}
    </div>
  )
}

// ── Tab 3: Seasonality ────────────────────────────────────────────────────────

function SeasonalityTab({ hs }) {
  const [showYears, setShowYears] = useState(false)

  const { data: seasResp, isLoading, isError, refetch } = useSeasonality(hs)
  const { data: histResp } = useHistorical(hs, 36)

  const yearData = useMemo(() => {
    const pts = histResp?.data ?? []
    const map = {}
    pts.forEach((d) => {
      const y = String(Math.floor(d.month / 100))
      if (!map[y]) map[y] = {}
      map[y][d.month % 100] = d.export_value_m
    })
    return Object.entries(map)
      .filter(([, d]) => Object.keys(d).length >= 6)
      .sort(([a], [b]) => Number(a) - Number(b))
      .slice(-3)
      .map(([year, data]) => ({ year: Number(year), data }))
  }, [histResp])

  if (isLoading) return <SkeletonCard className="h-64" />
  if (isError)   return <ErrorState onRetry={refetch} />

  const monthlyAverages = seasResp?.monthly_averages ?? {}
  const peakMonth   = seasResp?.peak_month
  const troughMonth = seasResp?.trough_month

  return (
    <div className="space-y-4">
      {/* Peak / Trough callout */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Peak Month</p>
          <p className="text-2xl font-bold text-green-900">{seasResp?.peak_month_name ?? '—'}</p>
          <p className="text-xs text-green-600 mt-1">
            Avg ${((monthlyAverages[String(peakMonth)] ?? 0)).toFixed(1)}M
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Trough Month</p>
          <p className="text-2xl font-bold text-red-900">{seasResp?.trough_month_name ?? '—'}</p>
          <p className="text-xs text-red-600 mt-1">
            Avg ${((monthlyAverages[String(troughMonth)] ?? 0)).toFixed(1)}M
          </p>
        </div>
      </div>

      {/* Chart + year toggle */}
      <SectionCard
        title="Monthly Export Pattern"
        subtitle={`Seasonality strength: ${seasResp?.seasonality_strength?.toFixed(1) ?? '—'}%`}
      >
        <div className="flex items-center gap-3 mb-4">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showYears}
              onChange={(e) => setShowYears(e.target.checked)}
              className="accent-blue-600"
            />
            Show year overlay (last 3 years)
          </label>
        </div>
        <SeasonalityChart
          monthlyAverages={monthlyAverages}
          peakMonth={peakMonth}
          troughMonth={troughMonth}
          yearData={showYears ? yearData : []}
        />
      </SectionCard>
    </div>
  )
}

// ── Tab 4: Sensitivity ────────────────────────────────────────────────────────

function SensitivityTab({ hs }) {
  const { usd_pkr, brent_oil, us_confidence } = useMacroStore()
  const targetMonth = getTargetMonth()
  const { data: currencySens } = useCurrencySensitivity()

  // Auto-fetch all 3 sweeps on tab mount
  const pkrQ = useQuery({
    queryKey: ['sens-sweep', hs, 'pkr', targetMonth, brent_oil, us_confidence],
    queryFn:  () => fetchSingleVariable({
      hs_code: hs, target_yyyymm: targetMonth, variable: 'pkr',
      range_min: SWEEP_RANGES.pkr.min, range_max: SWEEP_RANGES.pkr.max,
      fixed_oil: brent_oil, fixed_conf: us_confidence, n_months: 1,
    }),
    staleTime: 5 * 60 * 1000,
    enabled: !!hs,
  })

  const oilQ = useQuery({
    queryKey: ['sens-sweep', hs, 'oil', targetMonth, usd_pkr, us_confidence],
    queryFn:  () => fetchSingleVariable({
      hs_code: hs, target_yyyymm: targetMonth, variable: 'oil',
      range_min: SWEEP_RANGES.oil.min, range_max: SWEEP_RANGES.oil.max,
      fixed_pkr: usd_pkr, fixed_conf: us_confidence, n_months: 1,
    }),
    staleTime: 5 * 60 * 1000,
    enabled: !!hs,
  })

  const confQ = useQuery({
    queryKey: ['sens-sweep', hs, 'conf', targetMonth, usd_pkr, brent_oil],
    queryFn:  () => fetchSingleVariable({
      hs_code: hs, target_yyyymm: targetMonth, variable: 'conf',
      range_min: SWEEP_RANGES.conf.min, range_max: SWEEP_RANGES.conf.max,
      fixed_pkr: usd_pkr, fixed_oil: brent_oil, n_months: 1,
    }),
    staleTime: 5 * 60 * 1000,
    enabled: !!hs,
  })

  const rankInfo = useMemo(() => {
    const swing = (q) => {
      const pts = q.data?.points
      if (!pts?.length) return 0
      return Math.abs(pts[pts.length - 1].predicted_m - pts[0].predicted_m)
    }
    return [
      { variable: 'pkr',  label: VARIABLE_LABELS.pkr,  swing: swing(pkrQ)  },
      { variable: 'oil',  label: VARIABLE_LABELS.oil,  swing: swing(oilQ)  },
      { variable: 'conf', label: VARIABLE_LABELS.conf, swing: swing(confQ) },
    ].sort((a, b) => b.swing - a.swing)
  }, [pkrQ.data, oilQ.data, confQ.data])

  const pkrRank = currencySens?.commodities?.find((c) => c.hs_code === hs)?.sensitivity_rank

  const currentValues = { pkr: usd_pkr, oil: brent_oil, conf: us_confidence }
  const queries       = { pkr: pkrQ, oil: oilQ, conf: confQ }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      {rankInfo[0]?.swing > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-xs text-slate-500">Most Sensitive To</p>
            <p className="text-sm font-semibold text-slate-800">{rankInfo[0].label}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Forecast Swing</p>
            <p className="text-sm font-semibold text-slate-800">${rankInfo[0].swing.toFixed(1)}M</p>
          </div>
          {pkrRank && (
            <div>
              <p className="text-xs text-slate-500">PKR Sensitivity Rank</p>
              <p className="text-sm font-semibold text-slate-800">#{pkrRank} of 10</p>
            </div>
          )}
        </div>
      )}

      {/* 3 mini scenario charts */}
      <div className="grid grid-cols-3 gap-4">
        {(['pkr', 'oil', 'conf']).map((v) => {
          const q = queries[v]
          return (
            <SectionCard
              key={v}
              title={VARIABLE_LABELS[v]}
              subtitle={q.data ? `${q.data.sensitivity_label} sensitivity — ${q.data.annotation}` : ''}
            >
              {q.isLoading ? (
                <SkeletonLoader lines={4} />
              ) : q.isError ? (
                <p className="text-xs text-red-500">Failed to load</p>
              ) : q.data ? (
                <ScenarioChart
                  points={q.data.points}
                  variable={v}
                  currentValue={currentValues[v]}
                  className="mt-2"
                />
              ) : null}
            </SectionCard>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab 5: Model Performance ──────────────────────────────────────────────────

function PerfTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.stroke }}>
          {p.name}: <span className="font-mono font-semibold">${Number(p.value).toFixed(1)}M</span>
        </p>
      ))}
    </div>
  )
}

function ModelPerformanceTab({ hs, meta }) {
  const { usd_pkr, brent_oil, us_confidence } = useMacroStore()
  const { data: modelInfo } = useModelInfo()
  const { data: commodityMapes } = useCommodityMapes()

  const testStart = nextMonth(modelInfo?.train_cutoff)
  const mape = commodityMapes?.[hs] ?? meta.mape

  const { data: histResp, isLoading: histL } = useHistorical(hs, 24)
  const { data: fcResp,   isLoading: fcL   } = useQuery({
    queryKey: ['forecast', 'perf', hs, usd_pkr, brent_oil, us_confidence, testStart],
    queryFn:  () => fetchMultiHorizon({
      hs_code: hs, start_yyyymm: testStart, n_months: 24,
      macro: { usd_pkr, brent_oil, us_confidence },
    }),
    staleTime: 5 * 60 * 1000,
    enabled: !!hs && !!testStart,
  })

  const chartData = useMemo(() => {
    const actualMap = {}
    ;(histResp?.data ?? []).forEach((d) => { actualMap[d.month] = d.export_value_m })
    return (fcResp?.forecast ?? []).map((p) => ({
      label:     fmtMonth(p.month),
      actual:    actualMap[p.month] ?? null,
      predicted: p.predicted_m,
    }))
  }, [histResp, fcResp])

  const reliability = reliabilityLabel(mape ?? 50)
  const isLoading   = histL || fcL

  const testStartLabel = fmtMonthYear(testStart)
  const trainCutoffLabel = fmtMonthYear(modelInfo?.train_cutoff)

  return (
    <div className="space-y-6">
      {/* MAPE / R² / reliability */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Model MAPE</p>
          <p className="text-3xl font-bold text-slate-900 font-mono">{mape ?? '—'}%</p>
          <p className="text-xs text-slate-400 mt-1">Mean Absolute Pct Error on test set</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">R²</p>
          <p className="text-3xl font-bold text-slate-900 font-mono">{meta.r2 ?? '—'}</p>
          <p className="text-xs text-slate-400 mt-1">Variance explained by the model</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Reliability</p>
          <p className={clsx('text-3xl font-bold', reliability.color)}>{reliability.label}</p>
          <ConfidenceBar mape={mape} horizon={1} showLabel={false} className="mt-3" />
        </div>
      </div>

      {/* Actual vs Predicted chart */}
      <SectionCard
        title={`Actual vs Model Prediction — Test Period (${testStartLabel}–${trainCutoffLabel ? 'present' : '—'})`}
        subtitle="Compares held-out actuals against the model's predictions under current macro assumptions"
      >
        {isLoading ? (
          <div className="h-72 animate-pulse bg-slate-100 rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                interval={3}
              />
              <YAxis
                tickFormatter={(v) => `$${v}M`}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip content={<PerfTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone" dataKey="actual" name="Actual"
                stroke="#1A252F" strokeWidth={2} dot={false} connectNulls={false}
              />
              <Line
                type="monotone" dataKey="predicted" name="Predicted"
                stroke="#DC2626" strokeWidth={2} strokeDasharray="5 5"
                dot={{ r: 2, fill: '#DC2626', strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Reliability interpretation */}
      <SectionCard title="Forecast Reliability Statement">
        <p className="text-sm text-slate-600 leading-relaxed">
          {mape != null && mape <= 15 && `With a MAPE of ${mape}%, this model's forecasts are highly reliable for operational planning and procurement decisions.`}
          {mape != null && mape > 15 && mape <= 25 && `With a MAPE of ${mape}%, this model provides good directional forecasts suitable for strategic planning. Point estimates carry ±${mape}% typical error.`}
          {mape != null && mape > 25 && mape <= 40 && `With a MAPE of ${mape}%, use this model for directional guidance rather than precise targets. Consider the confidence bands when making decisions.`}
          {mape != null && mape > 40 && `With a MAPE of ${mape}%, this commodity is inherently difficult to forecast due to high volatility or structural irregularity. Treat forecasts as scenario boundaries, not point estimates.`}
          {mape == null && 'Loading model performance data…'}
        </p>
      </SectionCard>
    </div>
  )
}

// ── Root page ─────────────────────────────────────────────────────────────────

export default function CommodityExplorer() {
  const { hs }    = useParams()
  const navigate  = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const meta = COMMODITY_META[hs] ?? {}
  const { data: commodityMapes } = useCommodityMapes()
  const headerMape = commodityMapes?.[hs] ?? meta.mape

  const { data: momentum } = useQuery({
    queryKey: ['momentum', hs],
    queryFn:  () => fetchCommodityMomentum(hs),
    staleTime: 5 * 60 * 1000,
    enabled:  !!hs,
  })

  function handleHsChange(newHs) {
    navigate(`/commodity/${newHs}`)
    setActiveTab('overview')
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">
                {meta.name ?? `HS ${hs}`}
              </h1>
              <span className="font-mono text-sm text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                HS {hs}
              </span>
              {meta.sector && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {meta.sector}
                </span>
              )}
            </div>
            {/* Header stats */}
            <div className="flex items-center gap-4 flex-wrap mt-2">
              {momentum && (
                <>
                  <MomentumBadge direction={momentum.direction} value={Math.abs(momentum.momentum_3m_pct)} />
                  <span className="text-sm text-slate-500">
                    Last actual: <span className="font-mono font-semibold text-slate-800">${momentum.last_actual_m?.toFixed(1)}M</span>
                  </span>
                </>
              )}
              {headerMape != null && (
                <span className="text-sm text-slate-500">
                  MAPE <span className="font-mono font-semibold text-slate-700">{headerMape}%</span>
                </span>
              )}
              {meta.r2 && (
                <span className="text-sm text-slate-500">
                  R² <span className="font-mono font-semibold text-slate-700">{meta.r2}</span>
                </span>
              )}
            </div>
          </div>

          {/* Commodity picker */}
          <div className="w-56 shrink-0">
            <CommoditySelector value={hs} onChange={handleHsChange} label="" />
          </div>
        </div>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview'    && <OverviewTab         hs={hs} meta={meta} />}
      {activeTab === 'forecast'    && <ForecastTab         hs={hs} />}
      {activeTab === 'seasonality' && <SeasonalityTab      hs={hs} />}
      {activeTab === 'sensitivity' && <SensitivityTab      hs={hs} />}
      {activeTab === 'performance' && <ModelPerformanceTab hs={hs} meta={meta} />}
    </div>
  )
}
