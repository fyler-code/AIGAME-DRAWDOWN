import type { Card, Choice, Effect, RunState, StatKey } from '@/types'
import { rngFor } from '../src/engine/rng'

export type Strategy = (state: RunState, card: Card) => Choice

const STAT_KEYS: readonly StatKey[] = ['money', 'spirit', 'family', 'career']

const net = (e: Effect): number =>
  (e.money ?? 0) + (e.spirit ?? 0) + (e.family ?? 0) + (e.career ?? 0)

/** 贪心：选四属性变化之和更大的那边；相同时优先补最低属性 */
export const greedy: Strategy = (state, card) => {
  const upScore = net(card.up.effect)
  const downScore = net(card.down.effect)
  if (upScore !== downScore) return upScore > downScore ? 'up' : 'down'

  const lowest = STAT_KEYS.reduce((a, b) => (state.stats[b] < state.stats[a] ? b : a))
  const upLow = card.up.effect[lowest] ?? 0
  const downLow = card.down.effect[lowest] ?? 0
  return upLow >= downLow ? 'up' : 'down'
}

/** 随机：用 (seed, week) 派生，保证可复现 */
export const random =
  (seed: number): Strategy =>
  (state) =>
    rngFor(seed, state.week, 17)() < 0.5 ? 'up' : 'down'

export const STRATEGIES = { greedy, random } as const
