import { RUN_WEEKS } from '@/constants/balance'
import type { Phase } from '@/store/runStore'

interface RunHudProps {
  week: number
  phase: Phase
}

/** 顶部状态条：第 N 周 / 52（本期不显示市况，市况属 S3-T01） */
export function RunHud({ week, phase }: RunHudProps) {
  const over = phase === 'over'

  return (
    <header className="g-hud">
      <span className="g-hud-week">
        第 {week} 周 / {RUN_WEEKS}
      </span>
      <span className={over ? 'g-hud-state g-hud-state--over' : 'g-hud-state'}>
        <span aria-hidden="true" className="g-hud-dot">
          ●
        </span>
        {over ? '已结束' : '进行中'}
      </span>
    </header>
  )
}
