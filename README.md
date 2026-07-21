# 英雄广场

英雄广场 · 水上运动俱乐部（**微信小程序** + **管理后台**）

> Cursor 工作区根目录：`英雄广场/`（本文件夹）

## 仓库结构

```
英雄广场/
├── miniprogram/              # 微信小程序（微信开发者工具导入本文件夹根目录）
│   ├── app.js / app.json / app.wxss
│   ├── pages/                # 18 个页面
│   ├── components/           # 组件
│   ├── styles/tokens.wxss    # Design Tokens
│   └── assets/               # 图片、Tab 图标
├── admin/                    # 管理后台（Web，M1 脚手架）
│   └── src/pages/            # 8 个页面 .vue
├── docs/
│   ├── PRD.md                # 产品总纲
│   ├── PAGES.md              # 页面总索引（小程序 / 后台对照）
│   ├── DESIGN-SPEC.md        # UI 设计规范
│   ├── miniprogram/pages/    # 小程序 · 单页需求（21 份）
│   └── admin/pages/          # 后台 · 单页需求（10 份）
├── project.config.json       # miniprogramRoot: miniprogram/
└── .cursor/rules/            # Cursor AI 规则
```

## 快速开始 · 小程序

1. [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) → **导入项目**
2. 目录选：**`英雄广场`**（本文件夹根目录，非 `miniprogram/` 子目录）
3. `project.config.json` 已配置 `miniprogramRoot`
4. 将 `appid` 改为真实 AppID

## Tab 栏（已确认 · 同 Figma）

| Tab | 路径 | 说明 |
|-----|------|------|
| 首页 | `pages/index` | Figma 营销首页 |
| 英雄 | `pages/heroes` | 教练列表（英雄广场） |
| 商城 | `pages/mall` | 占位 |
| 我的 | `pages/profile` | 个人中心 |

**M1 不做「消息」Tab。**

## 快速开始 · 管理后台

见 [`admin/README.md`](admin/README.md)。M1 优先小程序 + 后台英雄/招募管理。

## 需求文档

- 页面总索引：[`docs/PAGES.md`](docs/PAGES.md)
- 总纲：[`docs/PRD.md`](docs/PRD.md)
- 小程序：[`docs/miniprogram/pages/README.md`](docs/miniprogram/pages/README.md)
- 后台：[`docs/admin/pages/README.md`](docs/admin/pages/README.md)
- UI：[`docs/DESIGN-SPEC.md`](docs/DESIGN-SPEC.md)

## 在线预览（给协作者）

优先用 **Cloudflare Pages**（国内一般比 `github.io` 好开，且按网页渲染）。  
**不要**用 jsDelivr 打开 `.html`：会显示源码。

说明：[docs/CLOUDFLARE-PAGES.md](docs/CLOUDFLARE-PAGES.md)

| 入口 | 地址 |
|------|------|
| 总入口 | https://personal-site-1e8.pages.dev/ |
| 小程序预览 | https://personal-site-1e8.pages.dev/miniprogram/index.html |
| 后台预览 | https://personal-site-1e8.pages.dev/admin/dashboard.html |

备用（GitHub Pages）：https://cgd1093702532-star.github.io/personal-site/  
推送 `main` 后请同步部署 Cloudflare（`bash scripts/deploy-to-cloudflare.sh`）或由协作 AI 在推送后执行；GitHub Pages 仍由 Actions 自动更新。

## Cursor

请 **Open Folder** 打开本仓库根目录。规则按 `miniprogram/**` 与 `admin/**` 分别生效。
