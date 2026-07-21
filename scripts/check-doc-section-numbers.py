#!/usr/bin/env python3
"""需求文档序号通篇连续（方案 B）。

规则：
  - `## N. 标题`：全文按出现顺序重排为 1、2、3…
  - `### N.M 标题`：大号跟随当前所属 `##`，小号保留
  - 正文行首 `N、`：每个 `###` 小节内从 1 重新连续（无 `###` 时按当前 `##`）
  - 正文行首 `N.M、`：跟随当前父项 `N、`，子序号在该父项下从 1 连续
  - 不改：表格行、代码块、引用块内序号
  - 同步替换文中 `§N` / `§N.M` 引用（按旧→新章节映射）

用法：
  python3 scripts/check-doc-section-numbers.py
  python3 scripts/check-doc-section-numbers.py --fix
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC_GLOBS = [
    ROOT / "docs" / "miniprogram" / "pages",
    ROOT / "docs" / "admin" / "pages",
]
SKIP_NAMES = {"README.md", "_TEMPLATE.md"}

H2_RE = re.compile(r"^(##)\s+(\d+)\.\s+(.+)$")
H3_RE = re.compile(r"^(###)\s+(\d+)\.(\d+)\s+(.+)$")
BODY_TOP_RE = re.compile(r"^(\d+)、(.*)$")
BODY_SUB_RE = re.compile(r"^(\d+)\.(\d+)、(.*)$")
FENCE_RE = re.compile(r"^```")
TABLE_ROW_RE = re.compile(r"^\s*\|")
BLOCKQUOTE_RE = re.compile(r"^\s*>")
SEC_REF_RE = re.compile(r"§(\d+)(?:\.(\d+))?")


def iter_doc_files() -> list[Path]:
    files: list[Path] = []
    for base in DOC_GLOBS:
        if not base.is_dir():
            continue
        for path in sorted(base.glob("*.md")):
            if path.name in SKIP_NAMES:
                continue
            files.append(path)
    return files


def renumber_text(text: str) -> tuple[str, bool]:
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    changed = False

    in_fence = False
    h2_new = 0
    h2_old_to_new: dict[int, int] = {}
    body_top = 0
    body_sub = 0
    current_top = 0

    def eol(line: str) -> str:
        return "\n" if line.endswith("\n") else ""

    def body(line: str) -> str:
        return line[:-1] if line.endswith("\n") else line

    for line in lines:
        raw = body(line)
        ending = eol(line)

        if FENCE_RE.match(raw.strip()):
            in_fence = not in_fence
            out.append(line)
            continue

        if in_fence or TABLE_ROW_RE.match(raw) or BLOCKQUOTE_RE.match(raw):
            out.append(line)
            continue

        m2 = H2_RE.match(raw)
        if m2:
            old_n = int(m2.group(2))
            title = m2.group(3)
            h2_new += 1
            h2_old_to_new[old_n] = h2_new
            body_top = 0
            body_sub = 0
            current_top = 0
            new_line = f"## {h2_new}. {title}{ending}"
            if new_line != line:
                changed = True
            out.append(new_line)
            continue

        m3 = H3_RE.match(raw)
        if m3:
            old_major = int(m3.group(2))
            minor = m3.group(3)
            title = m3.group(4)
            # 所属 ## 的新序号；若尚未见到 ##，保持原大号
            new_major = h2_new if h2_new > 0 else h2_old_to_new.get(old_major, old_major)
            # 每个 ### 小节内正文序号从 1 重新连续
            body_top = 0
            body_sub = 0
            current_top = 0
            new_line = f"### {new_major}.{minor} {title}{ending}"
            if new_line != line:
                changed = True
            out.append(new_line)
            continue

        m_sub = BODY_SUB_RE.match(raw)
        if m_sub:
            rest = m_sub.group(3)
            if current_top == 0:
                body_top += 1
                current_top = body_top
                body_sub = 0
            body_sub += 1
            new_line = f"{current_top}.{body_sub}、{rest}{ending}"
            if new_line != line:
                changed = True
            out.append(new_line)
            continue

        m_top = BODY_TOP_RE.match(raw)
        if m_top:
            rest = m_top.group(2)
            body_top += 1
            current_top = body_top
            body_sub = 0
            new_line = f"{body_top}、{rest}{ending}"
            if new_line != line:
                changed = True
            out.append(new_line)
            continue

        out.append(line)

    result = "".join(out)
    if text.endswith("\n") and not result.endswith("\n"):
        result += "\n"

    # 同步 §N / §N.M：仅正文区（变更记录章节及表格不改，避免改写历史条目）
    if h2_old_to_new:
        lines2 = result.splitlines(keepends=True)
        out2: list[str] = []
        in_changelog = False
        in_fence2 = False

        def repl_sec(m: re.Match[str]) -> str:
            old_major = int(m.group(1))
            minor = m.group(2)
            if old_major not in h2_old_to_new:
                return m.group(0)
            new_major = h2_old_to_new[old_major]
            if minor is None:
                return f"§{new_major}"
            return f"§{new_major}.{minor}"

        for line in lines2:
            raw = line[:-1] if line.endswith("\n") else line
            if FENCE_RE.match(raw.strip()):
                in_fence2 = not in_fence2
                out2.append(line)
                continue
            if H2_RE.match(raw) and ("变更记录" in raw):
                in_changelog = True
            if in_changelog or in_fence2 or TABLE_ROW_RE.match(raw):
                out2.append(line)
                continue
            new_line = SEC_REF_RE.sub(repl_sec, line)
            if new_line != line:
                changed = True
            out2.append(new_line)
        result = "".join(out2)

    return result, changed


def check_file(path: Path, fix: bool) -> list[str]:
    original = path.read_text(encoding="utf-8")
    updated, changed = renumber_text(original)
    if not changed and updated == original:
        # 仍做一致性探测：再跑一遍应幂等
        again, again_changed = renumber_text(updated)
        if again_changed or again != updated:
            return [f"{path.relative_to(ROOT)}: 序号重排非幂等"]
        return []

    if fix:
        if updated != original:
            path.write_text(updated, encoding="utf-8")
        return []

    issues: list[str] = []
    if updated != original:
        issues.append(f"{path.relative_to(ROOT)}: 章节/正文序号不连续（可 --fix）")
    return issues


def main() -> int:
    ap = argparse.ArgumentParser(description="需求文档序号通篇连续")
    ap.add_argument("--fix", action="store_true", help="自动重排为连续序号")
    args = ap.parse_args()

    files = iter_doc_files()
    if not files:
        print("OK doc-section-numbers (no files)", flush=True)
        return 0

    all_issues: list[str] = []
    fixed = 0
    for path in files:
        before = path.read_text(encoding="utf-8")
        issues = check_file(path, fix=args.fix)
        if args.fix:
            after = path.read_text(encoding="utf-8")
            if after != before:
                fixed += 1
        all_issues.extend(issues)

    if all_issues:
        print("DOC SECTION NUMBERS CHECK FAILED:", file=sys.stderr)
        for item in all_issues:
            print(f"  - {item}", file=sys.stderr)
        print("\n修复：python3 scripts/check-doc-section-numbers.py --fix", file=sys.stderr)
        return 1

    if args.fix:
        print(f"OK doc-section-numbers (fixed {fixed} files)", flush=True)
    else:
        print("OK doc-section-numbers", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
