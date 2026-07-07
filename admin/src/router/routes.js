/**
 * 管理后台路由表 · 与 docs/admin/pages/ 一一对应
 * 框架初始化后接入 Vue Router / React Router
 */
export const adminRoutes = [
  { path: '/admin/dashboard', name: 'Dashboard', component: 'Dashboard.vue', doc: 'docs/admin/pages/仪表盘.md' },
  { path: '/admin/heroes', name: 'Heroes', component: 'Heroes.vue', doc: 'docs/admin/pages/英雄管理.md' },
  { path: '/admin/recruitments', name: 'Recruitments', component: 'Recruitments.vue', doc: 'docs/admin/pages/招募管理.md' },
  { path: '/admin/signups', name: 'Signups', component: 'Signups.vue', doc: 'docs/admin/pages/报名管理.md' },
  { path: '/admin/reviews', name: 'Reviews', component: 'Reviews.vue', doc: 'docs/admin/pages/评价管理.md' },
  { path: '/admin/users', name: 'Users', component: 'Users.vue', doc: 'docs/admin/pages/用户管理.md' },
  { path: '/admin/settings', name: 'Settings', component: 'Settings.vue', doc: 'docs/admin/pages/系统配置.md' },
  { path: '/admin/profile-changes', name: 'ProfileChanges', component: 'ProfileChanges.vue', doc: 'docs/admin/pages/主页变更审核.md' },
];
