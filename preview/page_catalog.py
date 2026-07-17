"""小程序预览「有需求文档的页面」唯一目录真源。

- build-pages.py：由此生成 PREVIEW_DOC_MAP，并写出左侧导航 JSON
- scripts/check-preview-page-nav.py：核对导航产物与本目录、磁盘 md/html 一致

规则：
- 左侧导航 / PREVIEW_DOC_MAP **只包含磁盘上仍存在的需求文档**
- 在 docs/miniprogram/pages/ 删除某 md 后，build 或预览加载时会自动从导航移除对应页
- 新增带需求文档的预览页：在本文件对应分组追加一行，再跑 build-pages / 自查脚本
- 不要手改 preview/assets/preview-page-nav.json
"""
from __future__ import annotations

from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = _ROOT / "docs" / "miniprogram" / "pages"

# 有 md 但暂无预览页 / 非页面需求正文 → 不进左侧导航，也不强制进目录
SKIP_PAGE_DOCS = frozenset(
    {
        "README.md",
        "_TEMPLATE.md",
    }
)

# 分组顺序与 docs/miniprogram/pages/README.md 一致
# 每项：(预览 html 文件名, 需求文档文件名)
PAGE_CATALOG: list[tuple[str, list[tuple[str, str]]]] = [
    (
        "Tab 页",
        [
            ("index.html", "营销首页.md"),
            ("heroes.html", "英雄广场.md"),
            ("profile.html", "个人中心.md"),
        ],
    ),
    (
        "浏览与报名",
        [
            ("hero-detail.html", "英雄详情.md"),
            ("recruitment-detail.html", "赛事详情.md"),
            ("activity-detail.html", "活动详情.md"),
            ("course-detail.html", "课程详情.md"),
        ],
    ),
    (
        "英雄认证",
        [
            ("hero-apply.html", "申请成为英雄.md"),
            ("hero-apply-submitted.html", "申请提交成功.md"),
            ("hero-apply-success.html", "认证成功.md"),
        ],
    ),
    (
        "英雄中心",
        [
            ("hero-profile.html", "我的英雄资料.md"),
            ("recruitment-create.html", "发布招募.md"),
            ("course-create.html", "发布课程.md"),
            ("my-recruitments.html", "我的招募.md"),
            ("my-courses.html", "我的课程.md"),
            ("my-students.html", "我的学员.md"),
            ("recruitment-edit.html", "招募编辑.md"),
            ("signup-list.html", "报名人员列表.md"),
            ("cert-edit.html", "证书编辑.md"),
            ("bio-edit.html", "简介编辑.md"),
            ("hero-reviews.html", "英雄评价列表.md"),
        ],
    ),
    (
        "用户活动",
        [
            ("my-signups.html", "我的报名.md"),
            ("my-reviews.html", "我的评价.md"),
            ("messages.html", "消息.md"),
            ("message-detail.html", "消息详情.md"),
        ],
    ),
]

# 预览右侧文档裁剪范围（与历史 PREVIEW_DOC_SCOPE 一致）
PREVIEW_DOC_SCOPE: dict[str, str] = {
    "index.html": "intro",
    "course-create.html": "intro",
    "messages.html": "intro",
    "activity-detail.html": "intro",
    "course-detail.html": "intro",
}


def doc_exists(doc: str) -> bool:
    return (DOCS_DIR / doc).is_file()


def iter_pages(*, existing_only: bool = True) -> list[tuple[str, str, str]]:
    """Yield (group, html, doc)。

    existing_only=True（默认）：跳过已删除的需求文档，供导航 / DOC_MAP 使用。
    existing_only=False：返回目录登记的全部页，供自查「未登记 md」等。
    """
    rows: list[tuple[str, str, str]] = []
    for group, pages in PAGE_CATALOG:
        for html, doc in pages:
            if existing_only and not doc_exists(doc):
                continue
            rows.append((group, html, doc))
    return rows


def missing_catalog_docs() -> list[str]:
    """目录已登记但磁盘上不存在的需求文档（已从导航剔除）。"""
    missing: list[str] = []
    for _group, pages in PAGE_CATALOG:
        for _html, doc in pages:
            if not doc_exists(doc):
                missing.append(doc)
    return missing


def preview_doc_map() -> dict[str, str]:
    """html → 相对 preview/miniprogram/ 的文档路径（仅含仍存在的 md）。"""
    return {
        html: f"../docs/miniprogram/pages/{doc}"
        for _, html, doc in iter_pages(existing_only=True)
    }


# 文件名无法含「/」时，导航与需求预览展示名可在此覆盖
DOC_LABEL_OVERRIDES: dict[str, str] = {}


def label_for_doc(doc: str) -> str:
    name = Path(doc).name
    if name in DOC_LABEL_OVERRIDES:
        return DOC_LABEL_OVERRIDES[name]
    return name[:-3] if name.endswith(".md") else name


def build_nav_payload() -> dict:
    """生成左侧导航数据：只含磁盘上仍存在的需求文档。"""
    groups = []
    for group, pages in PAGE_CATALOG:
        live_pages = [
            {
                "html": html,
                "doc": doc,
                "label": label_for_doc(doc),
                "docUrl": f"../docs/miniprogram/pages/{doc}",
                "scope": PREVIEW_DOC_SCOPE.get(html, ""),
            }
            for html, doc in pages
            if doc_exists(doc)
        ]
        if live_pages:
            groups.append({"title": group, "pages": live_pages})
    return {"groups": groups}
