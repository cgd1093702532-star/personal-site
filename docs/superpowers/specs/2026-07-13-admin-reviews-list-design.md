# 后台评价列表页 · 对齐供方列表设计

> 日期：2026-07-13  
> 状态：已确认（用户批准方案 A）  
> 范围：`preview/admin/reviews.html` + `reviews-admin-preview.js` + 文档同步；可选补 seed 展示字段

## 1. 目标

将评价列表从「关键词 + pills Tab + 简表」改为与供方列表同结构的筛选面板 + 参考图字段表，色值与按钮样式对齐管理后台现有 token / 筛选参考图。

## 2. 方案

**采用方案 A**：复用供方列表的 `admin-filter-panel`、`admin-card--table`、`admin-table--supplier`、`admin-supplier-info` 等现有样式；不抽公共组件；不改供方列表本身。

## 3. 页面结构

### 3.1 移除

- 关键词搜索 `admin-card` 区
- `admin-tabs--pills`（全部 / 正常 / 已隐藏 / 已删除）

### 3.2 筛选面板（`admin-filter-panel`）

一行 6 列（可用 `grid` 6 列或两行 3 列，以视觉接近参考图为准）：

| 字段 | 控件 | 说明 |
|------|------|------|
| 用户昵称/手机号码 | 文本 | 匹配评价人昵称或手机 |
| 供方昵称/手机号码 | 文本 | 匹配关联英雄昵称或手机 |
| 关联招募 | 文本 | 匹配招募 id |
| 关联项目 | 文本 | 匹配关联内容标题 |
| 评价得分 | 下拉 | 请选择 / 1–5 |
| 评价状态 | 下拉 | 请选择 / 公开 / 隐藏 |

操作按钮（与筛选参考图一致）：

- **查询**：`admin-btn--primary` + 放大镜图标
- **重置 / 导出 / 查看已生成订单报表**：`admin-btn--outline`（白底灰边灰字）

导出、订单报表：点击 `alert` 占位「功能开发中」（与供方列表一致）。

### 3.3 表格列

| 列 | 展示 |
|----|------|
| 评价 id | `review_id` |
| 用户 id | `user_id` |
| 用户信息 | 头像 + 蓝昵称 + 手机（`admin-supplier-info` 结构） |
| 供方 id | `hero_id` |
| 供方信息 | 同上，关联英雄 |
| 关联招募 | `recruit_id` 等，缺省 `—` |
| 关联内容 | 标题，链接色；缺省 `—` |
| 关联订单 | `order_id`，缺省 `—` |
| 评价得分 | 分数；空则 `暂无` |
| 评价内容 | 截断文本；空则 `暂无` |
| 评价状态 | 公开 / 隐藏 |
| 提交时间 | `YYYY/MM/DD HH:mm` |
| 操作 | 仅「隐藏」（公开态可见） |

默认不展示 `deleted`；状态筛选项不含「已删除」。

## 4. 数据与过滤

- 列表：`GET /api/admin/reviews`（`include_hidden` 行为保持后台全量可见中的 visible + hidden）
- 供方信息：并行或缓存 `listAdminHeroes` / 现有英雄接口，按 `hero_id` 合并昵称、手机、头像
- 用户手机等缺字段：用 payload / seed 补；没有则 `—`
- 过滤：前端对上述 6 项做本地过滤（与供方列表筛选模式一致）
- 隐藏：现有 `hideReview` API；成功后刷新列表

### Seed 增强（可选但推荐）

为现有 reviews 条目补充演示字段，例如：

- `reviewer_phone`
- `recruit_id` / `order_id`
- 关联内容继续用现有 `title`

缺字段的行仍可渲染，显示 `—` / `暂无`。

## 5. 改动文件

| 文件 | 改动 |
|------|------|
| `preview/admin/reviews.html` | 新筛选面板 + 新表头 |
| `preview/assets/reviews-admin-preview.js` | 筛选、合并供方、渲染、隐藏、导出占位 |
| `docs/admin/pages/评价管理.md` | 同步结构说明 |
| `data/seed.json` | 可选：补评价演示字段 |

不改 API 路由契约（除非列表 enrichment 必须在后端；优先前端合并）。

## 6. 验收

1. 评价列表视觉与供方列表筛选/表格风格一致（绿表头、蓝链接信息格、蓝查询按钮）。
2. 无 pills Tab；筛选项与表格列对齐参考图。
3. 查询 / 重置可用；隐藏后状态变为隐藏。
4. 导出 / 报表占位提示。
5. 本地预览：`http://127.0.0.1:8765/admin/reviews.html`

## 7. 非目标

- 真实导出 / 订单报表
- 删除操作入口
- 抽公共筛选组件
- 改 Vue `admin/src`（预览 HTML 为当前后台真源）
