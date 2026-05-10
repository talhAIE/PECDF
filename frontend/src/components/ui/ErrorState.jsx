import { AlertCircle, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { getErrorMessage } from '../../utils/apiError'

export default function ErrorState({
  /** Explicit copy (wins over `error`) */
  message,
  /** React Query error, ApiError, axios error, etc. */
  error,
  fallback = 'Something went wrong.',
  onRetry = null,
  className = ''
}) {
  const resolved =
    (typeof message === 'string' && message.trim() ? message : null) ??
    (error != null ? getErrorMessage(error, fallback) : null) ??
    fallback

  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="p-3 bg-red-50 rounded-full mb-3">
        <AlertCircle size={22} className="text-red-500" aria-hidden />
      </div>
      <p className="mb-1 text-sm font-semibold text-slate-800">Something went wrong</p>
      <p
        role="status"
        className="mb-5 max-w-sm text-xs leading-relaxed text-slate-500"
      >
        {resolved}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
        >
          <RefreshCw size={14} className="opacity-90" aria-hidden />
          Try again
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
