import { useNavigate } from 'react-router-dom'
import { Bot, BarChart2, FileText, Trash2, RefreshCw } from 'lucide-react'
import ChatWindow from '../components/chat/ChatWindow'
import { useAgentChat } from '../hooks/useAgentChat'
import { useMacroStore } from '../store/macroStore'
import { COMMODITY_META } from '../config/commodities'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'

const COMMODITIES = Object.entries(COMMODITY_META).map(([hs, m]) => ({ hs, name: m.name }))

function MacroDisplay() {
  const usd_pkr       = useMacroStore(s => s.usd_pkr)
  const brent_oil     = useMacroStore(s => s.brent_oil)
  const us_confidence = useMacroStore(s => s.us_confidence)
  return (
    <SurfaceCard className="space-y-3" gradientTop>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active macro inputs</p>
      <div className="space-y-2">
        {[
          { label: 'USD/PKR', value: usd_pkr.toFixed(1) },
          { label: 'Brent Oil (USD)', value: brent_oil.toFixed(1) },
          { label: 'US Consumer Conf.', value: us_confidence.toFixed(1) },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-slate-600">{label}</span>
            <span className="font-mono text-xs font-semibold tabular-nums text-slate-900">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-400">Edit values in the toolbar above.</p>
    </SurfaceCard>
  )
}

function SessionInfo({ sessionId, messageCount, onClear }) {
  return (
    <SurfaceCard className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Session</p>
      <div className="space-y-1.5 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>Status</span>
          <span className={`font-medium ${sessionId ? 'text-emerald-600' : 'text-slate-400'}`}>
            {sessionId ? 'Active' : 'New'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Messages</span>
          <span className="font-mono font-medium text-slate-800">{messageCount}</span>
        </div>
        {sessionId && (
          <div className="flex justify-between">
            <span>ID</span>
            <span className="max-w-[120px] truncate font-mono text-slate-400" title={sessionId}>
              {sessionId.slice(0, 8)}…
            </span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      >
        <Trash2 size={12} />
        Clear conversation
      </button>
    </SurfaceCard>
  )
}

function QuickLinks() {
  const navigate = useNavigate()
  return (
    <SurfaceCard className="space-y-1">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Quick links</p>
      <button
        type="button"
        onClick={() => navigate('/forecast')}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-800"
      >
        <BarChart2 size={14} className="text-indigo-600" />
        Forecast center
      </button>
      <button
        type="button"
        onClick={() => navigate('/scenario')}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-900"
      >
        <RefreshCw size={14} className="text-violet-600" />
        Scenario simulator
      </button>
      <button
        type="button"
        onClick={() => navigate('/report')}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
      >
        <FileText size={14} className="text-emerald-600" />
        Generate report
      </button>
    </SurfaceCard>
  )
}

export default function AIAnalyst() {
  const { messages, isPending, isRestorable, sessionId, send, restore, clear, dismiss } = useAgentChat()

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6">

      <PageHeader
        eyebrow="AI assistant"
        title="Export analyst"
        description="Ask questions about forecasts, commodities, and macro drivers. The assistant uses your session macro inputs and live API tools."
        icon={Bot}
      />

      <div className="flex min-h-0 flex-1 gap-5">

        {/* chat — takes remaining width */}
        <div className="min-h-0 min-w-0 flex-1">
          <ChatWindow
            messages={messages}
            isPending={isPending}
            isRestorable={isRestorable}
            onSend={send}
            onRestore={restore}
            onDismiss={dismiss}
          />
        </div>

        {/* sidebar */}
        <div className="w-full shrink-0 space-y-3 overflow-y-auto sm:w-56">
          <MacroDisplay />
          <SessionInfo
            sessionId={sessionId}
            messageCount={messages.length}
            onClear={clear}
          />
          <QuickLinks />

          <SurfaceCard className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Commodities</p>
            <div className="max-h-48 space-y-0.5 overflow-y-auto pr-1">
              {COMMODITIES.map(c => (
                <button
                  key={c.hs}
                  type="button"
                  onClick={() => send(`Tell me about the forecast for ${c.name} (HS ${c.hs}).`)}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-800"
                >
                  {c.name}
                  <span className="ml-1 font-mono text-slate-400">{c.hs}</span>
                </button>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  )
}
