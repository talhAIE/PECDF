import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { useSingleVariableScenario } from '../hooks/useSingleVariableScenario'
import { useMultiVariableScenario } from '../hooks/useMultiVariableScenario'
import { useMacroStore } from '../store/macroStore'
import ScenarioChart from '../components/charts/ScenarioChart'
import HeatmapGrid   from '../components/charts/HeatmapGrid'
import CommoditySelector from '../components/forms/CommoditySelector'
import HorizonSelector   from '../components/forms/HorizonSelector'
import DataTable         from '../components/ui/DataTable'
import SkeletonLoader, { SkeletonChart } from '../components/ui/SkeletonLoader'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import PageTabs from '../components/ui/PageTabs'
import { Sliders } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const SCENARIO_TABS = [
  { id: 'single', label: 'Single variable' },
  { id: 'multi', label: 'Multi-variable' },
  { id: 'compare', label: 'Compare scenarios' },
]

const VARIABLE_META = {
  pkr:  { label: 'USD/PKR Rate',           unit: 'Rate',   defaultMin: 250, defaultMax: 350 },
  oil:  { label: 'Brent Oil Price',        unit: '$/bbl',  defaultMin: 40,  defaultMax: 130 },
  conf: { label: 'US Consumer Confidence', unit: 'Index',  defaultMin: 70,  defaultMax: 140 },
}

function getTargetMonth() {
  const now = new Date()
  return now.getFullYear() * 100 + (now.getMonth() + 1)
}

// ── Shared atoms ──────────────────────────────────────────────────────────────

function FieldInput({ label, value, onChange, min, max, step = 0.5 }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-600 shrink-0">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v) }}
        className="w-24 rounded-lg border border-slate-200 px-2 py-1 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
      />
    </div>
  )
}

function RunButton({ onClick, loading, children = 'Run scenario' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={clsx(
        'w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:from-indigo-500 hover:to-violet-600 disabled:cursor-not-allowed disabled:opacity-55',
        loading && 'cursor-not-allowed'
      )}
    >
      {loading ? 'Running…' : children}
    </button>
  )
}

function EmptyChart({ message }) {
  return (
    <SurfaceCard className="border-2 border-dashed border-slate-200/90 bg-slate-50/60">
      <div className="flex h-64 items-center justify-center px-4">
        <p className="text-center text-sm text-slate-500">{message}</p>
      </div>
    </SurfaceCard>
  )
}

const SENSITIVITY_META = {
  High: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    insight: 'This commodity is highly reactive to this macro variable. Small changes in the input will noticeably shift export forecasts.',
  },
  Medium: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    insight: 'Moderate responsiveness. Significant input changes will shift forecasts, but the relationship is not dominant.',
  },
  Low: {
    badge: 'bg-green-50 text-green-700 border-green-200',
    insight: 'Low direct sensitivity. Other factors (seasonal patterns, historical demand, prior-period export levels) dominate this commodity\'s forecast.',
  },
}

function SensitivityBadge({ label }) {
  const meta = SENSITIVITY_META[label] ?? SENSITIVITY_META.Medium
  return (
    <span className={clsx('inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border', meta.badge)}>
      {label} Sensitivity
    </span>
  )
}

function SensitivityInsight({ label, annotation, commodity }) {
  if (!label) return null
  const meta = SENSITIVITY_META[label] ?? SENSITIVITY_META.Medium
  const borderColor = label === 'High' ? 'border-red-200 bg-red-50' : label === 'Low' ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
  const textColor   = label === 'High' ? 'text-red-800' : label === 'Low' ? 'text-green-800' : 'text-amber-800'
  return (
    <div className={clsx('rounded-xl border p-4 space-y-1', borderColor)}>
      <div className="flex items-center gap-2">
        <SensitivityBadge label={label} />
        <span className="text-xs font-semibold text-slate-700">{commodity}</span>
      </div>
      <p className={clsx('text-xs leading-relaxed', textColor)}>{meta.insight}</p>
      {annotation && <p className="text-xs font-mono text-slate-500 pt-0.5">{annotation}</p>}
    </div>
  )
}

// ── Single Variable Tab ───────────────────────────────────────────────────────

function SingleVariableTab() {
  const { usd_pkr, brent_oil, us_confidence } = useMacroStore()

  const [hs,        setHs]        = useState('1006')
  const [variable,  setVariable]  = useState('pkr')
  const [rangeMin,  setRangeMin]  = useState(VARIABLE_META.pkr.defaultMin)
  const [rangeMax,  setRangeMax]  = useState(VARIABLE_META.pkr.defaultMax)
  const [horizon,   setHorizon]   = useState(1)
  const [fixedPkr,  setFixedPkr]  = useState(usd_pkr)
  const [fixedOil,  setFixedOil]  = useState(brent_oil)
  const [fixedConf, setFixedConf] = useState(us_confidence)

  const mutation = useSingleVariableScenario()

  function handleVariableChange(v) {
    setVariable(v)
    setRangeMin(VARIABLE_META[v].defaultMin)
    setRangeMax(VARIABLE_META[v].defaultMax)
    // Sync fixed values to current MacroBar when switching variable
    setFixedPkr(usd_pkr)
    setFixedOil(brent_oil)
    setFixedConf(us_confidence)
  }

  function handleRun() {
    mutation.mutate(
      {
        hs_code:       hs,
        target_yyyymm: getTargetMonth(),
        variable,
        range_min:     rangeMin,
        range_max:     rangeMax,
        fixed_pkr:     fixedPkr,
        fixed_oil:     fixedOil,
        fixed_conf:    fixedConf,
        n_months:      horizon,
      },
      { onError: (err) => toast.error(err.message ?? 'Scenario failed') }
    )
  }

  const result       = mutation.data
  const currentValue = variable === 'pkr' ? usd_pkr : variable === 'oil' ? brent_oil : us_confidence
  const vmeta        = VARIABLE_META[variable]

  const tableData    = result?.points ?? []
  const tableColumns = [
    { key: 'input_value', label: vmeta?.label,         format: (v) => `${v.toFixed(1)} ${vmeta?.unit}` },
    { key: 'predicted_m', label: 'Forecast ($M)', align: 'right', format: (v) => `$${v.toFixed(2)}M` },
  ]

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Controls */}
      <aside className="w-full shrink-0 space-y-4 lg:w-72">
        <SurfaceCard className="space-y-4">
          <CommoditySelector value={hs} onChange={setHs} />
          <HorizonSelector value={horizon} onChange={setHorizon} />
        </SurfaceCard>

        {/* Variable selector + range */}
        <SurfaceCard className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sweep variable</p>
          {Object.entries(VARIABLE_META).map(([key, m]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio" name="sv-variable" value={key}
                checked={variable === key}
                onChange={() => handleVariableChange(key)}
                className="accent-indigo-600"
              />
              <span className="text-sm text-slate-700">{m.label}</span>
            </label>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <p className="mb-0.5 text-xs text-slate-400">Min</p>
              <input
                type="number" value={rangeMin}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) setRangeMin(v) }}
                className="w-full rounded-lg border border-slate-200 px-2 py-1 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
              />
            </div>
            <div>
              <p className="mb-0.5 text-xs text-slate-400">Max</p>
              <input
                type="number" value={rangeMax}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) setRangeMax(v) }}
                className="w-full rounded-lg border border-slate-200 px-2 py-1 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
              />
            </div>
          </div>
        </SurfaceCard>

        {/* Fixed values */}
        <SurfaceCard className="space-y-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Fixed values</p>
          {variable !== 'pkr'  && <FieldInput label="USD/PKR Rate"  value={fixedPkr}  onChange={setFixedPkr}  min={120} max={560} />}
          {variable !== 'oil'  && <FieldInput label="Brent Oil ($)" value={fixedOil}  onChange={setFixedOil}  min={10} max={350} />}
          {variable !== 'conf' && <FieldInput label="US Confidence" value={fixedConf} onChange={setFixedConf} min={15} max={999} />}
        </SurfaceCard>

        <RunButton onClick={handleRun} loading={mutation.isPending} />
      </aside>

      {/* Results */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Sensitivity insight card */}
        {result && (
          <SensitivityInsight
            label={result.sensitivity_label}
            annotation={result.annotation}
            commodity={result.commodity}
          />
        )}

        <div className={clsx(mutation.isPending && 'pointer-events-none opacity-60')}>
          {mutation.isPending ? (
            <SurfaceCard>
              <SkeletonLoader lines={6} />
            </SurfaceCard>
          ) : result ? (
            <SurfaceCard>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-semibold text-slate-800">{result.commodity}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Forecast ($M) across {vmeta?.label} range {rangeMin}–{rangeMax}
                  </p>
                </div>
                <SensitivityBadge label={result.sensitivity_label} />
              </div>
              <ScenarioChart
                points={result.points}
                variable={variable}
                currentValue={currentValue}
              />
            </SurfaceCard>
          ) : (
            <EmptyChart message="Configure inputs above and click Run scenario" />
          )}
        </div>

        {result && tableData.length > 0 && (
          <DataTable
            columns={tableColumns}
            data={tableData}
            downloadFilename={`scenario_${hs}_${variable}.csv`}
          />
        )}
      </div>
    </div>
  )
}

// ── Multi-Variable Tab ────────────────────────────────────────────────────────

function MultiVariableTab() {
  const { us_confidence } = useMacroStore()

  const [hs,        setHs]        = useState('1006')
  const [pkrVals,   setPkrVals]   = useState([270, 285, 300])
  const [oilVals,   setOilVals]   = useState([65, 78, 95])
  const [fixedConf, setFixedConf] = useState(us_confidence)
  const [horizon,   setHorizon]   = useState(1)

  const mutation = useMultiVariableScenario()

  function handleRun() {
    mutation.mutate(
      {
        hs_code:       hs,
        target_yyyymm: getTargetMonth(),
        pkr_values:    pkrVals,
        oil_values:    oilVals,
        fixed_conf:    fixedConf,
        n_months:      horizon,
      },
      { onError: (err) => toast.error(err.message ?? 'Scenario failed') }
    )
  }

  // Normalise string-keyed matrix from backend → numeric keys for HeatmapGrid
  const { normMatrix, bestCase, worstCase } = useMemo(() => {
    const resp = mutation.data
    if (!resp) return { normMatrix: {}, bestCase: null, worstCase: null }
    const m = {}
    Object.entries(resp.matrix).forEach(([pkrStr, oils]) => {
      const pkr = parseFloat(pkrStr)
      m[pkr] = {}
      Object.entries(oils).forEach(([oilStr, val]) => {
        m[pkr][parseFloat(oilStr)] = val
      })
    })
    return {
      normMatrix: m,
      bestCase:   resp.best_scenario  ? { pkr: resp.best_scenario.pkr,  oil: resp.best_scenario.oil  } : null,
      worstCase:  resp.worst_scenario ? { pkr: resp.worst_scenario.pkr, oil: resp.worst_scenario.oil } : null,
    }
  }, [mutation.data])

  function updateVal(arr, setArr, i, val) {
    const next = [...arr]
    next[i] = val
    setArr(next)
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Controls */}
      <aside className="w-full shrink-0 space-y-4 lg:w-72">
        <SurfaceCard className="space-y-4">
          <CommoditySelector value={hs} onChange={setHs} />
          <HorizonSelector value={horizon} onChange={setHorizon} />
        </SurfaceCard>

        <SurfaceCard className="space-y-4">
          {/* PKR values */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">PKR values (3 points)</p>
            <div className="grid grid-cols-3 gap-1.5">
              {pkrVals.map((v, i) => (
                <input key={i} type="number" value={v}
                  onChange={(e) => { const n = parseFloat(e.target.value); if (!isNaN(n)) updateVal(pkrVals, setPkrVals, i, n) }}
                  className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-center font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
                />
              ))}
            </div>
          </div>

          {/* Oil values */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Oil values (3 points)</p>
            <div className="grid grid-cols-3 gap-1.5">
              {oilVals.map((v, i) => (
                <input key={i} type="number" value={v}
                  onChange={(e) => { const n = parseFloat(e.target.value); if (!isNaN(n)) updateVal(oilVals, setOilVals, i, n) }}
                  className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-center font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
                />
              ))}
            </div>
          </div>

          <FieldInput label="US Confidence (fixed)" value={fixedConf} onChange={setFixedConf} min={15} max={999} />
        </SurfaceCard>

        <RunButton onClick={handleRun} loading={mutation.isPending} />
      </aside>

      {/* Results */}
      <div className="min-w-0 flex-1 space-y-4">
        {mutation.isPending ? (
          <SurfaceCard>
            <SkeletonLoader lines={6} />
          </SurfaceCard>
        ) : mutation.data ? (
          <>
            {/* Best / Worst callout */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {bestCase && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">Best case</p>
                  <p className="font-mono text-sm text-emerald-900">PKR {bestCase.pkr} · Oil ${bestCase.oil}</p>
                  <p className="mt-1 font-mono text-xl font-bold text-emerald-950">
                    ${mutation.data.best_scenario.predicted_m.toFixed(1)}M
                  </p>
                </div>
              )}
              {worstCase && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 shadow-sm">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-rose-800">Worst case</p>
                  <p className="font-mono text-sm text-rose-900">PKR {worstCase.pkr} · Oil ${worstCase.oil}</p>
                  <p className="mt-1 font-mono text-xl font-bold text-rose-950">
                    ${mutation.data.worst_scenario.predicted_m.toFixed(1)}M
                  </p>
                </div>
              )}
            </div>

            {/* Heatmap */}
            <SurfaceCard gradientTop>
              <h3 className="font-display mb-1 text-sm font-semibold text-slate-800">
                {mutation.data.commodity} — PKR × Brent oil heatmap
              </h3>
              <p className="mb-4 text-xs text-slate-500">Forecast ($M) for each macro combination</p>
              <HeatmapGrid
                matrix={normMatrix}
                pkrValues={mutation.data.pkr_values}
                oilValues={mutation.data.oil_values}
                bestCase={bestCase}
                worstCase={worstCase}
              />
            </SurfaceCard>
          </>
        ) : (
          <EmptyChart message="Set PKR and oil grid values, then click Run scenario" />
        )}
      </div>
    </div>
  )
}

// ── Compare Scenarios Tab ─────────────────────────────────────────────────────

function CompareTab() {
  const { usd_pkr, brent_oil, us_confidence } = useMacroStore()

  const [hs,       setHs]      = useState('1006')
  const [variable, setVariable] = useState('pkr')
  const [rangeMin, setRangeMin] = useState(VARIABLE_META.pkr.defaultMin)
  const [rangeMax, setRangeMax] = useState(VARIABLE_META.pkr.defaultMax)
  const [horizon,  setHorizon]  = useState(1)

  // Scenario A fixed values
  const [aPkr,  setAPkr]  = useState(usd_pkr)
  const [aOil,  setAOil]  = useState(brent_oil)
  const [aConf, setAConf] = useState(us_confidence)

  // Scenario B fixed values (purposely different defaults)
  const [bPkr,  setBPkr]  = useState(310.0)
  const [bOil,  setBOil]  = useState(100.0)
  const [bConf, setBConf] = useState(us_confidence)

  const mutA = useSingleVariableScenario()
  const mutB = useSingleVariableScenario()

  function handleVariableChange(v) {
    setVariable(v)
    setRangeMin(VARIABLE_META[v].defaultMin)
    setRangeMax(VARIABLE_META[v].defaultMax)
  }

  function buildParams(pkr, oil, conf) {
    return {
      hs_code:       hs,
      target_yyyymm: getTargetMonth(),
      variable,
      range_min:    rangeMin,
      range_max:    rangeMax,
      fixed_pkr:    variable !== 'pkr'  ? pkr  : undefined,
      fixed_oil:    variable !== 'oil'  ? oil  : undefined,
      fixed_conf:   variable !== 'conf' ? conf : undefined,
      n_months:     horizon,
    }
  }

  function handleRun() {
    const onErr = (err) => toast.error(err.message ?? 'Scenario failed')
    mutA.mutate(buildParams(aPkr, aOil, aConf), { onError: onErr })
    mutB.mutate(buildParams(bPkr, bOil, bConf), { onError: onErr })
  }

  const isLoading    = mutA.isPending || mutB.isPending
  const currentValue = variable === 'pkr' ? usd_pkr : variable === 'oil' ? brent_oil : us_confidence
  const vmeta        = VARIABLE_META[variable]

  // Delta table: merge points from A and B by input_value
  const deltaRows = useMemo(() => {
    if (!mutA.data?.points || !mutB.data?.points) return []
    return mutA.data.points.map((pA) => {
      const pB = mutB.data.points.find((p) => p.input_value === pA.input_value)
      return {
        input_value: pA.input_value,
        forecast_a:  pA.predicted_m,
        forecast_b:  pB?.predicted_m ?? null,
        delta:       pB != null ? pB.predicted_m - pA.predicted_m : null,
      }
    })
  }, [mutA.data, mutB.data])

  const deltaColumns = [
    { key: 'input_value', label: vmeta?.label,         format: (v) => `${v.toFixed(1)} ${vmeta?.unit}` },
    { key: 'forecast_a',  label: 'Scenario A ($M)', align: 'right', format: (v) => v != null ? `$${v.toFixed(2)}M` : '—' },
    { key: 'forecast_b',  label: 'Scenario B ($M)', align: 'right', format: (v) => v != null ? `$${v.toFixed(2)}M` : '—' },
    { key: 'delta',       label: 'B − A ($M)',      align: 'right',
      format: (v) => v != null ? `${v >= 0 ? '+' : ''}$${v.toFixed(2)}M` : '—',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Shared controls bar */}
      <SurfaceCard gradientTop>
        <div className="flex flex-wrap items-end gap-6">
          <div className="w-52">
            <CommoditySelector value={hs} onChange={setHs} />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-600">Sweep variable</p>
            <div className="flex gap-4">
              {Object.entries(VARIABLE_META).map(([key]) => (
                <label key={key} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="radio" name="cmp-var" value={key}
                    checked={variable === key}
                    onChange={() => handleVariableChange(key)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-slate-700">{key.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {[['Min', rangeMin, setRangeMin], ['Max', rangeMax, setRangeMax]].map(([lbl, val, set]) => (
              <div key={lbl}>
                <p className="mb-0.5 text-xs text-slate-400">{lbl}</p>
                <input type="number" value={val}
                  onChange={(e) => { const n = parseFloat(e.target.value); if (!isNaN(n)) set(n) }}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
                />
              </div>
            ))}
          </div>

          <div className="w-44">
            <HorizonSelector value={horizon} onChange={setHorizon} />
          </div>

          <button
            type="button"
            onClick={handleRun}
            disabled={isLoading}
            className={clsx(
              'rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:from-indigo-500 hover:to-violet-600',
              isLoading && 'cursor-not-allowed opacity-60'
            )}
          >
            {isLoading ? 'Running…' : 'Run comparison'}
          </button>
        </div>
      </SurfaceCard>

      {/* Scenario A / B fixed-values panels */}
      <div className="grid grid-cols-2 gap-6">
        {[
          { label: 'Scenario A', headerCls: 'text-blue-700', bgCls: 'bg-blue-50 border-blue-200',
            pkr: aPkr, setPkr: setAPkr, oil: aOil, setOil: setAOil, conf: aConf, setConf: setAConf },
          { label: 'Scenario B', headerCls: 'text-red-700',  bgCls: 'bg-red-50  border-red-200',
            pkr: bPkr, setPkr: setBPkr, oil: bOil, setOil: setBOil, conf: bConf, setConf: setBConf },
        ].map(({ label, headerCls, bgCls, pkr, setPkr, oil, setOil, conf, setConf }) => (
          <div key={label} className={clsx('rounded-xl border p-5', bgCls)}>
            <h3 className={clsx('text-sm font-semibold mb-3', headerCls)}>{label}</h3>
            <div className="space-y-2">
              {variable !== 'pkr'  && <FieldInput label="USD/PKR Rate"  value={pkr}  onChange={setPkr}  min={120} max={560} />}
              {variable !== 'oil'  && <FieldInput label="Brent Oil ($)" value={oil}  onChange={setOil}  min={10} max={350} />}
              {variable !== 'conf' && <FieldInput label="US Confidence" value={conf} onChange={setConf} min={15} max={999} />}
              <p className="text-xs text-slate-400 pt-1 font-mono">
                Sweeping: <span className="font-medium text-slate-500">{vmeta?.label}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Overlay chart */}
      {isLoading ? (
        <SurfaceCard>
          <SkeletonLoader lines={6} />
        </SurfaceCard>
      ) : mutA.data && mutB.data ? (
        <SurfaceCard>
          <ScenarioChart
            points={mutA.data.points}
            variable={variable}
            currentValue={currentValue}
            comparePoints={mutB.data.points}
            annotation={`A: ${mutA.data.annotation}   ·   B: ${mutB.data.annotation}`}
          />
        </SurfaceCard>
      ) : (
        <EmptyChart message="Configure scenario A and B, then click Run comparison" />
      )}

      {/* Delta table */}
      {deltaRows.length > 0 && (
        <DataTable
          columns={deltaColumns}
          data={deltaRows}
          downloadFilename={`compare_${hs}_${variable}.csv`}
        />
      )}
    </div>
  )
}

// ── Root page ─────────────────────────────────────────────────────────────────

export default function ScenarioSimulator() {
  const [activeTab, setActiveTab] = useState('single')

  return (
    <div className="pb-8">
      <PageHeader
        eyebrow="What-if analysis"
        title="Scenario simulator"
        description="Stress-test PKR, oil, and US confidence—single-variable sweeps, PKR × oil grids, or side-by-side scenario comparison."
        icon={Sliders}
      />

      <PageTabs tabs={SCENARIO_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'single' && <SingleVariableTab />}
      {activeTab === 'multi' && <MultiVariableTab />}
      {activeTab === 'compare' && <CompareTab />}
    </div>
  )
}
