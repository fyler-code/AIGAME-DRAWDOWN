import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionBar } from '@/components/ActionBar'
import { CardView } from '@/components/CardView'
import { EquityChart } from '@/components/EquityChart'
import { Legend } from '@/components/Legend'
import { RunHud } from '@/components/RunHud'
import { SwipeLayer } from '@/components/SwipeLayer'
import { useRunStore } from '@/store/runStore'

export function RunScreen() {
  const navigate = useNavigate()

  const phase = useRunStore((s) => s.phase)
  const run = useRunStore((s) => s.run)
  const lastDelta = useRunStore((s) => s.lastDelta)
  const errorMessage = useRunStore((s) => s.errorMessage)
  const start = useRunStore((s) => s.start)
  const commit = useRunStore((s) => s.commit)
  const setPhase = useRunStore((s) => s.setPhase)

  // 进来自动开局。start() 内部有 phase 守卫，StrictMode 双调也只会开一次
  useEffect(() => {
    if (phase === 'idle') start('trader')
  }, [phase, start])

  // 死亡 / 通关 → 清盘页
  useEffect(() => {
    if (phase === 'over') navigate('/result')
  }, [phase, navigate])

  // 键盘：↑/W 接受，↓/S 拒绝
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (phase !== 'running') return
      const { key } = event

      if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        event.preventDefault()
        commit('up')
      } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        event.preventDefault()
        commit('down')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, commit])

  if (phase === 'error') {
    return (
      <main className="g-root g-root--center">
        <h1 className="g-result-title">出错了</h1>
        <p className="g-result-sub">{errorMessage ?? '未知错误'}</p>
        <button
          type="button"
          className="g-btn g-btn--wide"
          onClick={() => window.location.reload()}
        >
          重新加载
        </button>
      </main>
    )
  }

  if (!run || !run.current) {
    return (
      <main className="g-root g-root--center">
        <p className="g-result-sub">正在发牌…</p>
      </main>
    )
  }

  return (
    <main className="g-root">
      <RunHud week={run.week} phase={phase} />

      <section className="g-chart-wrap">
        <EquityChart run={run} />
        <Legend stats={run.stats} lastDelta={lastDelta} tick={run.history.length} />
      </section>

      <div className="g-play">
        <SwipeLayer
          disabled={phase !== 'running'}
          onSwipeStart={() => setPhase('swiping')}
          onSwipeCancel={() => setPhase('running')}
          onCommit={commit}
        >
          <CardView card={run.current} />
        </SwipeLayer>

        <ActionBar card={run.current} disabled={phase !== 'running'} onChoice={commit} />
      </div>
    </main>
  )
}
