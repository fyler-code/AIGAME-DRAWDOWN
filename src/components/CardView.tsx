import type { Card, CardSource, Effect, StatKey } from '@/types'

const SOURCE: Record<CardSource, { label: string; color: string }> = {
  wechat: { label: '微信', color: 'var(--color-src-wechat)' },
  work: { label: '工作', color: 'var(--color-src-work)' },
  family: { label: '家庭', color: 'var(--color-src-family)' },
  news: { label: '新闻', color: 'var(--color-src-news)' },
  inner: { label: '', color: 'var(--color-src-inner)' },
}

const STAT_LABEL: Record<StatKey, string> = {
  money: '金钱',
  spirit: '精神',
  family: '家庭',
  career: '事业',
}

const STAT_KEYS: readonly StatKey[] = ['money', 'spirit', 'family', 'career']

/** 取这条 effect 里变化量最大的属性，卡面只显示方向，不显示数值 */
function dominant(effect: Effect): StatKey | null {
  let best: StatKey | null = null
  let magnitude = 0

  for (const key of STAT_KEYS) {
    const value = effect[key] ?? 0
    if (Math.abs(value) > magnitude) {
      magnitude = Math.abs(value)
      best = key
    }
  }
  return best
}

/** 卡面：左侧来源色条 + 顶部来源标签 + 正文 + 影响预览（只有方向） */
export function CardView({ card }: { card: Card }) {
  const source = SOURCE[card.from]
  const up = dominant(card.up.effect)
  const down = dominant(card.down.effect)
  const inner = card.from === 'inner'

  return (
    <article
      className={inner ? `g-card g-card--${card.from} g-card--inner` : `g-card g-card--${card.from}`}
      data-source={card.from}
    >
      <span className="g-card-bar" style={{ backgroundColor: source.color }} aria-hidden="true" />

      {!inner && (
        <header className="g-card-head">
          <span className="g-card-src">{source.label}</span>
          {card.speaker && <span className="g-card-speaker">{card.speaker}</span>}
        </header>
      )}

      <p className="g-card-text">{card.text}</p>

      <footer className="g-card-impact">
        {up && <span className="g-impact g-impact--up">↑ {STAT_LABEL[up]}</span>}
        {down && <span className="g-impact g-impact--down">↓ {STAT_LABEL[down]}</span>}
      </footer>
    </article>
  )
}
