import type { CharacterId, RunState } from '@/types'
import { CHARACTERS, MARKET_START, RUN_WEEKS } from '../constants/balance'

export function createRun(seed: number, characterId: CharacterId): RunState {
  const character = CHARACTERS[characterId]
  return {
    seed,
    characterId,
    week: 0,
    stats: { ...character.startStats },
    market: MARKET_START,
    flags: { compliance: 0, absent: 0, hot_streak: 0, insomnia: 0 },
    counters: { mealsWithFamily: 0, promisesMade: 0, liesTold: 0, earlyNights: 0 },
    positions: [],
    deck: { recent: [], usedOnce: [] },
    current: null,
    history: [],
    status: 'running',
    deathCause: null,
    peak: { money: character.startStats.money, week: 0 },
  }
}

export { RUN_WEEKS }
