import { Link } from 'react-router-dom'

export function RunScreen() {
  return (
    <main>
      <h1>第 0 周 / 52</h1>
      <p>骨架屏：主界面将在 S2 实现。</p>
      <nav>
        <Link to="/result">结算</Link> · <Link to="/character">角色</Link> ·{' '}
        <Link to="/codex">图鉴</Link>
      </nav>
    </main>
  )
}
