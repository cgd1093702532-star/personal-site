# 个人站 · 前端开发约束

> **文档版本**：v1.0  
> **更新日期**：2026-07-01  
> **已确认决策**：纯 HTML + CSS · GitHub Pages · 首版无访问统计  
> **开发前必读**：[DESIGN-SPEC.md](./DESIGN-SPEC.md) · [TECH-STACK.md](./TECH-STACK.md) · [TECH-SPEC.md](./TECH-SPEC.md)  
> **AI 辅助开发**：同步遵守 `.cursor/rules/frontend-development.mdc`

---

## 1. 总原则

1. **设计规范优先** — 颜色、字号、间距以 DESIGN-SPEC 的 Design Tokens 为准，禁止临时发明样式
2. **移动优先** — 先写 `< 768px` 布局，再用 `min-width` 媒体查询增强
3. **语义优先** — 能用 HTML 语义元素就不用 div 堆叠
4. **渐进增强** — 核心内容无 JS 也能阅读；JS 只做体验增强
5. **最小改动** — 不引入与需求无关的库、框架或过度抽象
6. **首版零统计** — 不添加任何访问统计脚本或第三方追踪代码

---

## 2. HTML 约束

### 2.1 文档骨架

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>姓名 · 定位关键词</title>
  <meta name="description" content="120~160 字价值主张" />
  <link rel="stylesheet" href="styles/tokens.css" />
  <link rel="stylesheet" href="styles/base.css" />
  <link rel="stylesheet" href="styles/components.css" />
  <link rel="stylesheet" href="styles/sections.css" />
</head>
<body>
  <header>...</header>
  <main>
    <section id="hero">...</section>
    <!-- 其余 section -->
  </main>
  <footer>...</footer>
  <script src="scripts/main.js" defer></script>
</body>
</html>
```

### 2.2 必须遵守

- 全页 **仅 1 个** `<h1>`，位于 Hero 区块
- 区块标题从 `<h2>` 起，不跳级（如 h2 后直接 h4 ❌）
- 导航放在 `<nav aria-label="主导航">` 内
- CTA 使用 `<a href="#contact">` 或 `<button type="button">`；禁止 `<div onclick>`
- 外链加 `target="_blank" rel="noopener noreferrer"`
- 列表使用 `<ul>` / `<ol>`，不用 div 模拟
- FAQ 使用 `<details>` + `<summary>`
- 每个内容区块使用 `<section id="...">` 并含对应 heading

### 2.3 禁止

- 内联 `style=""`（调试用除外，提交前必须移除）
- 内联事件处理器 `onclick=""` 等（统一在 `main.js` 绑定）
- 空链接 `href="#"` 且无明确用途
- 多个 `<h1>`
- 无 heading 的空 `<section>`

---

## 3. CSS 约束

### 3.1 Design Tokens

- **所有**颜色、圆角、阴影必须来自 `:root` CSS 变量（见 DESIGN-SPEC §2.1）
- 间距优先使用 `--space-*` 尺度（见 DESIGN-SPEC §4.2）
- 禁止硬编码色值：`color: #004080` ❌ → `color: var(--brand)` ✅

### 3.2 布局

- 标准内容区宽度：`width: min(1180px, calc(100% - 40px)); margin: 0 auto;`
- 使用 Grid / Flexbox；禁止 float 布局
- 断点与 DESIGN-SPEC §8 一致：

| 名称 | 宽度 | 策略 |
|------|------|------|
| Mobile | `< 768px` | 默认样式，单列 |
| Tablet | `768px ~ 1023px` | 两列或折行 |
| Desktop | `≥ 1024px` | 完整多栏 |

```css
/* 移动优先示例 */
.pain-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
}
@media (min-width: 768px) {
  .pain-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .pain-grid { grid-template-columns: repeat(4, 1fr); }
}
```

### 3.3 类命名（BEM）

```
.btn / .btn--primary / .btn--ghost
.card / .card__title / .card--dark
.section / .section--band
.stat / .stat__value / .stat__label
.nav / .nav__link / .nav__toggle
```

新增组件前先搜索是否已有可复用 class，避免重复定义。

### 3.4 禁止

- `!important`（`prefers-reduced-motion` 全局覆盖除外）
- 用 ID 选择器写样式（ID 仅用于锚点与 JS hook）
- 选择器嵌套超过 3 层
- 引入 Bootstrap、Tailwind 等 CSS 框架（首版）
- `@import` 远程 CSS 文件
- 硬编码 magic number（应映射到 token 或 spacing scale）

### 3.5 动效与无障碍

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 3.6 固定顶栏锚点偏移

```css
section[id] {
  scroll-margin-top: 80px; /* 顶栏高度 + 缓冲，按实际调整 */
}
```

---

## 4. JavaScript 约束

### 4.1 允许的功能范围

| 功能 | 实现方式 |
|------|----------|
| 移动端导航开关 | `aria-expanded` + class toggle |
| 案例 Tab 切换 | 按钮切换 active class 或 `role="tab"` 模式 |
| 返回顶部 | 可选 |
| 平滑滚动 | 优先 CSS `scroll-behavior: smooth` |

### 4.2 规范

- 单入口 `scripts/main.js`，使用 `defer` 加载（不用 `type="module"`，以便双击 `index.html` 直接预览）
- 不污染全局命名空间
- 事件委托优先于大量单独绑定
- scroll / resize 监听需节流

### 4.3 禁止

- jQuery、React、Vue 等框架（首版）
- `document.write`
- 阻塞渲染的 `<script>`（无 defer/async）
- **任何访问统计脚本**（Umami、Plausible、GA、gtag、百度统计等）
- 未评估的第三方 widget（在线客服、广告等）

---

## 5. 图片与静态资源

| 类型 | 规则 |
|------|------|
| 格式 | 照片用 WebP；图标用 SVG |
| 尺寸属性 | 必须提供 `width` 和 `height`，防止 CLS |
| 懒加载 | 非 LCP 图片：`loading="lazy"` |
| LCP 图片 | 禁止 lazy；可加 `fetchpriority="high"` |
| alt 文本 | 内容图写描述性 alt；装饰图 `alt=""` |
| 路径 | 使用相对路径，兼容 GitHub Pages 子路径部署 |

**GitHub Pages 路径提示：** 若站点部署在 `username.github.io/repo-name/`，资源引用建议使用相对路径（如 `assets/brand/avatar.webp`）而非以 `/` 开头的绝对路径。

---

## 6. 第三方集成边界（首版）

| 集成 | 首版 | 说明 |
|------|------|------|
| 微信二维码 | ✅ 允许 | 本地 `assets/qr/` 托管 |
| 访问统计 | ❌ 禁止 | 首版明确不含 |
| 在线客服插件 | ❌ 禁止 | 影响性能与视觉 |
| CDN 字体 | ❌ 禁止 | 使用系统字体栈 |
| 社交媒体 embed | ❌ 禁止 | 首版不做 |

---

## 7. Git 提交约定（建议）

```
feat(hero): 完成首屏结构与样式
fix(nav): 修复移动端菜单无法关闭
style(tokens): 对齐 DESIGN-SPEC 色值
docs: 更新 TECH-SPEC 验收项
```

---

## 8. 提交前自检清单

- [ ] 无硬编码色值与随意 magic number
- [ ] 移动端无横向滚动（overflow-x）
- [ ] 按钮与链接触控区域 ≥ 44×44px
- [ ] 全页仅 1 个 H1，heading 层级正确
- [ ] 新图片已压缩且含 width/height
- [ ] `prefers-reduced-motion` 已处理
- [ ] 未引入 npm 依赖或 CSS/JS 框架
- [ ] **页面中无任何统计脚本**
- [ ] [DESIGN-SPEC.md](./DESIGN-SPEC.md) §12 相关项仍通过
- [ ] [TECH-SPEC.md](./TECH-SPEC.md) §6 验收项可勾选
