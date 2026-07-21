# Cloudflare Pages 在线预览托管

日期：2026-07-17  
状态：已确认

## 目标

为协作者提供国内比 `*.github.io` 更容易打开的**可视化**静态预览链接。  
不替代本地 `start-dev.sh`（带 API 的完整联调仍用本机）。

## 方案

- 托管：Cloudflare Pages（免费）
- 发布内容：仓库根目录 `preview/`（与现有 GitHub Pages 同源）
- 触发：连接 GitHub 仓库后，推送 `main` 自动部署
- 构建：无构建命令；输出/根目录为 `preview`
- 项目名：`personal-site`（线上域名：`https://personal-site-1e8.pages.dev`）
- 已用 wrangler 直传 `preview/` 完成首发；后续用 `scripts/deploy-to-cloudflare.sh`

## 非目标

- 不用 jsDelivr 作为 HTML 预览入口（HTML 会被当成纯文本）
- 不在此方案中部署真实后端 API
- 不强制关闭 GitHub Pages（可作备用）

## 文档与协作

- 主推链接写入 README、`docs/PAGES.md`、版本管理规则
- 开通步骤见 `docs/CLOUDFLARE-PAGES.md`
- 正式 `*.pages.dev` 域名以 Cloudflare 控制台为准；开通后回填文档

## 验收

1. 打开 `https://<项目>.pages.dev/miniprogram/index.html` 看到营销首页可视化预览（非源码）
2. 推送 `main` 后 Pages 自动更新
3. 协作者无需本机开服务即可访问
