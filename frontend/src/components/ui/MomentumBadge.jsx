import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { clsx } from 'clsx'

export default function MomentumBadge({ direction, value, size = 'md' }) {
  const config = {
    up:   { icon: TrendingUp,   label: value != null ? `+${Math.abs(value).toFixed(1)}%` : 'Up',   classes: 'bg-green-50 text-green-700 border-green-200' },
    down: { icon: TrendingDown, label: value != null ? `-${Math.abs(value).toFixed(1)}%` : 'Down', classes: 'bg-red-50 text-red-700 border-red-200'       },
    flat: { icon: Minus,        label: 'Flat',                                                       classes: 'bg-slate-100 text-slate-500 border-slate-200' },
  }

  const d = direction?.toLowerCase()
  const c = config[d] ?? config.flat
  const Icon = c.icon

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 font-medium border rounded-full',
      c.classes,
      size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'
    )}>
      <Icon size={size === 'sm' ? 10 : 11} />
      {c.label}
    </span>
  )
}
