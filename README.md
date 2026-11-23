# 今天吃什么 · Today Eat What

A fun, lightweight, local-first meal roulette. 每天中午不用纠结，转一下决定「区域 + 店铺 + 菜品」，抽中后展示带动效的结果弹窗和个人推荐备注。

## 功能（首版）
- 用等概率随机算法从**已启用的店铺 + 菜品组合**中选择
- 动画转盘 + 文字结果，支持继续抽取
- 内置 10 条来自项目维护者的日常吃饭推荐（可新增、编辑区域与推荐备注、启停、删除、重置）
- 本地持久化，无需账号、后端或远程 API
- Web 响应式布局和微信小程序触控布局。小程序可从右上角转发首页

## 技术栈
Taro 4.3.1 + React 18 + TypeScript + Vite + Bun。现有应用只有一个页面，负责转盘、结果弹窗和菜单管理。抽取、校验和默认推荐位于 `src/domain/`，本地持久化经 `src/services/` 调用 Taro Storage，界面使用 Taro 组件。

微信端沿用 Taro 4 的原生小程序编译目标，复用选餐规则、数据和页面交互。微信原生重写需要维护第二套界面和事件逻辑，而当前页面已使用跨端组件。生成的微信项目使用 WXML、WXSS 和微信运行时，Web 继续独立构建。

## 开始开发
需要 Bun 1.4.3+。首次安装：

```bash
bun ci
bun run dev:h5
```

常用命令：
```bash
bun run typecheck
bun run test
bun run build:h5
bun run build:weapp
bun run smoke:weapp
bun run build:pages
bunx playwright install chromium firefox # first time only
bun run smoke:h5 # run after build:pages; verifies both browsers at desktop/mobile widths
bun run build:workers
bun run check:workers # Wrangler dry run; does not publish
```

仓库已提交 `bun.lock`，CI 和 Cloudflare Workers Builds 均可据此安装固定依赖。需要更新依赖时再运行 `bun install` 并提交更新后的锁文件。

## 部署方式
- **GitHub Pages**：保持原有 GitHub Actions 发布流程，构建基准路径 `/today-eat-what/`。
- **Cloudflare Workers**：使用 **Cloudflare Workers Builds（GitHub 连接）**。由 Cloudflare 监听 `main`、执行 `bun run build:workers` 构建根路径 H5，再执行 `bun run deploy:workers` 上传 `dist/` 静态资源；不再通过 GitHub Actions 上传 Worker。详细配置见 [Cloudflare Workers 部署指南](./docs/cloudflare-workers-builds.md)。
- 两套发布互不干扰，构建产物不能混用。Worker 的名称须与 `wrangler.jsonc` 中的 `name`（`today-eat-what`）一致。

## 微信小程序

首次上线请按[微信小程序发布清单](./docs/weapp-release-checklist.md)完成真机验收、备案、体验版配置和提审。

### 初始化与本地构建

1. 在[微信公众平台](https://mp.weixin.qq.com/)注册并登录小程序，在「开发管理 → 开发设置」查看小程序 AppID。按需添加开发者和体验成员。
2. 首次运行下列命令。将真实 AppID 写入 `.env.local` 的 `TARO_APP_ID`，也可以通过终端环境变量提供。Taro 会把它写入生成目录内的项目配置。

   ```bash
   bun ci
   cp .env.example .env.local
   # 在 .env.local 设置 TARO_APP_ID 后运行
   bun run build:weapp
   bun run smoke:weapp
   ```

3. 用[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)导入 `dist-weapp/`，选择对应的 AppID。持续开发可用 `bun run dev:weapp` 监听源码改动。构建本身可在缺少 AppID 时运行，供 CI 检查。H5 产物仍位于 `dist/`，两端可分别构建。

### 预览二维码与上传开发版

1. 让小程序管理员在「开发管理 → 开发设置 → 小程序代码上传」下载上传私钥，并将运行命令的主机公网出口 IP 加入白名单。私钥保存在仓库外，仅允许本机账号或 CI 作业读取，例如在 macOS/Linux 用 `chmod 600` 限制权限。CI 应从密钥存储写入临时文件，作业结束后删除。
2. 在 `.env.local` 或执行环境中设置 `WEAPP_PRIVATE_KEY_PATH` 为私钥文件的绝对路径，`WEAPP_VERSION` 为本次上传版本号，例如 `0.1.0`。可用 `WEAPP_DESC` 填写版本说明。只配置私钥路径，保留上传私钥原文件，切勿提交到 Git。
3. 安装并执行微信官方 [miniprogram-ci](https://github.com/wechat-miniprogram/miniprogram-ci-dist)。工具依赖单独锁定，使用 Node.js 执行，Web 构建只需要安装根目录依赖。

   ```bash
   bun ci --cwd tools/weapp
   bun run preview:weapp
   bun run upload:weapp
   ```

   预览和上传都会重新生产构建。预览将二维码写入 `artifacts/weapp/preview.jpg`，可由有权限的成员用手机微信扫码。也可在微信开发者工具中点击「预览」。上传将代码放到微信公众平台的开发版本列表。

### 真机验收与手动提审

- 在微信开发者工具先用窄屏和带底部安全区的机型检查首页。随后用 iOS 和 Android 的手机微信扫码，确认可在首屏看到转盘和主按钮，键盘弹起时能填完表单，长店名与备注可读，弹窗按钮可触达。
- 首次打开应有 10 条推荐。添加、编辑、暂停、删除菜品后退出重进，核对本地数据仍在。测试无候选时按钮禁用，删除到空后重进仍为空。检查恢复清单的确认和取消。
- 用普通和跳过动画两种模式抽选，检查停转后显示正确的菜品、店铺、区域和备注，并验证确认及再抽一次。通过右上角转发给体验成员，确认对方打开的是首页且未收到你的本地菜单。
- 在微信公众平台的「版本管理」找到上传的开发版，可设为体验版邀请成员。按平台提示完成主体资料、服务类目、备案及隐私说明，核对版本和体验结果后由有权限的成员点击「提交审核」。审核通过后，由有权限的成员手动发布。

`smoke:weapp` 使用模拟微信 API 检查生成的页面代码、转发内容、抽取结果及本地存储。真机渲染、扫码预览、上传和平台审核需要账号权限和现场验证。

## 首屏与弹窗
- 手机首屏优先呈现转盘和「开始随机选择」，桌面保持左右分栏；抽取完成后弹出结果卡片，可确认或重新抽取。
- 默认推荐条目记录区域、店铺、菜品与可选备注。记录的价格、排队情况和个人感受来自维护者，不代表实时商家信息。
- 升级时仅自动替换**完全未修改**的旧版 12 条演示数据；凡是修改、禁用、添加、删除过的本地菜单都会原样保留。希望改用新推荐菜单的用户，可手动选择「恢复推荐清单」并确认覆盖。
- 相同店铺的同一菜品若位于不同区域，是不同的转盘候选项。

## 数据与隐私
演示数据位于 `src/domain/sample.ts`。菜单仅存于浏览器或小程序本地；不同浏览器、设备、域名之间不会自动同步。浏览器清理站点存储将丢失自定义数据。请勿在演示菜单中添加个人隐私信息。

## 协作与许可证
开发规范见 [AGENTS.md](./AGENTS.md)。仓库原有许可为 [AGPL-3.0](./LICENSE)，本次初始化保持不变。

## H5 白屏回归说明
此前 Taro 4.3.1 的显式 `h5.router.basename: '/'` 配置会造成 `#/pages/index/index` 已切换但 `#app` 为空。现保留 `hash` 模式并使用默认 basename，CI 加入 Playwright Chromium/Firefox 实际加载、抽选及移动端刷新测试，避免仅凭构建成功即判断已上线。
