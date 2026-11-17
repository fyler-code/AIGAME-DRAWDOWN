# 《回撤》Drawdown

竖屏单手操作的轻量级人生策略游戏。你是股票交易员，每一次上滑是建仓，每一次下滑是空仓。
金钱、精神、家庭、事业是你的四条净值曲线 —— 任意一条归零，你的这一年就清盘了。

> 当前阶段：**S2 基础界面**。浏览器里已经能玩：滑卡、曲线生长、死亡、重开。
> 视觉与手感（动效、音效、仓位、市况）留给 S3/S5，本期只求"能玩通、不崩、看得懂"。

---

## 快速开始

```bash
npm install        # Node >= 22，包管理器统一用 npm（不是 pnpm）
npm run dev        # http://localhost:5173
npm run build      # validate → tsc -b → vite build，产物在 dist/
npm run preview    # 预览构建产物
```

路由是 **hash 路由**，直接访问 `http://localhost:5173/#/codex` 也可。

## 怎么玩（S2）

| 操作                                            | 行为                       |
| ----------------------------------------------- | -------------------------- |
| 按住卡面向上拖 ≥ 18% 高度（或速度 ≥ 0.5 px/ms） | 接受 / 做多，进入下一周    |
| 按住卡面向下拖同上距离                          | 拒绝 / 空仓                |
| 拖不到阈值                                      | 卡面回弹，周次不变         |
| 点「↑」「↓」两个大按钮                          | 与上下滑等效（无障碍要求） |
| 键盘 `↑` / `W`                                  | 接受                       |
| 键盘 `↓` / `S`                                  | 拒绝                       |

一局 52 周，任意一项属性归零立刻结束并跳到 `/#/result` 清盘页；熬满 52 周是通关。
**连点没用**：每次结算有 320ms 的锁，1 秒里点 10 下也只前进 1 周。

## 脚本

| 命令                        | 作用                                                     |
| --------------------------- | -------------------------------------------------------- |
| `npm run dev`               | 开发服务器（HMR）                                        |
| `npm run build`             | 生产构建。**先跑 `validate`，内容错了就不编译**          |
| `npm run preview`           | 预览 `dist/`                                             |
| `npm run validate`          | 校验全部 YAML 卡牌（字段、字数、未知字段、两边净正收益） |
| `npm run sim`               | 机器人模拟器（见下节）                                   |
| `npm run lint` / `lint:fix` | ESLint，含四条架构护栏                                   |
| `npm run typecheck`         | `tsc --noEmit`（与 `build` 里的 `tsc -b` 互为补充）      |
| `npm test` / `test:watch`   | Vitest（85 例：引擎 63 + 状态机 9 + 曲线 13）            |
| `npm run test:e2e`          | Playwright（配置在 S6 补）                               |
| `npm run format`            | Prettier                                                 |

## 跑模拟（S1 的核心交付）

```powershell
npm run sim -- --runs=1 --verbose          # 单局逐周表格（周 / 卡 id / 选择 / 四项数值 / 市况）
npm run sim -- --runs=1 --seed=42 --json   # 单局 JSON（可 diff）
npm run sim -- --runs=10000                # 万局统计：平均存活 / 通关率 / 死因分布 / 分位
npm run sim -- --runs=1000 --strategy=random
npm run sim -- --runs=1000 --pool=path/to/cards   # 换一个卡池目录
```

参数默认值：`runs=1 seed=1 strategy=greedy pool=src/content/cards`。

10000 局输出示例（当前 40 张占位卡）：

```
✓ 10000 局 / 1.5s
平均存活 38.5 周   通关 20.1%
死因：金钱 15.3%  精神 25.2%  家庭 0.0%  事业 39.4%
周次分位：P10=21  P25=29  P50=40  P75=50  P90=52
```

规则：

- 任何一局抛异常 → 打印 `seed` 与错误，退出码 1，**不吞异常继续跑统计**
- `--json` 无时间戳、无浮点噪声（数值全为整数），同 seed 两次输出逐字节相同
- 死因里的 `complete` 表示熬满 52 周（通关），不是死因
- 当前数字是**占位卡池**跑出来的，S3 会用 240 张卡 + 仓位/flag/强制清算重调，不要在 W02 调平衡

## 目录

```
src/
  app/        路由（createHashRouter）与 ErrorBoundary
  constants/  balance.ts —— 全部数值参数的唯一出处，调平衡只改这里
  types/      index.ts —— 全项目类型契约（已冻结，只允许加可选字段）
  content/    schema.ts（zod）+ loadCards.ts（浏览器）+ loadCardsNode.ts（Node 读盘）+ cards/*.yaml
  engine/     游戏内核：纯 TS，无 React / DOM / IO（S1）
  screens/    RunScreen（主界面）/ ResultScreen（清盘页 v0）/ 其余三个骨架
  components/ RunHud · Legend · EquityChart · CardView · SwipeLayer · ActionBar（S2）
  store/      runStore.ts 状态机（zustand）+ persistence.ts 元进度
  styles/     tokens.css（颜色/字体/视口）+ game.css（布局，S2）
  lib/        env.ts（版本号）+ chart.ts（曲线取点/坐标/分段，纯函数）
scripts/      validate-cards.ts（内容校验）、simulate.ts（模拟器）、strategies.ts（贪心/随机）
```

## engine 边界（S1 定稿，后面只加不改）

**对外只有 6 个核心函数 + 1 个判定**（`src/engine/index.ts`）：

```ts
createRun(seed, characterId): RunState
drawCard(state, pool): RunState        // 卡池由调用方传入，引擎不读文件
resolveCard(state, choice): RunState
advanceWeek(state): RunState
isRunOver(state): RunOver | null       // 只有死亡返回非 null
isRunComplete(state): boolean          // 跑满 52 周且四项 > 0
```

一局的调用序列（`scripts/simulate.ts` 就是这么写的）：

```
createRun(seed, char)
loop: advanceWeek → drawCard(state, pool) → resolveCard(state, choice)   until status === 'over'
```

铁律：

1. **纯函数 + 不可变**：入参 `RunState` 永不修改，返回新对象（单测有断言）
2. **确定性**：同一个 `(seed, characterId, 卡池, 决策序列)` 逐字节可复现；引擎里没有 `Math.random` / `Date.now` / `import.meta`
3. **卡池外置**：`drawCard(state, pool)`，引擎不 import `@/content`、不解析 YAML、不碰 `node:*`
4. **本周不做**：仓位结算、flag 连锁触发卡、角色特殊规则、终局强制清算卡（S3/S4）
5. **数值不在引擎里**：一切参数读 `constants/balance.ts`，引擎里不出现魔法数字（市场均值回归的 80/20 除外）

**UI 只通过 `src/store/runStore.ts` 调这 6 个函数**，组件不直接改 `RunState`。曲线读的是 `history` + 当前实时态（衰减不写 history，见 `lib/chart.ts` 的 `buildChartPoints`）。

验证引擎是否还干净：

```powershell
Select-String -Path src/engine/*.ts -Pattern 'Math\.random|Date\.now|import\.meta|@/content|node:'
```

## 四条护栏（改了就要跑 `npm run lint` 验证）

1. **`src/engine/**` 必须是纯 TS**
   禁止 `react` / `react-dom` / `react-router-dom` / `zustand`，禁止 `window` / `document` / `localStorage`，
   禁止 `@/content`、`js-yaml`、`node:*`、`@/lib`、`@/app`、`@/store`。
   原因只有一个：**万局模拟器要能在 Node 里直接 import 引擎跑**。混进 DOM 依赖，数值平衡就没法调。
2. **`src/constants/**` 是叶子模块**
   不许反向依赖 `engine/`。常量只依赖 `types/`。
3. **禁止硬编码颜色**
   `src/components/**` 与 `src/screens/**` 里不许出现 `#RRGGBB` 字面量，颜色只能来自 `styles/tokens.css`。
   红涨绿跌（`--color-up` / `--color-down`）写死在 tokens 里，不要在组件里改。
4. **本地图待验证就写 probe**
   护栏必须实跑：在 `src/engine/probe.ts` 里分别写 `import { loadCards } from '@/content'`、`import fs from 'node:fs'`、
   `import yaml from 'js-yaml'`、`localStorage.getItem('x')`，四条都应报错；验证完删掉 probe，`lint` 回到 0。

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

## 与工作文档的偏差

| 项                                             | 说明                                                                                                                                                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 新增 `@types/node`                             | `vite.config.ts`、`scripts/*`、`src/content/loadCardsNode.ts` 用了 Node API，没有类型 `tsc` 直接报错。仅类型，不进产物                                                                                          |
| 新增 `src/content/__tests__/loadCards.test.ts` | W01 §2.1 树里没有测试文件，但验收要求 `npm test` 至少 1 个测试文件。后来在同一个文件里补了「两条加载路径同源」的用例                                                                                            |
| tsconfig 合成一个编译单元                      | TS 5.9 的 project reference + `noEmit` 会报 TS6310 / TS6305（引用项目必须 emit、输出必须已构建）。改为 `tsconfig.json` 同时包含 `src`、`vite.config.ts`、`scripts`；`tsconfig.node.json` 保留为 Node 侧独立检查 |
| `tsconfig.json` 的 `types` 加了 `node`         | 否则 `loadCardsNode.ts` 的 `node:fs` 无法解析                                                                                                                                                                   |
| 包管理器                                       | 一律 npm（环境未装 pnpm），时间线里的 pnpm 命令等价替换                                                                                                                                                         |
| 文件数                                         | W01 §2.1 正文写"共 30 个文件"，文件树实际列出 39 项。按**文件树**实现                                                                                                                                           |
| 占位卡数值做过一轮收敛                         | 首批 40 张占位卡按 §4.8 的幅度（主属性 ±5~15）收敛过，否则贪心策略 19 周必死、永远看不到 52 周。`balance.ts` 一个数没动                                                                                         |
| 结算锁 320ms（S2）                             | W03 §2.3.3 的 `commit` 结尾直接回到 `running`，那样连点会连推好几周（B1/B2 过不了）。实现改为：结算后 `phase` 停在 `resolving`，320ms（正好是曲线生长动画）后自动放开                                           |
| `commit` 接受 `running` 和 `swiping`（S2）     | §2.3.4 的转移表要求 `swiping --pointerup--> resolving`，但 §2.3.3 的守卫只放行 `running`。两者冲突，按转移表放行 `swiping`                                                                                      |
| 横屏断点 640px（S2）                           | §2.7 写"≥900px 且 landscape"，但验收 D3 要求 812×375 也走两栏；改成 `(orientation: landscape) and (min-width: 640px)`。不改的话 812×375 会把卡牌压到 28px、正文看不见                                           |
| 危险态呼吸动画未做（S2）                       | §2.6.2 要求危险态数值做 1.5 倍呼吸，§3.1 #5 又明确"不做危险态呼吸动画"。按 §3.1 优先：只做了 `!` + 危险段虚线                                                                                                   |
| 图例 ▲▼ 用 CSS 动画（S2）                      | Legend 里 `useEffect` 里 `setState` 被 react-hooks v7 拦（`react-hooks/set-state-in-effect`）。改成 `key={history.length}` 重挂 + 1200ms CSS 淡出，效果一致且不占 JS                                            |

## 已知问题（需要技术负责人决策）

- `npm audit`（对 npmjs registry）在 **devDependencies** 报出 2 critical + 1 high：
  `vitest@3` 传递依赖 `tinypool <= 2.1.1`（critical）、`glob`（high）。
  修复需要把 `vitest` 升到 4.1.11+ / 5，与 W01 §2.2.2 冻结的 `vitest ^3` 冲突，本周未擅自升级。
  **生产依赖（`npm audit --omit=dev`）0 漏洞**，且这些包不进产物包体。
- CI 的 PR 预览部署与 Actions 实跑（W01 §4.3 C6/C7）需要 GitHub 远端，本地无法验证。
- 占位卡池的死因分布还不达标（家庭 0%），这是 S3-T09 的活，别在 W02 调 `balance.ts`。
