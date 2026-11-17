import type { MarketPhase } from '@/types'
import { MARKET_BEAR, MARKET_BULL, MARKET_DRIFT_MAX } from '../constants/balance'
import { rngFor } from './rng'

export function marketPhaseOf(market: number): MarketPhase {
  if (market > MARKET_BULL) return 'bull'
  if (market < MARKET_BEAR) return 'bear'
  return 'chop'
}

/**
 * 市场漂移：基础在 [-4, +4]，带均值回归
 * M > 80 时偏向下，M < 20 时偏向上
 */
export function driftMarket(market: number, seed: number, week: number): number {
  const r = rngFor(seed, week, 7)
  let raw = (r() * 2 - 1) * MARKET_DRIFT_MAX
  if (market > 80) raw -= 1.5
  if (market < 20) raw += 1.5
  return Math.min(100, Math.max(0, market + raw))
}
