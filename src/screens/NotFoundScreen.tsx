import { Link } from 'react-router-dom'

export function NotFoundScreen() {
  return (
    <main>
      <h1>404</h1>
      <p>这个页面不存在。</p>
      <nav>
        <Link to="/">回首页</Link>
      </nav>
    </main>
  )
}
