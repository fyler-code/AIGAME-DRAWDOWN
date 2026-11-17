import type { StatKey, Stats } from '@/types'
import { isDangerValue } from '@/lib/chart'

const ITEMS: ReadonlyArray<{ key: StatKey; label: string; color: string }> = [
  { key: 'money', label: '金钱', color: 'var(--color-money)' },
  { key: 'spirit', label: '精神', color: 'var(--color-spirit)' },
  { key: 'family', label: '家庭', color: 'var(--color-family)' },
  { key: 'career', label: '事业', color: 'var(--color-career)' },
]

interface LegendProps {
  stats: Stats
  lastDelta: Partial<Stats> | null
  /** 每次结算 +1，用来重挂 ▲▼，让 1200ms 的淡出动画重新播（纯 CSS，不用定时器） */
  tick: number
}

/** 四属性图例：数值 + ▲▼ 变化提示（红涨绿跌）+ 危险态 `!` */
export function Legend({ stats, lastDelta, tick }: LegendProps) {
  return (
    <div className="g-legend">
      {ITEMS.map((item) => {
        const value = stats[item.key]
        const delta = lastDelta?.[item.key]
        const danger = isDangerValue(value)

        return (
          <span
            key={item.key}
            className={danger ? 'g-legend-item g-legend-item--danger' : 'g-legend-item'}
          >
            <span
              className="g-legend-dot"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className="g-legend-name">
              {danger ? '!' : ''}
              {item.label}
            </span>
            <span className="g-legend-value">{value}</span>
            {delta !== undefined && delta !== 0 && (
              <span
                key={tick}
                className={
                  delta > 0
                    ? 'g-legend-delta g-legend-delta--up'
                    : 'g-legend-delta g-legend-delta--down'
                }
              >
                {delta > 0 ? '▲' : '▼'}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
