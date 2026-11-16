import { Component, type ErrorInfo, type ReactNode } from 'react'
import { APP_VERSION, BUILD_HASH } from '@/lib/env'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * 应用级兜底：任何渲染期异常落到这里，而不是白屏。
 * 报错页展示版本号 + 构建 hash，线上问题能直接对上版本。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    const { error } = this.state
    if (!error) {
      return this.props.children
    }

    return (
      <main>
        <h1>游戏崩了</h1>
        <p>{error.message}</p>
        <p>
          版本 {APP_VERSION} · 构建 {BUILD_HASH}
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          重新加载
        </button>
      </main>
    )
  }
}
