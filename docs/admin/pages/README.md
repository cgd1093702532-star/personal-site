# 管理后台页面

> 平台：**Web 管理后台** · 源码在 `admin/src/pages/`  
> 与小程序文档 `docs/miniprogram/` **完全分离**  
> 业务规则已按 2026-07-10 清单同步

模板：[_TEMPLATE.md](./_TEMPLATE.md) · 总索引：[../../PAGES.md](../../PAGES.md) · 总纲：[../../PRD.md](../../PRD.md)

## 页面列表

| 需求文档 | 源码文件 | 路由 | M1 |
|----------|----------|------|-----|
| [仪表盘.md](./仪表盘.md) | `admin/src/pages/Dashboard.vue` | `/admin/dashboard` | P0 |
| [供方列表.md](./供方列表.md) | `preview/admin/heroes.html` · `supplier-edit.html` | `/admin/heroes` | P0 |
| [英雄管理.md](./英雄管理.md) | `admin/src/pages/Heroes.vue`（旧稿，见供方列表） | `/admin/heroes` | P0 |
| [招募管理.md](./招募管理.md) | `admin/src/pages/Recruitments.vue` | `/admin/recruitments` | P0 |
| [课程管理.md](./课程管理.md) | `admin/src/pages/Courses.vue` | `/admin/courses` | P1 |
| [报名管理.md](./报名管理.md) | `admin/src/pages/Signups.vue` | `/admin/signups` | P1 |
| [评价管理.md](./评价管理.md) | `admin/src/pages/Reviews.vue` | `/admin/reviews` | P1 |
| [用户管理.md](./用户管理.md) | `admin/src/pages/Users.vue` | `/admin/users` | P1 |
| [系统配置.md](./系统配置.md) | `admin/src/pages/Settings.vue` | `/admin/settings` | P2 |
| [主页变更审核.md](./主页变更审核.md) | `admin/src/pages/ProfileChanges.vue` | `/admin/profile-changes` | P2 |

## 跨端约定

- 前后台同一 SQLite；报名 / 课程 / 评价不以 `app_state` 为正式源
- `app_state` 仅会话 / 调试
- API 优先
- 本地管理端不鉴权；不做真实微信登录 / 真实支付
- **商城不纳入本轮业务规则**

## 开发说明

框架选型后，在 `admin/` 根目录执行 `npm install` 与 `npm run dev`。  
各页面 Vue 文件当前为 **M1 占位**，需求细节以本目录 `.md` 为准。
