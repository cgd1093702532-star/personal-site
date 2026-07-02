# 个人站 · 技术规格要求

> **文档版本**：v1.0  
> **更新日期**：2026-07-01  
> **已确认决策**：纯 HTML + CSS · GitHub Pages · 首版无访问统计  
> **验收基准**：本文档 + [DESIGN-SPEC.md](./DESIGN-SPEC.md) §12 交付检查清单

---

## 1. 功能范围

### 1.1 必须实现（P0 — 没有就不能上线）

| ID | 功能 | 规格 |
|----|------|------|
| F-01 | 单页区块结构 | 顺序与 [DESIGN-SPEC.md](./DESIGN-SPEC.md) §1.3 内容漏斗一致 |
| F-02 | 顶栏固定导航 | 锚点跳转至各区块；移动端汉堡菜单 |
| F-03 | 平滑滚动 | 使用 `scroll-behavior: smooth`；尊重 `prefers-reduced-motion` |
| F-04 | CTA 转化链路 | 顶栏、Hero、定价区、页脚各至少 1 处有效 CTA |
| F-05 | 案例 Tab 切换 | 无 JS 时可用纯 CSS 或 `<details>` 降级；有 JS 时增强体验 |
| F-06 | FAQ 折叠 | 语义化 `<details>` / `<summary>` |
| F-07 | 联系区 | 微信二维码（必）+ 邮箱或预约链接（可选） |
| F-08 | GitHub Pages 可访问 | 部署后通过公开 URL 正常打开，HTTPS 生效 |

### 1.2 建议实现（P1 — 有更好，没有也能上线）

| ID | 功能 | 规格 |
|----|------|------|
| F-09 | 返回顶部按钮 | 滚动超过 1 屏后显示；触控区域 ≥ 44px |
| F-10 | 图片懒加载 | 非首屏图片使用 `loading="lazy"` |
| F-11 | Open Graph 标签 | 微信分享时显示标题、描述、预览图 |
| F-12 | favicon | 浏览器标签页图标 |
| F-13 | robots.txt + sitemap.xml | 便于搜索引擎收录 |

### 1.3 首版明确不做

| 项目 | 说明 |
|------|------|
| 访问统计 | 不含 Umami、Plausible、百度统计、Google Analytics |
| 用户系统 | 无注册、登录、评论 |
| 在线支付 | 无 |
| 服务端 API | 无 |
| 多语言 | 仅简体中文 |
| 暗色模式 | v1 不做（可在 v2 基于系统偏好扩展） |
| 在线表单提交 | v1 不做（联系以扫码/邮件为主） |

---

## 2. 非功能需求

### 2.1 性能

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| LCP（最大内容绘制） | < 2.5s | Chrome Lighthouse · Mobile |
| INP（交互响应） | < 200ms | Lighthouse |
| CLS（布局偏移） | < 0.1 | Lighthouse |
| 首屏 HTML + CSS | < 100KB（gzip） | 文件大小统计 |
| 首屏 JS | 0 ~ 15KB（gzip） | 无框架前提下 |
| 整页总重量 | < 800KB（含图片） | 浏览器 Network 面板 |

**资源策略：**

- Hero 头像：WebP，宽 ≤ 400px，< 50KB
- 案例截图：WebP，宽 ≤ 800px，单张 < 120KB
- CSS：可拆分多文件，但禁止引入大型 CSS 框架
- 禁止：未使用的 CSS 框架、大型 icon 字体库、阻塞渲染的第三方脚本

### 2.2 浏览器兼容性

| 环境 | 要求 |
|------|------|
| Chrome / Edge | 最近 2 个大版本 |
| Safari（含 iOS） | 最近 2 个大版本 |
| Firefox | 最近 2 个大版本 |
| 微信内置浏览器 | 正常浏览、点击 CTA、扫码可用 |

**不保证：** IE11 及更早版本。

### 2.3 无障碍

- 正文对比度 ≥ 4.5:1（DESIGN-SPEC 中 `--ink` 于 `--paper` 上）
- 所有可交互元素可用键盘 Tab 聚焦，且有可见 focus 样式
- 内容图片提供有意义的 `alt`；纯装饰图用 `alt=""`
- 导航使用 `<nav aria-label="主导航">`
- 动效：在 `prefers-reduced-motion: reduce` 时关闭非必要动画
- FAQ 使用 `<details>` 元素，不用纯 div 模拟

### 2.4 SEO

```html
<html lang="zh-CN">
<head>
  <title>{姓名} · {定位关键词}</title>
  <meta name="description" content="120~160 字价值主张" />
  <link rel="canonical" href="https://你的域名/" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="zh_CN" />
  <meta property="og:title" content="{姓名} · {定位关键词}" />
  <meta property="og:description" content="120~160 字价值主张" />
  <meta property="og:image" content="https://你的域名/assets/brand/og-image.webp" />
</head>
```

- 全页仅 1 个 `<h1>`（位于 Hero）
- 每个内容区块使用 `<section id="...">` + 正确的 heading 层级
- 提供 `robots.txt` 与 `sitemap.xml`（单 URL 站点也建议有）

### 2.5 安全

- 全站 HTTPS（GitHub Pages 默认提供）
- 首版不嵌入第三方脚本（因不含统计工具，天然满足）
- 外链使用 `rel="noopener noreferrer"`
- 不在页面中暴露私人 API Key、Token 等敏感信息

---

## 3. 信息架构与 URL

### 3.1 首版 URL 结构

```
/                         → index.html（全部内容）
/robots.txt               → 搜索引擎规则
/sitemap.xml              → 站点地图
/assets/brand/            → 头像、Logo、OG 预览图
/assets/cases/            → 案例截图
/assets/qr/               → 微信二维码
/styles/                  → CSS 文件
/scripts/                 → JS 文件（若有）
```

### 3.2 区块锚点命名

使用 kebab-case（小写 + 连字符）：

| 区块 | 建议 id |
|------|---------|
| 首屏 | `#hero` |
| 关于我 | `#about` |
| 痛点 | `#pain-points` |
| 服务/产品 | `#services` |
| 交付/价值 | `#delivery` |
| 适合人群 | `#audience` |
| 案例 | `#cases` |
| 定价 | `#pricing` |
| FAQ | `#faq` |
| 联系 | `#contact` |

顶栏导航链接与上述 id 一一对应。

---

## 4. 目录结构

```
个人站/
├── docs/
│   ├── DESIGN-SPEC.md           # 设计规范
│   ├── TECH-STACK.md            # 技术选型（本文档姊妹篇）
│   ├── TECH-SPEC.md             # 本文件
│   └── FRONTEND-CONSTRAINTS.md  # 前端编码约束
├── index.html                   # 首页（GitHub Pages 入口）
├── styles/
│   ├── tokens.css               # Design Tokens（:root 变量）
│   ├── base.css                 # 重置、排版、全局容器
│   ├── components.css           # 按钮、卡片、导航等组件
│   └── sections.css             # 各区块样式
├── scripts/
│   └── main.js                  # 可选；Tab、移动菜单等
├── assets/
│   ├── brand/                   # 头像、Logo、OG 图
│   ├── cases/                   # 案例截图
│   └── qr/                      # 联系二维码
├── robots.txt
├── sitemap.xml
└── .cursor/rules/
    └── frontend-development.mdc # AI 开发约束
```

**命名规范：**

- 文件名：kebab-case（如 `pain-points.css`）
- CSS 类名：BEM 风格 `block__element--modifier`
- 图片：`{类别}-{描述}-{宽度}w.webp`（如 `brand-avatar-400w.webp`）

---

## 5. GitHub Pages 部署要求

| 项目 | 要求 |
|------|------|
| 入口文件 | 仓库根目录必须有 `index.html` |
| 分支 | 通常使用 `main` 分支作为 Pages 源 |
| 路径 | 资源使用相对路径或根路径，避免本地绝对路径 |
| 自定义域名 | 可选；在仓库根目录添加 `CNAME` 文件 |
| 404 | 单页站点通常不需要；若后续扩展子页面再配置 |

**GitHub Pages 子路径注意：** 若仓库名不是 `{用户名}.github.io`，站点会部署在 `/{仓库名}/` 子路径下，CSS/JS/图片路径需与此一致（或使用相对路径）。

---

## 6. 验收测试清单

### 6.1 功能

- [ ] 所有锚点导航跳转正确（含固定顶栏遮挡 offset）
- [ ] 移动端汉堡菜单可开/关
- [ ] 案例 Tab 可切换
- [ ] FAQ 可展开/折叠
- [ ] 微信二维码可扫码识别
- [ ] GitHub Pages URL 可公开访问

### 6.2 视觉与结构

- [ ] [DESIGN-SPEC.md](./DESIGN-SPEC.md) §12 交付检查清单全部通过
- [ ] 全页仅 1 个 H1
- [ ] 色彩、间距符合 Design Tokens

### 6.3 性能与体验

- [ ] Lighthouse Performance ≥ 90（Mobile）
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Lighthouse SEO ≥ 95
- [ ] iPhone SE / 大屏手机无横向滚动
- [ ] 弱网（Fast 3G）下 3 秒内可读首屏文案

### 6.4 首版特别确认

- [ ] 页面中 **无** 统计脚本（无 Umami / Plausible / GA / 百度统计 embed 代码）
- [ ] 页面中 **无** 不必要的第三方 widget

---

## 7. 运维

| 项目 | 方案 |
|------|------|
| 源码备份 | Git + GitHub 仓库即备份 |
| 更新发布 | 修改文件 → git push → GitHub Pages 自动更新 |
| 回滚 | Git revert 到上一版本 → push |
| 监控 | 首版不做；可用手动访问确认 |

---

## 8. 后续可加功能（非首版）

当需要时再单独开需求，不纳入首版验收：

| 功能 | 参考方案 |
|------|----------|
| 访问统计 | Umami Cloud 或 Plausible |
| 博客/子页面 | 迁移至 Astro |
| 在线表单 | Formspree |
| 自定义域名 | GitHub Pages + CNAME |
