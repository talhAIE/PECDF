import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders assistant markdown with GFM (tables, task lists, strikethrough) and
 * Tailwind-styled elements — tables are scroll-wrapped and readable.
 */
const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="font-display mb-3 mt-6 text-xl font-bold tracking-tight text-slate-900 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display mb-2 mt-6 border-b border-slate-200 pb-1.5 text-lg font-bold text-slate-900 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-5 text-base font-bold text-slate-900 first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-display mb-2 mt-4 text-sm font-bold uppercase tracking-wide text-slate-800 first:mt-0">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="mb-1.5 mt-3 text-sm font-semibold text-slate-800 first:mt-0">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wider text-slate-600 first:mt-0">{children}</h6>
  ),
  p: ({ children }) => <p className="mb-3 text-[15px] leading-relaxed text-slate-700 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-slate-700 marker:text-indigo-500">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-slate-700 marker:font-mono marker:text-indigo-600">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed [&>p]:mb-1 [&>p]:last:mb-0">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-indigo-200 bg-indigo-50/60 py-2 pl-4 pr-3 text-slate-700 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-slate-200" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-4 -mx-1 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-left text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/40">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-slate-100">{children}</tbody>,
  tr: ({ children }) => <tr className="transition-colors even:bg-slate-50/60">{children}</tr>,
  th: ({ children }) => (
    <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2.5 font-semibold text-slate-800">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-slate-100 px-3 py-2 align-top text-slate-700">{children}</td>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-3.5 text-[13px] leading-relaxed text-slate-100 [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = typeof className === 'string' && className.includes('language-')
    if (isBlock) {
      return (
        <code className={`font-mono text-[13px] text-slate-100 ${className || ''}`} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-[0.88em] font-medium text-indigo-900 ring-1 ring-indigo-100/80"
        {...props}
      >
        {children}
      </code>
    )
  },
}

export default function MarkdownMessage({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {children}
    </ReactMarkdown>
  )
}
