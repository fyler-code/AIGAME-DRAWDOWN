import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { loadCards } from '@/content'
import { useRunStore } from '@/store/runStore'
import '@/styles/tokens.css'
import '@/styles/game.css'

// 引导：卡池只加载一次，之后由 store 传给引擎（引擎自己不读文件）
useRunStore.getState().setPool(loadCards())

const container = document.getElementById('root')
if (!container) {
  throw new Error('找不到挂载节点 #root')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
