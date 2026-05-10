const PROMPTS = [
  { label: 'Forecast overview',    text: 'Give me a portfolio overview — which commodities are trending up next month?' },
  { label: 'Currency impact',      text: 'How would a PKR depreciation to 310 affect our top exports?' },
  { label: 'Oil sensitivity',      text: 'Which commodities are most sensitive to oil prices?' },
  { label: 'Seasonality check',    text: 'What seasonal patterns should I watch for over the next 3 months?' },
  { label: 'Rice vs Textile',      text: 'Compare the 6-month forecast for rice (1006) vs cotton textile (5208).' },
  { label: 'Model confidence',     text: 'How reliable are the forecasts? Show me model accuracy metrics.' },
]

export default function SuggestedPrompts({ onSelect }) {
  return (
    <div className="px-4 pb-4">
      <p className="text-xs text-slate-400 mb-2 font-medium">Suggested questions</p>
      <div className="flex flex-wrap gap-2">
        {PROMPTS.map(p => (
          <button
            key={p.label}
            onClick={() => onSelect(p.text)}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
