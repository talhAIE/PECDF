import { useQuery } from '@tanstack/react-query'
import { fetchCommodities } from '../../api/forecast'
import { clsx } from 'clsx'

export default function CommoditySelector({ value, onChange, label = 'Commodity', className = '' }) {
  const { data: commodities = [], isLoading } = useQuery({
    queryKey: ['commodities'],
    queryFn: fetchCommodities,
    staleTime: 60 * 60 * 1000,
  })

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        className={clsx(
          'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:bg-slate-50 disabled:text-slate-400'
        )}
      >
        {isLoading ? (
          <option>Loading...</option>
        ) : (
          commodities.map((c) => (
            <option key={c.hs_code} value={c.hs_code}>
              {c.name} (HS {c.hs_code})
            </option>
          ))
        )}
      </select>
    </div>
  )
}
