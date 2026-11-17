import type { Effect, RunState, Stats, StatKey } from '@/types'
import { STAT_MAX, STAT_MIN } from '../constants/balance'

export const STAT_KEYS: readonly StatKey[] = ['money', 'spirit', 'family', 'career']

export function clampStat(v: number): number {
  return Math.min(STAT_MAX, Math.max(STAT_MIN, v))
}

/** 对单条属性应用一次增减，自动截断；溢出部分直接丢弃 */
export function applyDelta(stats: Stats, key: StatKey, delta: number): Stats {
  return { ...stats, [key]: clampStat(stats[key] + delta) }
}

/** 应用一张卡的 effect；scale 为难度系数，只作用于四属性，不作用于 flags/counters */
export function applyEffect(
  stats: Stats,
  effect: Effect,
  scale: number,
): {
  stats: Stats
  delta: Partial<Stats>
} {
  const next = { ...stats }
  const delta: Partial<Stats> = {}
  for (const key of STAT_KEYS) {
    const raw = effect[key]
    if (raw === undefined) continue
    const scaled = Math.round(raw * scale)
    const before = next[key]
    next[key] = clampStat(before + scaled)
    delta[key] = next[key] - before // 记录的是截断后的实际变化
  }
  return { stats: next, delta }
}

export function applyFlags(flags: RunState['flags'], effect: Effect): RunState['flags'] {
  if (!effect.flags) return flags
  const next = { ...flags }
  for (const [k, v] of Object.entries(effect.flags)) {
    if (v === undefined) continue
    const key = k as keyof RunState['flags']
    next[key] = Math.max(0, next[key] + v)
  }
  return next
}

export function applyCounters(
  counters: RunState['counters'],
  effect: Effect,
): RunState['counters'] {
  if (!effect.counters) return counters
  const next = { ...counters }
  for (const [k, v] of Object.entries(effect.counters)) {
    if (v === undefined) continue
    const key = k as keyof RunState['counters']
    next[key] = next[key] + v
  }
  return next
}
