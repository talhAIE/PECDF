const PROMPTS = [
  { label: 'Forecast overview',    text: 'Give me a portfolio overview — which commodities are trending up next month?' },
  { label: 'Currency impact',      text: 'How would a PKR depreciation to 310 affect our top exports?' },
  { label: 'Oil sensitivity',      text: 'Which commodities are most sensitive to oil prices?' },
  { label: 'Seasonality check',    text: 'What seasonal patterns should I watch for over the next 3 months?' },
  { label: 'Rice vs cotton yarn',  text: 'Compare the 6-month forecast for rice (1006) vs cotton yarn (5205).' },
  { label: 'Model confidence',     text: 'How reliable are the forecasts? Show me model accuracy metrics.' },
]

export default function SuggestedPrompts({ onSelect }) {
  return (
    <div className="border-t border-slate-100/90 bg-gradient-to-b from-white to-slate-50/40 px-4 pb-5 pt-3">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Try asking</p>
      <div className="flex flex-wrap gap-2">
        {PROMPTS.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => onSelect(p.text)}
            className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 shadow-sm shadow-slate-900/[0.02] transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-900 active:scale-[0.98]"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
