import type { Card, RunState } from '@/types'
import { DEDUPE_WINDOW } from '../constants/balance'
import { meetsCondition } from './condition'
import { EmptyPoolError } from './errors'
import { marketPhaseOf } from './market'
import { rngFor } from './rng'

export type CardPool = readonly Card[]

/** 市况不匹配时的权重倍率 */
const PHASE_MISMATCH_FACTOR = 0.2

export function drawCard(state: RunState, pool: CardPool): RunState {
  if (state.current !== null) return state // 幂等：已有待决策卡不重复抽

  const phase = marketPhaseOf(state.market)
  const recent = new Set(state.deck.recent)
  const usedOnce = new Set(state.deck.usedOnce)

  const eligible = (c: Card) =>
    meetsCondition(state, c.require) && !usedOnce.has(c.id) && !recent.has(c.id)

  let candidates = pool.filter(eligible)

  // 兜底 1：去重窗口把池子抽干了 —— 只放开 recent，不放 once
  if (candidates.length === 0) {
    candidates = pool.filter((c) => meetsCondition(state, c.require) && !usedOnce.has(c.id))
  }
  // 兜底 2：还是没有 —— 抛错，不要静默返回 nil
  if (candidates.length === 0) throw new EmptyPoolError(state.week)

  const weights = candidates.map((c) =>
    c.phase && c.phase !== phase ? c.weight * PHASE_MISMATCH_FACTOR : c.weight,
  )
  const total = weights.reduce((a, b) => a + b, 0)
  const r = rngFor(state.seed, state.week, 13)()
  let acc = 0
  let picked = candidates[candidates.length - 1]!
  for (let i = 0; i < candidates.length; i++) {
    acc += weights[i]! / total
    if (r < acc) {
      picked = candidates[i]!
      break
    }
  }

  const nextRecent = [...state.deck.recent, picked.id].slice(-DEDUPE_WINDOW)
  const nextUsedOnce = picked.once ? [...state.deck.usedOnce, picked.id] : state.deck.usedOnce

  return {
    ...state,
    current: picked,
    deck: { recent: nextRecent, usedOnce: nextUsedOnce },
  }
}
