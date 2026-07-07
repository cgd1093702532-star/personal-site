#!/usr/bin/env python3
"""生成管理后台预览页 HTML（统一布局）"""

from pathlib import Path

ADMIN = Path(__file__).resolve().parent / "admin"

HEAD = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} · 英雄广场管理后台</title>
  <link rel="stylesheet" href="../assets/preview.css">
  <link rel="stylesheet" href="../assets/admin.css">
</head>
<body data-admin-page="{page}" data-admin-title="{nav_title}" data-admin-breadcrumb="{breadcrumb}">
  <div id="admin-page-root">
"""

FOOT = """
  </div>
  <script src="../assets/admin-layout.js"></script>
{scripts}
</body>
</html>
"""

# heroes body inline
HEROES_BODY = """
    <p id="heroes-admin-hint" class="admin-page-tip"></p>
    <div class="admin-tabs admin-tabs--inline">
      <button type="button" class="admin-tabs__item is-active" data-hero-mode="applications">申请审核</button>
      <button type="button" class="admin-tabs__item" data-hero-mode="certified">已认证英雄</button>
    </div>
    <div id="heroes-applications-panel">
      <div class="admin-tabs admin-tabs--pills" style="margin-top:12px">
        <button type="button" class="admin-tabs__item is-active" data-status-tab="pending">待审核</button>
        <button type="button" class="admin-tabs__item" data-status-tab="approved">已通过</button>
        <button type="button" class="admin-tabs__item" data-status-tab="rejected">已驳回</button>
        <button type="button" class="admin-tabs__item" data-status-tab="">全部</button>
      </div>
      <div class="admin-card" style="margin-top:16px">
        <div class="admin-card__body admin-card__body--compact">
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead><tr><th>姓名</th><th>手机号</th><th>项目类型</th><th>申请时间</th><th>状态</th><th>操作</th></tr></thead>
              <tbody id="heroes-admin-tbody"><tr><td colspan="6" class="admin-table__empty">加载中…</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
      <div id="heroes-admin-detail" class="admin-card admin-detail-panel" hidden><div class="admin-card__body"></div></div>
    </div>
    <div id="heroes-certified-panel" hidden>
      <div class="admin-card" style="margin-top:16px">
        <div class="admin-card__body admin-card__body--compact">
          <div class="admin-filter" style="margin-bottom:16px">
            <div class="admin-form-item"><label class="admin-form-item__label">英雄姓名</label><input id="heroes-certified-search" class="admin-input admin-search" type="search" placeholder="请输入姓名" /></div>
            <div class="admin-filter__actions"><button type="button" class="admin-btn admin-btn--primary" id="heroes-certified-search-btn">🔍 查询</button></div>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead><tr><th>姓名</th><th>评分</th><th>执教年限</th><th>学员数</th><th>项目类型</th><th>荣誉</th></tr></thead>
              <tbody id="heroes-certified-tbody"><tr><td colspan="6" class="admin-table__empty">加载中…</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
"""

SIGNUPS_BODY = """
    <p id="signups-admin-hint" class="admin-page-tip"></p>
    <div class="admin-card">
      <div class="admin-card__body admin-card__body--compact">
        <div class="admin-filter">
          <div class="admin-form-item"><label class="admin-form-item__label">姓名 / 手机号</label><input id="signups-admin-search" class="admin-input" type="search" placeholder="请输入姓名或手机号" /></div>
          <div class="admin-filter__actions">
            <button type="button" class="admin-btn admin-btn--primary" id="signups-admin-search-btn">🔍 查询</button>
            <button type="button" class="admin-btn" id="signups-admin-reset-btn">重置</button>
          </div>
        </div>
      </div>
    </div>
    <div class="admin-tabs admin-tabs--pills">
      <button type="button" class="admin-tabs__item is-active" data-signup-status="">全部</button>
      <button type="button" class="admin-tabs__item" data-signup-status="pending">待确认</button>
      <button type="button" class="admin-tabs__item" data-signup-status="confirmed">已确认</button>
      <button type="button" class="admin-tabs__item" data-signup-status="cancelled">已取消</button>
      <button type="button" class="admin-tabs__item" data-signup-status="refunded">已退款</button>
    </div>
    <div class="admin-tabs admin-tabs--pills admin-tabs--sub">
      <span class="admin-tabs__label">支付</span>
      <button type="button" class="admin-tabs__item is-active" data-pay-status="">全部</button>
      <button type="button" class="admin-tabs__item" data-pay-status="unpaid">待支付</button>
      <button type="button" class="admin-tabs__item" data-pay-status="paid">已支付</button>
      <button type="button" class="admin-tabs__item" data-pay-status="refunded">已退款</button>
    </div>
    <div class="admin-card">
      <div class="admin-card__body admin-card__body--compact">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>报名人</th><th>手机号</th><th>招募项目</th><th>场景</th><th>报名时间</th><th>支付状态</th><th>报名状态</th><th>操作</th></tr></thead>
            <tbody id="signups-admin-tbody"><tr><td colspan="8" class="admin-table__empty">加载中…</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
    <div id="signups-admin-detail" class="admin-card admin-detail-panel" hidden><div class="admin-card__body"></div></div>
"""

RECRUITMENTS_BODY = """
    <p id="recruitments-admin-hint" class="admin-page-tip"></p>
    <div class="admin-card">
      <div class="admin-card__body admin-card__body--compact">
        <div class="admin-filter">
          <div class="admin-form-item"><label class="admin-form-item__label">赛事标题</label><input id="recruitments-admin-search" class="admin-input" type="search" placeholder="请输入活动标题" /></div>
          <div class="admin-filter__actions">
            <button type="button" class="admin-btn admin-btn--primary" id="recruitments-admin-search-btn">🔍 查询</button>
            <button type="button" class="admin-btn" id="recruitments-admin-reset-btn">重置</button>
          </div>
        </div>
      </div>
    </div>
    <div class="admin-tabs admin-tabs--pills">
      <button type="button" class="admin-tabs__item is-active" data-recruit-status="">全部</button>
      <button type="button" class="admin-tabs__item" data-recruit-status="recruiting">招募中</button>
      <button type="button" class="admin-tabs__item" data-recruit-status="enrolling">报名中</button>
      <button type="button" class="admin-tabs__item" data-recruit-status="full">已满员</button>
      <button type="button" class="admin-tabs__item" data-recruit-status="ended">已结束</button>
      <button type="button" class="admin-tabs__item" data-recruit-status="cancelled">已取消</button>
    </div>
    <div class="admin-card">
      <div class="admin-card__body admin-card__body--compact">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>活动</th><th>类型</th><th>英雄</th><th>报名情况</th><th>价格</th><th>时间</th><th>状态</th><th>操作</th></tr></thead>
            <tbody id="recruitments-admin-tbody"><tr><td colspan="8" class="admin-table__empty">加载中…</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
    <div id="recruitments-admin-detail" class="admin-card admin-detail-panel" hidden><div class="admin-card__body"></div></div>
"""

COURSES_BODY = """
    <p id="courses-admin-hint" class="admin-page-tip"></p>
    <div class="admin-card">
      <div class="admin-card__body admin-card__body--compact">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>课程名称</th><th>价格</th><th>人数</th><th>授课英雄</th><th>操作</th></tr></thead>
            <tbody id="courses-admin-tbody"><tr><td colspan="5" class="admin-table__empty">加载中…</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
    <div id="courses-admin-detail" class="admin-card admin-detail-panel" hidden><div class="admin-card__body"></div></div>
"""

PLACEHOLDER_BODY = """
    <div class="admin-card"><div class="admin-card__body"><p class="admin-page-tip">功能开发中，敬请期待。</p></div></div>
"""

ALL_PAGES = {
    "dashboard.html": ("仪表盘", "dashboard", "仪表盘", "管理中心 / 仪表盘", """
    <div class="admin-stat-row">
      <div class="admin-stat-card"><div class="admin-stat-card__label">认证英雄</div><div class="admin-stat-card__value">128</div></div>
      <div class="admin-stat-card"><div class="admin-stat-card__label">进行中赛事</div><div class="admin-stat-card__value">12</div></div>
      <div class="admin-stat-card"><div class="admin-stat-card__label">待确认报名</div><div class="admin-stat-card__value">8</div></div>
      <div class="admin-stat-card"><div class="admin-stat-card__label">本月收入（元）</div><div class="admin-stat-card__value">86,420</div></div>
    </div>
    <div class="admin-card"><div class="admin-card__body"><h3 class="admin-card__title">快捷入口</h3><p class="admin-page-tip">请先运行 bash scripts/start-dev.sh 启动本地 API</p></div></div>
""", ""),
    "heroes.html": ("英雄管理", "heroes", "英雄管理", "管理中心 / 英雄管理", HEROES_BODY, '  <script src="../assets/db-client.js"></script>\n  <script src="../assets/heroes-admin-preview.js"></script>'),
    "recruitments.html": ("赛事管理", "recruitments", "赛事管理", "管理中心 / 赛事管理", RECRUITMENTS_BODY, '  <script src="../assets/db-client.js"></script>\n  <script src="../assets/recruitments-admin-preview.js"></script>'),
    "signups.html": ("报名管理", "signups", "报名管理", "管理中心 / 报名管理", SIGNUPS_BODY, '  <script src="../assets/db-client.js"></script>\n  <script src="../assets/signups-admin-preview.js"></script>'),
    "courses.html": ("课程管理", "courses", "课程管理", "管理中心 / 课程管理", COURSES_BODY, '  <script src="../assets/db-client.js"></script>\n  <script src="../assets/courses-admin-preview.js"></script>'),
    "reviews.html": ("评价管理", "reviews", "评价管理", "管理中心 / 评价管理", PLACEHOLDER_BODY, ""),
    "users.html": ("用户管理", "users", "用户管理", "管理中心 / 用户管理", PLACEHOLDER_BODY, ""),
    "settings.html": ("系统配置", "settings", "系统配置", "管理中心 / 系统配置", PLACEHOLDER_BODY, ""),
    "profile-changes.html": ("主页变更审核", "profile-changes", "主页变更审核", "管理中心 / 主页变更审核", PLACEHOLDER_BODY, ""),
}

for fname, (title, page, nav_title, breadcrumb, body, scripts) in ALL_PAGES.items():
    html = HEAD.format(title=title, page=page, nav_title=nav_title, breadcrumb=breadcrumb) + body + FOOT.format(scripts=scripts)
    (ADMIN / fname).write_text(html, encoding="utf-8")

print("ok", len(ALL_PAGES))
