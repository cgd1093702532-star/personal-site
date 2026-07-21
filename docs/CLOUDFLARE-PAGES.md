# Cloudflare Pages 在线预览

国内协作者优先用此链接；**不要**用 jsDelivr 打开 `.html`（只会显示源码）。

## 线上地址（已开通）

| 入口 | 地址 |
|------|------|
| 总入口 | https://personal-site-1e8.pages.dev/ |
| 小程序预览 | https://personal-site-1e8.pages.dev/miniprogram/index.html |
| 后台预览 | https://personal-site-1e8.pages.dev/admin/dashboard.html |

Cloudflare 项目名：`personal-site`  
控制台：Workers & Pages → personal-site

## 如何更新线上预览

发布内容来自仓库 `preview/`。

本机已登录 wrangler 时：

```bash
bash scripts/deploy-to-cloudflare.sh
```

或：

```bash
npx wrangler@4 pages deploy preview --project-name=personal-site --branch=main
```

推送 GitHub 后，GitHub Pages（`*.github.io`）仍由 Actions 自动更新；Cloudflare 需执行上述脚本（或由协作 AI 在「推送到 GitHub」时一并部署）。

## 备用

GitHub Pages：https://cgd1093702532-star.github.io/personal-site/
