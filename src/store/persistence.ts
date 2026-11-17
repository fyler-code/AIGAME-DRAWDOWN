import type { CharacterId } from '@/types'

export interface MetaState {
  version: number
  unlockedCharacters: CharacterId[]
  seenCards: string[]
  achievements: string[]
}

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const META_KEY = 'drawdown.meta'
export const META_VERSION = 1

const CHARACTER_IDS: readonly CharacterId[] = ['trader', 'fundManager', 'hotMoney', 'retail']

export function defaultMeta(): MetaState {
  return {
    version: META_VERSION,
    unlockedCharacters: ['trader'],
    seenCards: [],
    achievements: [],
  }
}

function isCharacterId(v: unknown): v is CharacterId {
  return typeof v === 'string' && (CHARACTER_IDS as readonly string[]).includes(v)
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === 'string')
}

/** 读元进度：坏数据 / 缺字段 / 版本不符一律回落默认值，绝不抛 */
export function loadMeta(adapter: StorageAdapter): MetaState {
  try {
    const raw = adapter.getItem(META_KEY)
    if (!raw) return defaultMeta()

    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return defaultMeta()

    const meta = data as Partial<MetaState>
    if (meta.version !== META_VERSION) return defaultMeta()
    if (!isStringArray(meta.seenCards) || !isStringArray(meta.achievements)) return defaultMeta()
    if (
      !Array.isArray(meta.unlockedCharacters) ||
      !meta.unlockedCharacters.every(isCharacterId)
    ) {
      return defaultMeta()
    }

    return {
      version: META_VERSION,
      unlockedCharacters: meta.unlockedCharacters,
      seenCards: meta.seenCards,
      achievements: meta.achievements,
    }
  } catch {
    return defaultMeta()
  }
}

export function saveMeta(meta: MetaState, adapter: StorageAdapter): void {
  adapter.setItem(META_KEY, JSON.stringify(meta))
}

/** 内存适配器：供单测与 Node 环境使用 */
export function memoryAdapter(): StorageAdapter {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
  }
}

/** 浏览器适配器：隐私模式 / 配额满时静默失败，不让游戏崩 */
export function localStorageAdapter(): StorageAdapter {
  return {
    getItem(key) {
      try {
        if (typeof localStorage === 'undefined') return null
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    setItem(key, value) {
      try {
        if (typeof localStorage === 'undefined') return
        localStorage.setItem(key, value)
      } catch {
        // 忽略：Safari 隐私模式会抛，写不进去不影响本局
      }
    },
  }
}
