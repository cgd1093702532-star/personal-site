# 英雄广场 · 产品需求文档（总纲）

> 版本：v1.1 · 2026-07-03  
> 适用范围：微信小程序 + 管理后台 + API  
> 小程序单页需求：`docs/miniprogram/pages/`  
> 后台单页需求：`docs/admin/pages/`  
> 页面总索引（含源码对照）：[`docs/PAGES.md`](./PAGES.md)

---

## 项目目录

```
hero-plaza-miniprogram/
├── miniprogram/          # 微信小程序源码
├── admin/                # 管理后台源码（Web）
├── docs/
│   ├── DESIGN-SPEC.md    # UI 规范（小程序为主）
│   ├── PRD.md            # 本文件
│   ├── miniprogram/      # 小程序需求文档
│   └── admin/            # 后台需求文档
└── project.config.json   # 微信开发者工具（指向 miniprogram/）
```

---

## 一、产品概述

（同 v1.0，略）

### 1.1 产品定位

英雄广场是水上运动领域的「**英雄（教练）- 招募（课程/赛事）- 队员（学员）**」撮合平台。

### 1.2 核心用户角色

| 角色 | 定义 | 核心诉求 |
|------|------|----------|
| 普通用户 | C 端用户 | 找教练、浏览课程/赛事、报名 |
| 英雄（教练） | 认证专业人士 | 展示能力、发布招募、管理学员 |
| 管理员 | 运营人员 | 审核、管理内容 |

### 1.3 名词定义

| 术语 | 说明 |
|------|------|
| 英雄 | 经认证的教练/专业人士 |
| 招募 | 课程体验或赛事活动 |
| 队员 | 报名参与的用户 |

---

## 二、Tab 栏（已确认）

与 **Figma 营销首页** 一致，**M1 不含「消息」**：

| Tab | 页面 | 需求文档 |
|-----|------|----------|
| 首页 | Figma 营销聚合页 | [miniprogram/pages/营销首页.md](./miniprogram/pages/营销首页.md) |
| 英雄 | 教练列表（英雄广场） | [miniprogram/pages/英雄广场.md](./miniprogram/pages/英雄广场.md) |
| 商城 | 商城（占位） | [miniprogram/pages/商城.md](./miniprogram/pages/商城.md) |
| 我的 | 个人中心 | [miniprogram/pages/个人中心.md](./miniprogram/pages/个人中心.md) |

实现：`miniprogram/app.json` → `tabBar`

---

## 三、小程序端页面索引

| 页面 | 需求文档 | 优先级 |
|------|----------|--------|
| 营销首页 | [miniprogram/pages/营销首页.md](./miniprogram/pages/营销首页.md) | P0 |
| 英雄广场 | [miniprogram/pages/英雄广场.md](./miniprogram/pages/英雄广场.md) | P0 |
| 商城 | [miniprogram/pages/商城.md](./miniprogram/pages/商城.md) | 占位 |
| 英雄详情 | [miniprogram/pages/英雄详情.md](./miniprogram/pages/英雄详情.md) | P0 |
| 招募详情 | [miniprogram/pages/招募详情.md](./miniprogram/pages/招募详情.md) | P0 |
| 个人中心 | [miniprogram/pages/个人中心.md](./miniprogram/pages/个人中心.md) | P0 |
| 申请成为英雄 | [miniprogram/pages/申请成为英雄.md](./miniprogram/pages/申请成为英雄.md) | P0 |
| 认证成功 | [miniprogram/pages/认证成功.md](./miniprogram/pages/认证成功.md) | P0 |
| 发布招募 | [miniprogram/pages/发布招募.md](./miniprogram/pages/发布招募.md) | P0 |
| 我的英雄资料 | [miniprogram/pages/我的英雄资料.md](./miniprogram/pages/我的英雄资料.md) | P0 |
| 我的招募 | [miniprogram/pages/我的招募.md](./miniprogram/pages/我的招募.md) | P0 |
| 我的报名 | [miniprogram/pages/我的报名.md](./miniprogram/pages/我的报名.md) | P1 |
| 我的评价 | [miniprogram/pages/我的评价.md](./miniprogram/pages/我的评价.md) | P1 |
| 招募编辑 | [miniprogram/pages/招募编辑.md](./miniprogram/pages/招募编辑.md) | P0 |
| 报名人员列表 | [miniprogram/pages/报名人员列表.md](./miniprogram/pages/报名人员列表.md) | P0 |
| 证书编辑 | [miniprogram/pages/证书编辑.md](./miniprogram/pages/证书编辑.md) | P2 |
| 简介编辑 | [miniprogram/pages/简介编辑.md](./miniprogram/pages/简介编辑.md) | P2 |
| 英雄评价列表 | [miniprogram/pages/英雄评价列表.md](./miniprogram/pages/英雄评价列表.md) | P1 |
| ~~消息~~ | [miniprogram/pages/消息.md](./miniprogram/pages/消息.md) | **M1 不做** |

---

## 四、管理后台页面索引

| 页面 | 需求文档 |
|------|----------|
| 仪表盘 | [admin/pages/仪表盘.md](./admin/pages/仪表盘.md) |
| 英雄管理 | [admin/pages/英雄管理.md](./admin/pages/英雄管理.md) |
| 招募管理 | [admin/pages/招募管理.md](./admin/pages/招募管理.md) |
| 报名管理 | [admin/pages/报名管理.md](./admin/pages/报名管理.md) |
| 评价管理 | [admin/pages/评价管理.md](./admin/pages/评价管理.md) |
| 用户管理 | [admin/pages/用户管理.md](./admin/pages/用户管理.md) |
| 系统配置 | [admin/pages/系统配置.md](./admin/pages/系统配置.md) |
| 主页变更审核 | [admin/pages/主页变更审核.md](./admin/pages/主页变更审核.md) |

---

## 五～十

数据模型、API、业务规则、非功能需求、里程碑、附录 — 同 v1.0 正文（见 Git 历史或按需展开）。

---

## 设计规范

[DESIGN-SPEC.md](./DESIGN-SPEC.md) — Figma「卡布里蓝」定稿，主要约束 **miniprogram/** UI。

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.1 | 2026-07-03 | 确认 Tab=Figma；首页=营销页；M1 不做消息；目录拆分 miniprogram/admin |
| v1.0 | 2026-07-03 | 初版总纲 |
