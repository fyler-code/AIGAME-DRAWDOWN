import { Link } from 'react-router-dom'
import { loadCards } from '@/content'

export function CodexScreen() {
  // 本周唯一一处端到端管道验证：YAML → zod → 类型 → React
  const count = loadCards().length

  return (
    <main>
      <h1>图鉴</h1>
      <p>已加载 {count} 张卡</p>
      <nav>
        <Link to="/">返回</Link>
      </nav>
    </main>
  )
}
