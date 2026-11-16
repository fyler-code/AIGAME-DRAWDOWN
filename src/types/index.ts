// ============ 基础 ============

export type StatKey = 'money' | 'spirit' | 'family' | 'career'

export type Stats = Record<StatKey, number>

/** 卡牌来源，决定视觉外壳 */
export type CardSource = 'wechat' | 'work' | 'family' | 'news' | 'inner'

export type MarketPhase = 'bull' | 'bear' | 'chop'

export type Choice = 'up' | 'down'

export type CardTag =
  | '公司'
  | '市场'
  | '家庭'
  | '宏观'
  | '荒诞'
  | '内心'
  | 'tutorial'
  | '仓位'

export type FlagKey =
  | 'compliance' // 合规风险 0..3
  | 'absent' // 缺席家庭次数
  | 'hot_streak' // 连续赚钱周数
  | 'insomnia' // 硬扛次数

export type CounterKey = 'mealsWithFamily' | 'promisesMade' | 'liesTold' | 'earlyNights'

export type CharacterId = 'trader' | 'fundManager' | 'hotMoney' | 'retail'

export type CharacterRuleId =
  | 'standard'
  | 'fourSlotsHarshBust'
  | 'fiveXHighDecay'
  | 'noPositionButWrongWay'

export type DeathCause = StatKey

// ============ 卡牌 ============

export interface Effect {
  /** 四属性增减，未出现的键视为 0 */
  money?: number
  spirit?: number
  family?: number
  career?: number
  /** flag 层数变化，delta 可为负 */
  flags?: Partial<Record<FlagKey, number>>
  /** 计数器变化，仅供结算页叙事 */
  counters?: Partial<Record<CounterKey, number>>
}

export interface CardOption {
  /** ≤ 4 字 */
  label: string
  effect: Effect
}

export interface CardCondition {
  /** 属性下限，全部满足才出现 */
  minStats?: Partial<Stats>
  /** 属性上限 */
  maxStats?: Partial<Stats>
  /** flag 达到某层才出现 */
  flagAtLeast?: Partial<Record<FlagKey, number>>
  /** 限定周次区间，闭区间 */
  weekRange?: readonly [number, number]
  /** 限定角色 */
  character?: CharacterId
}

export interface Card {
  /** 由文件名派生，禁止手写；见 loadCards.ts */
  readonly id: string
  /** 由文件名前缀派生，用于开发期定位 */
  readonly file: string

  from: CardSource
  /** ≤ 6 字 */
  speaker?: string
  /** ≤ 42 字 */
  text: string

  up: CardOption
  down: CardOption

  tags: CardTag[]
  weight: number

  /** 缺省 = 任何市况 */
  phase?: MarketPhase

  require?: CardCondition

  /** 全局只出现一次 */
  once?: boolean

  /** 非空表示这是仓位卡：选的 up 会开仓而非立即结算 */
  delay?: {
    /** 结算周期，单位周 */
    weeks: number
    leverage: 1 | 2
  }
}

// ============ 仓位 ============

export interface Position {
  readonly id: string
  readonly cardId: string
  /** 建仓时的市场指数 */
  readonly entryMarket: number
  /** 剩余周数，归零即结算 */
  weeksLeft: number
  readonly leverage: 1 | 2
  /** 已扣的保证金 */
  readonly margin: number
}

// ============ 局内状态 ============

export interface WeekLog {
  week: number
  cardId: string
  choice: Choice
  statsBefore: Stats
  statsAfter: Stats
  market: number
  delta: Partial<Stats>
}

export interface DeckState {
  /** 最近抽过的卡 id，长度上限 DEDUPE_WINDOW */
  recent: string[]
  /** 已消耗的 once 卡 */
  usedOnce: string[]
}

export interface RunState {
  readonly seed: number
  readonly characterId: CharacterId

  /** 0 = 未开始，1..52 = 第 N 周 */
  week: number

  stats: Stats

  /** 市场指数 0..100 */
  market: number

  flags: Record<FlagKey, number>
  counters: Record<CounterKey, number>

  positions: Position[]
  deck: DeckState

  /** 当前待决策的卡；null 表示需要抽卡 */
  current: Card | null

  history: WeekLog[]

  status: 'running' | 'over'
  deathCause: DeathCause | null

  peak: {
    money: number
    /** 达到峰值的周次 */
    week: number
  }
}

export interface RunOver {
  cause: DeathCause
  week: number
  stats: Stats
}

// ============ 角色 ============

export interface Character {
  readonly id: CharacterId
  readonly name: string
  readonly startStats: Stats
  readonly rule: CharacterRuleId
  /** 一句话描述，UI 展示用 */
  readonly blurb: string
}
