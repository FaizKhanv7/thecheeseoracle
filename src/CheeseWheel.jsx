import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function CheeseWheel({ score, description, mdComponents }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 150)
    return () => clearTimeout(t)
  }, [score])

  const size = 96
  const cx = size / 2
  const cy = size / 2
  const r = 40
  const fraction = Math.max(0, Math.min(10, animated)) / 10
  const angle = fraction * 2 * Math.PI - Math.PI / 2
  const x = cx + r * Math.cos(angle)
  const y = cy + r * Math.sin(angle)
  const largeArc = fraction > 0.5 ? 1 : 0
  const filledPath =
    fraction === 0
      ? ''
      : fraction >= 1
        ? `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 -${r * 2} 0`
        : `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y} Z`

  const holes = [
    { cx: 44, cy: 36, r: 4.5 },
    { cx: 34, cy: 50, r: 3.5 },
    { cx: 52, cy: 54, r: 5 },
    { cx: 42, cy: 64, r: 3 },
    { cx: 58, cy: 40, r: 3.5 },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="#F5C842" />
        {fraction > 0 && (
          <path
            d={filledPath}
            fill="#C8892A"
            style={{ transition: 'all 700ms ease' }}
          />
        )}
        {holes.map((hole, i) => (
          <circle key={i} cx={hole.cx} cy={hole.cy} r={hole.r} fill="#E8A838" opacity="0.7" />
        ))}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#C8892A" strokeWidth="1.5" />
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="13"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
          fill="#7A4A0A"
        >
          {score}/10
        </text>
      </svg>
      <div style={{ flex: 1 }}>
        <div className="section-copy markdown-content">
          <ReactMarkdown components={mdComponents}>{description}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
