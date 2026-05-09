import { useNavigate } from 'react-router-dom'
import { Bot, BarChart2, FileText, Trash2, RefreshCw } from 'lucide-react'
import ChatWindow    from '../components/chat/ChatWindow'
import { useAgentChat } from '../hooks/useAgentChat'
import { useMacroStore } from '../store/macroStore'
import { COMMODITY_META } from '../config/commodities'

const COMMODITIES = Object.entries(COMMODITY_META).map(([hs, m]) => ({ hs, name: m.name }))

function MacroDisplay() {
  const usd_pkr       = useMacroStore(s => s.usd_pkr)
  const brent_oil     = useMacroStore(s => s.brent_oil)
  const us_confidence = useMacroStore(s => s.us_confidence)
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Macro Inputs</p>
      <div className="space-y-2">
        {[
          { label: 'USD/PKR', value: usd_pkr.toFixed(1) },
          { label: 'Brent Oil (USD)', value: brent_oil.toFixed(1) },
          { label: 'US Consumer Conf.', value: us_confidence.toFixed(1) },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-xs font-semibold text-slate-800 font-mono">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-400">Edit macro values in the top bar.</p>
    </div>
  )
}

function SessionInfo({ sessionId, messageCount, onClear }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Session</p>
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
            <span className="font-mono text-slate-400 truncate max-w-[120px]" title={sessionId}>
              {sessionId.slice(0, 8)}…
            </span>
          </div>
        )}
      </div>
      <button
        onClick={onClear}
        className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={12} />
        Clear conversation
      </button>
    </div>
  )
}

function QuickLinks() {
  const navigate = useNavigate()
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Navigation</p>
      <button
        onClick={() => navigate('/forecast')}
        className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <BarChart2 size={14} className="text-blue-500" />
        Forecast Center
      </button>
      <button
        onClick={() => navigate('/scenario')}
        className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <RefreshCw size={14} className="text-purple-500" />
        Scenario Simulator
      </button>
      <button
        onClick={() => navigate('/report')}
        className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <FileText size={14} className="text-emerald-500" />
        Generate Report
      </button>
    </div>
  )
}

export default function AIAnalyst() {
  const { messages, isPending, isRestorable, sessionId, send, restore, clear, dismiss } = useAgentChat()

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-4rem)]">

      {/* header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
          <Bot size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">AI Export Analyst</h1>
          <p className="text-xs text-slate-500">Powered by Claude — asks only what the data knows</p>
        </div>
      </div>

      {/* body */}
      <div className="flex flex-1 gap-4 min-h-0">

        {/* chat — takes remaining width */}
        <div className="flex-1 min-w-0 min-h-0">
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
        <div className="w-56 shrink-0 space-y-3 overflow-y-auto">
          <MacroDisplay />
          <SessionInfo
            sessionId={sessionId}
            messageCount={messages.length}
            onClear={clear}
          />
          <QuickLinks />

          {/* commodity quick-links */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Commodities</p>
            <div className="space-y-0.5">
              {COMMODITIES.map(c => (
                <button
                  key={c.hs}
                  onClick={() => send(`Tell me about the forecast for ${c.name} (HS ${c.hs}).`)}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {c.name}
                  <span className="ml-1 text-slate-400 font-mono">{c.hs}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
