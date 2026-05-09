import ReactMarkdown from 'react-markdown'
import ToolUsedBadge from './ToolUsedBadge'

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
        AI
      </div>
      <div className="max-w-[80%] flex flex-col gap-2">
        <div className={`bg-white border rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed prose prose-sm max-w-none ${
          message.isError ? 'border-red-200 text-red-600' : 'border-slate-200 text-slate-800'
        }`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {message.tools_used?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {message.tools_used.map((t, i) => (
              <ToolUsedBadge key={i} tool={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
