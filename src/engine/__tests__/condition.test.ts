import { describe, expect, it } from 'vitest'
import { meetsCondition } from '../condition'
import { makeState } from './fixtures'

const state = makeState({
  stats: { money: 50, spirit: 50, family: 50, career: 50 },
  week: 40,
})

describe('条件判定', () => {
  it('minStats：等于时通过，低于时失败', () => {
    expect(meetsCondition(state, { minStats: { money: 50 } })).toBe(true)
    expect(meetsCondition(state, { minStats: { money: 51 } })).toBe(false)
  })

  it('maxStats：等于时通过，高于时失败', () => {
    expect(meetsCondition(state, { maxStats: { money: 50 } })).toBe(true)
    expect(meetsCondition(state, { maxStats: { money: 49 } })).toBe(false)
  })

  it('flagAtLeast：层级相等时通过', () => {
    const withFlag = makeState({ flags: { ...state.flags, compliance: 1 } })
    expect(meetsCondition(withFlag, { flagAtLeast: { compliance: 1 } })).toBe(true)
    expect(meetsCondition(withFlag, { flagAtLeast: { compliance: 2 } })).toBe(false)
    expect(meetsCondition(state, { flagAtLeast: { compliance: 1 } })).toBe(false)
  })

  it('weekRange 是闭区间：39 否 / 40 是 / 52 是 / 53 否', () => {
    const cond = { weekRange: [40, 52] as const }
    expect(meetsCondition(makeState({ week: 39 }), cond)).toBe(false)
    expect(meetsCondition(makeState({ week: 40 }), cond)).toBe(true)
    expect(meetsCondition(makeState({ week: 52 }), cond)).toBe(true)
    expect(meetsCondition(makeState({ week: 53 }), cond)).toBe(false)
  })

  it('character 限定：其他角色时为 false', () => {
    expect(meetsCondition(state, { character: 'trader' })).toBe(true)
    expect(meetsCondition(state, { character: 'retail' })).toBe(false)
  })

  it('空条件恒为 true', () => {
    expect(meetsCondition(state, undefined)).toBe(true)
    expect(meetsCondition(state, {})).toBe(true)
  })
})
