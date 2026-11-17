import { describe, expect, it } from 'vitest'
import { drawCard } from '../draw'
import { EmptyPoolError } from '../errors'
import { drawSequence, makeCard, makeState } from './fixtures'

const pool40 = Array.from({ length: 40 }, (_, i) => makeCard({ id: `c${i}` }))
const pool16 = Array.from({ length: 16 }, (_, i) => makeCard({ id: `s${i}` }))

describe('抽卡', () => {
  it('15 张去重窗口内不重复', () => {
    const ids = drawSequence(makeState(), pool40, 15)

    expect(new Set(ids).size).toBe(15)
  })

  it('超过窗口可重复：16 张池抽 17 次，第 17 张必是重复卡', () => {
    const ids = drawSequence(makeState(), pool16, 17)

    expect(new Set(ids.slice(0, 16)).size).toBe(16)
    expect(ids.slice(0, 16)).toContain(ids[16])
  })

  it('once 卡抽过不再出现', () => {
    const onceCard = makeCard({ id: 'once', once: true, weight: 100 })
    const others = Array.from({ length: 5 }, (_, i) => makeCard({ id: `n${i}`, weight: 1 }))
    const ids = drawSequence(makeState(), [onceCard, ...others], 50)

    expect(ids.filter((id) => id === 'once')).toHaveLength(1)
  })

  it('once 卡用掉后，池子里只剩它时抛 EmptyPoolError', () => {
    const onceCard = makeCard({ id: 'only', once: true })
    const first = drawCard(makeState(), [onceCard])
    const cleared = { ...first, current: null, week: 1 }

    expect(() => drawCard(cleared, [onceCard])).toThrow(EmptyPoolError)
  })

  it('权重生效：100 : 1 的两张卡，抽样比例 > 20 : 1', () => {
    const heavy = makeCard({ id: 'heavy', weight: 100 })
    const light = makeCard({ id: 'light', weight: 1 })
    const counts: Record<string, number> = { heavy: 0, light: 0 }

    for (let week = 0; week < 1000; week++) {
      const s = drawCard(makeState({ week }), [heavy, light])
      counts[s.current!.id] = counts[s.current!.id]! + 1
    }

    expect(counts.heavy! + counts.light!).toBe(1000)
    expect(counts.heavy! / counts.light!).toBeGreaterThan(20)
  })

  it('空池抛 EmptyPoolError', () => {
    expect(() => drawCard(makeState(), [])).toThrow(EmptyPoolError)
  })

  it('条件全不满足时抛 EmptyPoolError（不静默跳过）', () => {
    const gated = [makeCard({ id: 'gated', require: { flagAtLeast: { compliance: 3 } } })]

    expect(() => drawCard(makeState(), gated)).toThrow(EmptyPoolError)
  })

  it('兜底逻辑：池子只有 8 张（小于窗口 15）也能连续抽 9 次', () => {
    const pool8 = Array.from({ length: 8 }, (_, i) => makeCard({ id: `p${i}` }))

    expect(() => drawSequence(makeState(), pool8, 9)).not.toThrow()
  })

  it('幂等：已有待决策卡时不重复抽', () => {
    const first = drawCard(makeState(), pool40)

    expect(drawCard(first, pool40)).toBe(first)
  })

  it('市况不匹配只降权、不排除；匹配的卡也在池里', () => {
    const bearCard = makeCard({ id: 'bear', phase: 'bear', weight: 100 })
    const anyCard = makeCard({ id: 'any', weight: 10 })

    const seenChop = new Set<string>()
    const seenBull = new Set<string>()
    for (let week = 0; week < 200; week++) {
      seenChop.add(drawCard(makeState({ week, market: 50 }), [bearCard, anyCard]).current!.id)
      seenBull.add(drawCard(makeState({ week, market: 70 }), [bearCard, anyCard]).current!.id)
    }

    expect(seenChop.has('bear')).toBe(true)
    expect(seenChop.has('any')).toBe(true)
    expect(seenBull.has('bear')).toBe(true)
  })
})
