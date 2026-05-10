import { LineChart, Line, ResponsiveContainer } from 'recharts'

export default function SparkLine({
  data = [],
  forecastCount = 1,
  forecastUp = false,
  forecastDown = false,
}) {
  if (!data.length) return <div className="h-10" />

  const chartData = data.map((v, i) => ({ v, isForecast: i >= data.length - forecastCount }))

  const dotFill =
    forecastUp ? '#059669' : forecastDown ? '#E11D48' : '#64748B'

  const CustomDot = (props) => {
    const { cx, cy, index } = props
    if (index !== chartData.length - 1) return null
    return <circle cx={cx} cy={cy} r={3.5} fill={dotFill} stroke="#fff" strokeWidth={1} />
  }

  return (
    <div className="h-11 w-full min-w-0" aria-hidden>
      <ResponsiveContainer width="100%" height={44}>
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
