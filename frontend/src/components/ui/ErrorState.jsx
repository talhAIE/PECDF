import { AlertCircle, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'

export default function ErrorState({
  message = 'Something went wrong.',
  onRetry = null,
  className = ''
}) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="p-3 bg-red-50 rounded-full mb-3">
        <AlertCircle size={22} className="text-red-500" />
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1">Failed to load data</p>
      <p className="text-xs text-slate-400 max-w-xs mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      )}
    </div>
  )
}

export function EmptyState({ message = 'No data available.', icon: Icon = null, className = '' }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 text-center', className)}>
      {Icon && (
        <div className="p-3 bg-slate-100 rounded-full mb-3">
          <Icon size={22} className="text-slate-400" />
        </div>
      )}
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  )
}
