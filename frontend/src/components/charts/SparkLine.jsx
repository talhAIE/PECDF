import { LineChart, Line, ResponsiveContainer } from 'recharts'

export default function SparkLine({ data = [], forecastCount = 1 }) {
  if (!data.length) return <div className="h-10" />

  const chartData = data.map((v, i) => ({ v, isForecast: i >= data.length - forecastCount }))

  // Custom dot — only show on last point (forecast), hidden on historical
  const CustomDot = (props) => {
    const { cx, cy, index } = props
    if (index !== chartData.length - 1) return null
    return <circle cx={cx} cy={cy} r={3} fill="#DC2626" stroke="none" />
  }

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke="#94A3B8"
            strokeWidth={1.5}
            dot={<CustomDot />}
            activeDot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
