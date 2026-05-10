import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { RotateCcw, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react'
import { useMacroStore } from '../../store/macroStore'
import { useModelInfo, fmtMonthYear } from '../../hooks/useModelInfo'
import { fetchLiveMacro } from '../../api/system'
import { getErrorMessage } from '../../utils/apiError'

// Keep min/max aligned with backend `MacroInputs` (schemas/common.py) so forecasts don’t 422.
const FIELDS = [
  {
    key: 'usd_pkr',
    label: 'USD/PKR',
    unit: 'Rate',
    min: 120,
    max: 560,
    step: 0.5,
  },
  {
    key: 'brent_oil',
    label: 'Brent Oil',
    unit: '$/barrel',
    min: 10,
    max: 350,
    step: 0.5,
  },
  {
    key: 'us_confidence',
    label: 'US Confidence',
    unit: 'Index',
    min: 15,
    max: 999,
    step: 0.5,
  },
]

function clampStep(n, min, max, step) {
  if (!Number.isFinite(n)) return Math.min(max, Math.max(min, min))
  const stepStr = String(step)
  const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0
  const snapped = Math.round(n / step) * step
  const tidy = Number(snapped.toFixed(decimals))
  return Math.min(max, Math.max(min, tidy))
}

/**
 * Type freely (including empty / partial decimals); commit on blur.
 * Up/down always work and match backend min/max/step.
 */
function MacroSpinField({ label, unit, value, min, max, step, onCommit }) {
  const [draft, setDraft] = useState(undefined)

  useEffect(() => {
    setDraft(undefined)
  }, [value])

  const shown = draft !== undefined ? draft : String(value)

  const applyNumber = (n) => {
    const c = clampStep(n, min, max, step)
    onCommit(c)
    setDraft(undefined)
  }

  const bump = (dir) => {
    const base = draft !== undefined ? parseFloat(String(draft)) : value
    const n = clampStep(base + dir * step, min, max, step)
    onCommit(n)
    setDraft(undefined)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-right shrink-0">
        <p className="text-xs font-medium text-slate-600 leading-none">{label}</p>
        <p className="text-xs text-slate-400 leading-none mt-0.5">{unit}</p>
      </div>

      <div className="flex items-stretch rounded-lg border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30">
        <input
          type="number"
          inputMode="decimal"
          aria-label={`${label} ${unit}`}
          value={shown}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const raw = e.target.value
            setDraft(raw)
            const n = parseFloat(String(raw).replace(',', '.'))
            if (raw.trim() === '' || Number.isNaN(n)) return
            // Only push to store when in range so partial typing (e.g. "2" before "278") is not clamped to min.
            if (n >= min && n <= max) {
              onCommit(clampStep(n, min, max, step))
            }
          }}
          onBlur={() => {
            if (draft === undefined) return
            const trimmed = draft.trim().replace(',', '.')
            if (trimmed === '' || trimmed === '-') {
              setDraft(undefined)
              return
            }
            const n = parseFloat(trimmed)
            applyNumber(Number.isNaN(n) ? value : n)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
          className={
            'w-[6.75rem] min-w-0 border-0 bg-transparent px-2 py-1.5 text-sm font-mono text-slate-900 '
            + 'focus:outline-none [appearance:textfield] '
            + '[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          }
        />
        <div className="flex flex-col border-l border-slate-200 divide-y divide-slate-200 shrink-0">
          <button
            type="button"
            aria-label={`Increase ${label}`}
            onClick={() => bump(1)}
            className="flex items-center justify-center px-1.5 py-0.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100"
          >
            <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label={`Decrease ${label}`}
            onClick={() => bump(-1)}
            className="flex items-center justify-center px-1.5 py-0.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100"
          >
            <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MacroBar() {
  const { usd_pkr, brent_oil, us_confidence, setMacro, resetMacro } = useMacroStore()
  const { data: modelInfo } = useModelInfo()
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null) // 'ok' | 'partial' | 'error'

  const values = { usd_pkr, brent_oil, us_confidence }

  async function handleSyncLive() {
    setSyncing(true)
    setSyncStatus(null)
    try {
      const live = await fetchLiveMacro()
      let updated = 0
      if (live.usd_pkr != null)       { setMacro('usd_pkr',       live.usd_pkr);       updated++ }
      if (live.brent_oil != null)      { setMacro('brent_oil',      live.brent_oil);      updated++ }
      if (live.us_confidence != null)  { setMacro('us_confidence',  live.us_confidence);  updated++ }
      setSyncStatus(updated === 3 ? 'ok' : updated > 0 ? 'partial' : 'error')

      const ok = live.fetched_ok || {}
      const parts = [
        ok.usd_pkr && 'USD/PKR (Yahoo)',
        ok.brent_oil && 'Brent (Yahoo)',
        ok.us_confidence && 'US confidence (FRED)',
      ].filter(Boolean)
      const note = live.us_confidence_note || ''
      if (updated === 0) {
        toast.error('Live sync failed — check network and API keys (FRED for confidence).')
      } else {
        toast.success([`Updated: ${parts.join(', ')}.`, note].filter(Boolean).join(' '), {
          duration: 5500,
        })
      }
    } catch (err) {
      setSyncStatus('error')
      toast.error(getErrorMessage(err, 'Could not sync live macro data — check API and keys.'))
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncStatus(null), 4000)
    }
  }

  const syncLabel = syncStatus === 'ok'
    ? 'Synced!'
    : syncStatus === 'partial'
    ? 'Partial sync'
    : syncStatus === 'error'
    ? 'Sync failed'
    : 'Sync Live'

  const syncColor = syncStatus === 'ok'
    ? 'text-emerald-700'
    : syncStatus === 'error'
    ? 'text-red-600'
    : syncStatus === 'partial'
    ? 'text-amber-700'
    : 'text-slate-700 hover:text-slate-900'

  return (
    <div className="sticky top-14 z-40 flex h-auto min-h-[3.25rem] flex-wrap items-center gap-4 border-b border-slate-200/80 bg-white/70 px-4 py-2.5 shadow-sm shadow-slate-900/5 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 sm:gap-6 sm:px-6">

      {/* Label */}
      <span className="font-display shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600/80">
        Market inputs
      </span>

      {/* Inputs */}
      <div className="flex items-center gap-5 flex-1 flex-wrap">
        {FIELDS.map(({ key, label, unit, min, max, step }) => (
          <MacroSpinField
            key={key}
            label={label}
            unit={unit}
            value={values[key]}
            min={min}
            max={max}
            step={step}
            onCommit={(n) => setMacro(key, n)}
          />
        ))}
      </div>

      {/* Right side — sync live + reset + model badge */}
      <div className="flex flex-wrap items-center gap-3 shrink-0 sm:gap-4">
        {/* Sync Live button */}
        <button
          type="button"
          onClick={handleSyncLive}
          disabled={syncing}
          title="Fetch real-time USD/PKR, Brent Oil, and US Confidence from live market data"
          className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white/90 px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors hover:bg-white disabled:opacity-60 ${syncColor}`}
        >
          <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : syncLabel}
        </button>

        <span className="text-slate-200">|</span>

        <button
          onClick={resetMacro}
          title="Reset to defaults"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <RotateCcw size={12} />
          Reset
        </button>

        {modelInfo && (
          <span className="hidden xl:block text-xs text-slate-300 font-mono">
            {modelInfo.model_type ?? 'XGBoost'} · MAPE {modelInfo.test_mape?.toFixed(1) ?? '—'}% · {fmtMonthYear(modelInfo.train_cutoff)}
          </span>
        )}
      </div>
    </div>
  )
}
