# 页面总索引

> 英雄广场 · 小程序与后台页面一览  
> 需求文档与源码严格分目录存放，互不混用。

---

## 目录约定

| 端 | 需求文档 | 源码 |
|----|----------|------|
| **微信小程序** | `docs/miniprogram/pages/*.md` | `miniprogram/pages/` |
| **管理后台** | `docs/admin/pages/*.md` | `admin/src/pages/` |

总纲：[PRD.md](./PRD.md) · UI 规范：[DESIGN-SPEC.md](./DESIGN-SPEC.md)

---

## 浏览器预览

### 线上（GitHub Pages）

| 项 | 链接 |
|----|------|
| **预览入口** | [https://cgd1093702532-star.github.io/personal-site/](https://cgd1093702532-star.github.io/personal-site/) |

> 线上仅静态预览；申请提交与后台审核需本地 `bash scripts/start-dev.sh`（预览 :8765 + API :8787）。

### 本地

| 项 | 链接 |
|----|------|
| **预览目录（入口）** | [http://127.0.0.1:8765/](http://127.0.0.1:8765/) |
| 小程序 · 营销首页 | [http://127.0.0.1:8765/miniprogram/index.html](http://127.0.0.1:8765/miniprogram/index.html) |
| 小程序 · 英雄广场 | [http://127.0.0.1:8765/miniprogram/heroes.html](http://127.0.0.1:8765/miniprogram/heroes.html) |
| 管理后台 · 仪表盘 | [http://127.0.0.1:8765/admin/dashboard.html](http://127.0.0.1:8765/admin/dashboard.html) |
| **本地数据库 API** | [http://127.0.0.1:8787/api/health](http://127.0.0.1:8787/api/health) |

启动方式：

- 仅预览：`bash scripts/start-preview.sh`（端口 8765）
- 仅数据库：`bash scripts/start-local-db.sh`（端口 8787）
- **推荐开发**：`bash scripts/start-dev.sh`（同时启动预览 + 数据库）

数据持久化说明见 [本地数据库.md](./本地数据库.md)。启用数据库后，修改英雄资料、发布招募等操作会写入 `data/local.db`，刷新页面或跳转其他页仍可读取。

---

## 一、微信小程序（miniprogram）

### Tab 页

| 页面 | 需求文档 | 源码目录 | 路由 | M1 |
|------|----------|----------|------|-----|
| 营销首页 | [营销首页.md](./miniprogram/pages/营销首页.md) | `miniprogram/pages/index/` | `pages/index/index` | ✅ |
| 英雄广场 | [英雄广场.md](./miniprogram/pages/英雄广场.md) | `miniprogram/pages/heroes/` | `pages/heroes/heroes` | ✅ |
| 商城 | [商城.md](./miniprogram/pages/商城.md) | `miniprogram/pages/mall/` | `pages/mall/mall` | 占位 |
| 个人中心 | [个人中心.md](./miniprogram/pages/个人中心.md) | `miniprogram/pages/profile/` | `pages/profile/profile` | ✅ |

### 子页 · 浏览与报名

| 页面 | 需求文档 | 源码目录 | 路由 | M1 |
|------|----------|----------|------|-----|
| 英雄详情 | [英雄详情.md](./miniprogram/pages/英雄详情.md) | `miniprogram/pages/hero-detail/` | `pages/hero-detail/hero-detail` | ✅ |
| 赛事详情 | [赛事详情.md](./miniprogram/pages/赛事详情.md) | `miniprogram/pages/recruitment-detail/` | `pages/recruitment-detail/recruitment-detail` | ✅ |
| 活动详情 | [活动详情.md](./miniprogram/pages/活动详情.md) | 同壳预览 `activity-detail.html`（小程序仍走 recruitment-detail） | `pages/recruitment-detail/recruitment-detail` | ✅ |
| 课程详情 | [课程详情.md](./miniprogram/pages/课程详情.md) | `miniprogram/pages/course-detail/` | `pages/course-detail/course-detail` | ✅ |

### 子页 · 英雄认证

| 页面 | 需求文档 | 源码目录 | 路由 | M1 |
|------|----------|----------|------|-----|
| 申请成为英雄 | [申请成为英雄.md](./miniprogram/pages/申请成为英雄.md) | `miniprogram/pages/hero-apply/` | `pages/hero-apply/hero-apply` | ✅ |
| 申请提交成功 | [申请提交成功.md](./miniprogram/pages/申请提交成功.md) | `miniprogram/pages/hero-apply-submitted/` | `pages/hero-apply-submitted/hero-apply-submitted` | ✅ |
| 认证成功 | [认证成功.md](./miniprogram/pages/认证成功.md) | `miniprogram/pages/hero-apply-success/` | `pages/hero-apply-success/hero-apply-success` | ✅ |

### 子页 · 英雄中心

| 页面 | 需求文档 | 源码目录 | 路由 | M1 |
|------|----------|----------|------|-----|
| 我的英雄资料 | [我的英雄资料.md](./miniprogram/pages/我的英雄资料.md) | `miniprogram/pages/hero-profile/` | `pages/hero-profile/hero-profile` | 骨架 |
| 发布招募 | [发布招募.md](./miniprogram/pages/发布招募.md) | `miniprogram/pages/recruitment-create/` | `pages/recruitment-create/recruitment-create` | ✅ |
| 发布课程 | [发布课程.md](./miniprogram/pages/发布课程.md) | `miniprogram/pages/course-create/` | `pages/course-create/course-create` | ✅ |
| 我的招募 | [我的招募.md](./miniprogram/pages/我的招募.md) | `miniprogram/pages/my-recruitments/` | `pages/my-recruitments/my-recruitments` | ✅ |
| 我的课程 | [我的课程.md](./miniprogram/pages/我的课程.md) | `miniprogram/pages/my-courses/` | `pages/my-courses/my-courses` | ✅ |
| 我的学员 | [我的学员.md](./miniprogram/pages/我的学员.md) | `miniprogram/pages/my-students/` | `pages/my-students/my-students` | ✅ |
| 招募编辑 | [招募编辑.md](./miniprogram/pages/招募编辑.md) | `miniprogram/pages/recruitment-edit/` | `pages/recruitment-edit/recruitment-edit` | 骨架 |
| 报名人员列表 | [报名人员列表.md](./miniprogram/pages/报名人员列表.md) | `miniprogram/pages/signup-list/` | `pages/signup-list/signup-list` | 骨架 |
| 证书编辑 | [证书编辑.md](./miniprogram/pages/证书编辑.md) | `miniprogram/pages/cert-edit/` | `pages/cert-edit/cert-edit` | M2 |
| 简介编辑 | [简介编辑.md](./miniprogram/pages/简介编辑.md) | `miniprogram/pages/bio-edit/` | `pages/bio-edit/bio-edit` | M2 |
| 英雄评价列表 | [英雄评价列表.md](./miniprogram/pages/英雄评价列表.md) | `miniprogram/pages/hero-reviews/` | `pages/hero-reviews/hero-reviews` | M2 |

### 子页 · 用户活动

| 页面 | 需求文档 | 源码目录 | 路由 | M1 |
|------|----------|----------|------|-----|
| 我的报名 | [我的报名.md](./miniprogram/pages/我的报名.md) | `miniprogram/pages/my-signups/` | `pages/my-signups/my-signups` | 骨架 |
| 我的评价 | [我的评价.md](./miniprogram/pages/我的评价.md) | `miniprogram/pages/my-reviews/` | `pages/my-reviews/my-reviews` | 骨架 |

### 不做（M1）

| 页面 | 需求文档 | 说明 |
|------|----------|------|
| 消息 | [消息.md](./miniprogram/pages/消息.md) | M1 不做 |

小程序索引详情：[miniprogram/pages/README.md](./miniprogram/pages/README.md)

---

## 二、管理后台（admin）

| 页面 | 需求文档 | 源码文件 | 路由 | M1 |
|------|----------|----------|------|-----|
| 仪表盘 | [仪表盘.md](./admin/pages/仪表盘.md) | `admin/src/pages/Dashboard.vue` | `/admin/dashboard` | 占位 |
| 英雄管理 | [英雄管理.md](./admin/pages/英雄管理.md) | `admin/src/pages/Heroes.vue` | `/admin/heroes` | 占位 |
| 招募管理 | [招募管理.md](./admin/pages/招募管理.md) | `admin/src/pages/Recruitments.vue` | `/admin/recruitments` | 占位 |
| 报名管理 | [报名管理.md](./admin/pages/报名管理.md) | `admin/src/pages/Signups.vue` | `/admin/signups` | 占位 |
| 评价管理 | [评价管理.md](./admin/pages/评价管理.md) | `admin/src/pages/Reviews.vue` | `/admin/reviews` | 占位 |
| 用户管理 | [用户管理.md](./admin/pages/用户管理.md) | `admin/src/pages/Users.vue` | `/admin/users` | 占位 |
| 系统配置 | [系统配置.md](./admin/pages/系统配置.md) | `admin/src/pages/Settings.vue` | `/admin/settings` | 占位 |
| 主页变更审核 | [主页变更审核.md](./admin/pages/主页变更审核.md) | `admin/src/pages/ProfileChanges.vue` | `/admin/profile-changes` | 占位 |

后台索引详情：[admin/pages/README.md](./admin/pages/README.md)

---

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-07-07 | 小程序全部页面需求文档重写：逐元素 UI 规格、字段校验矩阵、接口字段 |
| 2026-07-07 | 小程序全部 24 页补全六大需求章节；新增申请提交成功、我的学员文档 |
| 2026-07-07 | 补充 GitHub Pages 线上预览链接 |
| 2026-07-03 | 建立页面总索引；补全商城需求；区分 miniprogram / admin 文档与源码 |
