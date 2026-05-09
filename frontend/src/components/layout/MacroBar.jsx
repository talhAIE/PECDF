import { useState } from 'react'
import { RotateCcw, RefreshCw } from 'lucide-react'
import { useMacroStore } from '../../store/macroStore'
import { useModelInfo, fmtMonthYear } from '../../hooks/useModelInfo'
import { fetchLiveMacro } from '../../api/system'

const FIELDS = [
  {
    key: 'usd_pkr',
    label: 'USD/PKR',
    unit: 'Rate',
    min: 200,
    max: 500,
    step: 0.5,
  },
  {
    key: 'brent_oil',
    label: 'Brent Oil',
    unit: '$/barrel',
    min: 20,
    max: 200,
    step: 0.5,
  },
  {
    key: 'us_confidence',
    label: 'US Confidence',
    unit: 'Index',
    min: 50,
    max: 150,
    step: 0.5,
  },
]

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
    } catch {
      setSyncStatus('error')
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
    ? 'text-green-600'
    : syncStatus === 'error'
    ? 'text-red-500'
    : syncStatus === 'partial'
    ? 'text-amber-500'
    : 'text-blue-500 hover:text-blue-700'

  return (
    <div className="sticky top-14 z-40 bg-slate-50 border-b border-slate-200 h-13 flex items-center px-6 gap-6">

      {/* Label */}
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
        Market Inputs
      </span>

      {/* Inputs */}
      <div className="flex items-center gap-5 flex-1">
        {FIELDS.map(({ key, label, unit, min, max, step }) => (
          <div key={key} className="flex items-center gap-2">
            <div className="text-right shrink-0">
              <p className="text-xs font-medium text-slate-600 leading-none">{label}</p>
              <p className="text-xs text-slate-400 leading-none mt-0.5">{unit}</p>
            </div>
            <input
              type="number"
              value={values[key]}
              min={min}
              max={max}
              step={step}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) setMacro(key, v)
              }}
              className="w-20 border border-slate-200 rounded-md px-2 py-1 text-sm font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ))}
      </div>

      {/* Right side — sync live + reset + model badge */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Sync Live button */}
        <button
          onClick={handleSyncLive}
          disabled={syncing}
          title="Fetch real-time USD/PKR, Brent Oil, and US Confidence from live market data"
          className={`flex items-center gap-1 text-xs font-medium transition-colors ${syncColor} disabled:opacity-60`}
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
