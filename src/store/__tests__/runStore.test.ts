import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Card, Effect } from '@/types'
import { RESOLVE_LOCK_MS, useRunStore } from '../runStore'

function makeCard(id: string, up: Effect, down: Effect): Card {
  return {
    id,
    file: `cards/${id}.yaml`,
    from: 'work',
    text: '测试卡',
    tags: ['公司'],
    weight: 10,
    up: { label: '上', effect: up },
    down: { label: '下', effect: down },
  }
}

/** 20 张同构的"稳赚"卡：一路选上，能撑满 52 周 */
const GOOD: Card[] = Array.from({ length: 20 }, (_, i) =>
  makeCard(
    `good-${i}`,
    { money: 5, spirit: 5, family: 5, career: 5 },
    { money: -5, spirit: -5, family: -5, career: -5 },
  ),
)

const DEADLY = [makeCard('deadly', { money: -60 }, { money: -60 })]

function resetStore() {
  useRunStore.setState({
    pool: [],
    run: null,
    phase: 'idle',
    lastDelta: null,
    outcome: null,
    errorMessage: null,
  })
}

describe('runStore 状态机', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetStore()
    useRunStore.getState().setPool(GOOD)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    resetStore()
  })

  it('start：建局 → 第 1 周 → 有待决策卡', () => {
    useRunStore.getState().start('trader', 42)
    const state = useRunStore.getState()

    expect(state.phase).toBe('running')
    expect(state.run?.week).toBe(1)
    expect(state.run?.current).not.toBeNull()
  })

  it('start 防重入：running 期间再调一次不重开（StrictMode 双调安全）', () => {
    const store = useRunStore.getState()
    store.start('trader', 42)
    const firstRun = useRunStore.getState().run

    store.start('trader', 999)

    expect(useRunStore.getState().run).toBe(firstRun)
    expect(useRunStore.getState().run?.week).toBe(1)
  })

  it('commit：结算一张卡 → 周次 +1，结算锁到期后回到 running', () => {
    const store = useRunStore.getState()
    store.start('trader', 42)

    store.commit('up')
    expect(useRunStore.getState().run?.week).toBe(2)
    expect(useRunStore.getState().phase).toBe('resolving')
    expect(useRunStore.getState().lastDelta).not.toBeNull()

    vi.advanceTimersByTime(RESOLVE_LOCK_MS + 1)
    expect(useRunStore.getState().phase).toBe('running')
  })

  it('状态锁：resolving 期间 commit 一律无效', () => {
    const store = useRunStore.getState()
    store.start('trader', 42)
    store.setPhase('resolving')

    const before = useRunStore.getState().run
    store.commit('up')
    const after = useRunStore.getState()

    expect(after.run).toBe(before)
    expect(after.phase).toBe('resolving')
  })

  it('连点 10 次只生效 1 次（同步连发）', () => {
    const store = useRunStore.getState()
    store.start('trader', 42)

    for (let i = 0; i < 10; i++) store.commit('up')

    expect(useRunStore.getState().run?.week).toBe(2)
  })

  it('死亡：phase 变 over，outcome 记录死因与终值', () => {
    resetStore()
    useRunStore.getState().setPool(DEADLY)

    const store = useRunStore.getState()
    store.start('trader', 42)
    store.commit('up')

    const state = useRunStore.getState()
    expect(state.phase).toBe('over')
    expect(state.outcome?.kind).toBe('dead')
    expect(state.outcome?.cause).toBe('money')
    expect(state.outcome?.finalStats.money).toBe(0)
  })

  it('跑满 52 周：outcome 是通关，cause 为 null', () => {
    const store = useRunStore.getState()
    store.start('trader', 42)

    for (let week = 0; week < 52; week++) {
      store.commit('up')
      vi.advanceTimersByTime(RESOLVE_LOCK_MS + 1)
    }

    const state = useRunStore.getState()
    expect(state.phase).toBe('over')
    expect(state.outcome?.kind).toBe('complete')
    expect(state.outcome?.cause).toBeNull()
    expect(state.run?.history).toHaveLength(52)
  })

  it('卡池为空：start 进 error 而不是白屏', () => {
    resetStore()
    useRunStore.getState().start('trader', 42)

    const state = useRunStore.getState()
    expect(state.phase).toBe('error')
    expect(state.errorMessage).toBe('卡池为空')
  })

  it('backToIdle 清空对局与结果', () => {
    const store = useRunStore.getState()
    store.start('trader', 42)
    store.commit('up')
    store.backToIdle()

    const state = useRunStore.getState()
    expect(state.phase).toBe('idle')
    expect(state.run).toBeNull()
    expect(state.outcome).toBeNull()
    expect(state.lastDelta).toBeNull()
  })
})
