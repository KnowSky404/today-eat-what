# 研发与交付流程

采用 [Manifest · AI-Native Development Workflow v1.0](https://github.com/KnowSky404/Manifest/blob/6f387de5065b6ffc475908880362939185ff89d7/docs/AI_NATIVE_DEVELOPMENT_WORKFLOW.md)，基准提交 `6f387de5065b6ffc475908880362939185ff89d7`。本地规则以 [AGENTS.md](../AGENTS.md) 和本文为准。更新基准时重新审阅差异，并在 PR 中记录新 SHA。

## 风险与验证

| 风险 | 本项目示例 | 本地与 CI | 审查与候选验收 |
| --- | --- | --- | --- |
| R0 | 普通说明文档 | 检查差异。CI 快速检查仅适用于 `README.md`、`README.en.md`、`docs/architecture.md` | 0 轮完整审查。无需候选验收 |
| R1 | 独立样式、界面文案 | 检查相关构建和窄屏布局。共享 Taro 样式同时影响 H5 和小程序，CI 跑完整矩阵 | 远程代码审查，最多 2 轮。按影响查看截图或验证候选 |
| R2 | 抽选逻辑、编辑交互、状态或依赖变化 | 受影响的单元和集成检查，领域行为附回归测试。CI 跑完整矩阵 | 远程代码审查，最多 3 轮。按影响完成关键路径候选验收，记录简要回退办法 |
| R3 | 菜单迁移、隐私、凭据、信任边界、关键 CI 或发布控制 | 完整受影响套件，加负向、失败和回退场景。可疑改动先按更高风险处理 | 独立审查或 Owner 批准的等效审查、远程代码与安全审查。须有候选或等效验收及显式恢复方案。3 轮后请 Owner 仲裁 |

混合变更取最高风险。风险由作者记录、审查人确认。CI 快速路径按实际 Git 差异和基线策略计算，PR 标签无法减免检查。基线不明、重命名涉及运行时文件或修改验证策略时，按完整矩阵执行。验证 PR 的集成提交，合并前确认有效基线和最终 Head。

完整矩阵使用冻结锁文件和 `package.json` 的 Bun 版本。运行 `bun run typecheck`、`bun run test`、`bun run build:workers` 与 `bun run check:workers`、`bun run build:pages` 与 `bun run smoke:h5`、`bun run build:weapp` 与 `bun run smoke:weapp`。Workers 构建验证与默认 H5 共用的根路径，Pages 保留独立子路径构建。Chromium 和 Firefox 保留响应式截图。浏览器缓存按平台和锁文件隔离。Wrangler 只做 dry run，小程序冒烟测试使用合成数据和模拟 API。

`Required checks` 始终汇总适用结果。只有明确的文档范围可以跳过完整检查。失败、取消、结果缺失或未识别的范围均阻塞。仅取消同一 PR 已被新提交替代的 CI。PR 检查使用只读权限，发布权限由可信 `main` 的独立 Pages 工作流按任务授予。

## 分支、审查与交接

1. 从最新目标分支创建短期分支。先在 PR、Issue 或每个工作区的忽略目录 `.task/` 记录目标、原始要求、范围、验收、风险、授权、基线 SHA 和分支。跨主机交接把脱敏版本放到 PR。
2. 自查差异和受影响路径，提交后并行开展 CI 与适用的远程、独立和安全审查。相同输入只审一次。结论写明触发条件、影响和证据，类型、构建、已知回归交给 CI。
3. 将一组并行反馈计为一轮，跨推送和会话累积。P0 严重事故及 P1 主要正确性或安全回归必须修复。P2 有限缺陷影响验收或安全时阻塞。P3 和建议通常可延后。每项记录已修复及验证、误报及原因，或延期及依据。集中处理一批后复验原问题与受影响路径，核对最终 Head 和基线的必需结果。达到预算仍有阻塞时停止自主迭代，记录根因、证据、选项和进度，请 Owner 决定拆分、暂停或继续。缺失或失效的必要证据影响合并资格。
4. 在实现、检查、审查批次、候选与交付时更新当前 Head、阶段、已完成与剩余项、检查链接、审查轮次和处置、阻塞、下一步。会话恢复时读 `AGENTS.md` 和记录，再以 Git 与 CI 实况校验进度。
5. 验收满足、必要检查与审查有效、阻塞已处理、延期已记录，且所需候选与回退证据齐全时，才标记可合并。Owner 按现有授权操作。汇报分别标注实现完成、可合并、已合并、可发布、已部署、生产已验证。

## 候选、发布与恢复

- **DEV** 使用本地服务器、模拟 API 与隔离数据。**PRE** 对 H5 使用 CI 的 `github-pages-*` 子路径候选与浏览器截图，在隔离环境按改动检查实际行为。小程序按[真机清单](weapp-release-checklist.md)使用经过授权的预览或体验版，并在检查和审查稳定后验收。每次记录提交、构建路径或包版本、工具链、可用的产物摘要、环境和结果。环境专属凭据只留在对应环境。
- 合并前核对集成树与候选源、锁文件、构建配置、版本及本地生成输入。文档改动经确认对运行时和构建等价时可沿用候选证据。代码、构建或基线的实质变化按影响重跑，敏感变化重新确认风险、发布授权和恢复能力。
- **GitHub Pages** 继续从 `main` 发布。完整 CI 通过后复用同次已通过 Chromium 和 Firefox 的 Pages 产物，普通文档提交跳过应用构建与发布。发布任务串行，不中断正在发布的任务。排队期间若只有白名单文档变化，已验证候选仍有效。若新版改变发布输入，改由新版验证及发布。页面发布后核对线上 HTML 摘要，并按实际变更复查抽取及清单行为。需恢复时，用授权的回退 PR 恢复既有版本，再检查部署与行为。回退 CI 实现时保留稳定的 `Required checks` 名称，确保规则集在回退 PR 上仍可验证。需要手动重新发布时，在 Actions → **CI** → **Run workflow** 选择 `main` 和 **Rebuild, verify and publish Pages from main**，会重建并验证当前版本。
- **Cloudflare Workers** 由 [Workers Builds](cloudflare-workers-builds.md) 构建并发布根路径版本。GitHub CI 只验证 Worker 构建和配置。检查原生最终部署与根路径资源、实际交互。平台目前分别构建，Pages 的子路径产物与 Worker 根路径产物不可互用。Worker 回退走平台部署记录。
- **微信小程序** 继续由有权限的成员在白名单主机执行开发版预览与上传，Owner 在公众平台审核通过后手动发布。线上用普通微信账号复查。记录候选源、上传版本和真实发布状态；出现问题由 Owner 在公众平台执行可用的版本回退或提交已验证修复。代码回退无法恢复已经修改的本地菜单，涉及迁移须验证前后版本兼容、异常输入以及对自定义和空清单的保留。

## 平台配置与观测

- GitHub 仓库 Settings → **Rules → Rulesets**。为 `main` 建立并启用分支规则，要求通过 PR 和 `Required checks`（来源 GitHub Actions），启用合并前分支最新检查，并阻止删除和强推。保持 bypass list 为空。单维护者可将强制批准数设为 0，适用的独立与远程审查证据仍由 Owner 在合并前查验。配置前先从本 PR 验证检查名和行为。当前仓库尚未配置该规则，PR 检查可运行，平台强制拦截仍待启用。
- Settings → **Pages** 的 Source 使用 **GitHub Actions**。Settings → **Environments → github-pages** 的 deployment branches 保持 **Selected branches → main**。本仓库当前已采用这两项设置。无须新的 GitHub Actions 发布密钥。
- Cloudflare 文档排除路径由 Owner 在平台单独配置，见 [Workers Builds 配置](cloudflare-workers-builds.md)。当前 GitHub PR 无法应用控制台设置。小程序仍按发布清单执行。三种发布权限不因 CI 或 PR 状态扩大。
- 使用 PR 和 Actions 记录观察从开始到交付的时间、PR 周期、CI 用时、审查轮次、候选部署数、上下文恢复与发布故障/恢复。对比同类 PR，避免用一次冷缓存运行推断长期收益。迁移前参考 [main CI](https://github.com/KnowSky404/today-eat-what/actions/runs/45960565290) 与同提交的[独立 Pages 构建](https://github.com/KnowSky404/today-eat-what/actions/runs/45960565193)。前者约 124 秒，后者 33 秒，两者并行并各自构建 Pages。
