import type { CardCondition, RunState } from '@/types'
import { STAT_KEYS } from './effect'

export function meetsCondition(state: RunState, cond?: CardCondition): boolean {
  if (!cond) return true

  if (cond.minStats) {
    for (const k of STAT_KEYS) {
      const v = cond.minStats[k]
      if (v !== undefined && state.stats[k] < v) return false
    }
  }
  if (cond.maxStats) {
    for (const k of STAT_KEYS) {
      const v = cond.maxStats[k]
      if (v !== undefined && state.stats[k] > v) return false
    }
  }
  if (cond.flagAtLeast) {
    for (const [k, v] of Object.entries(cond.flagAtLeast)) {
      if (v === undefined) continue
      if (state.flags[k as keyof RunState['flags']] < v) return false
    }
  }
  if (cond.weekRange) {
    const [from, to] = cond.weekRange
    if (state.week < from || state.week > to) return false
  }
  if (cond.character && state.characterId !== cond.character) return false

  return true
}
