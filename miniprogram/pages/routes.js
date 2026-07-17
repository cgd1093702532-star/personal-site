/**
 * 小程序页面路由表 · 与 docs/miniprogram/pages/ 一一对应
 * 注册于 miniprogram/app.json
 */
module.exports = {
  tabPages: [
    { path: 'pages/index/index', doc: 'docs/miniprogram/pages/营销首页.md', title: '首页' },
    { path: 'pages/heroes/heroes', doc: 'docs/miniprogram/pages/英雄广场.md', title: '英雄' },
    { path: 'pages/mall/mall', doc: 'docs/miniprogram/pages/商城.md', title: '商城' },
    { path: 'pages/profile/profile', doc: 'docs/miniprogram/pages/个人中心.md', title: '我的' },
  ],
  subPages: [
    { path: 'pages/hero-detail/hero-detail', doc: 'docs/miniprogram/pages/英雄详情.md' },
    { path: 'pages/recruitment-detail/recruitment-detail', doc: 'docs/miniprogram/pages/赛事详情.md' },
    // 活动详情与赛事共用小程序页；独立需求文档 docs/miniprogram/pages/活动详情.md（预览 activity-detail.html）
    { path: 'pages/course-detail/course-detail', doc: 'docs/miniprogram/pages/课程详情.md' },
    { path: 'pages/hero-apply/hero-apply', doc: 'docs/miniprogram/pages/申请成为英雄.md' },
    { path: 'pages/hero-apply-success/hero-apply-success', doc: 'docs/miniprogram/pages/认证成功.md' },
    { path: 'pages/hero-apply-submitted/hero-apply-submitted', doc: 'docs/miniprogram/pages/申请提交成功.md' },
    { path: 'pages/hero-profile/hero-profile', doc: 'docs/miniprogram/pages/我的英雄资料.md' },
    { path: 'pages/recruitment-create/recruitment-create', doc: 'docs/miniprogram/pages/发布招募.md' },
    { path: 'pages/course-create/course-create', doc: 'docs/miniprogram/pages/发布课程.md' },
    { path: 'pages/my-recruitments/my-recruitments', doc: 'docs/miniprogram/pages/我的招募.md' },
    { path: 'pages/my-courses/my-courses', doc: 'docs/miniprogram/pages/我的课程.md' },
    { path: 'pages/recruitment-edit/recruitment-edit', doc: 'docs/miniprogram/pages/招募编辑.md' },
    { path: 'pages/signup-list/signup-list', doc: 'docs/miniprogram/pages/报名人员列表.md' },
    { path: 'pages/my-signups/my-signups', doc: 'docs/miniprogram/pages/我的报名.md' },
    { path: 'pages/my-reviews/my-reviews', doc: 'docs/miniprogram/pages/我的评价.md' },
    { path: 'pages/cert-edit/cert-edit', doc: 'docs/miniprogram/pages/证书编辑.md' },
    { path: 'pages/bio-edit/bio-edit', doc: 'docs/miniprogram/pages/简介编辑.md' },
    { path: 'pages/my-students/my-students', doc: 'docs/miniprogram/pages/我的学员.md' },
    { path: 'pages/hero-reviews/hero-reviews', doc: 'docs/miniprogram/pages/英雄评价列表.md' },
  ],
};
