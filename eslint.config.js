import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { projectService: true } },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // ============ 护栏 1：engine 必须是纯 TS ============
  {
    files: ['src/engine/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'engine 必须是纯 TS：禁止依赖 React' },
            { name: 'react-dom', message: 'engine 必须是纯 TS：禁止依赖 ReactDOM' },
            { name: 'react-router-dom', message: 'engine 不许依赖路由' },
            { name: 'zustand', message: 'engine 不许依赖状态库' },
          ],
          patterns: [
            {
              group: ['@/components/*', '@/screens/*', '@/store/*', '**/components/**', '**/screens/**'],
              message: 'engine 只能依赖 types / constants / content',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'engine 必须能在 Node 里跑：禁止 window' },
        { name: 'document', message: 'engine 必须能在 Node 里跑：禁止 document' },
        { name: 'localStorage', message: 'engine 必须是纯函数：禁止 localStorage' },
      ],
    },
  },

  // ============ 护栏 2：constants 不许依赖 engine ============
  {
    files: ['src/constants/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/engine/*', '**/engine/**'], message: 'constants 是叶子模块，不许反向依赖' },
          ],
        },
      ],
    },
  },

  // ============ 护栏 3：组件里禁止硬编码色值 ============
  {
    files: ['src/components/**/*.tsx', 'src/screens/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message: '颜色只能来自 tokens.css，禁止硬编码十六进制色值',
        },
      ],
    },
  },
)
