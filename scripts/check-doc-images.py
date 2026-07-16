#!/usr/bin/env python3
"""检查需求文档配图：登记表、文件存在、Markdown ![alt](src) 未丢成纯文字。

用法：
  python3 scripts/check-doc-images.py           # 检查，失败 exit 1
  python3 scripts/check-doc-images.py --fix     # 把「纯文字 alt」恢复为 ![alt](src)
  python3 scripts/check-doc-images.py --write-preview-map  # 写出预览兜底 JSON

根因备忘：右侧预览只认 Markdown 图片语法；若只剩「教练不存在空态」这类纯文字，
配图文件虽在磁盘上，预览也不显示。见 .cursor/rules/doc-embedded-images.mdc
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "docs" / "miniprogram" / "pages"
REGISTRY = PAGES / "images" / "IMAGE_REGISTRY.json"
PREVIEW_MAP = ROOT / "preview" / "assets" / "doc-image-alts.json"

IMG_MD_RE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")


def load_registry() -> list[dict]:
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    return list(data.get("entries") or [])


def normalize_src(src: str) -> str:
    s = src.strip()
    if s.startswith("./"):
        return s
    if s.startswith("images/"):
        return f"./{s}"
    return s


def wanted_md(alt: str, src: str) -> str:
    return f"![{alt}]({normalize_src(src)})"


def split_glued_alts(line: str, alt_to_src: dict[str, str]) -> list[str] | None:
    """把「禁用状态预览禁用 · 查看原因弹窗」这类粘连纯文字拆回多条 ![alt](src)。"""
    remaining = line.strip()
    if not remaining or "![" in remaining:
        return None
    alts = sorted(alt_to_src.keys(), key=len, reverse=True)
    parts: list[str] = []
    while remaining:
        hit = next((a for a in alts if remaining.startswith(a)), None)
        if not hit:
            return None
        parts.append(wanted_md(hit, alt_to_src[hit]))
        remaining = remaining[len(hit) :].lstrip(" 　")
    return parts if len(parts) >= 2 else None


def fix_glued_alt_lines(doc_path: Path, alt_to_src: dict[str, str]) -> int:
    text = doc_path.read_text(encoding="utf-8")
    lines = text.splitlines()
    changed = 0
    out: list[str] = []
    for line in lines:
        parts = split_glued_alts(line, alt_to_src)
        if parts:
            out.extend(parts)
            changed += 1
            print(f"FIXED {doc_path.name}: 粘连纯文字配图 → {len(parts)} 张")
        else:
            out.append(line)
    if changed:
        doc_path.write_text("\n".join(out) + ("\n" if text.endswith("\n") else ""), encoding="utf-8")
    return changed


def check_and_fix(fix: bool) -> list[str]:
    errors: list[str] = []
    entries = load_registry()
    by_doc: dict[str, dict[str, str]] = {}
    for e in entries:
        by_doc.setdefault(e["doc"], {})[e["alt"]] = normalize_src(e["src"])

    if fix:
        for doc_name, alt_to_src in by_doc.items():
            doc_path = PAGES / doc_name
            if doc_path.is_file():
                fix_glued_alt_lines(doc_path, alt_to_src)

    for entry in entries:
        doc_name = entry["doc"]
        alt = entry["alt"]
        src = normalize_src(entry["src"])
        doc_path = PAGES / doc_name
        img_path = (PAGES / src[2:]) if src.startswith("./") else PAGES / src

        if not doc_path.is_file():
            errors.append(f"缺文档: {doc_name}")
            continue
        if not img_path.is_file():
            errors.append(f"缺配图文件: {src} （登记于 {doc_name}）")
            continue

        text = doc_path.read_text(encoding="utf-8")
        wanted = wanted_md(alt, src)
        # 也接受无 ./ 前缀
        alt_wanted = f"![{alt}]({src[2:]})" if src.startswith("./") else None

        has_md = wanted in text or (alt_wanted and alt_wanted in text)
        if has_md:
            continue

        # 纯文字残留：整行恰好等于 alt
        lines = text.splitlines()
        bare_idxs = [i for i, line in enumerate(lines) if line.strip() == alt]
        if bare_idxs:
            msg = f"{doc_name}: 配图语法丢失，仅剩纯文字「{alt}」→ 应为 {wanted}"
            if fix:
                i = bare_idxs[0]
                lines[i] = wanted
                doc_path.write_text("\n".join(lines) + ("\n" if text.endswith("\n") else ""), encoding="utf-8")
                print(f"FIXED {msg}")
            else:
                errors.append(msg)
            continue

        # 未 --fix 时：提示粘连行
        glued = [
            line.strip()
            for line in lines
            if split_glued_alts(line, by_doc.get(doc_name, {}))
            and alt in line
        ]
        if glued:
            msg = f"{doc_name}: 配图语法丢失且粘连「{glued[0]}」→ 含「{alt}」"
            errors.append(msg)
            continue

        errors.append(f"{doc_name}: 未找到 {wanted}（也未找到纯文字 alt）")

    # 孤儿：images 下 png 未出现在任何 md 的 ![]( 与登记表中
    registered = {normalize_src(e["src"]) for e in entries}
    referenced: set[str] = set()
    for md in PAGES.rglob("*.md"):
        for m in IMG_MD_RE.finditer(md.read_text(encoding="utf-8")):
            referenced.add(normalize_src(m.group(2)))

    for png in (PAGES / "images").rglob("*.png"):
        rel = "./" + str(png.relative_to(PAGES)).replace("\\", "/")
        if rel not in registered and rel not in referenced:
            errors.append(f"孤儿配图未引用也未登记: {rel}")

    return errors


def write_preview_map() -> None:
    entries = load_registry()
    by_doc: dict[str, dict[str, str]] = {}
    for e in entries:
        doc = e["doc"]
        by_doc.setdefault(doc, {})[e["alt"]] = normalize_src(e["src"])
    PREVIEW_MAP.parent.mkdir(parents=True, exist_ok=True)
    PREVIEW_MAP.write_text(
        json.dumps(
            {
                "description": "由 scripts/check-doc-images.py --write-preview-map 生成；预览对纯文字 alt 兜底出图",
                "byDoc": by_doc,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"wrote {PREVIEW_MAP.relative_to(ROOT)}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fix", action="store_true", help="恢复被收成纯文字的 ![alt](src)")
    parser.add_argument("--write-preview-map", action="store_true", help="写出 preview 兜底 JSON")
    args = parser.parse_args()

    if not REGISTRY.is_file():
        print(f"ERROR missing registry {REGISTRY}", file=sys.stderr)
        return 1

    if args.write_preview_map:
        write_preview_map()

    errors = check_and_fix(fix=args.fix)
    if errors:
        print("DOC IMAGE CHECK FAILED:")
        for e in errors:
            print(f"  - {e}")
        print("\n修复：python3 scripts/check-doc-images.py --fix")
        print("说明：.cursor/rules/doc-embedded-images.mdc")
        return 1

    print("OK doc-embedded-images")
    if not args.write_preview_map:
        write_preview_map()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
