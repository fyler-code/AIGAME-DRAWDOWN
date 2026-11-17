import type { RunState } from '@/types'
import { describe, expect, it } from 'vitest'
import { difficultyScale } from '../difficulty'
import { applyCounters, applyEffect, applyFlags, clampStat } from '../effect'

const ZERO_FLAGS: RunState['flags'] = {
  compliance: 0,
  absent: 0,
  hot_streak: 0,
  insomnia: 0,
}
const ZERO_COUNTERS: RunState['counters'] = {
  mealsWithFamily: 0,
  promisesMade: 0,
  liesTold: 0,
  earlyNights: 0,
}

const base = { money: 90, spirit: 5, family: 50, career: 50 }

describe('截断', () => {
  it('90 + 20 → 100，不是 110', () => {
    const { stats } = applyEffect(base, { money: 20 }, 1)
    expect(stats.money).toBe(100)
  })

  it('5 − 20 → 0，不是 −15', () => {
    const { stats } = applyEffect(base, { spirit: -20 }, 1)
    expect(stats.spirit).toBe(0)
  })

  it('delta 记录截断后的实际变化（90 + 20 时 delta = 10）', () => {
    const { delta } = applyEffect(base, { money: 20 }, 1)
    expect(delta.money).toBe(10)
  })

  it('effect 为 0 时仍然写入 delta', () => {
    const { delta } = applyEffect(base, { money: 0 }, 1)
    expect(delta.money).toBe(0)
  })

  it('clampStat 两端兜底', () => {
    expect(clampStat(-5)).toBe(0)
    expect(clampStat(105)).toBe(100)
    expect(clampStat(37)).toBe(37)
  })
})

describe('难度缩放', () => {
  it('第 10 周 scale = 1.0', () => {
    expect(difficultyScale(10)).toBe(1)
  })

  it('第 50 周 scale = 1.4，effect 10 → 14', () => {
    expect(difficultyScale(50)).toBe(1.4)
    const { stats } = applyEffect({ money: 50, spirit: 50, family: 50, career: 50 }, { money: 10 }, 1.4)
    expect(stats.money).toBe(64)
  })

  it('第 53 周（越界）回落 1.0，不抛', () => {
    expect(difficultyScale(53)).toBe(1)
  })

  it('第 0 周也在 1.0 区间内', () => {
    expect(difficultyScale(0)).toBe(1)
  })
})

describe('flags / counters', () => {
  it('flags 累加且下限为 0', () => {
    const added = applyFlags(ZERO_FLAGS, { flags: { compliance: 1, absent: 2 } })
    expect(added.compliance).toBe(1)
    expect(added.absent).toBe(2)

    const clamped = applyFlags({ ...ZERO_FLAGS, compliance: 0 }, { flags: { compliance: -1 } })
    expect(clamped.compliance).toBe(0)
  })

  it('effect 没有 flags 时原样返回', () => {
    expect(applyFlags(ZERO_FLAGS, { money: 1 })).toBe(ZERO_FLAGS)
  })

  it('counters 累加且不受上下限约束', () => {
    const next = applyCounters(ZERO_COUNTERS, { counters: { mealsWithFamily: 1, liesTold: 2 } })
    expect(next.mealsWithFamily).toBe(1)
    expect(next.liesTold).toBe(2)

    const big = applyCounters(next, { counters: { liesTold: 1 } })
    expect(big.liesTold).toBe(3)
  })

  it('effect 没有 counters 时原样返回', () => {
    expect(applyCounters(ZERO_COUNTERS, { money: 1 })).toBe(ZERO_COUNTERS)
  })
})
