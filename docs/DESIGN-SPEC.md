# UI 设计规范（DESIGN-SPEC）

> 从 Figma「店铺装修 · 定稿 · 卡布里蓝-切图」提取  
> 来源：[Figma 链接](https://www.figma.com/design/FQerHrZBo3Kx7ddFq7jKYx/%E5%BA%97%E9%93%BA%E8%A3%85%E4%BF%AE?node-id=8777-1717)  
> 提取日期：2026-07-03  
> 标准页面 Frame：`7765:1646`（375 × 2119，移动端首页）

---

## 1. 设计定位

| 项 | 值 |
|---|---|
| 产品类型 | 水上运动 / 帆船俱乐部 小程序首页 |
| 视觉主题 | **卡布里蓝** — 海洋蓝 + 金色 CTA + 白底内容区 |
| 设计基准宽度 | **375px**（移动优先，iPhone 标准） |
| 内容区宽度 | **343px**（左右各 16px 边距） |
| 字体栈 | `PingFang SC`（UI 主字体）、`Source Han Sans SC`（Banner 大标题） |

---

## 2. Design Tokens

### 2.1 颜色 — Primitive

```css
:root {
  /* 品牌主色 */
  --color-primary: #1b579c;           /* 图标圆底、Tab 选中态 */
  --color-accent: #fecf13;            /* 主 CTA、赛事标签 */
  --color-accent-gold: #e3c086;       /* 权益卡标题高亮 */
  --color-accent-gold-light: #ddc6a0; /* 权益卡价格 */

  /* 功能色 */
  --color-activity: #f47528;        /* 活动标签、教练徽章 */
  --color-activity-bg: #fde3d4;     /* 教练认证背景 */
  --color-price: #eb590d;           /* 课程/商品价格 */
  --color-course-tag: #09633f;      /* 课程标签文字 */
  --color-course-tag-bg: rgba(0, 199, 119, 0.4);

  /* 文字 */
  --color-text-primary: #222222;
  --color-text-secondary: #5c6c7a;   /* 「查看更多」 */
  --color-text-body: #1d2d38;        /* 卡片标题、教练信息 */
  --color-text-muted: #888888;       /* Figma 变量：灰度/888 */
  --color-text-tag: #3e4f5b;        /* 技能标签 */
  --color-text-inverse: #ffffff;

  /* 背景 */
  --color-bg-page: #ffffff;
  --color-bg-subtle: #fafafa;        /* 课程卡片底 */
  --color-bg-gray: #f5f5f5;          /* Figma 变量：灰度/F5 */
  --color-bg-hero-card: linear-gradient(180deg, #dbe6ff 0%, #f6f9ff 100%);
  --color-bg-navy-footer: linear-gradient(90deg, #0c3c86 0%, #0f347a 100%);

  /* 分割 / 边框 */
  --color-divider: #e1e5e8;
  --color-divider-navy: #103cb7;

  /* 遮罩 */
  --color-overlay-light: rgba(0, 0, 0, 0.24);
  --color-overlay-medium: rgba(0, 0, 0, 0.2);
  --color-overlay-card: rgba(255, 255, 255, 0.7);
}
```

### 2.2 字号与字重

| Token | 字号 | 字重 | 行高 | 用途 |
|-------|------|------|------|------|
| `--text-hero` | 24px | Bold/Heavy | 30px | Banner 主标题 |
| `--text-section-title` | 18px | Semibold | 26px | 区块标题（英雄广场、精选课程…） |
| `--text-card-title` | 14px | Medium | 20px | 卡片标题、按钮、价格 |
| `--text-body` | 12px | Regular | 18px | 正文、导航标签、金刚区 |
| `--text-caption` | 11px | Regular | 15px | 副标题、时间、地点 |
| `--text-micro` | 10px | Regular | 14px | 类型标签、Tab 文字 |
| `--text-price-lg` | 16px | Semibold | — | 权益卡价格数字 |
| `--text-price-xl` | 18px | Bold | — | 权益卡标题 |

**字重对应：** Regular 400 · Medium 500 · Semibold 600 · Bold 700

### 2.3 间距

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-page-x` | 16px | 页面左右边距 |
| `--space-section-y` | 32px | 大区块间距（约） |
| `--space-card-gap` | 8px | 卡片内元素间距 |
| `--space-tag-gap` | 4px | 标签内边距 px |
| `--space-list-gap` | 10px | 新闻列表图文间距 |

### 2.4 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | 4px | 类型标签、小徽章 |
| `--radius-md` | 8px | 卡片、按钮、图片（**最常用**） |
| `--radius-pill` | 12px | 航季胶囊标签 |
| `--radius-circle` | 32px / 50% | 金刚区图标（48×48 圆） |
| `--radius-home-indicator` | 17px | 底部 Home 指示条 |

### 2.5 阴影

```css
--shadow-icon: 0 0 4px rgba(0, 0, 0, 0.08);
--shadow-card: 0 4px 4px rgba(0, 0, 0, 0.25);
--shadow-text-on-image: 0 4px 4px rgba(0, 0, 0, 0.25);
```

### 2.6 模糊

```css
--blur-tag: 4.45px;   /* Banner 航季标签 backdrop-blur */
--blur-time: 3px;     /* 赛事时间条 backdrop-blur */
```

---

## 3. 页面结构（首页模板）

自上而下区块顺序（与 Figma slice 命名一致）：

```
┌─────────────────────────────┐
│  Banner（281px）             │  全宽背景图 + 标题 + CTA
├─────────────────────────────┤
│  金刚区（105px）              │  4 个快捷入口图标
├─────────────────────────────┤
│  权益卡（97px）               │  航海家权益卡促销
├─────────────────────────────┤
│  英雄广场                     │  横向滚动教练卡片
├─────────────────────────────┤
│  精选活动与赛事               │  纵向活动 Banner 列表
├─────────────────────────────┤
│  精选课程                     │  横向滚动课程卡片
├─────────────────────────────┤
│  精选好物                     │  双列商品网格
├─────────────────────────────┤
│  新闻动态                     │  图文列表（4:3 缩略图）
├─────────────────────────────┤
│  底部 Tab Bar（81px）         │  首页 / 英雄 / 商城 / 我的
└─────────────────────────────┘
```

---

## 4. 组件规范

### 4.1 区块标题（Section Header）

复用于：英雄广场、精选活动与赛事、精选课程、精选好物、新闻动态

| 属性 | 值 |
|------|-----|
| 布局 | 左标题 + 右「查看更多」+ 16px 箭头 |
| 标题 | 18px Semibold，`--color-text-primary` |
| 链接 | 12px Regular，`--color-text-secondary` |
| 箭头 | 16×16，向右（设计稿中为 `icon/right` 旋转 180°） |
| 高度 | 26px（部分区块 25px） |

### 4.2 主按钮（Primary CTA）

**样式 A — 金色实心（Banner / 权益卡）**

| 属性 | 值 |
|------|-----|
| 背景 | `#fecf13` |
| 文字 | 14px Regular，`#222` |
| 内边距 | 8px 12px（Banner）/ 高度 36px（权益卡） |
| 圆角 | 8px |

**样式 B — 白色实心（活动卡片）**

| 属性 | 值 |
|------|-----|
| 背景 | `#ffffff` |
| 文字 | 14px Regular，`#222` |
| 内边距 | 6px 12px |
| 圆角 | 8px |

### 4.3 类型标签（Category Tag）

| 类型 | 背景 | 文字 | 字号 |
|------|------|------|------|
| 赛事 | `#fecf13` | `#222`（或 `#000`） | 10px |
| 活动 | `#f47528` | `#ffffff` | 10px |
| 课程 | `rgba(0,199,119,0.4)` | `#09633f` | 10px |
| 技能（教练） | `#ffffff` | `#3e4f5b` | 10px |

共同：`padding: 0 4px`，`border-radius: 4px`，高度约 14–15px

### 4.4 金刚区快捷入口

| 属性 | 值 |
|------|-----|
| 图标容器 | 48×48，`#1b579c` 圆形，`--shadow-icon` |
| 图标尺寸 | 26–34px 居中 |
| 标签 | 12px Regular，`#222`，图标下方 4px |
| 列间距 | 约 40px（4 列均分 375 宽） |

入口项：船艇预约 · 活动赛事 · 精选课程 · 好物推荐

### 4.5 Banner 区

| 元素 | 规格 |
|------|------|
| 高度 | 281px，全宽 |
| 航季标签 | 100×24，半透明黑底 + blur，12px 圆角，11px 白字 + 4px 圆点 |
| 主标题 | 24px Bold 白字，字间距 0.48px，两行 |
| 副标题 | 12px Regular 白字 |
| CTA | 「查看活动」，金色按钮 |

### 4.6 权益卡（Membership Card）

| 属性 | 值 |
|------|-----|
| 尺寸 | 343×97，居中，`border-radius: 8px` |
| 标题 | 「航海家」白色 + 「权益卡」`#e3c086`，18px Bold |
| 价格 | ￥14px + 300/16px，`#ddc6a0` |
| CTA | 100×36 金色按钮「立即开通」+ 20px 箭头圆 |
| 底部权益条 | 28px 高，navy 渐变，11px 白字 + 16px 对勾 |

### 4.7 英雄卡片（Hero Card）— 横向滚动

| 属性 | 值 |
|------|-----|
| 卡片尺寸 | 264×189 |
| 背景 | `#dbe6ff → #f6f9ff` 纵向渐变 |
| 头像 | 48×48，`border-radius: 8px` |
| 姓名 | 14px Medium `#222` |
| 认证条 | 左 `#f47528` 16px 方块 + 皇冠图标 + 「ASA帆船认证教练」11px |
| 经验标签 | `#fde3d4` 背景，「15年经验」11px |
| 动态行 | 32px 高，`rgba(255,255,255,0.7)` 底，左类型标签 + 状态文字 + 右箭头 |

状态前缀：`招募中｜` · `报名中｜`（12px Medium）

### 4.8 活动/赛事卡片（Event Banner Card）

| 属性 | 值 |
|------|-----|
| 尺寸 | 343×103 |
| 背景 | 全宽图片 + 底部渐变遮罩（透明→20%/40% 黑） |
| 圆角 | 4px（赛事）/ 8px（活动） |
| 时间条 | 左上，`backdrop-blur 3px`，`rgba(0,0,0,0.2)`，11px 白字 |
| 标题 | 14px Medium 白字 |
| 地点 | 11px Regular 白字 |
| 价格 | 14px Semibold 白字 + 8px「/」+ 11px「人」，带文字阴影 |
| CTA | 右下白色「立即报名」按钮 |

卡片间距：约 8px（103 + 8 = 111 递进）

### 4.9 课程卡片（Course Card）— 横向滚动

| 属性 | 值 |
|------|-----|
| 尺寸 | 128×176 |
| 背景 | `#fafafa`，`border-radius: 8px` |
| 封面 | 128×96，顶部圆角 8px |
| 标题 | 14px Medium `#1d2d38`，最多 2 行 |
| 价格 | 14px Regular `#eb590d`，「¥」+ 数字 |
| 待定态 | 「待定中」14px `#eb590d` |
| 卡片间距 | 8px（128 + 8 = 136 递进） |

### 4.10 商品卡片（Product Card）

| 属性 | 值 |
|------|-----|
| 图片 | 166×166（或 152 宽），`border-radius: 8px` |
| 标题 | 14px Medium `#1d2d38`，单行省略 |
| 价格 | ¥ 14px + 数字 16px，`#eb590d` |
| 布局 | 双列，列间距约 11px |

### 4.11 新闻列表项（Article List Item）

组件名：`卡片/专题文章/详细列表-4:3`

| 属性 | 值 |
|------|-----|
| 布局 | 左图右文，gap 10px，宽 343px |
| 缩略图 | 110×84，`border-radius: 8px` |
| 标题 | 14px Medium `#222`，line-height 20px，最多 2 行 |
| 分类 | 10px Regular `#888` |
| 行高 | 84px + 间距 ≈ 96px 行距 |

### 4.12 底部 Tab Bar

| 属性 | 值 |
|------|-----|
| 总高 | 81px（含 32px 安全区 + 49px Tab） |
| 顶部分割线 | 1px `#e1e5e8` |
| Tab 项 | 4 个：首页 · 英雄 · 商城 · 我的 |
| 图标 | 24×24 |
| 文字 | 10px，未选中 `#222` Regular，选中 `#1b579c` Medium |
| Home 指示条 | 140×5，`#000`，`border-radius: 17px` |

---

## 5. 布局规则

| 规则 | 说明 |
|------|------|
| 页面边距 | 水平 16px 固定 |
| 内容最大宽 | 343px（375 − 32） |
| 横向滚动区 | 英雄卡片、课程卡片 — 左侧从 16px 起，右侧可溢出 |
| 纵向列表 | 活动卡片、新闻 — 全宽 343px 堆叠 |
| 图片 | `object-fit: cover`，重要区域指定 `object-position` |
| 文字截断 | 商品标题、新闻标题单行/双行 ellipsis |

---

## 6. 渐变与遮罩模式

```css
/* 活动卡片底部遮罩（典型） */
background: linear-gradient(180deg, rgba(0,0,0,0) 1%, rgba(0,0,0,0.4) 87%);

/* 权益卡底部条 */
background: linear-gradient(90deg, #0c3c86 0%, #0f347a 100%);

/* 英雄卡片背景 */
background: linear-gradient(180deg, #dbe6ff 0%, #f6f9ff 100%);
```

---

## 7. 图标与资产

- 图标以 Figma 导出 SVG/PNG 为准，尺寸见各组件说明
- 常用图标：`icon/right`（16px 箭头）、`icon/shouye`（首页 Tab）、对勾（16px）
- 禁止引入第三方图标库替代 Figma 资产（见 `.cursor/rules/figma-mcp.mdc`）

---

## 8. 与微信小程序开发约束的对齐

本规范源自 **375px** Figma 稿，落地到 **`miniprogram/`** 原生小程序：

| Figma 稿 | 小程序适配 |
|----------|-----------|
| 375px 设计宽 | **750rpx**；`1px = 2rpx` |
| Tab 栏 | **首页 / 英雄 / 商城 / 我的**（同 Figma，`miniprogram/app.json`） |
| 营销首页 | `pages/index` — 完整 Figma 卡布里蓝切图 |
| 英雄广场列表 | `pages/heroes` — Tab「英雄」 |
| 所有色值 | `miniprogram/styles/tokens.wxss`，禁止硬编码 |

管理后台 UI 可引用本规范色彩与组件语义，代码在 **`admin/`** 独立实现。

---

## 9. Figma 源信息

| 项 | 值 |
|---|---|
| 文件 | 店铺装修 |
| fileKey | `FQerHrZBo3Kx7ddFq7jKYx` |
| 定稿 Section | `8777:1717` |
| 标准首页 Frame | `7765:1646`（卡布里蓝-切图） |
| Figma 变量 | `灰度/888` → `#888888`，`灰度/F5` → `#F5F5F5` |

---

## 10. 待确认 / 后续补充

- [ ] 其他页面 Frame（内页、表单、详情）待补充链接
- [ ] Desktop / Tablet 断点变体（当前仅 375 移动端）
- [ ] 交互态：按钮 pressed、disabled、loading
- [ ] 空状态、错误态、骨架屏
- [ ] 是否与现有线上代码有差异（标注「以 Figma 定稿为准」或「以线上为准」）

---

*本文档由 Figma MCP 自动提取并经人工整理。确认后可作为后续中轴功能迭代的 UI 基准。*
