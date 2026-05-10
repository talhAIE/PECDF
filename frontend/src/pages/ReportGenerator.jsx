import { useState } from 'react'
import { FileText, Download, RefreshCw, ChevronDown } from 'lucide-react'
import MarkdownMessage from '../components/chat/MarkdownMessage'
import { useGenerateReport } from '../hooks/useGenerateReport'
import { useMacroStore }       from '../store/macroStore'
import { COMMODITY_META } from '../config/commodities'
import { downloadReportAsPDF } from '../utils/pdfExport'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'

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
  return (
    <p className="font-display mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{children}</p>
  )
}

function OptionCard({ option, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(option.value)}
      className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
        selected
          ? 'border-indigo-500 bg-indigo-50 text-indigo-950 shadow-sm ring-1 ring-indigo-200/60'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span className="block font-medium">{option.label}</span>
      <span className={`mt-0.5 block text-xs ${selected ? 'text-indigo-700' : 'text-slate-400'}`}>
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
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-8 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/35"
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
          <span className="font-mono text-xs font-semibold text-indigo-600">{config.horizon} month{config.horizon > 1 ? 's' : ''}</span>
        </div>
        <input
          type="range"
          min={1}
          max={12}
          value={config.horizon}
          onChange={e => onChange({ ...config, horizon: +e.target.value })}
          className="w-full accent-indigo-600"
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
        <div className="space-y-1.5 rounded-xl border border-indigo-100/80 bg-gradient-to-br from-slate-50 to-indigo-50/30 px-3 py-2.5">
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
        type="button"
        onClick={() => !isPending && onChange({ ...config, _trigger: Date.now() })}
        disabled={isPending || (config.scope === 'single' && !config.hs_code)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:from-indigo-500 hover:to-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
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
    <div className="flex flex-col gap-6 pb-8">

      <PageHeader
        eyebrow="Reports"
        title="Report generator"
        description="AI-written export outlook built from live forecasts, seasonality, and momentum—aligned with your toolbar macro assumptions and chosen scope."
        hint="Executive tone is concise for stakeholders; Technical includes MAPE-style context where relevant."
        icon={FileText}
      />

      <div className="flex flex-col items-start gap-6 lg:flex-row">

        {/* config panel */}
        <div className="w-full shrink-0 lg:w-64">
          <SurfaceCard gradientTop>
            <ConfigPanel config={config} onChange={handleConfigChange} isPending={isPending} />
          </SurfaceCard>
        </div>

        {/* report output */}
        <div className="min-w-0 flex-1">
          {!data && !isPending && !isError && (
            <SurfaceCard className="flex min-h-[20rem] flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200/90 bg-slate-50/50 text-center">
              <FileText size={32} className="text-slate-300" />
              <div>
                <p className="text-sm font-medium text-slate-600">No report yet</p>
                <p className="mt-1 text-xs text-slate-400">Configure options and click Generate report</p>
              </div>
            </SurfaceCard>
          )}

          {isPending && (
            <SurfaceCard className="flex min-h-[20rem] flex-col items-center justify-center gap-4">
              <RefreshCw size={28} className="animate-spin text-indigo-500" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">Generating report…</p>
                <p className="mt-1 text-xs text-slate-400">This may take 15–30 seconds</p>
              </div>
            </SurfaceCard>
          )}

          {isError && !isPending && (
            <SurfaceCard className="flex min-h-[20rem] flex-col items-center justify-center gap-2 border-rose-200 bg-rose-50/90">
              <p className="text-sm font-medium text-rose-800">Report generation failed</p>
              <p className="text-xs text-rose-600">Check that the backend is running and try again.</p>
            </SurfaceCard>
          )}

          {data && !isPending && (
            <SurfaceCard className="overflow-hidden" padding={false} gradientTop>
              {/* toolbar */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30 px-5 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Report output</span>
                <button
                  type="button"
                  onClick={() => downloadReportAsPDF(data)}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 transition-colors hover:bg-indigo-100"
                >
                  <Download size={12} />
                  Download PDF
                </button>
              </div>

              {/* content */}
              <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
                <ReportMeta data={data} />
                <article className="border-t border-slate-100 pt-6">
                  <MarkdownMessage>{data.report_text}</MarkdownMessage>
                </article>
              </div>
            </SurfaceCard>
          )}
        </div>
      </div>
    </div>
  )
}
