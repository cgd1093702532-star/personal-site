# 管理后台（Admin）

> Web 管理端 · 与 `miniprogram/` **完全分离**

## 目录

```
admin/
├── README.md              # 本文件
├── package.json
└── src/
    ├── pages/             # 页面组件（每页一个 .vue）
    │   ├── Dashboard.vue
    │   ├── Heroes.vue
    │   ├── Recruitments.vue
    │   ├── Signups.vue
    │   ├── Reviews.vue
    │   ├── Users.vue
    │   ├── Settings.vue
    │   └── ProfileChanges.vue
    └── router/
        └── routes.js      # 路由与需求文档对照
```

## 页面 ↔ 需求文档

| 源码 | 需求文档 |
|------|----------|
| `src/pages/Dashboard.vue` | [docs/admin/pages/仪表盘.md](../docs/admin/pages/仪表盘.md) |
| `src/pages/Heroes.vue` | [docs/admin/pages/英雄管理.md](../docs/admin/pages/英雄管理.md) |
| `src/pages/Recruitments.vue` | [docs/admin/pages/招募管理.md](../docs/admin/pages/招募管理.md) |
| `src/pages/Signups.vue` | [docs/admin/pages/报名管理.md](../docs/admin/pages/报名管理.md) |
| `src/pages/Reviews.vue` | [docs/admin/pages/评价管理.md](../docs/admin/pages/评价管理.md) |
| `src/pages/Users.vue` | [docs/admin/pages/用户管理.md](../docs/admin/pages/用户管理.md) |
| `src/pages/Settings.vue` | [docs/admin/pages/系统配置.md](../docs/admin/pages/系统配置.md) |
| `src/pages/ProfileChanges.vue` | [docs/admin/pages/主页变更审核.md](../docs/admin/pages/主页变更审核.md) |

总索引：[docs/PAGES.md](../docs/PAGES.md)

## 技术栈（待 M1 启动时确认）

建议：Vue 3 + Vite + Element Plus。当前各 `.vue` 为 **M1 占位**，尚未初始化构建工具。

## 开发

```bash
# 待框架初始化后：
cd admin
npm install
npm run dev
```

## API

与小程序共用后端，前缀 `/api/admin/*`，详见 `docs/PRD.md`。
