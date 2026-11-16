import { describe, expect, it } from 'vitest'
import { loadCards } from '@/content/loadCards'

describe('loadCards', () => {
  it('加载 5 张样例卡，并注入 id / file', () => {
    const cards = loadCards()

    expect(cards).toHaveLength(5)
    expect(new Set(cards.map((card) => card.id)).size).toBe(5)
    expect(cards.every((card) => card.file.endsWith('.yaml'))).toBe(true)
  })

  it('company-002 的 require.flagAtLeast.compliance 被正确解析', () => {
    const card = loadCards().find((c) => c.id === 'company-002')

    expect(card?.require?.flagAtLeast?.compliance).toBe(1)
  })

  it('company-003 的 require.weekRange 被正确解析', () => {
    const card = loadCards().find((c) => c.id === 'company-003')

    expect(card?.require?.weekRange).toEqual([40, 52])
  })
})
