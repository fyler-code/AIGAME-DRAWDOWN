import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import yaml from 'js-yaml'
import type { Card } from '@/types'
import { CardValidationError } from './loadCards'
import { cardSchema } from './schema'

/**
 * Node 侧的卡牌加载：与 loadCards.ts 同一套 schema、id 派生规则与重复检测，
 * 只是数据源从 import.meta.glob 换成 fs。
 */
export function loadCardsFromDisk(dir: string): Card[] {
  const files = readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .sort()

  const cards: Card[] = []
  const seen = new Set<string>()

  for (const file of files) {
    const id = file.replace(/\.ya?ml$/, '')
    const path = join(dir, file)
    const parsed = cardSchema.safeParse(yaml.load(readFileSync(path, 'utf8')))
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      throw new CardValidationError(path, issues)
    }
    if (seen.has(id)) {
      throw new CardValidationError(path, [`卡牌 id 重复: ${id}`])
    }
    seen.add(id)
    cards.push({ ...parsed.data, id, file: path })
  }

  return cards
}
