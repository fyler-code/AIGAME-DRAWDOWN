import type { RunOver, RunState, StatKey } from '@/types'
import { RUN_WEEKS } from '../constants/balance'

/** 同时归零时的死因优先级 */
const CAUSE_PRIORITY: readonly StatKey[] = ['money', 'spirit', 'family', 'career']

/** 检查死亡 / 通关，返回新的 state（会改 status 与 deathCause） */
export function finalize(state: RunState): RunState {
  if (state.status === 'over') return state

  for (const key of CAUSE_PRIORITY) {
    if (state.stats[key] <= 0) {
      return { ...state, status: 'over', deathCause: key }
    }
  }

  if (state.week > RUN_WEEKS) {
    // 通关：status=over 但 deathCause 保持 null
    return { ...state, status: 'over', deathCause: null }
  }

  return state
}

/** 仅在"死亡"时返回非 null；通关不返回（见 isRunComplete） */
export function isRunOver(state: RunState): RunOver | null {
  if (state.status !== 'over' || state.deathCause === null) return null
  return { cause: state.deathCause, week: state.week, stats: state.stats }
}

/** 通关判定：跑满 52 周且四项均 > 0 */
export function isRunComplete(state: RunState): boolean {
  return state.status === 'over' && state.deathCause === null
}
