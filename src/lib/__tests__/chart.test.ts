import { describe, expect, it } from 'vitest'
import type { RunState, Stats } from '@/types'
import { createRun } from '@/engine'
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  animatePoints,
  buildChartPoints,
  polylinePath,
  segmentPaths,
  toX,
  toY,
} from '../chart'

const stats = (money: number, spirit = 50, family = 50, career = 50): Stats => ({
  money,
  spirit,
  family,
  career,
})

const base = createRun(1, 'trader')

describe('曲线取点', () => {
  it('第 1 周：week 0 锚点 + 当前实时态，共 2 点，四条都在 50', () => {
    const run: RunState = { ...base, week: 1, stats: stats(50) }
    const points = buildChartPoints(run)

    expect(points).toHaveLength(2)
    expect(points[0]).toEqual({ week: 0, stats: { money: 50, spirit: 50, family: 50, career: 50 } })
    expect(points[1]!.week).toBe(1)
  })

  it('history 的每个点按周次顺序进入曲线', () => {
    const run: RunState = {
      ...base,
      week: 3,
      stats: stats(60),
      history: [
        { week: 1, cardId: 'a', choice: 'up', statsBefore: stats(50), statsAfter: stats(52), market: 50, delta: { money: 2 } },
        { week: 2, cardId: 'b', choice: 'down', statsBefore: stats(52), statsAfter: stats(56), market: 50, delta: { money: 4 } },
        { week: 3, cardId: 'c', choice: 'up', statsBefore: stats(56), statsAfter: stats(60), market: 50, delta: { money: 4 } },
      ],
    }
    const points = buildChartPoints(run)

    expect(points.map((p) => p.week)).toEqual([0, 1, 2, 3])
    expect(points[2]!.stats.money).toBe(56)
  })

  it('当前周比最后一个 history 大时追加实时态（衰减可见）', () => {
    const run: RunState = {
      ...base,
      week: 6,
      stats: stats(50, 50, 44, 50),
      history: [
        { week: 5, cardId: 'a', choice: 'up', statsBefore: stats(50), statsAfter: stats(50, 50, 46, 50), market: 50, delta: { family: 1 } },
      ],
    }
    const points = buildChartPoints(run)

    expect(points).toHaveLength(3)
    expect(points[2]).toEqual({ week: 6, stats: stats(50, 50, 44, 50) })
  })

  it('当前周与最后一个 history 同周时不重复追加', () => {
    const run: RunState = {
      ...base,
      week: 5,
      stats: stats(50),
      history: [
        { week: 5, cardId: 'a', choice: 'up', statsBefore: stats(50), statsAfter: stats(50), market: 50, delta: {} },
      ],
    }

    expect(buildChartPoints(run)).toHaveLength(2)
  })
})

describe('坐标映射（固定 0–52 × 0–100）', () => {
  it('toX：0 → 0，52 → width，26 → 一半', () => {
    expect(toX(0, CHART_WIDTH)).toBe(0)
    expect(toX(52, CHART_WIDTH)).toBe(CHART_WIDTH)
    expect(toX(26, CHART_WIDTH)).toBe(CHART_WIDTH / 2)
  })

  it('toY：0 在底部，100 在顶部，50 在中线', () => {
    expect(toY(0, CHART_HEIGHT)).toBe(CHART_HEIGHT)
    expect(toY(100, CHART_HEIGHT)).toBe(0)
    expect(toY(50, CHART_HEIGHT)).toBe(CHART_HEIGHT / 2)
  })

  it('toY 越界时截断在 0 与 100', () => {
    expect(toY(140, CHART_HEIGHT)).toBe(0)
    expect(toY(-20, CHART_HEIGHT)).toBe(CHART_HEIGHT)
  })
})

describe('路径生成', () => {
  it('polylinePath：首点 M，其余 L，点数 - 1 个 L', () => {
    const points = [
      { week: 0, stats: stats(50) },
      { week: 1, stats: stats(60) },
      { week: 2, stats: stats(40) },
    ]
    const d = polylinePath(points, CHART_WIDTH, CHART_HEIGHT, 'money')

    expect(d.startsWith('M')).toBe(true)
    expect(d.match(/L/g)).toHaveLength(2)
  })

  it('危险段（任一端 ≤ 20）单独拆出来画虚线', () => {
    const points = [
      { week: 0, stats: stats(80) },
      { week: 1, stats: stats(60) },
      { week: 2, stats: stats(15) },
    ]
    const { solid, danger } = segmentPaths(points, CHART_WIDTH, CHART_HEIGHT, 'money')

    expect(danger.split('M')).toHaveLength(2) // 1 段 = 1 个 M
    expect(solid.split('M')).toHaveLength(2) // 另一段实线
  })
})

describe('生长动画', () => {
  const from = [
    { week: 0, stats: stats(50) },
    { week: 1, stats: stats(60) },
  ]
  const to = [
    { week: 0, stats: stats(50) },
    { week: 1, stats: stats(60) },
    { week: 2, stats: stats(70) },
  ]

  it('t = 0 时停在上一周的点', () => {
    const mid = animatePoints(from, to, 0)

    expect(mid).toHaveLength(3)
    expect(mid[2]!.week).toBe(1)
    expect(mid[2]!.stats.money).toBe(60)
  })

  it('t = 1 时等于目标点', () => {
    expect(animatePoints(from, to, 1)[2]).toEqual(to[2])
  })

  it('t = 0.5 时插值到中点', () => {
    const mid = animatePoints(from, to, 0.5)

    expect(mid[2]!.week).toBe(1.5)
    expect(mid[2]!.stats.money).toBe(65)
  })

  it('点数不连续（重开一局）时直接定格', () => {
    expect(animatePoints(to, from, 0.5)).toBe(from)
  })
})
