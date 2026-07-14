# 实现计划：营销首页活动大图卡对齐与英雄区同壳

> 日期：2026-07-14  
> 依据：[2026-07-14-home-event-hero-cards-design.md](../specs/2026-07-14-home-event-hero-cards-design.md)  
> 范围：预览站营销首页（不做小程序原生页）

---

## 目标

1. 「精选活动与赛事」`event-card--hero` 视觉对齐效果图。
2. 「英雄广场」横滑改为同款大图卡，展示该英雄代表赛事/活动。
3. 同步 `营销首页.md`。

---

## 任务拆分

### Task 1 · CSS：对齐 `event-card--hero` + 横滑同壳

**文件：** `preview/assets/preview.css`

1. 微调 `.event-card--hero`：
   - 高度约 `152–160px`（现 148，可略增）
   - 圆角 `12px` 保持
   - `.event-card__btn`：圆角改为更接近胶囊（如 `999px` 或 `20px`），白底深字
   - `.event-card__footer` 与信息区对齐：价格与按钮在右下，与标题区底部齐平
   - 遮罩可略加强底部暗度，保证白字可读
2. 英雄横滑改用同壳时的样式：
   - `.home-scroll-x .event-card--hero`（或 `.event-card--hero.event-card--home`）：`flex-shrink: 0; width: 280px; height: 同活动卡; margin-bottom: 0`
   - 移除/停用横滑内旧 `.home-scroll-x .hero-card` 渐变白卡样式对首页的影响（列表页 `hero-card--list` 不动）

**验收：** 活动区三卡视觉贴近效果图；横滑卡宽 280、高度一致。

---

### Task 2 · 静态 HTML：英雄区兜底改为大图卡

**文件：** `preview/miniprogram/index.html`

1. `#home-hero-track` 内三张 `hero-card--home` 替换为 `event-card event-card--hero`（可加 `event-card--home` 修饰类），结构与下方精选区一致：
   - `bg` / `scrim` / `time` / `tag` / `title` / `meta` / `price` / `btn`
2. 兜底内容用各英雄代表招募（与现静态行一致的赛事优先），例如：
   - 小哥 → 企业家杯月赛
   - 熊猫 → 金鸡湖浆板周末联赛
   - Amy → 开放水域潜水体验营（或现有静态活动）
3. `href` 指向对应 `recruitment-detail.html?id=…`
4. 精选区三卡：仅在结构已对齐时做小幅 class/文案微调；数据可保持现状。

**验收：** 断网/无 API 时首页英雄区仍是大图卡，无头像三行。

---

### Task 3 · JS：`home-heroes-preview.js` 渲染代表招募卡

**文件：** `preview/assets/home-heroes-preview.js`

1. 新增/改写卡片 HTML 生成：输出 `event-card--hero` 结构，不再输出 `hero-card__head` / `hero-card__rows`。
2. 代表招募选择：
   - 从该英雄关联招募中优先 `event`，否则 `activity`
   - 与精选区前 3 条 `recruit_id` 去重：冲突则换下一条；仍冲突可保留
3. 字段格式化：
   - 时间：`MM/DD (周X) HH:mm-HH:mm`；缺失则隐藏胶囊或「时间待定」
   - 价格：有费用 → `¥N/人`；无 → `价格待定`
   - 封面：招募封面 → 默认 `event.jpg` / `recruit-cover.jpg`
   - 色点：赛事黄 / 活动橙
4. 无代表招募的英雄跳过；横滑为空则隐藏 `#home-heroes-section`。
5. 保留 `focus` / `storage` 刷新逻辑。

**验收：** API 可用时横滑为大图卡；点击进招募详情；无活动英雄不出现。

---

### Task 4 · 文档同步

**文件：** `docs/miniprogram/pages/营销首页.md`（若预览副本存在则同步或跑 `build-pages.py`）

1. §3「英雄广场」行：改为大图活动卡（代表赛事/活动）+「立即报名」→ 招募详情。
2. §4「看教练」：查看更多 → 英雄 Tab；首页英雄区卡 → 招募详情。
3. §7 变更记录追加今日条目。
4. 需要时执行 `python3 preview/build-pages.py` 刷新预览侧文档。

**验收：** 文档与实现一致；预览右侧面板文案正确。

---

### Task 5 · 本地验收

1. 启动/确认预览：
   - 小程序预览：`http://127.0.0.1:8765/miniprogram/index.html`
   - 后台管理系统：`http://127.0.0.1:8765/admin/dashboard.html`
2. 对照效果图检查活动区与英雄横滑。
3. 点击：英雄卡 → 招募详情；查看更多 → heroes；活动卡 → 招募详情。
4. 确认英雄 Tab 列表卡未改。

---

## 执行顺序

Task 1 → Task 2 → Task 3 → Task 4 → Task 5

## 风险与注意

- 勿改 `heroes.html` / `hero-card--list` 列表样式与逻辑。
- 横滑旧 `.hero-card` 选择器需收窄，避免误伤列表页。
- 用户未要求时不 commit；实现完成后再按指令提交。
