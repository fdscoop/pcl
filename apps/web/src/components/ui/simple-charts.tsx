'use client'

interface SimpleBarChartProps {
  data: { label: string; value: number; color?: string }[]
  height?: number
  maxValue?: number
}

export function SimpleBarChart({ data, height = 200, maxValue }: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value))

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
            <span className="font-semibold">{item.value}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                item.color || 'bg-blue-600'
              }`}
              style={{ width: `${max > 0 ? (item.value / max) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface SimplePieChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
}

export function SimplePieChart({ data, size = 200 }: SimplePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  let cumulativePercent = 0
  const segments = data.map((item) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0
    const segment = {
      ...item,
      percentage,
      startPercent: cumulativePercent
    }
    cumulativePercent += percentage
    return segment
  })

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
          />
          {segments.map((segment, index) => {
            const angle = (segment.percentage / 100) * 360
            const startAngle = (segment.startPercent / 100) * 360 - 90
            const endAngle = startAngle + angle
            
            const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
            const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
            const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180)
            const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180)
            
            const largeArcFlag = angle > 180 ? 1 : 0
            
            const pathData = [
              `M 50 50`,
              `L ${startX} ${startY}`,
              `A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              'Z'
            ].join(' ')

            return (
              <path
                key={index}
                d={pathData}
                fill={segment.color}
                className="transition-opacity hover:opacity-80"
              />
            )
          })}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {item.label}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SimpleLineChartProps {
  data: { label: string; value: number }[]
  height?: number
  color?: string
}

export function SimpleLineChart({ data, height = 200, color = '#3b82f6' }: SimpleLineChartProps) {
  if (data.length === 0) return null

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  const width = 100
  const chartHeight = 80
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * width
    const y = chartHeight - ((item.value - minValue) / range) * chartHeight
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="space-y-2">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${chartHeight + 20}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => (
          <line
            key={percent}
            x1="0"
            y1={(chartHeight * percent) / 100}
            x2={width}
            y2={(chartHeight * percent) / 100}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Area under line */}
        <polygon
          points={`0,${chartHeight} ${points} ${width},${chartHeight}`}
          fill={color}
          fillOpacity="0.1"
        />

        {/* Points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * width
          const y = chartHeight - ((item.value - minValue) / range) * chartHeight
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              className="hover:r-3 transition-all"
            />
          )
        })}
      </svg>

      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-500">
        {data.map((item, index) => (
          <span key={index} className="truncate">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
