# 小程序页面

> 平台：**微信小程序** · 源码在 `miniprogram/pages/`  
> 与后台文档 `docs/admin/` **完全分离**

模板：[_TEMPLATE.md](./_TEMPLATE.md) · 总索引：[../PAGES.md](../PAGES.md) · 总纲：[../PRD.md](../PRD.md)

**文档粒度要求**（2026-07-07 起）：

- 每个可见/可交互 UI 元素：文案、样式 token、数据来源、校验规则
- 表单页：完整 §4 字段与校验矩阵（含错误 Toast、提交 payload）
- 含：业务规则、状态机、交互前置条件、加载刷新、性能指标、接口字段表、预览差异
- 范例：[申请提交成功.md](./申请提交成功.md) · [申请成为英雄.md](./申请成为英雄.md)

## Tab 页

| 需求文档 | 源码 | 路由 | M1 |
|----------|------|------|-----|
| [营销首页.md](./营销首页.md) | `miniprogram/pages/index/` | `pages/index/index` | ✅ |
| [英雄广场.md](./英雄广场.md) | `miniprogram/pages/heroes/` | `pages/heroes/heroes` | ✅ |
| [商城.md](./商城.md) | `miniprogram/pages/mall/` | `pages/mall/mall` | 占位 |
| [个人中心.md](./个人中心.md) | `miniprogram/pages/profile/` | `pages/profile/profile` | ✅ |

## 子页 · 浏览与报名

| 需求文档 | 源码 | 路由 | 优先级 |
|----------|------|------|--------|
| [英雄详情.md](./英雄详情.md) | `miniprogram/pages/hero-detail/` | `pages/hero-detail/hero-detail` | P0 |
| [招募详情.md](./招募详情.md) | `miniprogram/pages/recruitment-detail/` | `pages/recruitment-detail/recruitment-detail` | P0 |
| [课程详情.md](./课程详情.md) | `miniprogram/pages/course-detail/` | `pages/course-detail/course-detail` | P0 |

## 子页 · 英雄认证

| 需求文档 | 源码 | 路由 | 优先级 |
|----------|------|------|--------|
| [申请成为英雄.md](./申请成为英雄.md) | `miniprogram/pages/hero-apply/` | `pages/hero-apply/hero-apply` | P0 |
| [申请提交成功.md](./申请提交成功.md) | `miniprogram/pages/hero-apply-submitted/` | `pages/hero-apply-submitted/hero-apply-submitted` | P0 |
| [认证成功.md](./认证成功.md) | `miniprogram/pages/hero-apply-success/` | `pages/hero-apply-success/hero-apply-success` | P0 |

## 子页 · 英雄中心

| 需求文档 | 源码 | 路由 | 优先级 |
|----------|------|------|--------|
| [我的英雄资料.md](./我的英雄资料.md) | `miniprogram/pages/hero-profile/` | `pages/hero-profile/hero-profile` | P0 |
| [发布招募.md](./发布招募.md) | `miniprogram/pages/recruitment-create/` | `pages/recruitment-create/recruitment-create` | P0 |
| [发布课程.md](./发布课程.md) | `miniprogram/pages/course-create/` | `pages/course-create/course-create` | P0 |
| [我的招募.md](./我的招募.md) | `miniprogram/pages/my-recruitments/` | `pages/my-recruitments/my-recruitments` | P0 |
| [我的课程.md](./我的课程.md) | `miniprogram/pages/my-courses/` | `pages/my-courses/my-courses` | P0 |
| [我的学员.md](./我的学员.md) | `miniprogram/pages/my-students/` | `pages/my-students/my-students` | P1 |
| [招募编辑.md](./招募编辑.md) | `miniprogram/pages/recruitment-edit/` | `pages/recruitment-edit/recruitment-edit` | P0 |
| [报名人员列表.md](./报名人员列表.md) | `miniprogram/pages/signup-list/` | `pages/signup-list/signup-list` | P0 |
| [证书编辑.md](./证书编辑.md) | `miniprogram/pages/cert-edit/` | `pages/cert-edit/cert-edit` | P2 |
| [简介编辑.md](./简介编辑.md) | `miniprogram/pages/bio-edit/` | `pages/bio-edit/bio-edit` | P2 |
| [英雄评价列表.md](./英雄评价列表.md) | `miniprogram/pages/hero-reviews/` | `pages/hero-reviews/hero-reviews` | P1 |

## 子页 · 用户活动

| 需求文档 | 源码 | 路由 | 优先级 |
|----------|------|------|--------|
| [我的报名.md](./我的报名.md) | `miniprogram/pages/my-signups/` | `pages/my-signups/my-signups` | P1 |
| [我的评价.md](./我的评价.md) | `miniprogram/pages/my-reviews/` | `pages/my-reviews/my-reviews` | P1 |

## 不做（M1）

| 需求文档 | 说明 |
|----------|------|
| [消息.md](./消息.md) | M1 不做，M2 规划 |
