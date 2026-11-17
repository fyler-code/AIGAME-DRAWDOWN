import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadCards } from '@/content/loadCards'
import { loadCardsFromDisk } from '@/content/loadCardsNode'

const CARDS_DIR = fileURLToPath(new URL('../cards', import.meta.url))

describe('loadCards', () => {
  it('加载全部卡牌，id 唯一，path 已注入', () => {
    const cards = loadCards()

    expect(cards.length).toBeGreaterThanOrEqual(20)
    expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length)
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

describe('loadCardsFromDisk 与 loadCards 同源', () => {
  it('两条加载路径得到同一批卡（id 集合与内容一致）', () => {
    const fromGlob = loadCards()
    const fromDisk = loadCardsFromDisk(CARDS_DIR)

    const byId = (cards: typeof fromGlob) =>
      [...cards].sort((a, b) => a.id.localeCompare(b.id)).map((card) => ({ ...card, file: '' }))

    expect(fromDisk.map((c) => c.id).sort()).toEqual(fromGlob.map((c) => c.id).sort())
    expect(byId(fromDisk)).toEqual(byId(fromGlob))
  })
})
