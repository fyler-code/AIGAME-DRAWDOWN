import { DIFFICULTY_PHASES } from '../constants/balance'

export function difficultyScale(week: number): number {
  for (const p of DIFFICULTY_PHASES) {
    if (week >= p.fromWeek && week <= p.toWeek) return p.scale
  }
  return 1.0
}
