import { createHashRouter } from 'react-router-dom'
import { CharacterScreen } from '@/screens/CharacterScreen'
import { CodexScreen } from '@/screens/CodexScreen'
import { NotFoundScreen } from '@/screens/NotFoundScreen'
import { ResultScreen } from '@/screens/ResultScreen'
import { RunScreen } from '@/screens/RunScreen'

/**
 * 必须用 createHashRouter：
 * 桌面端（Tauri / Electron）以 file:// 打开，History 路由刷新会 404。
 */
export const router = createHashRouter([
  { path: '/', element: <RunScreen /> },
  { path: '/result', element: <ResultScreen /> },
  { path: '/character', element: <CharacterScreen /> },
  { path: '/codex', element: <CodexScreen /> },
  { path: '*', element: <NotFoundScreen /> },
])
