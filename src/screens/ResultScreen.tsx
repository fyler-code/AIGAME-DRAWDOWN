import { Link, useNavigate } from 'react-router-dom'
import type { DeathCause } from '@/types'
import { useRunStore } from '@/store/runStore'

interface Copy {
  title: string
  subtitle: string
}

/** 四种死因 + 通关的文案（开发参考文档 §6.2 / W03 §2.8，逐字） */
const COPY: Record<DeathCause, Copy> = {
  money: {
    title: '强制平仓',
    subtitle: '你的账户余额不足以支付下个月的房贷。中介的电话是周三打来的。',
  },
  spirit: {
    title: '你去看医生了',
    subtitle: '医生问你最近睡眠怎么样。你张了张嘴，发现已经三个月没人问过你这个问题。',
  },
  family: {
    title: '离婚协议放在餐桌上',
    subtitle: '她把协议放在餐桌上，旁边是你上周答应要签的那张家长回执。',
  },
  career: {
    title: '工位清空了',
    subtitle: '门禁卡在下午五点失效。你抱着纸箱站在楼下，不知道要不要打车。',
  },
}

const COMPLETE: Copy = {
  title: '你熬过了这一年',
  subtitle: '五十二周，四项都活着。这一年就这样过去了。',
}

const STAT_LABEL = [
  { key: 'money', label: '金钱' },
  { key: 'spirit', label: '精神' },
  { key: 'family', label: '家庭' },
  { key: 'career', label: '事业' },
] as const

export function ResultScreen() {
  const navigate = useNavigate()
  const outcome = useRunStore((s) => s.outcome)
  const backToIdle = useRunStore((s) => s.backToIdle)
  const start = useRunStore((s) => s.start)

  if (!outcome) {
    return (
      <main className="g-root g-root--center">
        <h1 className="g-result-title">没有进行中的对局</h1>
        <p className="g-result-sub">先去玩一局，结束后这里会有你的清盘报告。</p>
        <Link className="g-btn g-btn--wide" to="/">
          返回首页
        </Link>
      </main>
    )
  }

  const copy = outcome.kind === 'complete' ? COMPLETE : COPY[outcome.cause ?? 'money']

  const restart = () => {
    backToIdle()
    start('trader')
    navigate('/')
  }

  return (
    <main className="g-root g-root--center">
      <h1 className="g-result-title">{copy.title}</h1>
      <p className="g-result-sub">{copy.subtitle}</p>

      <p className="g-result-week">第 {outcome.week} 周</p>

      <dl className="g-result-stats">
        {STAT_LABEL.map((item) => (
          <div key={item.key} className="g-result-stat" data-stat={item.key}>
            <dt>{item.label}</dt>
            <dd>{outcome.finalStats[item.key]}</dd>
          </div>
        ))}
      </dl>

      <div className="g-result-actions">
        <button type="button" className="g-btn g-btn--up g-btn--wide" onClick={restart}>
          再来一局
        </button>
        <Link
          className="g-btn g-btn--wide"
          to="/"
          onClick={() => {
            backToIdle()
          }}
        >
          返回首页
        </Link>
      </div>
    </main>
  )
}
