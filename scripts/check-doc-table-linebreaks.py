#!/usr/bin/env python3
"""铁律：需求文档表格单元格内序号分点必须用 <br> 换行（真源写作 + 预览一致）。

检查并可选修复：
  - 中文顿号序号 1、2、
  - 子序号 1.1、
  - 西式序号 1. （点后空白）
  - 场景序号 场景 1：
  - 清除误入的控制符 \\x1f 等（先转为换行再清理）

用法：
  python3 scripts/check-doc-table-linebreaks.py
  python3 scripts/check-doc-table-linebreaks.py --fix
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "docs" / "miniprogram" / "pages"

CTRL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
# 注意：`1、` 用 (?<![\d.]) 避免把 `1.1、` 尾部再当成 `1、`
MARKER_RE = re.compile(
    r"(?:"
    r"\d+\.\d+[、]"
    r"|(?<![\d.])\d+[、]"
    r"|(?<!\d)\d+\.\s+"
    r"|场景\s*\d+\s*[：:]"
    r")"
)


def is_table_sep(line: str) -> bool:
    return bool(
        re.match(
            r"^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$",
            line.strip(),
        )
    )


def parse_row(line: str) -> list[str]:
    raw = line.strip()
    if raw.startswith("|"):
        raw = raw[1:]
    if raw.endswith("|"):
        raw = raw[:-1]
    return [c.strip() for c in raw.split("|")]


def marker_spans(text: str) -> list[tuple[int, int]]:
    return [(m.start(), m.end()) for m in MARKER_RE.finditer(text)]


def insert_breaks_before_markers(text: str) -> str:
    """仅在第 2 个及之后的序号前插入换行（不拆开首个序号，避免 **1、 被拆）。"""
    spans = marker_spans(text)
    if len(spans) < 2:
        return text
    out = text
    for start, _end in reversed(spans[1:]):
        if start <= 0:
            continue
        if out[start - 1] == "\n":
            continue
        out = out[:start] + "\n" + out[start:]
    return out


def cell_needs_break(cell: str) -> bool:
    if CTRL_RE.search(cell):
        return True
    flat = (
        cell.replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("<br />", "\n")
    )
    flat = CTRL_RE.sub("", flat)
    for part in flat.split("\n"):
        part = part.strip()
        if not part:
            continue
        if len(marker_spans(part)) >= 2:
            return True
    return False


def fix_cell(cell: str) -> str:
    # 控制符曾被当作「隐形换行」；先转成换行再清残留
    raw = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]+", "\n", cell)
    raw = CTRL_RE.sub("", raw)
    raw = re.sub(r"<br\s*/?>", "\n", raw, flags=re.I)
    raw = insert_breaks_before_markers(raw)
    parts = [p.strip() for p in raw.split("\n") if p.strip()]
    return "<br>".join(parts)


def iter_md_files() -> list[Path]:
    if not PAGES.is_dir():
        return []
    return sorted(p for p in PAGES.glob("*.md") if p.name not in {"README.md"})


def process_file(path: Path, fix: bool) -> list[str]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    errors: list[str] = []
    changed = False
    out: list[str] = []

    i = 0
    while i < len(lines):
        line = lines[i]
        if "|" in line and i + 1 < len(lines) and is_table_sep(lines[i + 1]):
            block_start = i
            block: list[str] = []
            while i < len(lines) and "|" in lines[i] and lines[i].strip().startswith("|"):
                block.append(lines[i])
                i += 1
            new_block: list[str] = []
            for bi, bline in enumerate(block):
                endl = ""
                raw_line = bline
                if raw_line.endswith("\n"):
                    endl = "\n"
                    raw_line = raw_line[:-1]
                if raw_line.endswith("\r"):
                    endl = "\r\n" if endl == "\n" else "\r"
                    raw_line = raw_line[:-1]
                if is_table_sep(raw_line) or bi == 0:
                    new_block.append(bline)
                    continue
                cells = parse_row(raw_line)
                new_cells: list[str] = []
                row_dirty = False
                for ci, cell in enumerate(cells):
                    if cell_needs_break(cell) or CTRL_RE.search(cell):
                        fixed = fix_cell(cell)
                        if fixed != cell:
                            row_dirty = True
                            if not fix:
                                errors.append(
                                    f"{path.relative_to(ROOT)}: 表格单元格序号未换行 "
                                    f"(约 L{block_start + bi + 1} 列{ci + 1})"
                                )
                            new_cells.append(fixed)
                        else:
                            new_cells.append(cell)
                    else:
                        new_cells.append(cell)
                if row_dirty and fix:
                    changed = True
                    new_block.append("| " + " | ".join(new_cells) + " |" + endl)
                else:
                    new_block.append(bline)
            out.extend(new_block)
            continue
        out.append(line)
        i += 1

    if fix and changed:
        path.write_text("".join(out), encoding="utf-8")
    return errors


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--fix", action="store_true", help="自动插入 <br> 并清除控制符")
    args = ap.parse_args()

    all_errors: list[str] = []
    for path in iter_md_files():
        errs = process_file(path, fix=args.fix)
        all_errors.extend(errs)

    if args.fix:
        all_errors = []
        for path in iter_md_files():
            all_errors.extend(process_file(path, fix=False))

    if all_errors:
        print("FAIL doc-table-linebreaks:")
        for e in all_errors[:50]:
            print(" ", e)
        if len(all_errors) > 50:
            print(f"  …另有 {len(all_errors) - 50} 条")
        print("提示：python3 scripts/check-doc-table-linebreaks.py --fix")
        return 1

    print("OK doc-table-linebreaks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
