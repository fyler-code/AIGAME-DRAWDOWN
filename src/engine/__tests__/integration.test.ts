import { describe, expect, it } from 'vitest'
import { advanceWeek } from '../advance'
import { createRun } from '../createRun'
import { drawCard } from '../draw'
import { isRunComplete, isRunOver } from '../over'
import { resolveCard } from '../resolve'
import { makeCard } from './fixtures'

/** 20 张同构卡：上滑净赚，下滑净亏。配"永远上滑"的策略，52 周必通关 */
const POOL = Array.from({ length: 20 }, (_, i) =>
  makeCard({
    id: `int-${i}`,
    up: { label: '上', effect: { money: 2, spirit: 1, family: 1, career: 1 } },
    down: { label: '下', effect: { money: -2, spirit: -1, family: -1, career: -1 } },
  }),
)

function play(seed: number) {
  let state = createRun(seed, 'trader')
  while (state.status === 'running') {
    state = advanceWeek(state)
    if (state.status !== 'running') break
    state = drawCard(state, POOL)
    state = resolveCard(state, 'up')
  }
  return state
}

describe('整局集成（回归总闸）', () => {
  it('固定 seed 跑满 52 周，history / 最终数值 / 死因锁定', () => {
    const state = play(1234)

    expect(state.history).toHaveLength(52)
    expect(state.week).toBe(53)
    expect(state.stats).toEqual({ money: 100, spirit: 96, family: 82, career: 100 })
    expect(state.deathCause).toBeNull()
    expect(isRunComplete(state)).toBe(true)
    expect(isRunOver(state)).toBeNull()
  })

  it('同 seed 两次运行，history 完全一致', () => {
    const a = play(1234)
    const b = play(1234)

    expect(a.history).toEqual(b.history)
    expect(a.stats).toEqual(b.stats)
  })
})
