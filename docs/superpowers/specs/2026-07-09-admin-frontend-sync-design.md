# 前后台数据联动 · 全量打通设计

> 日期：2026-07-09  
> 状态：已批准（用户授权按推荐方案直接执行）  
> 范围：补全 `preview/admin` + 统一本地 API 数据层；小程序与预览前台 API 优先

## 1. 目标

- 前台（`miniprogram` / `preview/miniprogram`）与后台（`preview/admin`）读写同一套 SQLite 正式表
- 消灭 `app_state.my_signups` / `my_courses` / `my_reviews` 与后台表分裂
- 补齐仪表盘、评价、用户、主页变更审核、系统配置
- 本地不鉴权

## 2. 数据模型

| 表 | 说明 |
|---|---|
| `heroes` / `recruitments` / `courses` / `hero_applications` | 保留 |
| `signups` | **唯一报名源**（招募+课程）；payload 含 type、user_id、关联 id |
| `reviews` | 新增：评价 |
| `users` | 新增：用户档案 |
| `profile_change_requests` | 新增：主页变更审核 |
| `settings` | 新增：系统配置 KV |
| `app_state` | 仅会话/调试：`mock_hero_role`、草稿等 |

## 3. API（增量）

### 前台

- `GET/POST /api/signups` · `GET /api/signups/mine` · `GET /api/signups/:id`
- `POST /api/signups/:id/checkin` · `PATCH /api/signups/:id`
- `GET /api/courses?hero_id=`（我的课程）
- `GET/POST /api/reviews` · `GET /api/reviews?hero_id=` · `GET /api/reviews/mine`
- `GET /api/heroes/:id/students`（由 signups 聚合）
- `POST /api/heroes/:id/profile-changes`（提交变更审核）

### 后台

- `GET /api/admin/dashboard`
- `GET /api/admin/reviews` · hide / delete
- `GET /api/admin/users` · disable / enable
- `GET/POST approve/reject /api/admin/profile-changes`
- `GET/PUT /api/admin/settings`

## 4. 前台改造

- `miniprogram/utils/data.js`：报名/课程/评价/学员改走正式 API
- 英雄列表/详情：API 优先，mock 仅兜底
- `preview/assets/db-client.js`：补齐客户端方法
- 预览页发布课程已写 `courses`；小程序 `addMyCourse` 对齐

## 5. 后台页面（preview/admin）

| 页 | 动作 |
|---|---|
| dashboard | 接 live API |
| heroes / recruitments / courses / signups | 保持并受益于统一报名 |
| reviews / users / profile-changes / settings | 从占位做成可用页 |

## 6. 验收

1. 前台报名 → 后台报名管理可见  
2. 前台发布课程 → 后台课程管理可见  
3. 后台批准英雄 → 前台英雄列表可见  
4. 仪表盘数字与库一致  
5. 评价/用户/变更审核/配置可读写  

## 7. 非目标

- 真实微信登录、支付、商城主数据、Vue admin 同步
