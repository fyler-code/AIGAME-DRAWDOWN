import type { Character, CharacterId, Stats } from '@/types'

export const STAT_MIN = 0
export const STAT_MAX = 100
export const STAT_START = 50
export const RUN_WEEKS = 52
export const DEDUPE_WINDOW = 15

/** 危险线 */
export const DANGER_THRESHOLD = 20
/** 濒死线 */
export const CRITICAL_THRESHOLD = 5

/** 仓位 */
export const POSITION_SLOTS = 3
export const POSITION_MARGIN = 15
export const POSITION_PAYOFF_FACTOR = 1.2
export const POSITION_MIN_SETTLE = -45
export const POSITION_MAX_SETTLE = 60
export const BUST_THRESHOLD = -30
export const BUST_SPIRIT_PENALTY = -15
export const LEVERAGE_MIN_MONEY = 20

/** 市场 */
export const MARKET_START = 50
export const MARKET_BULL = 62
export const MARKET_BEAR = 38
export const MARKET_DRIFT_MAX = 4
export const MARKET_REGRESSION_BAND = 80

/** 自然衰减 */
export const DECAY_FAMILY_EVERY = 5
export const DECAY_FAMILY = -2
export const DECAY_SPIRIT_EVERY = 8
export const DECAY_SPIRIT = -1

/** 难度阶段：按周次区间缩放 effect */
export const DIFFICULTY_PHASES = [
  { fromWeek: 1, toWeek: 12, scale: 1.0 },
  { fromWeek: 13, toWeek: 30, scale: 1.0 },
  { fromWeek: 31, toWeek: 45, scale: 1.0 },
  { fromWeek: 46, toWeek: 52, scale: 1.4 },
] as const

export const INITIAL_STATS: Stats = {
  money: STAT_START,
  spirit: STAT_START,
  family: STAT_START,
  career: STAT_START,
}

export const CHARACTERS: Record<CharacterId, Character> = {
  trader: {
    id: 'trader',
    name: '交易员',
    startStats: { money: 50, spirit: 50, family: 50, career: 50 },
    rule: 'standard',
    blurb: '标准人生。四根条，五十二周。',
  },
  fundManager: {
    id: 'fundManager',
    name: '基金经理',
    startStats: { money: 80, spirit: 40, family: 30, career: 60 },
    rule: 'fourSlotsHarshBust',
    blurb: '四个仓位槽，但爆仓的两倍代价。',
  },
  hotMoney: {
    id: 'hotMoney',
    name: '游资',
    startStats: { money: 30, spirit: 60, family: 40, career: 40 },
    rule: 'fiveXHighDecay',
    blurb: '杠杆拉到五倍。家里的事，掉得更快。',
  },
  retail: {
    id: 'retail',
    name: '散户',
    startStats: { money: 60, spirit: 50, family: 55, career: 25 },
    rule: 'noPositionButWrongWay',
    blurb: '没有仓位。但每十张卡，有一次看反了。',
  },
}
