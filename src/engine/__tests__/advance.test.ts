import { describe, expect, it } from 'vitest'
import { advanceWeek } from '../advance'
import { driftMarket } from '../market'
import { makeCard, makeState } from './fixtures'
import { resolveCard } from '../resolve'

describe('推进', () => {
  it('第 4 周家庭不衰减，第 5 周 −2', () => {
    const week4 = advanceWeek(makeState({ week: 3 }))
    expect(week4.week).toBe(4)
    expect(week4.stats.family).toBe(50)

    const week5 = advanceWeek(makeState({ week: 4 }))
    expect(week5.week).toBe(5)
    expect(week5.stats.family).toBe(48)
  })

  it('第 7 周精神不衰减，第 8 周 −1', () => {
    const week7 = advanceWeek(makeState({ week: 6 }))
    expect(week7.week).toBe(7)
    expect(week7.stats.spirit).toBe(50)

    const week8 = advanceWeek(makeState({ week: 7 }))
    expect(week8.week).toBe(8)
    expect(week8.stats.spirit).toBe(49)
  })

  it('第 10 周家庭再衰减一次（每 5 周重复生效）', () => {
    expect(advanceWeek(makeState({ week: 9 })).stats.family).toBe(48)
  })

  it('市场漂移 200 周恒在 [0, 100]', () => {
    let market = 50
    for (let week = 1; week <= 200; week++) {
      market = driftMarket(market, 42, week)
      expect(market).toBeGreaterThanOrEqual(0)
      expect(market).toBeLessThanOrEqual(100)
    }
  })

  it('市场漂移可复现', () => {
    expect(driftMarket(50, 7, 12)).toBe(driftMarket(50, 7, 12))
  })

  it('第 52 周推进到 53 即通关', () => {
    const next = advanceWeek(makeState({ week: 52 }))

    expect(next.week).toBe(53)
    expect(next.status).toBe('over')
    expect(next.deathCause).toBeNull()
  })

  it('衰减把属性打到 0 时立即结束', () => {
    const next = advanceWeek(makeState({ week: 4, stats: { money: 50, spirit: 50, family: 1, career: 50 } }))

    expect(next.status).toBe('over')
    expect(next.deathCause).toBe('family')
  })

  it('已结束时原样返回（不再推进周次）', () => {
    const over = resolveCard(
      makeState({ week: 1, current: makeCard({ id: 'x', up: { label: '上', effect: { money: -60 } } }) }),
      'up',
    )

    expect(advanceWeek(over)).toBe(over)
  })

  it('不修改入参', () => {
    const state = makeState({ week: 4 })
    const snapshot = structuredClone(state)

    advanceWeek(state)

    expect(state).toEqual(snapshot)
  })
})
