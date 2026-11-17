import type { Card, CardOption, Effect, RunState } from '@/types'
import { createRun } from '../createRun'
import { drawCard } from '../draw'

/** 造一张测试卡：字段有合理默认值，只覆盖关心的部分 */
export function makeCard({ id, ...over }: Partial<Card> & { id: string }): Card {
  return {
    ...over,
    id,
    file: `cards/${id}.yaml`,
    from: over.from ?? 'work',
    text: over.text ?? '测试卡',
    tags: over.tags ?? ['公司'],
    weight: over.weight ?? 10,
    up: over.up ?? { label: '上', effect: { career: 1 } },
    down: over.down ?? { label: '下', effect: { career: -1 } },
  }
}

export function makeOption(label: string, effect: Effect): CardOption {
  return { label, effect }
}

/** 造一个局内状态：默认交易员、第 0 周、四项 50 */
export function makeState(over: Partial<RunState> = {}): RunState {
  return { ...createRun(1, 'trader'), ...over }
}

/** 连抽 n 次（每次清空 current 并推进一周），返回抽到的 id 序列 */
export function drawSequence(state: RunState, pool: readonly Card[], n: number): string[] {
  let s = state
  const ids: string[] = []
  for (let i = 0; i < n; i++) {
    s = drawCard(s, pool)
    ids.push(s.current!.id)
    s = { ...s, current: null, week: s.week + 1 }
  }
  return ids
}
