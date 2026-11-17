import type { RunState } from '@/types'
import {
  DECAY_FAMILY,
  DECAY_FAMILY_EVERY,
  DECAY_SPIRIT,
  DECAY_SPIRIT_EVERY,
} from '../constants/balance'
import { applyDelta } from './effect'
import { driftMarket } from './market'
import { finalize } from './over'

export function advanceWeek(state: RunState): RunState {
  if (state.status !== 'running') return state

  const week = state.week + 1
  let stats = { ...state.stats }

  // ① 自然衰减
  if (week % DECAY_FAMILY_EVERY === 0) stats = applyDelta(stats, 'family', DECAY_FAMILY)
  if (week % DECAY_SPIRIT_EVERY === 0) stats = applyDelta(stats, 'spirit', DECAY_SPIRIT)

  // ② 市场漂移
  const market = driftMarket(state.market, state.seed, week)

  // ③ 仓位到期结算 —— 本周不实现（S3-T04），positions 恒为空
  const next: RunState = { ...state, week, stats, market }

  return finalize(next)
}
