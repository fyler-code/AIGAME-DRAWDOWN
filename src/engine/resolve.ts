import type { Choice, RunState } from '@/types'
import { difficultyScale } from './difficulty'
import { applyCounters, applyEffect, applyFlags } from './effect'
import { finalize } from './over'

export function resolveCard(state: RunState, choice: Choice): RunState {
  if (state.status !== 'running') return state
  if (state.current === null) return state

  const card = state.current
  const option = choice === 'up' ? card.up : card.down
  const scale = difficultyScale(state.week)

  const { stats, delta } = applyEffect(state.stats, option.effect, scale)

  const peak = stats.money > state.peak.money ? { money: stats.money, week: state.week } : state.peak

  const next: RunState = {
    ...state,
    stats,
    flags: applyFlags(state.flags, option.effect),
    counters: applyCounters(state.counters, option.effect),
    peak,
    current: null,
    history: [
      ...state.history,
      {
        week: state.week,
        cardId: card.id,
        choice,
        statsBefore: state.stats,
        statsAfter: stats,
        market: state.market,
        delta,
      },
    ],
  }

  return finalize(next)
}
