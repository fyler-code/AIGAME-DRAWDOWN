import { describe, expect, it } from 'vitest'
import {
  META_KEY,
  META_VERSION,
  defaultMeta,
  loadMeta,
  localStorageAdapter,
  memoryAdapter,
  saveMeta,
} from '../persistence'

describe('元进度持久化', () => {
  it('写入 → 读出往返一致', () => {
    const adapter = memoryAdapter()
    const meta = {
      version: META_VERSION,
      unlockedCharacters: ['trader', 'fundManager'] as const,
      seenCards: ['company-001', 'news-001'],
      achievements: ['first-bust'],
    }

    saveMeta({ ...meta, unlockedCharacters: [...meta.unlockedCharacters] }, adapter)

    expect(loadMeta(adapter)).toEqual({
      version: META_VERSION,
      unlockedCharacters: ['trader', 'fundManager'],
      seenCards: ['company-001', 'news-001'],
      achievements: ['first-bust'],
    })
  })

  it('坏 JSON 回落默认值，不抛', () => {
    const adapter = memoryAdapter()
    adapter.setItem(META_KEY, '{坏json')

    expect(() => loadMeta(adapter)).not.toThrow()
    expect(loadMeta(adapter)).toEqual(defaultMeta())
  })

  it('版本号不匹配回落默认值', () => {
    const adapter = memoryAdapter()
    adapter.setItem(META_KEY, JSON.stringify({ ...defaultMeta(), version: 999 }))

    expect(loadMeta(adapter)).toEqual(defaultMeta())
  })

  it('缺字段 / 字段类型不对回落默认值', () => {
    const adapter = memoryAdapter()

    adapter.setItem(META_KEY, JSON.stringify({ version: META_VERSION }))
    expect(loadMeta(adapter)).toEqual(defaultMeta())

    adapter.setItem(
      META_KEY,
      JSON.stringify({ version: META_VERSION, seenCards: 1, achievements: [], unlockedCharacters: [] }),
    )
    expect(loadMeta(adapter)).toEqual(defaultMeta())

    adapter.setItem(
      META_KEY,
      JSON.stringify({
        version: META_VERSION,
        seenCards: [],
        achievements: [],
        unlockedCharacters: ['nobody'],
      }),
    )
    expect(loadMeta(adapter)).toEqual(defaultMeta())
  })

  it('空存储返回默认值（默认只解锁交易员）', () => {
    expect(loadMeta(memoryAdapter())).toEqual(defaultMeta())
    expect(defaultMeta().unlockedCharacters).toEqual(['trader'])
  })

  it('Node 环境没有 localStorage 时读写都不抛', () => {
    const adapter = localStorageAdapter()

    expect(adapter.getItem(META_KEY)).toBeNull()
    expect(() => adapter.setItem(META_KEY, 'x')).not.toThrow()
  })
})
