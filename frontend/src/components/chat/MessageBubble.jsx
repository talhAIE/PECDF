import MarkdownMessage from './MarkdownMessage'
import ToolUsedBadge from './ToolUsedBadge'

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-600 to-violet-700 px-4 py-3 text-sm leading-relaxed text-white shadow-md shadow-indigo-600/20">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-xs font-bold text-white shadow-md shadow-indigo-600/25">
        AI
      </div>
      <div className="flex min-w-0 max-w-[min(100%,52rem)] flex-col gap-2">
        <div
          className={`rounded-2xl rounded-tl-sm border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-100/90 ${
            message.isError ? 'border-red-200 text-red-700' : 'text-slate-800'
          }`}
        >
          {message.isError ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <MarkdownMessage>{message.content}</MarkdownMessage>
          )}
        </div>
        {message.tools_used?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-0.5">
            {message.tools_used.map((t, i) => (
              <ToolUsedBadge key={i} tool={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
