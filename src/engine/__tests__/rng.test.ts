import { describe, expect, it } from 'vitest'
import { mulberry32, rngFor } from '../rng'

describe('rng', () => {
  it('同 seed 同序列', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const seqA = [a(), a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b(), b()]

    expect(seqA).toEqual(seqB)
  })

  it('不同 seed 不同序列', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })

  it('值域恒在 [0, 1)', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('rngFor 由 (seed, week, salt) 派生，可复现且互不干扰', () => {
    expect(rngFor(1, 10, 7)()).toBe(rngFor(1, 10, 7)())
    expect(rngFor(1, 10, 7)()).not.toBe(rngFor(1, 10, 13)())
    expect(rngFor(1, 10, 7)()).not.toBe(rngFor(2, 10, 7)())
  })
})
