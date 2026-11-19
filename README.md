# 今天吃什么 · Today Eat What

A fun, lightweight, local-first meal roulette. 每天中午不用纠结，转一下决定「店铺 + 菜品」。

## 功能（首版）
- 用等概率随机算法从**已启用的店铺 + 菜品组合**中选择
- 动画转盘 + 文字结果，支持继续抽取
- 内置可编辑的演示菜单（可新增、启停、删除、重置）
- 本地持久化，无需账号、后端或远程 API
- Web 移动端 / 平板 / 大屏响应式布局；预留微信小程序构建

## 技术栈
Taro 4 + React 18 + TypeScript + Vite + Bun；前端使用 Taro 组件和 Taro Storage。

## 开始开发
需要 Bun 1.4.3+。首次安装：

```bash
bun install
bun run dev:h5
```

常用命令：
```bash
bun run typecheck
bun run test
bun run build:h5
bun run build:weapp
bun run build:pages
bun run smoke:h5 # requires Playwright browsers; run after build:pages
bun run build:workers
```

开发完成后请提交由 `bun install` 生成的 `bun.lock`，后续将 CI 切换至 `bun ci` 以锁定依赖。**当前初始化环境无法联网生成真实锁文件**，因此 CI 暂用 `bun install`。

## 部署方式
- **GitHub Pages**：`.github/workflows/deploy-pages.yml` 在 main 更新时构建 `/today-eat-what/` 子路径版本。需在仓库 Settings → Pages → Build and deployment 选择 **GitHub Actions**。预期地址：https://knowsky404.github.io/today-eat-what/（需工作流成功才生效）。
- **Cloudflare Workers**：`wrangler.jsonc` 的 Static Assets 将 `dist` 发布为静态应用，无需 Worker 后端脚本。设置 Actions secrets：`CLOUDFLARE_API_TOKEN`（具备 Workers Scripts 编辑权限）和 `CLOUDFLARE_ACCOUNT_ID`；main 更新会编译根路径构建并运行 `wrangler deploy`。没有凭据时跳过，不声称部署成功。若要绑定自定义域名，请在 Cloudflare 控制台另行配置。
- 两条部署流程分别构建，**不要把 GitHub Pages 的子路径 dist 上传到 Workers**。

## 微信小程序
`bun run build:weapp` 产生 `dist/`，用微信开发者工具打开项目。把 `project.config.json` 的 `touristappid` 换为自己的小程序 AppID 再做发布测试。此次只是跨端初始支持，不代表已通过微信真机或上架审核。

## 数据与隐私
演示数据位于 `src/domain/sample.ts`。菜单仅存于浏览器或小程序本地；不同浏览器、设备、域名之间不会自动同步。浏览器清理站点存储将丢失自定义数据。请勿在演示菜单中添加个人隐私信息。

## 协作与许可证
开发规范见 [AGENTS.md](./AGENTS.md)。仓库原有许可为 [AGPL-3.0](./LICENSE)，本次初始化保持不变。
