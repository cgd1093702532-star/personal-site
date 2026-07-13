#!/usr/bin/env python3
"""重新生成手机端预览 HTML"""
import json
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MP = ROOT / "miniprogram"
ASSETS = ROOT / "assets"
I = "../assets/images"  # 示例图片目录

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
    icons = {
        "index.html": '<svg class="tabbar__svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
        "heroes.html": '<svg class="tabbar__svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.2" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 19.5c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16.5 7.2l1.2-2.1 2.2.4-1.1 2.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        "mall.html": '<svg class="tabbar__svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 8h12l-1 11H7L6 8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 8a3 3 0 016 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
        "profile.html": '<svg class="tabbar__svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.2" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 19.5c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    }
    tabs = [("index.html", "首页"), ("heroes.html", "英雄"), ("mall.html", "商城"), ("profile.html", "我的")]
    return "\n          ".join(
        f'<a class="{"active" if h == active else ""}" href="{h}"><span class="tabbar__icon">{icons[h]}</span>{l}</a>'
        for h, l in tabs
    )

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
    "years_exp": 15,
    "student_count": 128,
    "honors_count": 3,
    "project_types": ["帆船", "游艇"],
    "honor_titles": ["中欧航海协会秘书长", "ASA205级资深签证官"],
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
}

COURSE_CATALOG = {
    "c1": {
        "course_id": "c1",
        "title": "ASA101-103培训课",
        "timeDisplay": "7月26日 09:00 - 16:30",
        "location": "滴水湖二号码头",
        "fee": 1280,
        "cover_image": "course.jpg",
    },
    "c2": {
        "course_id": "c2",
        "title": "桨板入门体验课",
        "timeDisplay": "7月18日 10:00 - 12:00",
        "location": "太湖桨板营地",
        "fee": 198,
        "cover_image": "course.jpg",
    },
    "c3": {
        "course_id": "c3",
        "title": "潜水基础课程",
        "timeDisplay": "8月10日 09:00 - 17:00",
        "location": "三亚开放水域基地",
        "fee": 2680,
        "cover_image": "course.jpg",
    },
}

COURSES_BY_HERO = {
    "1": ["c1"],
    "2": ["c1"],
    "3": ["c2", "c3"],
    "4": ["c1"],
}

RECRUITMENTS_BY_HERO = {
    "1": [
        {
            "recruit_id": "r2",
            "title": "周末帆船体验营",
            "start_at": "2026-07-12T09:30:00",
            "end_at": "2026-07-12T16:00:00",
            "location": "滴水湖帆船基地",
            "fee": 680,
            "signed": 8,
            "total": 16,
            "cover_image": "recruit-cover.jpg",
        },
        {
            "recruit_id": "r1",
            "title": "企业家杯月赛",
            "start_at": "2026-07-20T08:00:00",
            "end_at": "2026-07-20T17:00:00",
            "location": "滴水湖二号码头",
            "fee": 500,
            "signed": 12,
            "total": 20,
            "cover_image": "event.jpg",
        },
    ],
    "2": [
        {
            "recruit_id": "r3",
            "title": "浆板初体验",
            "start_at": "2026-08-03T14:00:00",
            "end_at": "2026-08-03T17:00:00",
            "location": "金鸡湖桨板码头",
            "fee": 298,
            "signed": 5,
            "total": 12,
            "cover_image": "recruit-cover.jpg",
        },
        {
            "recruit_id": "r4",
            "title": "ASA101-103培训课",
            "start_at": "2026-07-26T09:00:00",
            "end_at": "2026-07-26T16:30:00",
            "location": "滴水湖二号码头",
            "fee": 1280,
            "signed": 10,
            "total": 10,
            "cover_image": "event.jpg",
        },
    ],
    "3": [
        {
            "recruit_id": "r5",
            "title": "桨板入门体验课",
            "start_at": "2026-07-18T10:00:00",
            "end_at": "2026-07-18T12:00:00",
            "location": "太湖桨板营地",
            "fee": 198,
            "signed": 3,
            "total": 8,
            "cover_image": "recruit-cover.jpg",
        },
        {
            "recruit_id": "r6",
            "title": "潜水基础课程",
            "start_at": "2026-08-10T09:00:00",
            "end_at": "2026-08-10T17:00:00",
            "location": "三亚开放水域基地",
            "fee": 2680,
            "signed": 2,
            "total": 6,
            "cover_image": "event.jpg",
        },
    ],
    "4": [
        {
            "recruit_id": "r7",
            "title": "城市帆船精英赛",
            "start_at": "2026-07-28T07:30:00",
            "end_at": "2026-07-28T18:00:00",
            "location": "青岛奥帆中心",
            "fee": 800,
            "signed": 15,
            "total": 24,
            "cover_image": "event.jpg",
        },
    ],
}


def format_recruit_time_range(start_at: str, end_at: str) -> str:
    start = datetime.fromisoformat(start_at)
    end = datetime.fromisoformat(end_at)
    start_str = f"{start.month}月{start.day}日 {start.hour:02d}:{start.minute:02d}"
    same_day = start.date() == end.date()
    if same_day:
        return f"{start_str} - {end.hour:02d}:{end.minute:02d}"
    end_str = f"{end.month}月{end.day}日 {end.hour:02d}:{end.minute:02d}"
    return f"{start_str} - {end_str}"


def format_recruit_signup(signed: int, total: int) -> str:
    if signed >= total:
        return f"已满 {total} 名，可继续报名"
    return f"共招募 {total} 名，已报 {signed} 名"


for hero_id, items in RECRUITMENTS_BY_HERO.items():
    ALL_HEROES[hero_id]["recruitments"] = [
        {
            **item,
            "timeDisplay": format_recruit_time_range(item["start_at"], item["end_at"]),
            "signupDisplay": format_recruit_signup(item["signed"], item["total"]),
        }
        for item in items
    ]

for hero_id, course_ids in COURSES_BY_HERO.items():
    ALL_HEROES[hero_id]["courses"] = [COURSE_CATALOG[cid] for cid in course_ids]

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
):
    type_tags = "".join(f'<span class="tag tag--skill">{t.strip()}</span>' for t in types.split(","))
    row_labels = {"event": "赛事", "course": "课程", "activity": "活动"}

    def row_href(row_type, item_id):
        if row_type == "course":
            return f"course-detail.html?id={item_id}"
        return f"recruitment-detail.html?id={item_id}"

    row1_link = row_href(row1_type, row1_id)
    row2_link = row_href(row2_type, row2_id)
    extra = " hero-card--list" if list_mode else ""
    data = f' data-name="{name}" data-types="{types}" data-years="{years}" data-rating="{rating}" data-bio="{bio}" data-honors="{honor1},{honor2}"'
    return (
        f'<div class="hero-card{extra}" data-hero-id="{hero_id}"{data}>'
        f'<a class="hero-card__head nav-forward" href="hero-detail.html?id={hero_id}">'
        f'<div class="hero-card__avatar"><img src="{I}/{img}" alt="{name}"></div>'
        f'<div class="hero-card__meta"><div class="hero-card__name-row"><span class="hero-card__name">{name}</span>{type_tags}</div>'
        f'<div class="hero-card__honors"><span class="hero-card__honor hero-card__honor--primary"><span class="hero-card__honor-icon">👑</span><span class="hero-card__honor-text">{honor1}</span></span>'
        f'<span class="hero-card__honor hero-card__honor--secondary"><span class="hero-card__honor-text">{honor2}</span></span></div></div></a>'
        f'<div class="hero-card__rows">'
        f'<a class="hero-card__row nav-forward" href="{row1_link}"><span class="tag tag--{row1_type}">{row_labels[row1_type]}</span><span class="hero-card__row-text">{row1}</span><span class="hero-card__row-arrow">›</span></a>'
        f'<a class="hero-card__row nav-forward" href="{row2_link}"><span class="tag tag--{row2_type}">{row_labels[row2_type]}</span><span class="hero-card__row-text">{row2}</span><span class="hero-card__row-arrow">›</span></a>'
        f'</div></div>'
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
                  <span class="filter-chip active" data-type="全部">全部</span><span class="filter-chip" data-type="帆船">帆船</span><span class="filter-chip" data-type="桨板">桨板</span><span class="filter-chip" data-type="潜水">潜水</span>
                </div>
              </div>
              <div class="heroes-filter-sheet__group">
                <div class="heroes-filter-sheet__label">排序</div>
                <div class="heroes-filter-sheet__chips filter-scroll" id="hero-sort">
                  <span class="filter-chip active" data-sort="default">综合</span><span class="filter-chip" data-sort="rating_desc">评分高→低</span><span class="filter-chip" data-sort="rating_asc">评分低→高</span>
                </div>
              </div>
              <div class="heroes-filter-sheet__group">
                <div class="heroes-filter-sheet__label">年限</div>
                <div class="heroes-filter-sheet__chips filter-scroll" id="hero-years">
                  <span class="filter-chip active" data-years="全部">不限</span><span class="filter-chip" data-years="1-3">1-3年</span><span class="filter-chip" data-years="3-5">3-5年</span><span class="filter-chip" data-years="5-10">5-10年</span><span class="filter-chip" data-years="10+">10年+</span>
                </div>
              </div>
              <button type="button" class="heroes-filter-sheet__confirm" id="hero-filter-done">完成</button>
            </div>
          </div>'''

PROFILE_PUBLISH_SHEET = '''
          <div id="profile-publish-sheet" class="profile-action-sheet mobile-overlay" hidden>
            <div class="profile-action-sheet__mask"></div>
            <div class="profile-action-sheet__panel">
              <button type="button" class="profile-action-sheet__item" data-href="recruitment-create.html">发布赛事招募</button>
              <button type="button" class="profile-action-sheet__item" data-href="course-create.html">发布课程</button>
              <button type="button" class="profile-action-sheet__item profile-action-sheet__item--cancel" data-action="cancel">取消</button>
            </div>
          </div>'''

PROFILE_PAGE_SCRIPT = '<script src="../assets/db-client.js"></script><script src="../assets/preview-toast.js"></script><script src="../assets/profile-preview.js"></script>'
HERO_PAGE_SCRIPT = '<script src="../assets/hero-search.js"></script>'

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

def render(title, content, *, status=STATUS_DARK, navbar_html="", tabbar_html="", overlays="", immersive=False):
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
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=402, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>{title} · 英雄广场</title>
  <link rel="stylesheet" href="../assets/preview.css">
</head>
<body>
  <div class="device">
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
  <script src="../assets/preview-nav.js"></script>
</body>
</html>"""

HOME = f"""
          <div class="home-banner">
            <img class="home-banner__img" src="{I}/banner.jpg" alt="帆船赛事">
            <div class="home-banner__overlay"></div>
            <div class="home-banner__fade"></div>
            <div class="home-banner__season"><span class="home-banner__dot"></span>2026 夏季航季</div>
            <div class="home-banner__content">
              <span class="home-banner__title">企业家杯月赛</span>
              <span class="home-banner__date">06.20</span>
              <span class="home-banner__desc">一站式高端水上运动体验平台</span>
              <a class="home-banner__cta" href="recruitment-detail.html">查看活动</a>
            </div>
          </div>
          <div class="home-nav">
            <div><div class="home-nav__icon">⛵</div><span class="home-nav__label">船艇预约</span></div>
            <div><div class="home-nav__icon">🏆</div><span class="home-nav__label">活动赛事</span></div>
            <div><div class="home-nav__icon">⛵</div><span class="home-nav__label">精选课程</span></div>
            <div><div class="home-nav__icon">🛍</div><span class="home-nav__label">好物推荐</span></div>
          </div>
          <div class="section">
            <div class="membership__card">
              <div class="membership__main">
                <div><div class="membership__title"><span>航海家</span><span class="membership__title-gold">权益卡</span></div><div class="membership__price-num">￥300</div></div>
                <div class="membership__btn">立即开通 ›</div>
              </div>
              <div class="membership__footer"><span>✓ 课程体验</span><span>✓ 课程折扣</span><span>✓ 商城折扣</span></div>
            </div>
          </div>
          <div class="section">
            <div class="section-header"><span class="section-header__title">英雄广场</span><a class="section-header__more nav-forward" href="heroes.html">查看更多 ›</a></div>
            <div class="home-scroll-x">
              <div class="home-scroll-x__track">
              {hero_home_card("小哥", "hero-1.jpg", "帆船,游艇", "中欧航海协会秘书长", "ASA205级资深签证官", "招募中 | 企业家杯帆船赛系列赛7月站", "报名中 | ASA101-103培训课", hero_id="1")}
              {hero_home_card("熊猫", "hero-2.jpg", "帆船,浆板", "ASA帆船认证教练", "15年执教经验", "招募中 | 企业家杯帆船赛系列赛7月站", "报名中 | ASA101-103培训课", hero_id="2")}
              {hero_home_card("Amy", "hero-1.jpg", "桨板,潜水", "PADI潜水教练", "5年教学经验", "报名中 | 桨板入门体验课", "报名中 | 潜水基础课程", hero_id="3", row1_type="course", row2_type="course", row1_id="c2", row2_id="c3")}
              </div>
            </div>
          </div>
          <div class="section">
            <div class="section-header"><span class="section-header__title">精选活动与赛事</span><span class="section-header__more">查看更多 ›</span></div>
            <a class="event-card" href="recruitment-detail.html"><div class="event-card__cover"><img src="{I}/event.jpg" alt="企业家杯月赛"></div><div class="event-card__body"><span class="event-card__tag">赛事</span><div class="event-card__title">企业家杯月赛</div><div class="event-card__meta">06/08 · 滴水湖二号码头</div><div class="event-card__price">¥500/人</div></div></a>
          </div>
          <div class="section">
            <div class="section-header"><span class="section-header__title">精选课程</span><span class="section-header__more">查看更多 ›</span></div>
            <div class="home-scroll-x">
              <div class="home-scroll-x__track">
              <div class="course-card"><div class="course-card__cover"><img src="{I}/course.jpg" alt="ASA课程"></div><div class="course-card__title">ASA 101+103 组合课程</div><div class="course-card__price">¥12800</div></div>
              <div class="course-card"><div class="course-card__cover"><img src="{I}/course.jpg" alt="桨板课"></div><div class="course-card__title">桨板入门体验课</div><div class="course-card__price">¥198</div></div>
              <div class="course-card"><div class="course-card__cover"><img src="{I}/course.jpg" alt="潜水课"></div><div class="course-card__title">潜水基础课程</div><div class="course-card__price">¥2680</div></div>
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
            <div class="news-item"><div class="news-item__cover"><img src="{I}/news-1.jpg" alt="新闻"></div><div><div class="news-item__title">城市亲子帆船体验日开启</div><div class="news-item__cat">帆船</div></div></div>
            <div class="news-item"><div class="news-item__cover"><img src="{I}/news-2.jpg" alt="新闻"></div><div><div class="news-item__title">ASA航海课程报名升温</div><div class="news-item__cat">浆板</div></div></div>
          </div>
          <script src="../assets/home-scroll.js"></script>
"""

tab_pages = {
    "index.html": ("营销首页", HOME, STATUS_LIGHT, "", tabbar("index.html")),
    "heroes.html": ("英雄广场", f"""
          <div class="search-bar-wrap heroes-search-row">
            <div class="heroes-search-field">
              <input id="hero-search" class="search-bar search-bar--input" type="search" placeholder="搜索教练姓名或项目名称" autocomplete="off" readonly />
              <button type="button" id="hero-search-clear" class="search-bar__clear" aria-label="清空" hidden>×</button>
            </div>
            <button type="button" id="hero-filter-btn" class="heroes-filter-btn" aria-label="筛选"><span class="heroes-filter-btn__icon"></span></button>
          </div>
          <div class="heroes-banner"><img src="{I}/banner.jpg" alt="英雄广场"></div>
          <div id="hero-search-status" class="hero-search-status" style="display:none"></div>
          <div id="hero-list" class="heroes-card-list">
          {hero_home_card("小哥", "hero-1.jpg", "帆船,游艇", "中欧航海协会秘书长", "ASA205级资深签证官", "招募中 | 企业家杯帆船赛系列赛7月站", "报名中 | ASA101-103培训课", hero_id="1", years="15", rating="4.9", bio="ASA帆船认证教练，15年水上运动教学经验。", list_mode=True)}
          {hero_home_card("熊猫", "hero-2.jpg", "帆船,浆板", "ASA帆船认证教练", "15年执教经验", "招募中 | 企业家杯帆船赛系列赛7月站", "报名中 | ASA101-103培训课", hero_id="2", years="15", rating="4.8", bio="专注帆船与浆板入门教学。", list_mode=True)}
          {hero_home_card("Amy", "hero-1.jpg", "桨板,潜水", "PADI潜水教练", "5年教学经验", "报名中 | 桨板入门体验课", "报名中 | 潜水基础课程", hero_id="3", row1_type="course", row2_type="course", row1_id="c2", row2_id="c3", years="5", rating="4.6", bio="桨板与潜水入门教学，5年教学经验。", list_mode=True)}
          {hero_home_card("大伟", "hero-2.jpg", "帆船,冲浪", "国家级帆船教练", "20年执教经验", "招募中 | 城市帆船精英赛", "报名中 | ASA101-103培训课", hero_id="4", row1_id="r7", row2_id="c1", years="20", rating="5.0", bio="20年帆船与冲浪执教经验，多次带队参赛获奖。", list_mode=True)}
          </div>
          <div id="hero-empty" class="heroes-empty-state" style="display:none">
            <div class="heroes-empty-state__icon">🔍</div>
            <div class="heroes-empty-state__title">未找到相关教练和项目</div>
            <div class="heroes-empty-state__hint">试试调整关键词或筛选条件</div>
          </div>
          {VK_HTML}
    """, STATUS_DARK, navbar("英雄广场", "index.html"), tabbar("heroes.html"), HERO_FILTER_SHEET + HERO_PAGE_SCRIPT),
    "mall.html": ("商城", f"""
          <div style="padding:16px 16px 8px"><div style="font-size:18px;font-weight:600">好物商城</div><div style="font-size:12px;color:#5c6c7a;margin-top:4px">航海装备与精选好物</div></div>
          <div class="grid-2"><div><div class="cover"><img src="{I}/product-1.jpg" alt="商品"></div><div style="font-size:12px;margin-top:6px">生态种植｜零添加…</div><div class="price">¥299.00</div></div><div><div class="cover"><img src="{I}/product-2.jpg" alt="商品"></div><div style="font-size:12px;margin-top:6px">航海专用手套</div><div class="price">¥98.00</div></div></div>
    """, STATUS_DARK, navbar("商城"), tabbar("mall.html")),
    "profile.html": ("个人中心", '''
          <button type="button" class="profile-dev-toggle" id="profile-dev-toggle">预览：切换为已认证状态</button>
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
          <script src="../assets/recruitment-form-preview.js"></script>
          <script src="../assets/recruitment-create-preview.js"></script>
    '''),
    "course-create.html": ("发布课程", '''
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
    "signup-list.html": ("报名人员", '<div class="card-block" style="margin-top:12px"><div class="card__title">张三 · 待确认</div></div>'),
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
    (MP / fname).write_text(render(title, body, status=status, navbar_html=nav, tabbar_html=tb, overlays=overlays), encoding="utf-8")

for fname, (title, body) in sub_pages.items():
    back = "profile.html"
    if fname.startswith("hero") and fname not in ("hero-apply-success.html", "hero-apply-submitted.html", "hero-profile.html", "hero-apply.html"):
        back = "heroes.html"
    if fname in ("recruitment-detail.html", "course-detail.html", "hero-detail.html", "signup-list.html"):
        back = "heroes.html"
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
    if fname in ("hero-apply-submitted.html", "hero-apply-success.html"):
        back_target = "profile.html"
    if fname == "hero-detail.html":
        nav_title_id = "navbar-hero-title"
    elif fname == "recruitment-detail.html":
        nav_title_id = "navbar-recruit-title"
    (MP / fname).write_text(
        render(
            title,
            body,
            navbar_html=navbar(title, back, back_target=back_target, title_id=nav_title_id, right_action=nav_right_action),
            immersive=fname == "recruitment-detail.html",
        ),
        encoding="utf-8",
    )

(ASSETS / "heroes-data.js").write_text(
    "window.HEROES_DATA = " + json.dumps(ALL_HEROES, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8",
)

print("ok", len(tab_pages) + len(sub_pages))
