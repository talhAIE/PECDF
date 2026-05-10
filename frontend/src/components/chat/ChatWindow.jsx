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
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-sm">
          <span className="text-amber-800">You have a previous session. Resume it?</span>
          <div className="flex gap-2">
            <button
              onClick={onRestore}
              className="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors"
            >
              Resume
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1 rounded-lg border border-amber-300 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
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
