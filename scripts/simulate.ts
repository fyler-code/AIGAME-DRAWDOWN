import { join } from 'node:path'
import type { Card, DeathCause, RunState, Stats } from '@/types'
import { RUN_WEEKS } from '../src/constants/balance'
import { loadCardsFromDisk } from '../src/content/loadCardsNode'
import { advanceWeek, createRun, drawCard, resolveCard } from '../src/engine/index'
import { greedy, random, type Strategy } from './strategies'

const STRATEGY_NAMES = ['greedy', 'random'] as const
type StrategyName = (typeof STRATEGY_NAMES)[number]

interface Args {
  runs: number
  seed: number
  strategy: StrategyName
  json: boolean
  verbose: boolean
  pool: string
}

interface RunResult {
  seed: number
  weeks: number
  cause: DeathCause | 'complete'
  finalStats: Stats
}

const STAT_LABEL: Record<DeathCause, string> = {
  money: '金钱',
  spirit: '精神',
  family: '家庭',
  career: '事业',
}

function fail(message: string): never {
  console.error(`✗ ${message}`)
  process.exit(1)
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    runs: 1,
    seed: 1,
    strategy: 'greedy',
    json: false,
    verbose: false,
    pool: join(process.cwd(), 'src/content/cards'),
  }

  for (const raw of argv) {
    if (!raw.startsWith('--')) continue
    const [key, value] = raw.slice(2).split('=')

    switch (key) {
      case 'runs':
        args.runs = Number(value)
        break
      case 'seed':
        args.seed = Number(value)
        break
      case 'strategy':
        if (!STRATEGY_NAMES.includes(value as StrategyName)) {
          fail(`未知策略：${value}（可选 ${STRATEGY_NAMES.join(' / ')}）`)
        }
        args.strategy = value as StrategyName
        break
      case 'json':
        args.json = true
        break
      case 'verbose':
        args.verbose = true
        break
      case 'pool':
        if (!value) fail('--pool 需要一个目录')
        args.pool = join(process.cwd(), value as string)
        break
      default:
        fail(`未知参数：--${key}`)
    }
  }

  if (!Number.isFinite(args.runs) || args.runs < 1) fail('--runs 必须是正整数')
  if (!Number.isFinite(args.seed)) fail('--seed 必须是数字')

  return args
}

function buildStrategy(name: StrategyName, seed: number): Strategy {
  return name === 'random' ? random(seed) : greedy
}

/** 单局：createRun → (advanceWeek → drawCard → resolveCard)* */
function playOne(
  seed: number,
  strategy: Strategy,
  pool: Card[],
): { state: RunState; result: RunResult } {
  let state = createRun(seed, 'trader')

  while (state.status === 'running') {
    state = advanceWeek(state)
    if (state.status !== 'running') break
    state = drawCard(state, pool)
    state = resolveCard(state, strategy(state, state.current!))
  }

  return {
    state,
    result: {
      seed,
      weeks: Math.min(state.week, RUN_WEEKS),
      cause: state.deathCause ?? 'complete',
      finalStats: state.stats,
    },
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[idx]!
}

function printSummary(results: RunResult[], elapsedMs: number): void {
  const total = results.length
  const weeks = results.map((r) => r.weeks).sort((a, b) => a - b)
  const avg = weeks.reduce((a, b) => a + b, 0) / total
  const complete = results.filter((r) => r.cause === 'complete').length

  const causes = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.cause] = (acc[r.cause] ?? 0) + 1
    return acc
  }, {})
  const pct = (n: number) => ((n / total) * 100).toFixed(1)

  console.log(`✓ ${total} 局 / ${(elapsedMs / 1000).toFixed(1)}s`)
  console.log(`平均存活 ${avg.toFixed(1)} 周   通关 ${pct(complete)}%`)
  console.log(
    `死因：${(['money', 'spirit', 'family', 'career'] as const)
      .map((cause) => `${STAT_LABEL[cause]} ${pct(causes[cause] ?? 0)}%`)
      .join('  ')}`,
  )
  console.log(
    `周次分位：P10=${percentile(weeks, 10)}  P25=${percentile(weeks, 25)}  P50=${percentile(
      weeks,
      50,
    )}  P75=${percentile(weeks, 75)}  P90=${percentile(weeks, 90)}`,
  )
}

function printRun(state: RunState, result: RunResult): void {
  const header = ['周', '卡 id', '选择', '金钱', '精神', '家庭', '事业', '市况']
  const rows = state.history.map((log) => [
    String(log.week),
    log.cardId,
    log.choice,
    String(log.statsAfter.money),
    String(log.statsAfter.spirit),
    String(log.statsAfter.family),
    String(log.statsAfter.career),
    log.market.toFixed(1),
  ])

  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((row) => (row[i] ?? '').length)),
  )
  const line = (cells: string[]) =>
    cells
      .map((cell, i) => cell.padEnd(widths[i]!))
      .join('  ')
      .trimEnd()

  console.log(`seed=${result.seed}`)
  console.log(line(header))
  for (const row of rows) console.log(line(row))

  if (result.cause === 'complete') {
    console.log(`\n结论：第 ${result.weeks} 周收盘，熬过这一年（通关）`)
  } else {
    console.log(`\n结论：第 ${result.weeks} 周 ${STAT_LABEL[result.cause]} 归零`)
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2))
  const pool = loadCardsFromDisk(args.pool)
  const strategy = buildStrategy(args.strategy, args.seed)

  const started = performance.now()
  const results: RunResult[] = []

  for (let i = 0; i < args.runs; i++) {
    const seed = args.seed + i
    let outcome: { state: RunState; result: RunResult }
    try {
      outcome = playOne(seed, strategy, pool)
    } catch (error) {
      // 不许吞异常：任何一局炸掉，整批统计都是假的
      console.error(`✗ seed=${seed} 运行失败：${(error as Error).message}`)
      process.exit(1)
    }
    results.push(outcome.result)
    if (args.verbose && !args.json) {
      if (args.runs > 1) console.log(`\n=== 第 ${i + 1} 局 ===`)
      printRun(outcome.state, outcome.result)
      if (args.runs > 1) console.log('')
    }
  }

  const elapsed = performance.now() - started

  if (args.json) {
    console.log(JSON.stringify(results, null, 2))
    return
  }

  if (args.runs > 1) {
    printSummary(results, elapsed)
  } else {
    const only = results[0]!
    console.log(
      `第 ${only.weeks} 周 ${only.cause === 'complete' ? '通关' : `${STAT_LABEL[only.cause]} 归零`}`,
    )
  }
}

main()
