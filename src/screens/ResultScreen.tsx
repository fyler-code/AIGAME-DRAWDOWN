import { Link } from 'react-router-dom'

export function ResultScreen() {
  return (
    <main>
      <h1>结算</h1>
      <p>骨架屏：清盘报告将在 S3 实现。</p>
      <nav>
        <Link to="/">返回</Link>
      </nav>
    </main>
  )
}
