import yaml from 'js-yaml'
import type { Card } from '@/types'
import { cardSchema } from './schema'

export class CardValidationError extends Error {
  constructor(
    readonly file: string,
    readonly issues: string[],
  ) {
    super(`[${file}] 卡牌校验失败:\n  - ${issues.join('\n  - ')}`)
    this.name = 'CardValidationError'
  }
}

/** 文件路径 -> 卡牌 id：cards/company-001.yaml -> company-001 */
function idFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.ya?ml$/, '')
}

export function loadCards(): Card[] {
  const modules = import.meta.glob('./cards/*.yaml', {
    eager: true,
    query: '?raw',
    import: 'default',
  }) as Record<string, string>

  const cards: Card[] = []
  const seen = new Set<string>()

  for (const [path, raw] of Object.entries(modules)) {
    const id = idFromPath(path)
    const parsed = cardSchema.safeParse(yaml.load(raw))
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
