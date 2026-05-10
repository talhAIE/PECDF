import { useState } from 'react'
import { Download, ChevronUp, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

export default function DataTable({ columns, data = [], downloadFilename = 'data.csv', className = '' }) {
  const [sortKey, setSortKey]   = useState(null)
  const [sortDir, setSortDir]   = useState('asc')

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const av = a[sortKey]
    const bv = b[sortKey]
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sortDir === 'asc' ? cmp : -cmp
  })

  function downloadCSV() {
    const header = columns.map((c) => c.label).join(',')
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = row[c.key]
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val ?? ''
      }).join(',')
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = downloadFilename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={clsx('bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden', className)}>
      {/* Header row with download */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {data.length} rows
        </span>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
        >
          <Download size={13} />
          Download CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={clsx(
                    'px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap',
                    col.sortable !== false && 'cursor-pointer hover:text-slate-700 select-none'
                  )}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === 'asc'
                        ? <ChevronUp size={12} />
                        : <ChevronDown size={12} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                {columns.map((col) => {
                  const raw = row[col.key]
                  const display = col.format ? col.format(raw, row) : raw
                  return (
                    <td
                      key={col.key}
                      className={clsx(
                        'px-4 py-2.5 text-slate-700 font-mono whitespace-nowrap',
                        col.align === 'right' && 'text-right',
                        col.className
                      )}
                    >
                      {display ?? '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400 text-sm">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
