const TOOL_LABELS = {
  forecast_commodity: '📊 Forecast',
  run_scenario:       '🔄 Scenario',
  get_momentum:       '📈 Momentum',
  get_seasonality:    '🗓 Seasonality',
  get_historical:     '📂 Historical',
  compare_commodities:'⚖️ Compare',
  get_sensitivity:    '💱 Sensitivity',
}

export default function ToolUsedBadge({ tool }) {
  const label = TOOL_LABELS[tool] ?? `🔧 ${tool}`
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
      {label}
    </span>
  )
}
