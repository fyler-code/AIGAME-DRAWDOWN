# 《回撤》Drawdown

竖屏单手操作的轻量级人生策略游戏。你是股票交易员，每一次上滑是建仓，每一次下滑是空仓。
金钱、精神、家庭、事业是你的四条净值曲线 —— 任意一条归零，你的这一年就清盘了。

> 本仓库当前处于 **S0 工程地基（W1）**：只有骨架、类型契约、内容 Schema 和护栏。
> **没有任何游戏功能**——这是对的，功能从 S1 开始。

---

## 快速开始

```bash
npm install        # Node >= 22，包管理器统一用 npm（不是 pnpm）
npm run dev        # http://localhost:5173
npm run build      # validate → tsc -b → vite build，产物在 dist/
npm run preview    # 预览构建产物
```

路由是 **hash 路由**，直接访问 `http://localhost:5173/#/codex` 也可。

## 脚本

| 命令                        | 作用                                                     |
| --------------------------- | -------------------------------------------------------- |
| `npm run dev`               | 开发服务器（HMR）                                        |
| `npm run build`             | 生产构建。**先跑 `validate`，内容错了就不编译**          |
| `npm run preview`           | 预览 `dist/`                                             |
| `npm run validate`          | 校验全部 YAML 卡牌（字段、字数、未知字段、两边净正收益） |
| `npm run lint` / `lint:fix` | ESLint，含三条架构护栏                                   |
| `npm run typecheck`         | `tsc --noEmit`（与 `build` 里的 `tsc -b` 互为补充）      |
| `npm test` / `test:watch`   | Vitest                                                   |
| `npm run test:e2e`          | Playwright（配置在 S6 补，本周只装依赖）                 |
| `npm run format`            | Prettier                                                 |

## 目录

```
src/
  app/        路由（createHashRouter）与 ErrorBoundary
  constants/  balance.ts —— 全部数值参数的唯一出处，调平衡只改这里
  types/      index.ts —— 全项目类型契约（已冻结，只允许加可选字段）
  content/    schema.ts（zod）+ loadCards.ts + cards/*.yaml
  screens/    Run / Result / Character / Codex / NotFound（本周只有骨架）
  components/ 空占位（S2 起写）
  engine/     空占位（S1 起写，纯 TS：禁止 React / window / document / localStorage）
  store/      空占位（S2 起写）
  styles/     tokens.css —— 颜色、间距、字体的唯一出处
  lib/        env.ts —— 版本号与构建 hash
scripts/      validate-cards.ts —— Node 侧内容校验（命令行）
```

## 三条护栏（改了就要跑 `npm run lint` 验证）

1. **`src/engine/**` 必须是纯 TS**
   禁止 `import react` / `react-dom` / `react-router-dom` / `zustand`，禁止 `window` / `document` / `localStorage`，禁止依赖 `components/`、`screens/`、`store/`。
   原因只有一个：**万局模拟器要能在 Node 里直接 import 引擎跑**。混进 DOM 依赖，数值平衡就没法调。
2. **`src/constants/**` 是叶子模块**
   不许反向依赖 `engine/`。常量只依赖 `types/`。
3. **禁止硬编码颜色**
   `src/components/**` 与 `src/screens/**` 里不许出现 `#RRGGBB` 字面量，颜色只能来自 `styles/tokens.css`。
   红涨绿跌（`--color-up` / `--color-down`）写死在 tokens 里，不要在组件里改。

检验护栏是否真的生效，按 W01 文档 §4.2 的 B1–B8 做一遍（写 probe 文件 → 跑 lint / validate → 应报错 → 删掉）。

## 写卡

卡牌是 YAML，写手不碰 `.ts`。文件名即卡牌 id（`company-001.yaml` → `company-001`），**YAML 里不许写 `id` / `file`**。

```yaml
from: wechat # wechat | work | family | news | inner
speaker: 王哥 # ≤ 6 字，可省
text: 正文 # ≤ 42 字
tags: [公司] # 公司 市场 家庭 宏观 荒诞 内心 tutorial 仓位
weight: 10 # 1..100，默认 10
phase: bear # 可选：bull | bear | chop
require: # 可选：出现条件
  flagAtLeast: { compliance: 1 }
  weekRange: [40, 52]
up: { label: 润色, effect: { career: 12, spirit: -8, flags: { compliance: 1 } } }
down: { label: 不改, effect: { career: -10, spirit: 5 } }
```

存盘前跑 `npm run validate`（pre-commit 也会自动跑）。失败时输出 **文件名 + 字段路径 + 原因**。

## 与 W01 工作文档的偏差

| 项                                              | 说明                                                                                                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 新增 `@types/node`                              | `vite.config.ts` 与 `scripts/validate-cards.ts` 用了 `node:url` / `node:child_process` / `node:fs`，没有 Node 类型 `tsc` 直接报错。仅类型，不进包体。 |
| 新增 `src/content/__tests__/loadCards.test.ts`  | §2.1 文件树里没有测试文件，但验收 A7 要求 `npm test` 至少 1 个测试文件通过。只做 `loadCards` 冒烟。                                                   |
| `tsconfig.node.json` 需要 `emitDeclarationOnly` | TS 5.9 的 `tsc -b` 不允许被引用项目 `noEmit`（TS6310）。声明文件只写到 `node_modules/.tmp/`，不污染仓库。                                             |
| 包管理器                                        | 一律 npm（环境未装 pnpm），时间线里的 pnpm 命令等价替换。                                                                                             |
| 文件数                                          | §2.1 正文写"共 30 个文件"，但同一份文件树实际列出 39 项。按**文件树**实现，39 项全齐；另有 `package-lock.json` 与上面那个测试文件。                   |

## 已知问题（需要技术负责人决策）

- `npm audit`（对 npmjs registry）在 **devDependencies** 报出 2 critical + 1 high：
  `vitest@3` 传递依赖 `tinypool <= 2.1.1`（critical）、`glob`（high）。
  修复需要把 `vitest` 升到 4.1.11+ / 5，与 W01 §2.2.2 冻结的 `vitest ^3` 冲突，本周未擅自升级。
  **生产依赖（`npm audit --omit=dev`）0 漏洞**，且这些包不进产物包体。
- CI 的 PR 预览部署（W01 §2.1 未包含 workflow 之外的部分）与 §4.3 C6/C7（开 PR 看 Actions 变绿/变红）
  需要 GitHub 远端，本地无法验证。
