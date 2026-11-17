import { useEffect, useMemo, useRef } from 'react'
import type { RunState, StatKey } from '@/types'
import { DANGER_THRESHOLD } from '@/constants/balance'
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  animatePoints,
  buildChartPoints,
  polylinePath,
  segmentPaths,
  toX,
  toY,
  type ChartPoint,
} from '@/lib/chart'

const LINES: ReadonlyArray<{ key: StatKey; color: string; strokeWidth: number }> = [
  { key: 'money', color: 'var(--color-money)', strokeWidth: 2 },
  { key: 'spirit', color: 'var(--color-spirit)', strokeWidth: 1.5 },
  { key: 'family', color: 'var(--color-family)', strokeWidth: 1.5 },
  { key: 'career', color: 'var(--color-career)', strokeWidth: 1.5 },
]

const H_GRID = [0, 20, 40, 60, 80, 100]
const V_GRID = [0, 10, 20, 30, 40, 52]
const GROWTH_MS = 320

/**
 * 四条净值曲线。坐标轴固定 0–52 周 × 0–100，不随数据缩放。
 * 生长动画只插值最后一段，直接写 SVG 的 d 属性，不经过 React state。
 */
export function EquityChart({ run }: { run: RunState }) {
  const points = useMemo(() => buildChartPoints(run), [run])
  const prevPoints = useRef<ChartPoint[]>(points)
  const lineRefs = useRef<Partial<Record<StatKey, SVGPathElement | null>>>({})
  const dangerRefs = useRef<Partial<Record<StatKey, SVGPathElement | null>>>({})
  const areaRef = useRef<SVGPathElement | null>(null)

  useEffect(() => {
    const from = prevPoints.current
    prevPoints.current = points

    const paint = (pts: ChartPoint[]) => {
      for (const line of LINES) {
        const segments = segmentPaths(pts, CHART_WIDTH, CHART_HEIGHT, line.key)
        lineRefs.current[line.key]?.setAttribute('d', segments.solid)
        dangerRefs.current[line.key]?.setAttribute('d', segments.danger)
      }

      if (pts.length < 2) {
        areaRef.current?.setAttribute('d', '')
        return
      }
      const money = polylinePath(pts, CHART_WIDTH, CHART_HEIGHT, 'money')
      const first = pts[0]!
      const last = pts[pts.length - 1]!
      areaRef.current?.setAttribute(
        'd',
        `${money} L${toX(last.week, CHART_WIDTH).toFixed(2)},${CHART_HEIGHT} L${toX(
          first.week,
          CHART_WIDTH,
        ).toFixed(2)},${CHART_HEIGHT} Z`,
      )
    }

    let rafId = 0

    // 只有"新增了一个点"才做生长动画；重开一局（点数变少）直接定格
    if (points.length === from.length + 1) {
      const started = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - started) / GROWTH_MS)
        const eased = 1 - Math.pow(1 - t, 3)
        paint(animatePoints(from, points, eased))
        if (t < 1) rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(rafId)
    }

    paint(points)
    return () => cancelAnimationFrame(rafId)
  }, [points])

  const nowX = toX(run.week, CHART_WIDTH)

  return (
    <svg
      className="g-chart"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="四属性净值曲线"
    >
      <g className="g-chart-grid">
        {H_GRID.map((value) => (
          <line
            key={`h-${value}`}
            x1={0}
            x2={CHART_WIDTH}
            y1={toY(value, CHART_HEIGHT)}
            y2={toY(value, CHART_HEIGHT)}
          />
        ))}
        {V_GRID.map((week) => (
          <line
            key={`v-${week}`}
            className="g-chart-grid-v"
            x1={toX(week, CHART_WIDTH)}
            x2={toX(week, CHART_WIDTH)}
            y1={0}
            y2={CHART_HEIGHT}
          />
        ))}
      </g>

      <line
        className="g-chart-threshold"
        x1={0}
        x2={CHART_WIDTH}
        y1={toY(DANGER_THRESHOLD, CHART_HEIGHT)}
        y2={toY(DANGER_THRESHOLD, CHART_HEIGHT)}
      />

      <path ref={areaRef} className="g-chart-area" fill="var(--color-money)" />

      {LINES.map((line) => (
        <g key={line.key}>
          <path
            ref={(el) => {
              lineRefs.current[line.key] = el
            }}
            data-stat={line.key}
            fill="none"
            stroke={line.color}
            strokeWidth={line.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            ref={(el) => {
              dangerRefs.current[line.key] = el
            }}
            data-stat-danger={line.key}
            fill="none"
            stroke={line.color}
            strokeWidth={line.strokeWidth}
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        </g>
      ))}

      <line className="g-chart-now" x1={nowX} x2={nowX} y1={0} y2={CHART_HEIGHT} />
    </svg>
  )
}
