import { clsx } from 'clsx'

function SkeletonLine({ width = 'w-full', height = 'h-4' }) {
  return (
    <div className={clsx('animate-pulse bg-slate-200 rounded', width, height)} />
  )
}

export default function SkeletonLoader({ lines = 4, className = '' }) {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-full', 'w-3/6', 'w-5/6']
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={widths[i % widths.length]} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={clsx('bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3', className)}>
      <SkeletonLine width="w-1/3" height="h-3" />
      <SkeletonLine width="w-1/2" height="h-7" />
      <SkeletonLine width="w-2/3" height="h-3" />
    </div>
  )
}

export function SkeletonChart({ height = 'h-64', className = '' }) {
  return (
    <div className={clsx('bg-white rounded-xl border border-slate-200 shadow-sm p-5', className)}>
      <SkeletonLine width="w-1/4" height="h-3" />
      <div className={clsx('mt-4 animate-pulse bg-slate-100 rounded-lg', height)} />
    </div>
  )
}
