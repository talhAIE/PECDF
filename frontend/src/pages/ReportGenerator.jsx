import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { FileText, Download, RefreshCw, ChevronDown } from 'lucide-react'
import { useGenerateReport } from '../hooks/useGenerateReport'
import { useMacroStore }       from '../store/macroStore'
import { COMMODITY_META } from '../config/commodities'
import { downloadReportAsPDF } from '../utils/pdfExport'

const COMMODITIES = Object.entries(COMMODITY_META).map(([hs, m]) => ({ hs, name: m.name }))

const SCOPE_OPTIONS = [
  { value: 'single', label: 'Single Commodity', description: 'Deep-dive on one HS code' },
  { value: 'top5',   label: 'Top 5 Exports',    description: 'Rice, Men\'s Suits, Bed Linens, Winter Wear, Cotton Yarn' },
  { value: 'all',    label: 'Full Portfolio',    description: 'All 10 tracked commodities' },
]

const TONE_OPTIONS = [
  { value: 'executive', label: 'Executive',  description: 'Strategic summary for decision-makers' },
  { value: 'technical', label: 'Technical',  description: 'Detailed with model metrics and data' },
]

function SectionLabel({ children }) {
  return <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{children}</p>
}

function OptionCard({ option, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(option.value)}
      className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 text-blue-800'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span className="font-medium block">{option.label}</span>
      <span className={`text-xs mt-0.5 block ${selected ? 'text-blue-600' : 'text-slate-400'}`}>
        {option.description}
      </span>
    </button>
  )
}

function ConfigPanel({ config, onChange, isPending }) {
  const usd_pkr       = useMacroStore(s => s.usd_pkr)
  const brent_oil     = useMacroStore(s => s.brent_oil)
  const us_confidence = useMacroStore(s => s.us_confidence)

  return (
    <div className="space-y-5">

      {/* scope */}
      <div>
        <SectionLabel>Report Scope</SectionLabel>
        <div className="space-y-2">
          {SCOPE_OPTIONS.map(opt => (
            <OptionCard
              key={opt.value}
              option={opt}
              selected={config.scope === opt.value}
              onClick={v => onChange({ ...config, scope: v, hs_code: null })}
            />
          ))}
        </div>
      </div>

      {/* commodity picker — only for single */}
      {config.scope === 'single' && (
        <div>
          <SectionLabel>Commodity</SectionLabel>
          <div className="relative">
            <select
              value={config.hs_code ?? ''}
              onChange={e => onChange({ ...config, hs_code: e.target.value || null })}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
            >
              <option value="">Select commodity…</option>
              {COMMODITIES.map(c => (
                <option key={c.hs} value={c.hs}>{c.name} ({c.hs})</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* horizon */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <SectionLabel>Forecast Horizon</SectionLabel>
          <span className="text-xs font-mono font-semibold text-blue-600">{config.horizon} month{config.horizon > 1 ? 's' : ''}</span>
        </div>
        <input
          type="range"
          min={1}
          max={12}
          value={config.horizon}
          onChange={e => onChange({ ...config, horizon: +e.target.value })}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>1 month</span>
          <span>12 months</span>
        </div>
      </div>

      {/* tone */}
      <div>
        <SectionLabel>Report Tone</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {TONE_OPTIONS.map(opt => (
            <OptionCard
              key={opt.value}
              option={opt}
              selected={config.tone === opt.value}
              onClick={v => onChange({ ...config, tone: v })}
            />
          ))}
        </div>
      </div>

      {/* macro (read-only) */}
      <div>
        <SectionLabel>Macro Inputs (from MacroBar)</SectionLabel>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1.5">
          {[
            { label: 'USD/PKR',        value: usd_pkr.toFixed(1) },
            { label: 'Brent Oil',      value: `$${brent_oil.toFixed(1)}` },
            { label: 'US Conf. Index', value: us_confidence.toFixed(1) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-slate-500">{label}</span>
              <span className="font-mono font-semibold text-slate-700">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* generate button */}
      <button
        onClick={() => !isPending && onChange({ ...config, _trigger: Date.now() })}
        disabled={isPending || (config.scope === 'single' && !config.hs_code)}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        {isPending
          ? <><RefreshCw size={15} className="animate-spin" /> Generating…</>
          : <><FileText size={15} /> Generate Report</>
        }
      </button>
    </div>
  )
}

function ReportMeta({ data }) {
  const ts = new Date(data.generated_at).toLocaleString()
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-500 pb-3 border-b border-slate-200 mb-4">
      <span className="capitalize">
        <span className="font-medium text-slate-700">Scope:</span> {data.scope}
      </span>
      <span>
        <span className="font-medium text-slate-700">Horizon:</span> {data.horizon} month{data.horizon > 1 ? 's' : ''}
      </span>
      <span className="capitalize">
        <span className="font-medium text-slate-700">Tone:</span> {data.tone}
      </span>
      <span>
        <span className="font-medium text-slate-700">Words:</span> {data.word_count.toLocaleString()}
      </span>
      <span>
        <span className="font-medium text-slate-700">Generated:</span> {ts}
      </span>
    </div>
  )
}


export default function ReportGenerator() {
  const usd_pkr       = useMacroStore(s => s.usd_pkr)
  const brent_oil     = useMacroStore(s => s.brent_oil)
  const us_confidence = useMacroStore(s => s.us_confidence)

  const [config, setConfig] = useState({
    scope:    'top5',
    hs_code:  null,
    horizon:  3,
    tone:     'executive',
  })

  const { mutate, data, isPending, isError, reset } = useGenerateReport()

  const handleConfigChange = (next) => {
    if (next._trigger) {
      const { _trigger, ...params } = next
      mutate({ ...params, macro: { usd_pkr, brent_oil, us_confidence } })
    } else {
      setConfig(next)
      reset()
    }
  }


  return (
    <div className="flex flex-col gap-4">

      {/* header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
          <FileText size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Report Generator</h1>
          <p className="text-xs text-slate-500">AI-written export analysis reports from live forecast data</p>
        </div>
      </div>

      <div className="flex gap-5 items-start">

        {/* config panel */}
        <div className="w-64 shrink-0">
          <ConfigPanel config={config} onChange={handleConfigChange} isPending={isPending} />
        </div>

        {/* report output */}
        <div className="flex-1 min-w-0">
          {!data && !isPending && !isError && (
            <div className="flex flex-col items-center justify-center h-80 rounded-xl border-2 border-dashed border-slate-200 text-center gap-3">
              <FileText size={32} className="text-slate-300" />
              <div>
                <p className="text-slate-500 font-medium text-sm">No report yet</p>
                <p className="text-slate-400 text-xs mt-1">Configure options and click Generate Report</p>
              </div>
            </div>
          )}

          {isPending && (
            <div className="flex flex-col items-center justify-center h-80 rounded-xl border border-slate-200 bg-white gap-4">
              <RefreshCw size={28} className="text-blue-500 animate-spin" />
              <div className="text-center">
                <p className="text-slate-700 font-medium text-sm">Generating report…</p>
                <p className="text-slate-400 text-xs mt-1">This may take 15–30 seconds</p>
              </div>
            </div>
          )}

          {isError && !isPending && (
            <div className="flex flex-col items-center justify-center h-80 rounded-xl border border-red-200 bg-red-50 gap-3">
              <p className="text-red-600 font-medium text-sm">Report generation failed</p>
              <p className="text-red-400 text-xs">Check that the backend is running and try again.</p>
            </div>
          )}

          {data && !isPending && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              {/* toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Report</span>
                <button
                  onClick={() => downloadReportAsPDF(data)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs text-blue-700 hover:bg-blue-100 transition-colors font-medium"
                >
                  <Download size={12} />
                  Download PDF
                </button>
              </div>

              {/* content */}
              <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
                <ReportMeta data={data} />
                <div className="prose prose-sm max-w-none text-slate-800">
                  <ReactMarkdown>{data.report_text}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
