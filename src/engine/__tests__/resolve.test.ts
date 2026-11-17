import type { Card } from '@/types'
import { describe, expect, it } from 'vitest'
import { advanceWeek } from '../advance'
import { isRunComplete, isRunOver } from '../over'
import { resolveCard } from '../resolve'
import { makeCard, makeState } from './fixtures'

const swapCard: Card = makeCard({
  id: 'swap',
  up: { label: '上', effect: { money: 10, spirit: -5 } },
  down: { label: '下', effect: { money: -10, spirit: 5 } },
})

describe('结算', () => {
  it('up / down 分别应用，方向正确', () => {
    const state = makeState({ week: 1, current: swapCard })

    const up = resolveCard(state, 'up')
    expect(up.stats.money).toBe(60)
    expect(up.stats.spirit).toBe(45)

    const down = resolveCard(state, 'down')
    expect(down.stats.money).toBe(40)
    expect(down.stats.spirit).toBe(55)
  })

  it('归零即结束，deathCause 正确', () => {
    const card = makeCard({ id: 'dead', up: { label: '上', effect: { money: -60 } } })
    const next = resolveCard(makeState({ week: 3, current: card }), 'up')

    expect(next.status).toBe('over')
    expect(next.deathCause).toBe('money')
    expect(isRunOver(next)).toEqual({ cause: 'money', week: 3, stats: next.stats })
  })

  it('金钱与精神同时归零时，死因优先取金钱', () => {
    const card = makeCard({
      id: 'double',
      up: { label: '上', effect: { money: -60, spirit: -60 } },
    })
    const next = resolveCard(makeState({ week: 3, current: card }), 'up')

    expect(next.deathCause).toBe('money')
  })

  it('写 history：卡 id、选择、前后数值、市况、delta', () => {
    const state = makeState({ week: 5, market: 66, current: swapCard })
    const next = resolveCard(state, 'up')
    const log = next.history[0]!

    expect(next.history).toHaveLength(1)
    expect(log.week).toBe(5)
    expect(log.cardId).toBe('swap')
    expect(log.choice).toBe('up')
    expect(log.statsBefore).toEqual(state.stats)
    expect(log.statsAfter).toEqual(next.stats)
    expect(log.market).toBe(66)
    expect(log.delta).toEqual({ money: 10, spirit: -5 })
    expect(next.current).toBeNull()
  })

  it('peak 只在金钱创新高时更新', () => {
    const state = makeState({ week: 3, current: swapCard })
    expect(resolveCard(state, 'up').peak).toEqual({ money: 60, week: 3 })
    expect(resolveCard(state, 'down').peak).toEqual({ money: 50, week: 0 })
  })

  it('第 52 周跑满即通关：isRunComplete 为 true、isRunOver 为 null', () => {
    const state = makeState({ week: 52, current: swapCard })
    const afterCard = resolveCard(state, 'up')
    const afterWeek = advanceWeek(afterCard)

    expect(isRunComplete(afterWeek)).toBe(true)
    expect(isRunOver(afterWeek)).toBeNull()
    expect(afterWeek.status).toBe('over')
    expect(afterWeek.deathCause).toBeNull()
  })

  it('已结束时再结算原样返回', () => {
    const over = resolveCard(
      makeState({ week: 1, current: makeCard({ id: 'x', up: { label: '上', effect: { money: -60 } } }) }),
      'up',
    )

    expect(resolveCard(over, 'up')).toBe(over)
  })

  it('没有待决策卡时原样返回', () => {
    const state = makeState({ week: 1, current: null })

    expect(resolveCard(state, 'up')).toBe(state)
  })

  it('不修改入参（同一 state 乱序调用两次结果一致）', () => {
    const state = makeState({ week: 7, current: swapCard })
    const snapshot = structuredClone(state)

    const first = resolveCard(state, 'up')
    const second = resolveCard(state, 'up')

    expect(state).toEqual(snapshot)
    expect(first).toEqual(second)
  })
})
