# 小程序页面

> 平台：**微信小程序**  
> 与后台文档 `docs/admin/` **完全分离**  
> 需求文档给**产品协作**阅读：白话中文；范例见 **[个人中心.md](./个人中心.md)**；模板见 [_TEMPLATE.md](./_TEMPLATE.md)

总索引：[../PAGES.md](../PAGES.md) · 总纲：[../PRD.md](../PRD.md)

## 文档约定

1. **读者**：不懂技术也能看懂；全文（含 §6）用产品语言  
2. **结构**：§1 页面业务目标 → §2 登录和身份描述 → §3 页面详细描述 → §4 常见路径 → §5 相关页面 → §6 规则补充与验收要点 → §7 变更记录  
3. **预览**：打开对应预览页时，桌面为「左侧页面导航 | 手机预览 | 右侧需求文档」三方联动；左侧导航只含有需求文档的页面，目录真源为 `preview/page_catalog.py`（新增文档页须登记后 build）；自查：`python3 scripts/check-preview-page-nav.py`；改文档后执行 `python3 preview/build-pages.py`  
4. **流程图**：保留，标签用中文  
5. **§6**：预览右侧隐藏；仍写验收规则，不写接口/代码字段  
6. **个人中心**另有状态截图同步规则：`.cursor/rules/profile-doc-sync.mdc`

## Tab 页

| 需求文档 | 预览 |
|----------|------|
| [营销首页.md](./营销首页.md) | `index.html` |
| [英雄广场.md](./英雄广场.md) | `heroes.html` |
| 商城（暂无独立需求文档） | `mall.html` |
| [个人中心.md](./个人中心.md) | `profile.html` |

## 子页 · 浏览与报名

| 需求文档 | 预览 |
|----------|------|
| [英雄详情.md](./英雄详情.md) | `hero-detail.html` |
| [招募详情.md](./招募详情.md) | `recruitment-detail.html` |
| [课程详情.md](./课程详情.md) | `course-detail.html` |

## 子页 · 英雄认证

| 需求文档 | 预览 |
|----------|------|
| [申请成为英雄.md](./申请成为英雄.md) | `hero-apply.html` |
| [申请提交成功.md](./申请提交成功.md) | `hero-apply-submitted.html` |
| [认证成功.md](./认证成功.md) | `hero-apply-success.html` |

## 子页 · 英雄中心

| 需求文档 | 预览 |
|----------|------|
| [我的英雄资料.md](./我的英雄资料.md) | `hero-profile.html` |
| [发布招募.md](./发布招募.md) | `recruitment-create.html` |
| [发布课程.md](./发布课程.md) | `course-create.html` |
| [我的招募.md](./我的招募.md) | `my-recruitments.html` |
| [我的课程.md](./我的课程.md) | `my-courses.html` |
| [我的学员.md](./我的学员.md) | `my-students.html` |
| [招募编辑.md](./招募编辑.md) | `recruitment-edit.html` |
| [报名人员列表.md](./报名人员列表.md) | `signup-list.html` |
| [证书编辑.md](./证书编辑.md) | `cert-edit.html` |
| [简介编辑.md](./简介编辑.md) | `bio-edit.html` |
| [英雄评价列表.md](./英雄评价列表.md) | `hero-reviews.html` |

## 子页 · 用户活动

| 需求文档 | 预览 |
|----------|------|
| [我的报名.md](./我的报名.md) | `my-signups.html` |
| [我的评价.md](./我的评价.md) | `my-reviews.html` |

## 暂不做

| 需求文档 | 说明 |
|----------|------|
| [消息.md](./消息.md) | 第一期不做；无预览页 |
