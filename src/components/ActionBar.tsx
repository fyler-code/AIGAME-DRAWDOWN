import type { Card, Choice } from '@/types'

interface ActionBarProps {
  card: Card | null
  disabled: boolean
  onChoice: (choice: Choice) => void
}

/** 两个大按钮：上滑 = 接受，下滑 = 拒绝。按钮文案随卡 */
export function ActionBar({ card, disabled, onChoice }: ActionBarProps) {
  return (
    <div className="g-actions">
      <button
        type="button"
        className="g-btn g-btn--up"
        disabled={disabled || !card}
        onClick={() => onChoice('up')}
      >
        <span aria-hidden="true">↑</span>
        {card?.up.label ?? '接受'}
      </button>
      <button
        type="button"
        className="g-btn g-btn--down"
        disabled={disabled || !card}
        onClick={() => onChoice('down')}
      >
        <span aria-hidden="true">↓</span>
        {card?.down.label ?? '拒绝'}
      </button>
    </div>
  )
}
