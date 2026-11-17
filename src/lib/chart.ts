import type { RunState, StatKey, Stats } from '@/types'
import { CHARACTERS, DANGER_THRESHOLD, RUN_WEEKS, STAT_MAX, STAT_MIN } from '@/constants/balance'

export interface ChartPoint {
  week: number
  stats: Stats
}

/** 图表视口（SVG 坐标，preserveAspectRatio="none" 拉伸到容器） */
export const CHART_WIDTH = 520
export const CHART_HEIGHT = 260

const STAT_KEYS: readonly StatKey[] = ['money', 'spirit', 'family', 'career']

/**
 * 曲线取点 = week 0 锚点 + 全部 history + 当前实时态
 * 当前态只在 run.week > 最后一个 history 周次时追加（避免重复点）
 */
export function buildChartPoints(run: RunState): ChartPoint[] {
  const anchor = CHARACTERS[run.characterId].startStats
  const points: ChartPoint[] = [{ week: 0, stats: anchor }]

  for (const h of run.history) {
    points.push({ week: h.week, stats: h.statsAfter })
  }

  const lastWeek = points[points.length - 1]!.week
  if (run.week > lastWeek) {
    points.push({ week: run.week, stats: run.stats })
  }
  return points
}

/** 周次 → 屏幕 x（0..width），坐标轴固定 0..52，不随数据缩放 */
export function toX(week: number, width: number): number {
  return (week / RUN_WEEKS) * width
}

/** 属性值 → 屏幕 y（0..height，0 在底部），坐标轴固定 0..100 */
export function toY(value: number, height: number): number {
  const v = Math.min(STAT_MAX, Math.max(STAT_MIN, value))
  return height - (v / STAT_MAX) * height
}

/** 生成一条折线路径。S5 再换 monotone cubic 平滑 */
export function polylinePath(
  points: ChartPoint[],
  width: number,
  height: number,
  key: StatKey,
): string {
  return points
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'}${toX(p.week, width).toFixed(2)},${toY(p.stats[key], height).toFixed(2)}`,
    )
    .join(' ')
}

/**
 * 按危险态切段：任一端 ≤ 20 的那一段算危险段（画虚线）。
 * 实线段与虚线段分开返回，避免虚线盖在实线上。
 */
export function segmentPaths(
  points: ChartPoint[],
  width: number,
  height: number,
  key: StatKey,
): { solid: string; danger: string } {
  const solid: string[] = []
  const danger: string[] = []

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!
    const b = points[i + 1]!
    const d = `M${toX(a.week, width).toFixed(2)},${toY(a.stats[key], height).toFixed(2)} L${toX(
      b.week,
      width,
    ).toFixed(2)},${toY(b.stats[key], height).toFixed(2)}`
    const isDanger = a.stats[key] <= DANGER_THRESHOLD || b.stats[key] <= DANGER_THRESHOLD
    ;(isDanger ? danger : solid).push(d)
  }

  return { solid: solid.join(' '), danger: danger.join(' ') }
}

/** 属性在某一段是否踩到危险线（供图例显示 `!`） */
export function isDangerValue(value: number): boolean {
  return value <= DANGER_THRESHOLD
}

/**
 * 生长动画：只把最后一个点从上一个点插值到目标点（线性）。
 * from 必须比 to 少一个点，否则原样返回（重开一局等场景直接定格）。
 */
export function animatePoints(from: ChartPoint[], to: ChartPoint[], t: number): ChartPoint[] {
  if (to.length < 2) return to
  if (from.length !== to.length - 1) return to

  const prev = from[from.length - 1]!
  const target = to[to.length - 1]!
  const week = prev.week + (target.week - prev.week) * t
  const stats: Stats = { ...target.stats }
  for (const key of STAT_KEYS) {
    stats[key] = prev.stats[key] + (target.stats[key] - prev.stats[key]) * t
  }

  return [...to.slice(0, -1), { week, stats }]
}
