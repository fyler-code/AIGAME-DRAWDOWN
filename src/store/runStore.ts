import { create } from 'zustand'
import type { Card, CharacterId, Choice, RunState, Stats } from '@/types'
import { EmptyPoolError, advanceWeek, createRun, drawCard, resolveCard } from '@/engine'

export type Phase = 'idle' | 'running' | 'swiping' | 'resolving' | 'over' | 'error'

export interface Outcome {
  kind: 'dead' | 'complete'
  cause: keyof Stats | null
  week: number
  finalStats: Stats
}

interface RunStore {
  pool: Card[]
  run: RunState | null
  phase: Phase
  /** 最近一次结算的实际变化量，供图例做 ▲▼ 闪烁 */
  lastDelta: Partial<Stats> | null
  outcome: Outcome | null
  errorMessage: string | null

  setPool(pool: Card[]): void
  start(characterId: CharacterId, seed?: number): void
  commit(choice: Choice): void
  backToIdle(): void
  setPhase(phase: Phase): void
}

/**
 * 结算锁：resolve 完成后 phase 仍是 resolving，锁 320ms 再放开。
 * 这段时间正好是曲线的生长动画，连点/连按都会被丢掉；
 * 没有它，一次快速连点会把周次连推好几周（S2 验收 B1/B2）。
 */
export const RESOLVE_LOCK_MS = 320

let unlockTimer: ReturnType<typeof setTimeout> | null = null

function clearUnlockTimer(): void {
  if (unlockTimer !== null) {
    clearTimeout(unlockTimer)
    unlockTimer = null
  }
}

function scheduleUnlock(): void {
  clearUnlockTimer()
  unlockTimer = setTimeout(() => {
    unlockTimer = null
    const store = useRunStore.getState()
    if (store.phase === 'resolving') {
      useRunStore.setState({ phase: 'running' })
    }
  }, RESOLVE_LOCK_MS)
}

function finish(run: RunState): void {
  clearUnlockTimer()
  useRunStore.setState({
    run,
    phase: 'over',
    outcome: {
      kind: run.deathCause === null ? 'complete' : 'dead',
      cause: run.deathCause,
      week: run.week,
      finalStats: run.stats,
    },
  })
}

export const useRunStore = create<RunStore>()((set, get) => ({
  pool: [],
  run: null,
  phase: 'idle',
  lastDelta: null,
  outcome: null,
  errorMessage: null,

  setPool: (pool) => set({ pool }),

  start: (characterId, seed = Date.now() % 0x7fffffff) => {
    const s = get()
    // 防重入必须写在第一行：StrictMode 会把 effect 调两次
    if (s.phase === 'running' || s.phase === 'swiping' || s.phase === 'resolving') return
    if (s.pool.length === 0) {
      set({ phase: 'error', errorMessage: '卡池为空' })
      return
    }
    try {
      let run = createRun(seed, characterId)
      run = advanceWeek(run) // week 0 → 1
      run = drawCard(run, s.pool)
      set({ run, phase: 'running', lastDelta: null, outcome: null, errorMessage: null })
    } catch (e) {
      set({ phase: 'error', errorMessage: String(e) })
    }
  },

  commit: (choice) => {
    const s = get()
    // ① 状态锁：只有 running / swiping 可以提交。
    //    swiping 也必须放行——pointerdown 已经把 phase 改成 swiping 了
    if (s.phase !== 'running' && s.phase !== 'swiping') return
    if (!s.run || s.run.current === null) return

    set({ phase: 'resolving' })
    clearUnlockTimer()

    try {
      // ② 结算这张卡
      let run = resolveCard(s.run, choice)

      if (run.status === 'over') {
        finish(run)
        return
      }

      // ③ 进入下一周：衰减 + 市场漂移
      run = advanceWeek(run)

      if (run.status === 'over') {
        // 被自然衰减扣死的，最后一个 history 是上一张卡
        finish(run)
        return
      }

      // ④ 抽下一张
      run = drawCard(run, s.pool)

      const last = run.history[run.history.length - 1]
      set({
        run,
        lastDelta: last ? last.delta : null,
      })
      // phase 保持 resolving，等结算锁到期再放开输入
      scheduleUnlock()
    } catch (e) {
      const msg = e instanceof EmptyPoolError ? e.message : String(e)
      set({ phase: 'error', errorMessage: msg })
    }
  },

  backToIdle: () => {
    clearUnlockTimer()
    set({ run: null, phase: 'idle', lastDelta: null, outcome: null, errorMessage: null })
  },

  setPhase: (phase) => set({ phase }),
}))
