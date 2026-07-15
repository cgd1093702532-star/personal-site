#!/usr/bin/env python3
"""自查：左侧页面导航是否真正从 page_catalog + 磁盘 md 同步。

核对：
1. preview-page-nav.json == build_nav_payload()（已按存在的 md 过滤）
2. 导航内每个 md / html 在磁盘上存在
3. 仍存在的页面 md（除 SKIP）不得遗漏未登记进目录
4. 导航条目的 docUrl 与 preview_doc_map 一致
5. 目录登记但 md 已删：仅提示（导航应已剔除），不失败

退出码：0 通过；1 失败
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "preview"
ASSETS = PREVIEW / "assets"
DOCS = ROOT / "docs" / "miniprogram" / "pages"
MP = PREVIEW / "miniprogram"
NAV_JSON = ASSETS / "preview-page-nav.json"

sys.path.insert(0, str(PREVIEW))
from page_catalog import (  # noqa: E402
    SKIP_PAGE_DOCS,
    build_nav_payload,
    iter_pages,
    missing_catalog_docs,
    preview_doc_map,
)


def main() -> int:
    errors: list[str] = []
    notes: list[str] = []

    expected = build_nav_payload()
    if not NAV_JSON.is_file():
        errors.append(f"缺少生成文件：{NAV_JSON}（请先运行 python3 preview/build-pages.py）")
    else:
        actual = json.loads(NAV_JSON.read_text(encoding="utf-8"))
        if actual != expected:
            errors.append(
                "preview-page-nav.json 与「目录 ∩ 现存 md」不一致。"
                "请运行 python3 preview/build-pages.py，禁止手改 JSON。"
            )

    live_docs: set[str] = set()
    for _group, html, doc in iter_pages(existing_only=True):
        live_docs.add(doc)
        doc_path = DOCS / doc
        html_path = MP / html
        if not doc_path.is_file():
            errors.append(f"导航含已删除的需求文档：{doc}")
        if not html_path.is_file():
            errors.append(f"导航对应的预览页不存在：{html}")

    missing = missing_catalog_docs()
    if missing:
        notes.append(
            "目录登记但文档已删除（导航已自动剔除）：" + "、".join(missing)
        )

    # 真源 md：文件仍在却未进目录 → 左侧导航会漏页
    if DOCS.is_dir():
        for path in sorted(DOCS.glob("*.md")):
            name = path.name
            if name in SKIP_PAGE_DOCS:
                continue
            # 是否曾登记：用 full catalog
            registered = {doc for _g, _h, doc in iter_pages(existing_only=False)}
            if name not in registered:
                errors.append(
                    f"需求文档未登记进左侧导航真源 page_catalog.py：{name}"
                    "（请追加到对应分组，再 build）"
                )

    expected_map = preview_doc_map()
    if NAV_JSON.is_file():
        actual = json.loads(NAV_JSON.read_text(encoding="utf-8"))
        for group in actual.get("groups", []):
            for page in group.get("pages", []):
                html = page.get("html")
                doc_url = page.get("docUrl")
                doc_name = page.get("doc")
                if doc_name and not (DOCS / doc_name).is_file():
                    errors.append(f"JSON 仍含已删除文档：{doc_name}（需重新 build）")
                if html not in expected_map:
                    errors.append(f"导航含不应出现的页（文档可能已删）：{html}")
                elif expected_map.get(html) != doc_url:
                    errors.append(
                        f"导航 docUrl 与目录不一致：{html} → {doc_url}，期望 {expected_map.get(html)}"
                    )

    if errors:
        print("ERROR preview-page-nav 自查失败：", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        for note in notes:
            print(f"  note: {note}", file=sys.stderr)
        return 1

    n = len(list(iter_pages(existing_only=True)))
    print(f"OK preview-page-nav ({n} pages ← page_catalog ∩ 现存 md → {NAV_JSON.name})")
    for note in notes:
        print(f"note: {note}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
