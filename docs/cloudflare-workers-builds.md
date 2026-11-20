# Cloudflare Workers Builds：连接 GitHub 自动构建

此仓库使用 **Cloudflare 控制台原生 Workers Builds**，不需要为 Cloudflare 配置 GitHub Actions Secrets，也不需要上传 GitHub Pages 的 `dist` 构建产物。

## 创建并连接仓库

1. Cloudflare Dashboard → **Workers & Pages** → **Create application** → 选择 **GitHub**。
2. 授权 GitHub，选择 `KnowSky404/today-eat-what` 公开仓库。
3. **Worker name：`today-eat-what`**。必须与仓库根目录 `wrangler.jsonc` 的 `name` 完全一致。若你已创建了其他名称的 Worker，需改 Worker 名或更新配置，避免不一致。
4. **Production branch：`main`**，**Root directory：`/`**（仓库根目录；有些界面可保持为空）。
5. **Build command：`bun run build:workers`**
6. **Deploy command：`bun run deploy:workers`**
7. **Preview command（可选）：`bun run preview:workers`**。此仓库提供 `previews: {}` 配置，且 Wrangler >= 4.135.0。需要按 Cloudflare 的 Preview 设置开启非生产分支预览；不想构建 PR 可关闭。
8. 保存并发布。Cloudflare 会监听 `main` 后续提交并自动部署到 Worker。生产环境的实际 `workers.dev` 地址以 Cloudflare 项目页面为准，不要根据名称猜测。

## 构建环境

- 仓库固定 `packageManager: bun@1.4.3`；Cloudflare Workers Builds 支持 Bun，并按 `packageManager` 选版本。
- 仓库已提交 `bun.lock`；Cloudflare 可据此自动安装依赖；通常**无需额外填写安装命令**。若平台没有自动识别 Bun 或构建提示找不到依赖，可在 Build variables 设置 `SKIP_DEPENDENCY_INSTALL=1`，并改 Build command 为 `bun install --frozen-lockfile && bun run build:workers`。
- 不要同时开启手动安装与平台自动安装，以避免重复安装。
- 此应用不使用运行时 Secrets / Bindings / API / 数据库，所有菜品数据仅在用户本地存储。
- `wrangler.jsonc` 的 `assets.directory: ./dist` 和 `not_found_handling: single-page-application` 已正确支持静态 H5 页面。
- **根路径区别**：Workers 构建使用 `PUBLIC_BASE_PATH=/`，而 GitHub Pages 构建使用 `/today-eat-what/`。切勿直接将 Pages 的产物发布到 Worker。

## 之后如何更新和回滚

- PR 在 GitHub Actions CI 检查通过并合并至 `main` 后，Cloudflare Builds 自动开始生产构建、发布。
- 本仓库不再包含 `.github/workflows/deploy-workers.yml`，避免 Cloudflare 与 GitHub Actions 对同一个 Worker 重复发布。
- 查看 Cloudflare → Worker → **Deployments / Builds** 检查最终结果。不要将 Github Actions CI 的 success 当作 Cloudflare Workers 已上线。
- 出现异常时从 Worker 部署历史回滚； GitHub Pages 仍由 GitHub Actions 独立发布。

## 首次上线验证

1. Cloudflare 构建日志显示依赖安装、`bun run build:workers`、`bun run deploy:workers` 全部成功。
2. Workers URL 打开后转到 `#/pages/index/index` 是正常 Hash 路由，页面应显示转盘和示例菜品。
3. 开发者工具 Network 中 `/js/` 和 `/css/` 应返回 200，没有错误的 `/today-eat-what/` 资产前缀。
4. Firefox 和 Chromium 分别尝试抽选、菜品编辑、刷新；数据会按 **origin** 分别存储，GitHub Pages 和 Workers 域名不会共享菜单。
