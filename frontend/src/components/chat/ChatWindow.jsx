import { useEffect, useRef } from 'react'
import MessageBubble    from './MessageBubble'
import TypingIndicator  from './TypingIndicator'
import SuggestedPrompts from './SuggestedPrompts'
import ChatInput        from './ChatInput'

export default function ChatWindow({ messages, isPending, isRestorable, onSend, onRestore, onDismiss }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isPending])

  const empty = messages.length === 0

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50 to-white shadow-[0_8px_32px_-20px_rgba(79,70,229,0.15)] ring-1 ring-indigo-100/60">

      {/* restore banner */}
      {isRestorable && (
        <div className="flex flex-col gap-3 border-b border-amber-200/90 bg-gradient-to-r from-amber-50 to-amber-100/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium leading-snug text-amber-950">
            Continue your last analyst chat. Messages are saved in this browser.
          </span>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onRestore}
              className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg border border-amber-300 bg-white px-4 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-50"
            >
              Start fresh
            </button>
          </div>
        </div>
      )}

      {/* message area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {empty && !isPending && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
              AI
            </div>
            <div>
              <p className="text-slate-700 font-medium">AI Export Analyst</p>
              <p className="text-slate-400 text-sm mt-1 max-w-xs">
                Ask me about export forecasts, market scenarios, commodity trends, or model performance.
              </p>
            </div>
          </div>
        )}
        {messages.map(m => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {isPending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* suggested prompts — shown when empty */}
      {empty && !isRestorable && (
        <SuggestedPrompts onSelect={onSend} />
      )}

      <ChatInput onSend={onSend} disabled={isPending} />
    </div>
  )
}
