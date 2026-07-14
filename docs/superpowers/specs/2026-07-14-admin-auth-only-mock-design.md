# 后台仅保留认证治理 · 小程序业务全 mock

> 日期：2026-07-14  
> 状态：待用户确认  
> 范围：`preview/admin/`、`server/`、`miniprogram/utils/data.js`、`admin/`（Vue 脚手架）、相关文档  
> 决策摘要：认证治理 = 申请审核 / 主页变更审核 / 用户启停；业务数据小程序侧纯 mock；审核通过不刷新广场英雄列表

---

## 1. 目标与边界

### 1.1 目标

1. 后台管理系统只保留**身份/供方治理（认证相关）**能力与代码。
2. 删除运营类后台页面、非认证 Admin API，以及小程序将不再使用的公共业务 API。
3. 小程序依赖的已删业务 API，全部改为本地 `store` / `mock`（经 `data.js`），保证无业务 API 时主路径仍可用。

### 1.2 认证相关（保留）

| 能力 | 后台页 | API |
|------|--------|-----|
| 英雄申请审核 | `preview/admin/heroes.html`、`supplier-edit.html` | `/api/admin/applications*`、approve/reject；审核链路所需的 `/api/admin/heroes*`（创建/启停/删除供方，仅后台） |
| 主页变更审核 | `preview/admin/profile-changes.html` | `/api/admin/profile-changes*`、approve/reject |
| 用户启停 | `preview/admin/users.html` | `/api/admin/users`、disable/enable |
| 小程序提交侧 | — | `/api/heroes/apply*`、`/api/heroes/:id/profile-changes*` |

可选保留：`GET /api/health`（开发探测）。

`/api/app-state/*`：仅当认证状态仍依赖 `mock_hero_role` 等键时保留；否则认证状态只走 apply/status，业务态改纯本地。

### 1.3 明确不做

- 运营后台：仪表盘、招募/课程/报名/评价管理、系统配置等
- 审核通过后同步更新小程序广场英雄列表（列表保持静态 mock）
- 新建登录/session 鉴权（当前没有，本次不加）

### 1.4 审核通过后的产品行为

- 只更新**当前用户**认证状态（如 `pending → approved`），影响申请页 / 个人中心展示
- 广场英雄列表、招募等**不**随后台审核变化

---

## 2. 删除与入口调整

### 2.1 后台页面 — 删除

- `preview/admin/dashboard.html`
- `preview/admin/recruitments.html`
- `preview/admin/courses.html`
- `preview/admin/signups.html`
- `preview/admin/reviews.html`
- `preview/admin/settings.html`
- 对应 `preview/assets/*-admin-preview.js`（dashboard / recruitments / courses / signups / reviews / settings）

旧书签 `dashboard.html`：可做简单重定向到 `heroes.html`。

### 2.2 后台页面 — 保留

- `heroes.html`、`supplier-edit.html`
- `profile-changes.html`
- `users.html`
- 共享：`admin-layout.js`、`admin.css`、`db-client.js`（仅保留认证调用所需）

### 2.3 导航（`admin-layout.js`）

- 顶栏/侧栏只保留认证相关入口（用户、供方列表/申请审核、主页变更审核）
- 去掉：装修、票务、销售、订单、内容、促销、物业、招募列表、评价列表、管理中心仪表盘等
- 默认落地页：`heroes.html`

### 2.4 Vue 脚手架 `admin/`

整目录删除，或以简短 README 说明「以 `preview/admin/` 为准」；不再维护 Vue 运营页。

### 2.5 服务端 API — 删除

非认证 Admin：

- `/api/admin/dashboard`
- `/api/admin/courses`
- `/api/admin/signups*`
- `/api/admin/recruitments*`
- `/api/admin/reviews*`
- `/api/admin/settings`

小程序将改 mock、不再调用的公共业务 API：

- `/api/heroes` 列表/详情/`PUT`（广场读列表不走 API）
- `/api/heroes/:id/students`
- `/api/recruitments*`
- `/api/courses*`
- `/api/signups*`
- `/api/reviews*`

`db.py` / `seed.json`：可随路由删除清理仅被上述接口使用的逻辑；审核链路仍依赖的表（applications、profile_changes、users、以及 approve 写入的 heroes）保留。

### 2.6 文档

- `docs/admin/pages/` 运营页文档：标记废弃或删除
- 认证相关页文档保留，并更新入口为 `heroes.html`
- `docs/本地数据库.md`：同步「仅认证 API + 小程序业务 mock」说明

---

## 3. 小程序 mock 策略

### 3.1 原则

- 页面仍只通过 `miniprogram/utils/data.js` 取数
- 按「是否认证」分流，**不是**全局关闭 API 客户端

### 3.2 仍走 API

- `getHeroApplyStatus` / `submitHeroApply` / `withdrawHeroApply`
- `submitProfileChange` / `withdrawProfileChange`
- 若仍需要：`getAppState` / `setAppState` 中与认证状态相关的键

### 3.3 改为仅 store / mock

英雄列表与详情、招募 CRUD、课程、报名与签到、评价、学员列表、活动供方列表等：

- 去掉对已删业务 API 及 `/api/admin/*` 的请求
- 读/写 `store.js`，种子来自 `mock.js` + `data.js` 内 `DEFAULT_*`
- 修正误用：`getMyReviews`、`listActivitySuppliers` 不再打 `/api/admin/*`

### 3.4 可用性探测

- `api.checkAvailable()` 仅用于认证相关调用前
- 业务路径不再「API 优先再降级」，避免误打已删除接口

---

## 4. 风险与验收

### 4.1 风险

| 风险 | 处理 |
|------|------|
| approve 写入 heroes 表但广场读不到 | 已按产品约定接受 |
| `data.js` 漏改导致 404 | 按导出函数逐条核对 |
| 旧 dashboard 书签失效 | 重定向到 `heroes.html` |

### 4.2 验收标准

1. 后台只能进入：供方/申请、主页变更、用户；无运营菜单与页面
2. `/api/recruitments`、`/api/courses`、`/api/admin/dashboard` 等不可用（404 或不存在）
3. 认证 API 可用：申请提交/撤回/状态、审核通过/驳回、主页变更审核、用户启停
4. 小程序：广场/招募/课程/报名/评价在无业务 API 下正常（纯 mock）
5. 申请通过后，个人中心/申请状态变为已通过；广场列表不出现新供方

---

## 5. 实施顺序

1. 收紧 `server/local_api.py`（及必要时 `db.py`）只留认证路由  
2. 删/改 `preview/admin` 页面与 `admin-layout.js`  
3. 改 `miniprogram/utils/data.js` 业务路径纯 mock  
4. 清理 `admin/` Vue 脚手架与过时文档  
5. 本地冒烟：后台三页 + 小程序主路径  

---

## 6. 非目标回顾

- 不实现真实 Admin 登录鉴权  
- 不把审核结果同步进广场 mock 列表  
- 不改造商城（`mall.js` 已纯 mock，保持不动）  
