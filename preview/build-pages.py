#!/usr/bin/env python3
"""重新生成手机端预览 HTML"""
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MP = ROOT / "miniprogram"
ASSETS = ROOT / "assets"
I = "../assets/images"  # 示例图片目录

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from page_catalog import PREVIEW_DOC_SCOPE, build_nav_payload, missing_catalog_docs, preview_doc_map

PREVIEW_DOC_MAP = preview_doc_map()


def write_preview_page_nav():
    """由 page_catalog ∩ 现存 md 写出左侧导航数据，禁止手改生成文件。"""
    payload = build_nav_payload()
    out = ASSETS / "preview-page-nav.json"
    out.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    n = sum(len(g["pages"]) for g in payload["groups"])
    print(f"preview-page-nav: {n} pages")
    skipped = missing_catalog_docs()
    if skipped:
        print(f"preview-page-nav: skipped deleted docs: {', '.join(skipped)}")

STATUS_ICONS = '''<span class="status-bar__icons" aria-hidden="true">
        <svg class="status-bar__svg" viewBox="0 0 17 11" fill="currentColor"><path d="M1 7h2.5v4H1V7zm4.5-2.5H8v6.5H5.5V4.5zm4.5-2.5h2.5V11H10V2zm4.5 0H17v11h-2.5V2z"/></svg>
        <svg class="status-bar__svg" viewBox="0 0 16 11" fill="currentColor"><path d="M8 2.5c2.2 0 4.2 1.1 5.3 2.8L14.5 4C13.2 2.4 10.8 1.2 8 1.2S2.8 2.4 1.5 4l1.2 1.3C3.8 3.6 5.8 2.5 8 2.5zm0 3.5c1.3 0 2.5.6 3.3 1.6l1.2-1.2C11 5.5 9.6 4.7 8 4.7s-3 .8-3.9 2.2l1.2 1.2c.8-1 2-1.6 3.7-1.6zM8 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>
        <svg class="status-bar__svg status-bar__svg--battery" viewBox="0 0 27 12" fill="currentColor"><rect x="1" y="1" width="21" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/><rect x="2.5" y="2.5" width="16" height="7" rx="1.2"/><path d="M23.5 4h2a1 1 0 011 1v2a1 1 0 01-1 1h-2V4z" opacity="0.35"/></svg>
      </span>'''

STATUS_LIGHT = f'''<div class="status-bar status-bar--light">
      <span class="status-bar__time">9:41</span>
      {STATUS_ICONS}
    </div>'''

STATUS_DARK = f'''<div class="status-bar status-bar--dark">
      <span class="status-bar__time">9:41</span>
      {STATUS_ICONS}
    </div>'''

def tabbar(active):
    # 图标与小程序 app.json tabBar 一致（示意：首页 / 英雄 / 商城 / 我的）
    icon_keys = {
        "index.html": "home",
        "heroes.html": "hero",
        "mall.html": "mall",
        "profile.html": "profile",
    }
    tabs = [("index.html", "首页"), ("heroes.html", "英雄"), ("mall.html", "商城"), ("profile.html", "我的")]
    links = []
    for href, label in tabs:
        key = icon_keys[href]
        suffix = "-active" if href == active else ""
        icon = f'<img class="tabbar__icon-img" src="../assets/icons/tab-{key}{suffix}.png" alt="">'
        links.append(
            f'<a class="{"active" if href == active else ""}" href="{href}">'
            f'<span class="tabbar__icon">{icon}</span>{label}</a>'
        )
    return "\n          ".join(links)

def navbar(title, back="index.html", *, back_target="", title_id="", share=False, right_action=None):
    tid = f' id="{title_id}"' if title_id else ""
    share_btn = '<button type="button" class="mp-navbar__share" data-hero-share aria-label="分享">↗</button>' if share else ""
    # href 用真实兜底页，JS 未加载时仍可跳转；SPA 内由 preview-nav.js 拦截
    back_href = back_target or back or "index.html"
    back_attrs = f'href="{back_href}" data-back-fallback="{back}"'
    if back_target:
        back_attrs += f' data-back-target="{back_target}"'
    back_link = (
        f'<a class="mp-navbar__back nav-back" {back_attrs}>‹</a>'
        if back
        else ""
    )
    right_btn = ""
    if right_action:
        href, label = right_action[0], right_action[1]
        btn_id = right_action[2] if len(right_action) > 2 else ""
        id_attr = f' id="{btn_id}"' if btn_id else ""
        right_btn = f'<a class="mp-navbar__action nav-forward"{id_attr} href="{href}">{label}</a>'
    return f'{back_link}<span class="mp-navbar__title"{tid}>{title}</span>{share_btn}{right_btn}'

def render_hero_detail(hero):
    tags = (hero.get("honor_titles", []) + hero.get("cert_badges", []))[:3]
    tags_html = "".join(f'<span class="hero-detail__tag">{t}</span>' for t in tags)
    rating = hero["rating"]
    stars_html = ""
    for i in range(1, 6):
        cls = "hero-detail__star hero-detail__star--filled" if rating >= i else (
            "hero-detail__star hero-detail__star--half" if rating >= i - 0.5 else "hero-detail__star"
        )
        stars_html += f'<span class="{cls}">★</span>'
    honors_html = "".join(
        f'<div class="hero-detail__honor"><div class="hero-detail__honor-icon">{h["icon"]}</div>'
        f'<div class="hero-detail__honor-body"><div class="hero-detail__honor-name">{h["name"]}</div>'
        f'<div class="hero-detail__honor-summary">{h["summary"]}</div></div></div>'
        for h in hero.get("past_honors", [])
    )
    moments_html = "".join(
        f'<div class="hero-detail__gallery-item"><img src="{I}/{img}" alt="精彩瞬间"></div>'
        for img in hero.get("moments", [])[:10]
    )
    certs_html = "".join(
        f'<div class="hero-detail__gallery-item hero-detail__gallery-item--cert"><img src="{I}/{img}" alt="资质证书"></div>'
        for img in hero.get("certificates", [])[:10]
    )
    return f'''<div class="hero-detail">
  <div class="hero-detail__head">
    <div class="hero-detail__avatar"><img src="{I}/{hero["avatar_img"]}" alt="{hero["name"]}"></div>
    <div class="hero-detail__info">
      <div class="hero-detail__name">{hero["name"]}</div>
      <div class="hero-detail__rating"><div class="hero-detail__stars">{stars_html}</div><span class="hero-detail__score">{rating}</span></div>
      <div class="hero-detail__tags">{tags_html}</div>
    </div>
  </div>
  <div class="hero-detail__block"><div class="hero-detail__label">关于我</div><div class="hero-detail__bio">{hero["about_me"]}</div></div>
  <div class="hero-detail__block"><div class="hero-detail__label">过往荣誉</div>{honors_html}</div>
  <div class="hero-detail__block"><div class="hero-detail__label">精彩瞬间</div><div class="hero-detail__gallery">{moments_html}</div></div>
  <div class="hero-detail__block"><div class="hero-detail__label">资质证书</div><div class="hero-detail__gallery">{certs_html}</div></div>
</div>'''

HERO_DETAIL_1 = {
    "name": "小哥",
    "avatar_img": "hero-1.jpg",
    "rating": 4.9,
    "years_exp": "10-15年",
    "student_count": 128,
    "honors_count": 3,
    "project_types": ["帆船", "游艇"],
    "honor_titles": ["ASA帆船认证教练"],
    "cert_badges": ["ASA认证", "ACA认证", "救生员证"],
    "about_me": "从事水上运动教学十五年，深耕帆船与游艇领域，持有 ASA 多项认证与救生员资质。带领学员从入门到参赛，注重安全规范与技术细节。曾出任中欧航海协会秘书长，担任 ASA205 级资深签证官，擅长根据学员水平定制课程方案。教学风格耐心细致，累计服务学员逾百人，多次组织企业团建与青少年帆船夏令营，希望帮助更多人爱上航海运动，在风浪中找到自信与快乐。",
    "past_honors": [
        {"icon": "🏆", "name": "企业家杯冠军教练", "summary": "连续三年带队夺冠"},
        {"icon": "👑", "name": "中欧航海协会秘书长", "summary": "负责协会赛事与培训"},
        {"icon": "⛵", "name": "ASA205级资深签证官", "summary": "负责资质认证评审"},
    ],
    "moments": ["hero-1.jpg", "hero-2.jpg", "event.jpg", "course.jpg", "recruit-cover.jpg"],
    "certificates": [
        {"name": "国家级教练证", "image": "cert.jpg"},
        {"name": "救生员证", "image": "cert.jpg"},
        {"name": "ACA证", "image": "cert.jpg"},
        {"name": "ASA认证", "image": "cert.jpg"},
    ],
    "teaching_philosophy": {
        "intro": "小哥教练秉承“细心专业、耐心同频、快乐自信、安全至上”的教学理念，致力于将专业的航海知识与愉悦的航海体验完美结合。",
        "belief_lead": "他相信：",
        "points": [
            {"title": "细心专业", "desc": "每一个细节都关乎航行安全与效率"},
            {"title": "耐心同频", "desc": "根据学员节奏调整教学，确保理解掌握"},
            {"title": "快乐自信", "desc": "在快乐中学习，在航海中建立自信"},
            {"title": "安全至上", "desc": "安全是航海的第一原则和最终底线"},
        ],
    },
    "race_showcase": {
        "intro": "小哥教练拥有丰富的国内外赛事经验，曾参加多项知名帆船赛事：",
        "items": [
            {"title": "CCOR国际帆船赛", "image": "event.jpg"},
            {"title": "上海帆船公开赛", "image": "banner.jpg"},
            {"title": "厦门俱乐部杯帆船赛", "image": "recruit-cover.jpg"},
            {"title": "青岛市长杯帆船赛", "image": "hero-1.jpg"},
            {"title": "青岛新年杯帆船赛", "image": "course.jpg"},
        ],
    },
    "voyage_leadership": {
        "intro": "作为经验丰富的长航领队，小哥教练曾多次组织并带队完成具有挑战性的长距离航行：",
        "items": [
            {"title": "跨越渤海海峡长途航行", "image": "event.jpg"},
            {"title": "青岛跳岛长航训练", "image": "banner.jpg"},
            {"title": "舟山群岛长航探险", "image": "recruit-cover.jpg"},
            {"title": "梦回西沙长航远航", "image": "hero-2.jpg"},
        ],
    },
    "social_showcase": {
        "intro": "作为中国海洋发展研究会常务理事和中欧校友航海协会秘书长，小哥教练积极推动中国航海运动的发展：",
        "points": [
            "促进国际航海文化交流",
            "推动航海教育普及",
            "培养新一代航海人才",
            "倡导海洋环境保护理念",
        ],
    },
    "personal_showcase": {
        "intro": "小哥教练的个人展示，记录教学与航海日常中的精彩瞬间：",
        "items": [
            {"title": "帆船教学现场", "image": "hero-1.jpg"},
            {"title": "学员出海练习", "image": "hero-2.jpg"},
            {"title": "赛事训练日", "image": "event.jpg"},
            {"title": "课程合影", "image": "course.jpg"},
            {"title": "码头整备瞬间", "image": "recruit-cover.jpg"},
            {"title": "湖上航行", "image": "banner.jpg"},
            {"title": "亲子体验", "image": "news-1.jpg"},
            {"title": "证书展示", "image": "cert.jpg"},
            {"title": "团队合练", "image": "hero-1.jpg"},
            {"title": "赛后复盘", "image": "event.jpg"},
        ],
    },
}

ALL_HEROES = {
    "1": HERO_DETAIL_1,
    "2": {
        "name": "熊猫",
        "avatar_img": "hero-2.jpg",
        "rating": 4.8,
        "years_exp": 15,
        "student_count": 96,
        "honors_count": 2,
        "project_types": ["帆船", "浆板"],
        "honor_titles": ["ASA帆船认证教练", "15年执教经验"],
        "cert_badges": ["ASA认证", "救生员证"],
        "about_me": "专注帆船与浆板入门教学十五年，擅长零基础学员引导与团队体验课设计。教学强调安全意识与基础动作规范，帮助学员快速建立水上运动信心。曾服务多家企业与亲子营地，课程反馈稳定。希望以轻松有趣的方式，让更多人接触帆船与浆板运动，享受湖畔与海风中的自由感。",
        "past_honors": [
            {"icon": "🏅", "name": "ASA帆船认证教练", "summary": "持官方认证资质"},
            {"icon": "⛵", "name": "浆板入门金牌讲师", "summary": "入门课好评率领先"},
        ],
        "moments": ["hero-2.jpg", "event.jpg", "course.jpg"],
        "certificates": [
            {"name": "ASA帆船认证", "image": "cert.jpg"},
            {"name": "救生员证", "image": "cert.jpg"},
            {"name": "ACA证", "image": "cert.jpg"},
        ],
    },
    "3": {
        "name": "Amy",
        "avatar_img": "hero-1.jpg",
        "rating": 4.6,
        "years_exp": 5,
        "student_count": 64,
        "honors_count": 1,
        "project_types": ["桨板", "潜水"],
        "honor_titles": ["PADI潜水教练", "5年教学经验"],
        "cert_badges": ["PADI认证", "ACA认证"],
        "about_me": "桨板与潜水双项教练，五年教学经验，擅长女性与青少年入门课程。注重呼吸节奏与核心力量训练，帮助学员克服恐水心理。持有 PADI 潜水教练与 ACA 桨板认证，可开展湖泊桨板与开放水域潜水体验。希望用温和耐心的方式，带领学员探索水下与水面世界。",
        "past_honors": [
            {"icon": "🤿", "name": "PADI潜水教练", "summary": "开放水域教学资质"},
            {"icon": "🏄", "name": "桨板体验课讲师", "summary": "亲子课口碑优秀"},
        ],
        "moments": ["hero-1.jpg", "course.jpg"],
        "certificates": [
            {"name": "PADI潜水证", "image": "cert.jpg"},
            {"name": "ACA桨板证", "image": "cert.jpg"},
        ],
    },
    "4": {
        "name": "大伟",
        "avatar_img": "hero-2.jpg",
        "rating": 5.0,
        "years_exp": 20,
        "student_count": 210,
        "honors_count": 5,
        "project_types": ["帆船", "冲浪"],
        "honor_titles": ["国家级帆船教练", "20年执教经验"],
        "cert_badges": ["国家级教练", "ACA认证", "救生员证"],
        "about_me": "二十年帆船与冲浪执教经验，国家级帆船教练，多次带队参加国内外赛事并获奖。擅长竞技训练与高级技术提升，注重战术配合与体能储备。长期担任企业赛事顾问与青少年队教练，教学风格严谨高效。希望培养更多优秀水手，推动国内帆船运动发展。",
        "past_honors": [
            {"icon": "🥇", "name": "国家级帆船教练", "summary": "国家级执业资质"},
            {"icon": "🏆", "name": "全国帆船联赛导师", "summary": "多次带队获奖"},
            {"icon": "🌊", "name": "冲浪入门推广人", "summary": "推广冲浪安全教学"},
        ],
        "moments": ["hero-2.jpg", "hero-1.jpg", "event.jpg", "recruit-cover.jpg", "course.jpg", "news-1.jpg"],
        "certificates": [
            {"name": "国家级教练证", "image": "cert.jpg"},
            {"name": "救生员证", "image": "cert.jpg"},
            {"name": "ACA证", "image": "cert.jpg"},
            {"name": "ASA认证", "image": "cert.jpg"},
        ],
    },
    "5": {
        "name": "阿海",
        "nickname": "阿海",
        "avatar_img": "hero-1.jpg",
        "rating": 4.7,
        "years_exp": 8,
        "student_count": 86,
        "honors_count": 2,
        # 演示详情 §2.2：广场列表仍可见，详情按已禁用/删除处理
        "enabled": False,
        "stale_list_demo": True,
        "project_types": ["皮划艇", "桨板"],
        "honor_titles": ["省级皮划艇教练", "8年执教经验"],
        "cert_badges": ["省级教练", "ACA认证", "救生员证"],
        "about_me": "专注皮划艇与桨板教学八年，擅长零基础成人与亲子体验课。注重水域安全与团队协作，曾多次组织城市皮划艇巡游与企业团建。持有省级教练与救生员资质，教学风格轻松友好，希望带更多人感受桨叶划开水面的节奏与乐趣。",
        "past_honors": [
            {"icon": "🏅", "name": "省级皮划艇教练", "summary": "省级执业资质"},
            {"icon": "🏆", "name": "城市巡游活动主理人", "summary": "多次组织百人级巡游"},
        ],
        "moments": ["hero-1.jpg", "event.jpg", "course.jpg"],
        "certificates": [
            {"name": "省级教练证", "image": "cert.jpg"},
            {"name": "救生员证", "image": "cert.jpg"},
            {"name": "ACA证", "image": "cert.jpg"},
        ],
    },
}

COURSE_CATALOG = {
    "c1": {
        "course_id": "c1",
        "title": "ASA101-103培训课",
        "timeDisplay": "7月26日 09:00 - 16:30",
        "location": "滴水湖二号码头",
        "fee": 1280,
        "signed": 10,
        "total": 16,
        "cover_image": "course.jpg",
    },
    "c2": {
        "course_id": "c2",
        "title": "桨板入门体验课",
        "timeDisplay": "7月18日 10:00 - 12:00",
        "location": "太湖桨板营地",
        "fee": 198,
        "signed": 5,
        "total": 12,
        "cover_image": "course.jpg",
    },
    "c3": {
        "course_id": "c3",
        "title": "潜水基础课程",
        "timeDisplay": "8月10日 09:00 - 17:00",
        "location": "三亚开放水域基地",
        "fee": 2680,
        "signed": 3,
        "total": 8,
        "cover_image": "course.jpg",
    },
    "c4": {
        "course_id": "c4",
        "title": "皮划艇入门体验课",
        "timeDisplay": "7月19日 09:30 - 11:30",
        "location": "淀山湖皮划艇基地",
        "fee": 268,
        "signed": 4,
        "total": 10,
        "cover_image": "course.jpg",
    },
    "c5": {
        "course_id": "c5",
        "title": "帆船入门周末班",
        "timeDisplay": "8月2日 09:00 - 16:00",
        "location": "金鸡湖帆船码头",
        "fee": 880,
        "signed": 7,
        "total": 12,
        "cover_image": "course.jpg",
    },
    "c6": {
        "course_id": "c6",
        "title": "ASA进阶航行课",
        "timeDisplay": "8月15日 08:30 - 17:00",
        "location": "青岛奥帆中心",
        "fee": 1680,
        "signed": 5,
        "total": 8,
        "cover_image": "course.jpg",
    },
}

# 每位英雄卡片：赛事 / 活动 / 课程（与首页英雄广场一致，共 5 人）
COURSES_BY_HERO = {
    "1": ["c1"],
    "2": ["c5"],
    "3": ["c2"],
    "4": ["c6"],
    "5": ["c4"],
}

RECRUITMENTS_BY_HERO = {
    "1": [
        {
            "recruit_id": "r1",
            "type": "event",
            "typeLabel": "赛事",
            "status": "招募中",
            "title": "企业家杯月赛",
            "start_at": "2026-06-08T09:00:00",
            "end_at": "2026-06-08T16:00:00",
            "location": "滴水湖二号码头",
            "fee": 500,
            "feeDisplay": "500",
            "signed": 0,
            "total": 16,
            "signupDisplay": "招募名额：0/16",
            "cover_image": "event.jpg",
            "time": "06/08 (周六) 09:00-16:00",
        },
        {
            "recruit_id": "r2",
            "type": "activity",
            "typeLabel": "活动",
            "status": "报名中",
            "title": "亲子帆船体验日",
            "start_at": "2026-06-08T09:00:00",
            "end_at": "2026-06-08T16:00:00",
            "location": "滴水湖二号码头",
            "fee": 1280,
            "feeDisplay": "1,280",
            "signed": 3,
            "total": None,
            "signupDisplay": "招募名额：3/不限",
            "cover_image": "banner.jpg",
            "time": "06/08 (周六) 09:00-16:00",
        },
        {
            "recruit_id": "r9",
            "type": "activity",
            "typeLabel": "活动",
            "status": "报名中",
            "title": "周末帆船体验营",
            "start_at": "2026-06-14T09:00:00",
            "end_at": "2026-06-14T16:00:00",
            "location": "滴水湖二号码头",
            "fee": 680,
            "feeDisplay": "680",
            "signed": 9,
            "total": 16,
            "cover_image": "recruit-cover.jpg",
            "time": "06/14 (周日) 09:00-16:00",
        },
        {
            "recruit_id": "r10",
            "type": "event",
            "typeLabel": "赛事",
            "status": "招募中",
            "title": "城市帆船联赛选拔赛",
            "start_at": "2026-06-21T08:00:00",
            "end_at": "2026-06-21T17:00:00",
            "location": "滴水湖一号码头",
            "fee": 800,
            "feeDisplay": "800",
            "signed": 10,
            "total": 20,
            "cover_image": "event.jpg",
            "time": "06/21 (周日) 08:00-17:00",
        },
        {
            "recruit_id": "r11",
            "type": "activity",
            "typeLabel": "活动",
            "status": "报名中",
            "title": "游艇驾驶体验日",
            "start_at": "2026-06-28T10:00:00",
            "end_at": "2026-06-28T15:00:00",
            "location": "滴水湖游艇会",
            "fee": 1680,
            "feeDisplay": "1,680",
            "signed": 4,
            "total": 8,
            "cover_image": "course.jpg",
            "time": "06/28 (周日) 10:00-15:00",
        },
    ],
    "2": [
        {
            "recruit_id": "r3",
            "type": "event",
            "status": "招募中",
            "title": "金鸡湖浆板周末联赛",
            "start_at": "2026-08-03T14:00:00",
            "end_at": "2026-08-03T17:00:00",
            "location": "金鸡湖桨板码头",
            "fee": 298,
            "signed": 5,
            "total": 12,
            "cover_image": "event.jpg",
        },
        {
            "recruit_id": "r4",
            "type": "activity",
            "status": "报名中",
            "title": "桨板周末体验",
            "start_at": "2026-08-09T14:00:00",
            "end_at": "2026-08-09T16:00:00",
            "location": "金鸡湖桨板码头",
            "fee": 168,
            "signed": 6,
            "total": 12,
            "cover_image": "event.jpg",
        },
    ],
    "3": [
        {
            "recruit_id": "r13",
            "type": "event",
            "status": "招募中",
            "title": "开放水域潜水体验营",
            "start_at": "2026-08-10T09:00:00",
            "end_at": "2026-08-10T17:00:00",
            "location": "三亚开放水域基地",
            "fee": 680,
            "signed": 4,
            "total": 10,
            "cover_image": "event.jpg",
        },
        {
            "recruit_id": "r5",
            "type": "activity",
            "status": "报名中",
            "title": "桨板入门体验",
            "start_at": "2026-07-18T10:00:00",
            "end_at": "2026-07-18T12:00:00",
            "location": "太湖桨板营地",
            "fee": 128,
            "signed": 5,
            "total": 10,
            "cover_image": "event.jpg",
        },
    ],
    "4": [
        {
            "recruit_id": "r7",
            "type": "event",
            "status": "招募中",
            "title": "城市帆船精英赛",
            "start_at": "2026-07-28T07:30:00",
            "end_at": "2026-07-28T18:00:00",
            "location": "青岛奥帆中心",
            "fee": 800,
            "signed": 15,
            "total": 24,
            "cover_image": "event.jpg",
        },
        {
            "recruit_id": "r7a",
            "type": "activity",
            "status": "报名中",
            "title": "周末帆船体验",
            "start_at": "2026-08-09T09:00:00",
            "end_at": "2026-08-09T16:00:00",
            "location": "青岛奥帆中心",
            "fee": 398,
            "signed": 8,
            "total": 16,
            "cover_image": "event.jpg",
        },
    ],
    "5": [
        {
            "recruit_id": "r8",
            "type": "event",
            "status": "招募中",
            "title": "周末皮划艇体验营",
            "start_at": "2026-08-02T09:00:00",
            "end_at": "2026-08-02T16:00:00",
            "location": "滴水湖皮划艇营地",
            "fee": 268,
            "signed": 6,
            "total": 12,
            "cover_image": "event.jpg",
        },
        {
            "recruit_id": "r8a",
            "type": "activity",
            "status": "报名中",
            "title": "皮划艇亲子体验",
            "start_at": "2026-08-16T10:00:00",
            "end_at": "2026-08-16T12:00:00",
            "location": "滴水湖皮划艇营地",
            "fee": 168,
            "signed": 4,
            "total": 10,
            "cover_image": "event.jpg",
        },
    ],
}


WEEKDAYS_CN = ("周一", "周二", "周三", "周四", "周五", "周六", "周日")


def format_recruit_time_range(start_at: str, end_at: str) -> str:
    """卡片时间条：06/08 (周六) 09:00-16:00"""
    start = datetime.fromisoformat(start_at)
    end = datetime.fromisoformat(end_at)
    weekday = WEEKDAYS_CN[start.weekday()]
    start_part = f"{start.month:02d}/{start.day:02d} ({weekday}) {start.hour:02d}:{start.minute:02d}"
    same_day = start.date() == end.date()
    if same_day:
        return f"{start_part}-{end.hour:02d}:{end.minute:02d}"
    end_part = f"{end.month:02d}/{end.day:02d} {end.hour:02d}:{end.minute:02d}"
    return f"{start_part}-{end_part}"


def format_recruit_signup(signed, total) -> str:
    if total is None or total == "" or str(total).strip() in ("不限", "unlimited"):
        return f"招募名额：{signed}/不限"
    try:
        total_n = int(total)
        signed_n = int(signed)
    except (TypeError, ValueError):
        return f"招募名额：{signed}/{total}"
    return f"招募名额：{signed_n}/{total_n}"


def format_recruit_fee_display(fee) -> str:
    try:
        return f"{int(fee):,}"
    except (TypeError, ValueError):
        return str(fee)


for hero_id, items in RECRUITMENTS_BY_HERO.items():
    ALL_HEROES[hero_id]["recruitments"] = [
        {
            **item,
            "typeLabel": item.get("typeLabel") or ("活动" if item.get("type") == "activity" else "赛事"),
            "time": item.get("time") or format_recruit_time_range(item["start_at"], item["end_at"]),
            "timeDisplay": item.get("time")
            or item.get("timeDisplay")
            or format_recruit_time_range(item["start_at"], item["end_at"]),
            "feeDisplay": item.get("feeDisplay") or format_recruit_fee_display(item.get("fee")),
            # 统一从人数真值生成，禁止旧 signupDisplay 把新格式覆盖回去
            "signupDisplay": format_recruit_signup(item.get("signed"), item.get("total")),
        }
        for item in items
    ]

for hero_id, course_ids in COURSES_BY_HERO.items():
    ALL_HEROES[hero_id]["courses"] = [
        {
            **COURSE_CATALOG[cid],
            "feeDisplay": format_recruit_fee_display(COURSE_CATALOG[cid].get("fee")),
            "signupDisplay": format_recruit_signup(
                COURSE_CATALOG[cid].get("signed"),
                COURSE_CATALOG[cid].get("total"),
            ),
        }
        for cid in course_ids
    ]

# 防回退：详情页活动/赛事/课程必须保留统一卡片所需数据与文案
for hero_id, hero in ALL_HEROES.items():
    for item in [*(hero.get("recruitments") or []), *(hero.get("courses") or [])]:
        signup_display = str(item.get("signupDisplay") or "")
        if not signup_display.startswith("招募名额："):
            raise ValueError(
                f"hero {hero_id} item {item.get('recruit_id') or item.get('course_id')} "
                f"signupDisplay 格式回退：{signup_display!r}"
            )

def truncate_label(text, max_len=6):
    s = str(text or "")
    return s if len(s) <= max_len else f"{s[:max_len]}…"


def hero_home_card(
    name,
    img,
    types,
    honor1,
    honor2,
    row1,
    row2,
    *,
    hero_id="1",
    row1_type="event",
    row2_type="course",
    row1_id="r1",
    row2_id="c1",
    years="",
    rating="",
    bio="",
    list_mode=False,
    nickname="",
    home_badges=False,
    row3="",
    row3_id="",
    row3_type="course",
):
    display_name = nickname or name
    type_tags = "".join(
        f'<span class="tag tag--skill">{truncate_label(t.strip())}</span>'
        for t in types.split(",")
        if t.strip()
    )
    row_labels = {"event": "赛事", "course": "课程", "activity": "活动"}

    def row_href(row_type, item_id):
        if row_type == "course":
            return f"course-detail.html?id={item_id}"
        return f"recruitment-detail.html?id={item_id}"

    row1_link = row_href(row1_type, row1_id)
    row2_link = row_href(row2_type, row2_id)
    extra = " hero-card--list" if list_mode else (" hero-card--home" if not list_mode else "")
    honors_attr = honor1 if not (list_mode and honor2) else f"{honor1},{honor2}"
    data = (
        f' data-name="{name}" data-nickname="{display_name}" data-types="{types}"'
        f' data-years="{years}" data-rating="{rating}" data-bio="{bio}" data-honors="{honors_attr}"'
    )
    honors_html = ""
    if honor1:
        honors_html = (
            '<div class="hero-card__honors">'
            '<span class="hero-card__honor hero-card__honor--primary">'
            '<span class="hero-card__honor-icon">'
            '<img class="hero-card__honor-icon-img" src="../assets/icons/crown.png" alt=""></span>'
            f'<span class="hero-card__honor-text">{honor1}</span></span>'
        )
        # 主荣誉（皇冠）+ 经验副标；无经验时用第二条荣誉
        secondary = ""
        if years:
            y = str(years).strip()
            if y.isdigit():
                secondary = f"{y}年经验"
            elif "经验" in y:
                secondary = y.replace("执教经验", "经验")
            else:
                secondary = f"{y}经验"
        elif honor2:
            secondary = honor2.replace("执教经验", "经验") if "执教经验" in honor2 else honor2
        if secondary:
            honors_html += (
                '<span class="hero-card__honor hero-card__honor--secondary">'
                f'<span class="hero-card__honor-text">{secondary}</span></span>'
            )
        honors_html += "</div>"

    def row_html(href, label_key, text, plain=False):
        if plain:
            return (
                f'<a class="hero-card__row nav-forward" href="{href}">'
                f'<span class="hero-card__row-text">{text}</span>'
                f'<span class="hero-card__row-arrow">›</span></a>'
            )
        return (
            f'<a class="hero-card__row nav-forward" href="{href}">'
            f'<span class="tag tag--{label_key}">{row_labels[label_key]}</span>'
            f'<span class="hero-card__row-text">{text}</span>'
            f'<span class="hero-card__row-arrow">›</span></a>'
        )

    rows = row_html(row1_link, row1_type, row1) + row_html(row2_link, row2_type, row2)
    if row3:
        rows += row_html(row_href(row3_type, row3_id or row2_id), row3_type, row3)

    return (
        f'<div class="hero-card{extra}" data-hero-id="{hero_id}"{data}>'
        f'<a class="hero-card__head nav-forward" href="hero-detail.html?id={hero_id}">'
        f'<div class="hero-card__avatar"><img src="{I}/{img}" alt="{display_name}"></div>'
        f'<div class="hero-card__meta"><div class="hero-card__name-row">'
        f'<span class="hero-card__name">{display_name}</span>{type_tags}</div>'
        f"{honors_html}</div></a>"
        f'<div class="hero-card__rows">{rows}</div></div>'
    )

def event_hero_card(
    title,
    img,
    location,
    price,
    time_text,
    *,
    recruit_id="r1",
    hero_id="",
    card_type="event",
):
    """首页英雄横滑 / 精选活动同壳大图卡"""
    type_label = "活动" if card_type == "activity" else "赛事"
    tag_class = "tag--activity" if card_type == "activity" else "tag--event"
    dot_class = " event-card__dot--activity" if card_type == "activity" else ""
    hero_attr = f' data-hero-id="{hero_id}"' if hero_id else ""
    return (
        f'<a class="event-card event-card--hero event-card--home nav-forward" '
        f'href="recruitment-detail.html?id={recruit_id}"{hero_attr}>'
        f'<div class="event-card__bg"><img src="{I}/{img}" alt="{title}"></div>'
        f'<div class="event-card__scrim"></div>'
        f'<div class="event-card__top">'
        f'<span class="event-card__time"><i class="event-card__dot{dot_class}" aria-hidden="true"></i>{time_text}</span>'
        f"</div>"
        f'<div class="event-card__bottom">'
        f'<div class="event-card__info">'
        f'<span class="tag {tag_class}">{type_label}</span>'
        f'<div class="event-card__title">{title}</div>'
        f'<div class="event-card__meta">{location}</div>'
        f"</div>"
        f'<div class="event-card__footer">'
        f'<span class="event-card__price">{price}</span>'
        f'<span class="event-card__btn">立即报名</span>'
        f"</div></div></a>"
    )

def hero_row(name, img, types, years, rating, badges, bio):
    type_tags = "".join(f'<span class="tag tag--skill">{t.strip()}</span>' for t in types.split(","))
    cert_list = [b.strip() for b in badges.split(",") if b.strip()]
    badge_tags = f'<span class="tag tag--years">{years}年经验</span>'
    for b in cert_list[:2]:
        badge_tags += f'<span class="tag tag--cert">{b}</span>'
    return f'''<a class="list-item hero-row" href="hero-detail.html" data-name="{name}" data-types="{types}" data-cert="{badges}" data-badges="{badges}" data-bio="{bio}" data-years="{years}" data-rating="{rating}"><div class="avatar"><img src="{I}/{img}" alt="{name}"></div><div class="hero-row__body"><div class="card__title">{name}</div><div class="card__rating">★ {rating}</div><div class="hero-row__tags">{type_tags}</div><div class="hero-row__badges">{badge_tags}</div></div><span class="hero-row__arrow">›</span></a>'''

VK_HTML = '''
          <div id="hero-keyboard" class="virtual-keyboard" aria-hidden="true">
            <div class="virtual-keyboard__toolbar">
              <button type="button" class="vk-btn vk-btn--ghost" id="vk-dismiss">完成</button>
            </div>
            <div class="virtual-keyboard__rows">
              <div class="vk-row"><button type="button" class="vk-key" data-key="Q">Q</button><button type="button" class="vk-key" data-key="W">W</button><button type="button" class="vk-key" data-key="E">E</button><button type="button" class="vk-key" data-key="R">R</button><button type="button" class="vk-key" data-key="T">T</button><button type="button" class="vk-key" data-key="Y">Y</button><button type="button" class="vk-key" data-key="U">U</button><button type="button" class="vk-key" data-key="I">I</button><button type="button" class="vk-key" data-key="O">O</button><button type="button" class="vk-key" data-key="P">P</button></div>
              <div class="vk-row"><button type="button" class="vk-key" data-key="A">A</button><button type="button" class="vk-key" data-key="S">S</button><button type="button" class="vk-key" data-key="D">D</button><button type="button" class="vk-key" data-key="F">F</button><button type="button" class="vk-key" data-key="G">G</button><button type="button" class="vk-key" data-key="H">H</button><button type="button" class="vk-key" data-key="J">J</button><button type="button" class="vk-key" data-key="K">K</button><button type="button" class="vk-key" data-key="L">L</button></div>
              <div class="vk-row"><button type="button" class="vk-key vk-key--wide" data-key="del">⌫</button><button type="button" class="vk-key" data-key="Z">Z</button><button type="button" class="vk-key" data-key="X">X</button><button type="button" class="vk-key" data-key="C">C</button><button type="button" class="vk-key" data-key="V">V</button><button type="button" class="vk-key" data-key="B">B</button><button type="button" class="vk-key" data-key="N">N</button><button type="button" class="vk-key" data-key="M">M</button><button type="button" class="vk-key vk-key--wide" data-key=" ">空格</button></div>
            </div>
          </div>'''

HERO_FILTER_SHEET = '''
          <div id="hero-filter-sheet" class="heroes-filter-sheet mobile-overlay" hidden>
            <div class="heroes-filter-sheet__mask"></div>
            <div class="heroes-filter-sheet__panel">
              <div class="heroes-filter-sheet__header">
                <span class="heroes-filter-sheet__title">筛选</span>
                <button type="button" class="heroes-filter-sheet__reset" id="hero-filter-reset">重置</button>
              </div>
              <div class="heroes-filter-sheet__group">
                <div class="heroes-filter-sheet__label">项目</div>
                <div class="heroes-filter-sheet__chips filter-scroll" id="hero-filters">
                  <span class="filter-chip active" data-type="全部">全部</span><span class="filter-chip" data-type="帆船">帆船</span><span class="filter-chip" data-type="皮划艇">皮划艇</span><span class="filter-chip" data-type="桨板">桨板</span><span class="filter-chip" data-type="潜水">潜水</span><span class="filter-chip" data-type="冲浪">冲浪</span>
                </div>
              </div>
              <div class="heroes-filter-sheet__group">
                <div class="heroes-filter-sheet__label">排序</div>
                <div class="heroes-filter-sheet__chips filter-scroll" id="hero-sort">
                  <span class="filter-chip active" data-sort="default">综合排序</span><span class="filter-chip" data-sort="rating_desc">评分从高到低</span><span class="filter-chip" data-sort="rating_asc">评分从低到高</span>
                </div>
              </div>
              <div class="heroes-filter-sheet__group">
                <div class="heroes-filter-sheet__label">年限</div>
                <div class="heroes-filter-sheet__chips filter-scroll" id="hero-years">
                  <span class="filter-chip active" data-years="全部">不限年限</span><span class="filter-chip" data-years="1-3">1-3年</span><span class="filter-chip" data-years="3-5">3-5年</span><span class="filter-chip" data-years="5-10">5-10年</span><span class="filter-chip" data-years="10+">10年以上</span>
                </div>
              </div>
              <button type="button" class="heroes-filter-sheet__confirm" id="hero-filter-done">完成</button>
            </div>
          </div>'''

PROFILE_PUBLISH_SHEET = ''

PROFILE_PAGE_SCRIPT = (
    '<script src="../assets/db-client.js"></script>'
    '<script src="../assets/preview-toast.js"></script>'
    '<script src="../assets/profile-preview.js"></script>'
)
HERO_PAGE_SCRIPT = (
    '<script src="../assets/heroes-data.js"></script>'
    '<script src="../assets/db-client.js"></script>'
    '<script src="../assets/heroes-list-preview.js"></script>'
    '<script src="../assets/hero-search.js"></script>'
)

def cover_carousel(images, alt="活动封面"):
    imgs = images if isinstance(images, list) else [images]
    if len(imgs) == 1:
        return f'<div class="cover-full"><img src="{I}/{imgs[0]}" alt="{alt}"></div>'
    slides = "".join(
        f'<div class="cover-carousel__slide"><img src="{I}/{img}" alt="{alt}"></div>'
        for img in imgs
    )
    dots = "".join(
        f'<span class="cover-carousel__dot{" is-active" if i == 0 else ""}"></span>'
        for i in range(len(imgs))
    )
    return (
        f'<div class="cover-carousel" data-cover-carousel>'
        f'<div class="cover-carousel__viewport"><div class="cover-carousel__track">{slides}</div></div>'
        f'<div class="cover-carousel__dots">{dots}</div></div>'
    )

def render(
    title,
    content,
    *,
    status=STATUS_DARK,
    navbar_html="",
    tabbar_html="",
    overlays="",
    immersive=False,
    preview_doc="",
    preview_doc_scope="",
):
    tb = f'<nav class="tabbar">{tabbar_html}</nav>' if tabbar_html else ""
    if immersive:
        shell_cls = "mobile-shell mobile-shell--immersive"
        header_block = (
            f'<div class="immersive-chrome" id="immersive-chrome">'
            f"{STATUS_LIGHT}"
            f'<header class="mp-navbar mp-navbar--immersive">{navbar_html}</header>'
            f"</div>"
            if navbar_html
            else ""
        )
        cc = "content--sub content--immersive"
        main_attrs = ' id="immersive-scroll"'
    else:
        shell_cls = "mobile-shell"
        nav = f'<header class="mp-navbar">{navbar_html}</header>' if navbar_html else ""
        header_block = f"{status}{nav}"
        cc = "content--tab" if tabbar_html else "content--sub"
        main_attrs = ""
    body_attrs = ""
    device_attrs = ""
    if preview_doc:
        body_attrs = f' data-preview-doc="{preview_doc}"'
        device_attrs = f' data-preview-doc="{preview_doc}"'
        if preview_doc_scope:
            body_attrs += f' data-preview-doc-scope="{preview_doc_scope}"'
            device_attrs += f' data-preview-doc-scope="{preview_doc_scope}"'
    # 所有小程序预览页都挂文档面板 + 左侧页面导航，便于 SPA 三方联动
    _aside_js = ASSETS / "preview-doc-aside.js"
    _aside_ver = int(_aside_js.stat().st_mtime) if _aside_js.is_file() else 0
    _nav_js = ASSETS / "preview-page-nav.js"
    _nav_ver = int(_nav_js.stat().st_mtime) if _nav_js.is_file() else 0
    _gallery_js = ASSETS / "preview-dialog-gallery.js"
    _gallery_ver = int(_gallery_js.stat().st_mtime) if _gallery_js.is_file() else 0
    doc_script = (
        f'\n  <script src="../assets/preview-doc-aside.js?v={_aside_ver}"></script>'
        f'\n  <script src="../assets/preview-page-nav.js?v={_nav_ver}"></script>'
        f'\n  <script src="../assets/preview-dialog-gallery.js?v={_gallery_ver}"></script>'
    )
    if "preview-doc-aside.js" in overlays:
        doc_script = ""
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=402, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>{title} · 英雄广场</title>
  <link rel="stylesheet" href="../assets/preview.css">
</head>
<body{body_attrs}>
  <div class="device"{device_attrs}>
    <div class="device__frame">
      <div class="device__notch"></div>
      <div class="{shell_cls}">
        {header_block}
        <main class="content {cc}"{main_attrs}>
{content}
        </main>
        {tb}
        {overlays}
        <div class="home-indicator"></div>
      </div>
    </div>
  </div>
  <script src="../assets/preview-nav.js"></script>{doc_script}
</body>
</html>"""

HOME = f"""
          <div class="home-banner">
            <img class="home-banner__img" src="{I}/banner.jpg" alt="帆船赛事">
            <div class="home-banner__overlay"></div>
            <div class="home-banner__fade"></div>
            <div class="home-banner__season"><span class="home-banner__pin" aria-hidden="true">📍</span>2023.06 前往</div>
            <div class="home-banner__content">
              <span class="home-banner__title">企业家杯月赛</span>
              <span class="home-banner__date">06.20</span>
              <span class="home-banner__desc">定制式高端水上潮流体育</span>
              <a class="home-banner__cta" href="recruitment-detail.html">查看活动</a>
            </div>
          </div>
          <div class="home-nav">
            <div class="home-nav__item"><div class="home-nav__icon"><img class="home-nav__icon-img" src="../assets/icons/boat.png" alt=""></div><span class="home-nav__label">预约场地</span></div>
            <div class="home-nav__item"><div class="home-nav__icon"><img class="home-nav__icon-img" src="../assets/icons/trophy.png" alt=""></div><span class="home-nav__label">活动赛事</span></div>
            <div class="home-nav__item"><div class="home-nav__icon"><img class="home-nav__icon-img" src="../assets/icons/wave.png" alt=""></div><span class="home-nav__label">精致航程</span></div>
            <div class="home-nav__item"><div class="home-nav__icon"><img class="home-nav__icon-img" src="../assets/icons/shopping.png" alt=""></div><span class="home-nav__label">时尚装备</span></div>
          </div>
          <div class="section">
            <div class="membership__card">
              <div class="membership__main">
                <div><div class="membership__title"><span>航海家</span><span class="membership__title-gold">权益卡</span></div><div class="membership__price-num">¥ 300</div></div>
                <div class="membership__btn">立即开通 →</div>
              </div>
              <div class="membership__footer"><span>✓ 优惠购船</span><span>✓ 课程折扣</span><span>✓ 活动优先</span></div>
            </div>
          </div>
          <div class="section" id="home-heroes-section">
            <div class="section-header"><span class="section-header__title">英雄广场</span><a class="section-header__more nav-forward" href="heroes.html">查看更多 ›</a></div>
            <div class="home-scroll-x">
              <div class="home-scroll-x__track" id="home-hero-track">
              {hero_home_card("小哥", "hero-1.jpg", "浆板,帆船", "ASA帆船认证教练", "", "招募中 | 企业家杯月赛 招募8人", "报名中 | 亲子帆船体验日", hero_id="1", row1_id="r1", row1_type="event", row2_id="r2", row2_type="activity", years="15", nickname="小哥", row3="ASA 101+ASA 103 组合课程", row3_id="c1", row3_type="course")}
              {hero_home_card("熊猫", "hero-2.jpg", "帆船,浆板", "ASA帆船认证教练", "", "招募中 | 金鸡湖浆板周末联赛 招募8人", "报名中 | 桨板周末体验", hero_id="2", row1_id="r3", row1_type="event", row2_id="r4", row2_type="activity", years="15", nickname="熊猫", row3="帆船入门周末班", row3_id="c5", row3_type="course")}
              {hero_home_card("Amy", "hero-1.jpg", "桨板,潜水", "PADI潜水教练", "", "招募中 | 开放水域潜水体验营 招募8人", "报名中 | 桨板入门体验", hero_id="3", row1_id="r13", row1_type="event", row2_id="r5", row2_type="activity", years="5", nickname="Amy", row3="桨板入门体验课", row3_id="c2", row3_type="course")}
              {hero_home_card("大伟", "hero-2.jpg", "帆船,冲浪", "国家级帆船教练", "", "招募中 | 城市帆船精英赛", "报名中 | 周末帆船体验", hero_id="4", row1_id="r7", row1_type="event", row2_id="r7a", row2_type="activity", years="20", nickname="大伟", row3="ASA进阶航行课", row3_id="c6", row3_type="course")}
              {hero_home_card("阿海", "hero-1.jpg", "皮划艇,桨板", "省级皮划艇教练", "", "招募中 | 周末皮划艇体验营", "报名中 | 皮划艇亲子体验", hero_id="5", row1_id="r8", row1_type="event", row2_id="r8a", row2_type="activity", years="8", nickname="阿海", row3="皮划艇入门体验课", row3_id="c4", row3_type="course")}
              </div>
            </div>
          </div>
          <div class="section" id="home-featured-section">
            <div class="section-header"><span class="section-header__title">精选活动与赛事</span><span class="section-header__more">查看更多 ›</span></div>
            <a class="event-card event-card--hero" href="recruitment-detail.html?id=r1">
              <div class="event-card__bg"><img src="{I}/event.jpg" alt="企业家杯月赛"></div>
              <div class="event-card__scrim"></div>
              <div class="event-card__top">
                <span class="event-card__time"><i class="event-card__dot" aria-hidden="true"></i>06/08 (周六) 09:00-16:00</span>
              </div>
              <div class="event-card__bottom">
                <div class="event-card__info">
                  <span class="tag tag--event">赛事</span>
                  <div class="event-card__title">企业家杯月赛</div>
                  <div class="event-card__meta">滴水湖二号码头</div>
                </div>
                <div class="event-card__footer">
                  <span class="event-card__price">¥500/人</span>
                  <span class="event-card__btn">立即报名</span>
                </div>
              </div>
            </a>
            <a class="event-card event-card--hero" href="recruitment-detail.html?id=r2">
              <div class="event-card__bg"><img src="{I}/banner.jpg" alt="亲子帆船体验日"></div>
              <div class="event-card__scrim"></div>
              <div class="event-card__top">
                <span class="event-card__time"><i class="event-card__dot event-card__dot--activity" aria-hidden="true"></i>06/08 (周六) 09:00-16:00</span>
              </div>
              <div class="event-card__bottom">
                <div class="event-card__info">
                  <span class="tag tag--activity">活动</span>
                  <div class="event-card__title">亲子帆船体验日</div>
                  <div class="event-card__meta">滴水湖二号码头</div>
                </div>
                <div class="event-card__footer">
                  <span class="event-card__price">¥1,280/人</span>
                  <span class="event-card__btn">立即报名</span>
                </div>
              </div>
            </a>
            <a class="event-card event-card--hero" href="recruitment-detail.html?id=r4">
              <div class="event-card__bg"><img src="{I}/recruit-cover.jpg" alt="浆板初体验"></div>
              <div class="event-card__scrim"></div>
              <div class="event-card__top">
                <span class="event-card__time"><i class="event-card__dot event-card__dot--activity" aria-hidden="true"></i>06/08 (周六) 09:00-16:00</span>
              </div>
              <div class="event-card__bottom">
                <div class="event-card__info">
                  <span class="tag tag--activity">活动</span>
                  <div class="event-card__title">浆板初体验</div>
                  <div class="event-card__meta">滴水湖二号码头</div>
                </div>
                <div class="event-card__footer">
                  <span class="event-card__price">¥1,280/人</span>
                  <span class="event-card__btn">立即报名</span>
                </div>
              </div>
            </a>
          </div>
          <div class="section">
            <div class="section-header"><span class="section-header__title">精选课程</span><span class="section-header__more">查看更多 ›</span></div>
            <div class="home-scroll-x">
              <div class="home-scroll-x__track">
              <div class="course-card"><div class="course-card__cover"><img src="{I}/course.jpg" alt="ASA课程"></div><div class="course-card__title">ASA 101+ASA 103 组合课程</div><div class="course-card__price">¥ 12800.00</div></div>
              <div class="course-card"><div class="course-card__cover"><img src="{I}/course.jpg" alt="桨板课"></div><div class="course-card__title">桨板入门体验课</div><div class="course-card__price">¥ 198.00</div></div>
              <div class="course-card"><div class="course-card__cover"><img src="{I}/course.jpg" alt="潜水课"></div><div class="course-card__title">潜水基础课程</div><div class="course-card__price">待定中</div></div>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="section-header"><span class="section-header__title">精选好物</span><span class="section-header__more">查看更多 ›</span></div>
            <div class="product-grid">
              <div class="product-card"><div class="product-card__cover"><img src="{I}/product-1.jpg" alt="生态种植"></div><div class="product-card__title">生态种植｜零添加…</div><div class="product-card__price">¥299.00</div></div>
              <div class="product-card"><div class="product-card__cover"><img src="{I}/product-2.jpg" alt="航海手套"></div><div class="product-card__title">航海专用手套</div><div class="product-card__price">¥98.00</div></div>
            </div>
          </div>
          <div class="section section--last">
            <div class="section-header"><span class="section-header__title">新闻动态</span><span class="section-header__more">查看更多 ›</span></div>
            <div class="news-item"><div class="news-item__cover"><img src="{I}/news-1.jpg" alt="新闻"></div><div><div class="news-item__title">城市亲子帆船体验日开启，孩子们在风里完成第一次掌舵</div><div class="news-item__cat">资讯</div></div></div>
            <div class="news-item"><div class="news-item__cover"><img src="{I}/news-2.jpg" alt="新闻"></div><div><div class="news-item__title">ASA航海课程报名升温，城市白领成为主力学员</div><div class="news-item__cat">资讯</div></div></div>
          </div>
          <script src="../assets/home-scroll.js"></script>
          <script src="../assets/heroes-data.js"></script>
          <script src="../assets/db-client.js"></script>
          <script src="../assets/home-heroes-preview.js"></script>
"""

tab_pages = {
    "index.html": ("营销首页", HOME, STATUS_LIGHT, "", tabbar("index.html")),
    "heroes.html": ("英雄广场", f"""
          <div class="search-bar-wrap heroes-search-row">
            <div class="heroes-search-field">
              <input id="hero-search" class="search-bar search-bar--input" type="search" placeholder="搜索教练昵称、姓名或项目名称" autocomplete="off" readonly />
              <button type="button" id="hero-search-clear" class="search-bar__clear" aria-label="清空" hidden>×</button>
            </div>
          </div>
          <div class="heroes-banner" id="heroes-banner"><img src="{I}/heroes-banner.png" alt="英雄招募令"></div>
          <div id="hero-search-status" class="hero-search-status" style="display:none"></div>
          <div id="hero-list" class="heroes-card-list">
          {hero_home_card("小哥", "hero-1.jpg", "帆船,游艇", "ASA帆船认证教练", "", "招募中 | 企业家杯帆船赛系列赛7月站", "报名中 | 亲子帆船体验日", hero_id="1", row1_id="r1", row1_type="event", row2_id="r2", row2_type="activity", years="15", rating="4.9", bio="ASA帆船认证教练，15年水上运动教学经验。", list_mode=True, row3="ASA101-103培训课", row3_id="c1", row3_type="course")}
          {hero_home_card("熊猫", "hero-2.jpg", "帆船,浆板", "ASA帆船认证教练", "", "招募中 | 金鸡湖浆板周末联赛", "报名中 | 桨板周末体验", hero_id="2", row1_id="r3", row1_type="event", row2_id="r4", row2_type="activity", years="15", rating="4.8", bio="专注帆船与浆板入门教学。", list_mode=True, row3="帆船入门周末班", row3_id="c5", row3_type="course")}
          {hero_home_card("Amy", "hero-1.jpg", "桨板,潜水", "PADI潜水教练", "", "招募中 | 开放水域潜水体验营", "报名中 | 桨板入门体验", hero_id="3", row1_id="r13", row1_type="event", row2_id="r5", row2_type="activity", years="5", rating="4.6", bio="桨板与潜水入门教学，5年教学经验。", list_mode=True, row3="桨板入门体验课", row3_id="c2", row3_type="course")}
          {hero_home_card("大伟", "hero-2.jpg", "帆船,冲浪", "国家级帆船教练", "", "招募中 | 城市帆船精英赛", "报名中 | 周末帆船体验", hero_id="4", row1_id="r7", row1_type="event", row2_id="r7a", row2_type="activity", years="20", rating="5.0", bio="20年帆船与冲浪执教经验，多次带队参赛获奖。", list_mode=True, row3="ASA进阶航行课", row3_id="c6", row3_type="course")}
          {hero_home_card("阿海", "hero-1.jpg", "皮划艇,桨板", "省级皮划艇教练", "", "招募中 | 周末皮划艇体验营", "报名中 | 皮划艇亲子体验", hero_id="5", row1_id="r8", row1_type="event", row2_id="r8a", row2_type="activity", years="8", rating="4.7", bio="专注皮划艇与桨板教学八年，擅长零基础体验课。", list_mode=True, row3="皮划艇入门体验课", row3_id="c4", row3_type="course")}
          </div>
          <div id="hero-empty" class="heroes-empty-state" style="display:none">
            <div class="heroes-empty-state__icon"><img src="../assets/icons/empty.png" alt="" width="32" height="32"></div>
            <div class="heroes-empty-state__title">广场暂无数据</div>
            <div class="heroes-empty-state__hint" style="display:none"></div>
          </div>
          {VK_HTML}
    """, STATUS_DARK, navbar("英雄广场", "index.html"), tabbar("heroes.html"), HERO_PAGE_SCRIPT),
    "mall.html": ("商城", f"""
          <div style="padding:16px 16px 8px"><div style="font-size:18px;font-weight:600">好物商城</div><div style="font-size:12px;color:#5c6c7a;margin-top:4px">精选水上装备</div></div>
          <div class="grid-2"><div><div class="cover"><img src="{I}/product-1.jpg" alt="商品"></div><div style="font-size:12px;margin-top:6px">生态种植｜零添加…</div><div class="price">¥299.00</div></div><div><div class="cover"><img src="{I}/product-2.jpg" alt="商品"></div><div style="font-size:12px;margin-top:6px">航海专用手套</div><div class="price">¥98.00</div></div></div>
    """, STATUS_DARK, navbar("商城"), tabbar("mall.html")),
    "profile.html": ("个人中心", '''
          <div id="profile-root"></div>
    ''', STATUS_DARK, navbar("个人中心", back=None), tabbar("profile.html"), PROFILE_PUBLISH_SHEET + PROFILE_PAGE_SCRIPT),
}

sub_pages = {
    "hero-detail.html": ("英雄详情", '''
          <div id="hero-detail-root"></div>
          <script src="../assets/db-client.js"></script>
          <script src="../assets/heroes-data.js"></script>
          <script src="../assets/image-viewer.js"></script>
          <script src="../assets/hero-share.js"></script>
          <script src="../assets/hero-detail-page.js"></script>
    '''),
    "recruitment-detail.html": ("招募详情", '''
          <div id="recruitment-detail-root"></div>
          <script src="../assets/db-client.js"></script>
          <script src="../assets/preview-toast.js"></script>
          <script src="../assets/my-signups-preview.js"></script>
          <script src="../assets/signup-action-preview.js"></script>
          <script src="../assets/heroes-data.js"></script>
          <script src="../assets/recruitments-data.js"></script>
          <script src="../assets/cover-carousel.js"></script>
          <script src="../assets/recruitment-detail-preview.js"></script>
    '''),
    "course-detail.html": ("课程详情", '''
          <div id="course-detail-root"></div>
          <script src="../assets/db-client.js"></script>
          <script src="../assets/heroes-data.js"></script>
          <script src="../assets/cover-carousel.js"></script>
          <script src="../assets/course-detail-preview.js"></script>
    '''),
    "hero-apply.html": ("申请成为英雄", '''
          <div id="hero-apply-root"></div>
          <script src="../assets/db-client.js"></script>
          <script src="../assets/preview-toast.js"></script>
          <script src="../assets/hero-apply-preview.js"></script>
    '''),
    "hero-apply-success.html": ("认证成功", '''
          <div id="hero-apply-success-root"></div>
          <script src="../assets/hero-apply-success-preview.js"></script>
    '''),
    "hero-apply-submitted.html": ("提交成功", '''
          <div id="hero-apply-submitted-root"></div>
          <script src="../assets/db-client.js"></script>
          <script src="../assets/hero-apply-submitted-preview.js"></script>
    '''),
    "hero-profile.html": ("修改英雄资料", '''
          <div id="hero-profile-root"></div>
          <script src="../assets/db-client.js"></script>
          <script src="../assets/heroes-data.js"></script>
          <script src="../assets/image-viewer.js"></script>
          <script src="../assets/hero-profile-preview.js"></script>
    '''),
    "recruitment-create.html": ("发布赛事招募", '''
          <div id="recruitment-create-root"></div>
          <script src="../assets/db-client.js"></script>
          <script src="../assets/preview-toast.js"></script>
          <script src="../assets/recruitments-data.js"></script>
          <script src="../assets/recruitment-create-preview.js"></script>
    '''),
    "course-create.html": ("申请课程", '''
          <div id="course-create-root"></div>
          <script src="../assets/db-client.js"></script>
          <script src="../assets/preview-toast.js"></script>
          <script src="../assets/cover-carousel.js"></script>
          <script src="../assets/course-form-preview.js"></script>
          <script src="../assets/course-create-preview.js"></script>
    '''),
    "my-recruitments.html": ("我的招募", '''
          <div id="my-recruitments-root"></div>
          <script src="../assets/db-client.js"></script>
          <script src="../assets/preview-toast.js"></script>
          <script src="../assets/recruitments-data.js"></script>
          <script src="../assets/my-recruitments-preview.js"></script>
    '''),
    "my-courses.html": ("我的课程", '''
          <div id="my-courses-root"></div>
          <script src="../assets/course-sort.js"></script>
          <script src="../assets/my-courses-preview.js"></script>
    '''),
    "recruitment-edit.html": ("编辑招募", '''
          <div id="recruitment-edit-root"></div>
          <script src="../assets/db-client.js"></script>
          <script src="../assets/preview-toast.js"></script>
          <script src="../assets/recruitments-data.js"></script>
          <script src="../assets/recruitment-form-preview.js"></script>
          <script src="../assets/recruitment-edit-preview.js"></script>
    '''),
    "signup-list.html": ("报名人员", '''
          <div id="signup-list-root"></div>
          <script src="../assets/db-client.js"></script>
          <script src="../assets/preview-toast.js"></script>
          <script src="../assets/signup-list-preview.js"></script>
    '''),
    "my-signups.html": ("我的报名", '''
          <div id="my-signups-root"></div>
          <script src="../assets/recruitments-data.js"></script>
          <script src="../assets/signup-sort.js"></script>
          <script src="../assets/my-signups-preview.js"></script>
    '''),
    "my-reviews.html": ("我的评价", '''
          <div id="my-reviews-root"></div>
          <script src="../assets/review-sort.js"></script>
          <script src="../assets/my-reviews-preview.js"></script>
    '''),
    "my-students.html": ("我的学员", '''
          <div id="my-students-root"></div>
          <script src="../assets/my-students-preview.js"></script>
    '''),
    "cert-edit.html": ("编辑证书", f'<div style="padding:16px"><div class="cert-preview" style="height:200px"><img src="{I}/cert.jpg" alt="资质证书"></div><a class="btn-primary" style="margin-top:16px">保存</a></div>'),
    "bio-edit.html": ("编辑简介", '<div style="padding:16px"><textarea rows="6" style="width:100%;padding:12px;background:#f5f5f5;border:none;border-radius:8px"></textarea><a class="btn-primary" style="margin-top:12px">保存</a></div>'),
    "hero-reviews.html": ("我的评分", '''
          <div id="hero-reviews-root"></div>
          <script src="../assets/review-sort.js"></script>
          <script src="../assets/hero-reviews-preview.js"></script>
    '''),
}

for fname, data in tab_pages.items():
    title, body, status, nav, tb = data[:5]
    overlays = data[5] if len(data) > 5 else ""
    preview_doc = PREVIEW_DOC_MAP.get(fname, "")
    preview_doc_scope = PREVIEW_DOC_SCOPE.get(fname, "")
    (MP / fname).write_text(
        render(
            title,
            body,
            status=status,
            navbar_html=nav,
            tabbar_html=tb,
            overlays=overlays,
            preview_doc=preview_doc,
            preview_doc_scope=preview_doc_scope,
        ),
        encoding="utf-8",
    )

for fname, (title, body) in sub_pages.items():
    back = "profile.html"
    if fname.startswith("hero") and fname not in ("hero-apply-success.html", "hero-apply-submitted.html", "hero-profile.html", "hero-apply.html"):
        back = "heroes.html"
    if fname in ("recruitment-detail.html", "course-detail.html", "hero-detail.html"):
        back = "heroes.html"
    if fname == "signup-list.html":
        back = "my-courses.html"
    if fname == "hero-reviews.html":
        back = "profile.html"
    if fname == "recruitment-edit.html":
        back = "my-recruitments.html"
    if fname in ("hero-apply.html",):
        back = "profile.html"
    if fname == "hero-apply-success.html":
        back = "profile.html"
    if fname == "hero-apply-submitted.html":
        back = "profile.html"
    nav_title_id = ""
    nav_right_action = None
    back_target = ""
    if fname in ("hero-apply-submitted.html", "hero-apply-success.html", "recruitment-create.html", "course-create.html"):
        back_target = "profile.html"
    if fname == "hero-detail.html":
        nav_title_id = "navbar-hero-title"
    elif fname == "recruitment-detail.html":
        nav_title_id = "navbar-recruit-title"
    elif fname == "course-detail.html":
        nav_title_id = "navbar-course-title"
    elif fname == "signup-list.html":
        nav_title_id = "navbar-signup-title"
    (MP / fname).write_text(
        render(
            title,
            body,
            navbar_html=navbar(title, back, back_target=back_target, title_id=nav_title_id, right_action=nav_right_action),
            immersive=fname in ("recruitment-detail.html", "course-detail.html"),
            preview_doc=PREVIEW_DOC_MAP.get(fname, ""),
        ),
        encoding="utf-8",
    )

PLAZA_HEROES_MOCK_JS = r"""
/** 英雄广场列表 mock（首页 / 广场页共用） */
window.listPlazaHeroesMock = function listPlazaHeroesMock() {
  const data = window.HEROES_DATA || {};
  return Object.keys(data)
    .map(function (id) {
    const h = data[id] || {};
    if (h.enabled === false && !h.stale_list_demo) return null;
    const recruitments = Array.isArray(h.recruitments) ? h.recruitments : [];
    const courses = Array.isArray(h.courses) ? h.courses : [];
    const nested = [];
    recruitments.forEach(function (r) {
      nested.push({
        type: r.type || 'event',
        status: r.status || r.status_label || (r.type === 'activity' ? '报名中' : '招募中'),
        title: r.title || '',
        target_id: r.recruit_id || r.id,
        recruit_id: r.recruit_id || r.id,
      });
    });
    courses.forEach(function (c) {
      nested.push({
        type: 'course',
        status: '报名中',
        title: c.title || '',
        target_id: c.course_id || c.id,
        course_id: c.course_id || c.id,
      });
    });
    return {
      hero_id: id,
      id: id,
      enabled: h.enabled !== false,
      stale_list_demo: !!h.stale_list_demo,
      name: h.name,
      nickname: h.nickname || h.name,
      avatar: h.avatar_img || h.avatar || '',
      avatar_img: h.avatar_img || h.avatar || '',
      rating: h.rating,
      years_exp: h.years_exp,
      student_count: h.student_count,
      honors_count: h.honors_count,
      project_types: h.project_types || [],
      honor_titles: h.honor_titles || [],
      cert_badges: h.cert_badges || [],
      about_me: h.about_me || h.bio || '',
      bio: h.about_me || h.bio || '',
      recruitments: nested,
      events: recruitments,
      courses: courses,
    };
  })
    .filter(Boolean);
};
"""

(ASSETS / "heroes-data.js").write_text(
    "window.HEROES_DATA = "
    + json.dumps(ALL_HEROES, ensure_ascii=False, indent=2)
    + ";\n"
    + PLAZA_HEROES_MOCK_JS,
    encoding="utf-8",
)


def sync_preview_docs():
    """预览右侧文档目录改为符号链接指向真源，避免 copy 漂移。"""
    import os
    import shutil

    repo_pages = ROOT.parent / "docs" / "miniprogram" / "pages"
    preview_pages = ROOT / "docs" / "miniprogram" / "pages"
    preview_pages.parent.mkdir(parents=True, exist_ok=True)
    if not repo_pages.is_dir():
        raise SystemExit(f"真源不存在：{repo_pages}")

    target_rel = Path(os.path.relpath(repo_pages, start=preview_pages.parent))

    def link_ok() -> bool:
        if not preview_pages.is_symlink():
            return False
        try:
            return preview_pages.resolve() == repo_pages.resolve()
        except FileNotFoundError:
            return False

    if link_ok():
        print("docs-synced symlink-ok")
        return

    if preview_pages.is_symlink() or preview_pages.exists():
        if preview_pages.is_symlink() or preview_pages.is_file():
            preview_pages.unlink()
        else:
            shutil.rmtree(preview_pages)

    preview_pages.symlink_to(target_rel, target_is_directory=True)
    if not link_ok():
        raise SystemExit(f"创建符号链接失败：{preview_pages} -> {target_rel}")
    print("docs-synced symlink", target_rel)


def verify_preview_docs_sync():
    """核对预览 docs 已符号链接到真源。"""
    import sys

    repo_pages = ROOT.parent / "docs" / "miniprogram" / "pages"
    preview_pages = ROOT / "docs" / "miniprogram" / "pages"
    if not preview_pages.is_symlink():
        print("docs-sync-verify FAILED: preview/docs/.../pages 不是符号链接", file=sys.stderr)
        raise SystemExit(1)
    try:
        resolved = preview_pages.resolve()
    except FileNotFoundError:
        print("docs-sync-verify FAILED: 符号链接目标不存在", file=sys.stderr)
        raise SystemExit(1)
    if resolved != repo_pages.resolve():
        print(
            f"docs-sync-verify FAILED: 链接到 {resolved}，期望 {repo_pages.resolve()}",
            file=sys.stderr,
        )
        raise SystemExit(1)
    print("docs-sync-verify OK (symlink)")


sync_preview_docs()
verify_preview_docs_sync()
write_preview_page_nav()

import subprocess

_check = ROOT.parent / "scripts" / "check-preview-page-nav.py"
_r = subprocess.run([sys.executable, str(_check)], cwd=str(ROOT.parent))
if _r.returncode != 0:
    raise SystemExit(_r.returncode)

_img_check = ROOT.parent / "scripts" / "check-doc-images.py"
# 先自动修复「纯文字 / 粘连 alt」配图语法，再校验并写出预览兜底映射
_r_fix = subprocess.run(
    [sys.executable, str(_img_check), "--fix"],
    cwd=str(ROOT.parent),
)
if _r_fix.returncode != 0:
    raise SystemExit(_r_fix.returncode)
_r2 = subprocess.run(
    [sys.executable, str(_img_check), "--write-preview-map"],
    cwd=str(ROOT.parent),
)
if _r2.returncode != 0:
    raise SystemExit(_r2.returncode)

print("ok", len(tab_pages) + len(sub_pages))
