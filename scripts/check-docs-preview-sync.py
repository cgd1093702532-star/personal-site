#!/usr/bin/env python3
"""核对预览 docs 已符号链接到真源 docs/miniprogram/pages。

退出码：
  0 = 一致（符号链接正确）
  1 = 不一致或缺失
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "miniprogram" / "pages"
DST = ROOT / "preview" / "docs" / "miniprogram" / "pages"


def main() -> int:
    if not SRC.is_dir():
        print(f"ERROR: 真源不存在：{SRC}", file=sys.stderr)
        return 1
    if not DST.exists() and not DST.is_symlink():
        print(
            f"ERROR: 预览目录不存在：{DST}（请先运行 python3 preview/build-pages.py）",
            file=sys.stderr,
        )
        return 1
    if not DST.is_symlink():
        print(
            "ERROR: preview/docs/miniprogram/pages 不是符号链接。"
            "旧的拷贝方式会导致与真源漂移。请运行：python3 preview/build-pages.py",
            file=sys.stderr,
        )
        return 1
    try:
        resolved = DST.resolve()
    except FileNotFoundError:
        print("ERROR: 符号链接目标不存在", file=sys.stderr)
        return 1
    if resolved != SRC.resolve():
        print(f"ERROR: 链接到 {resolved}，期望 {SRC.resolve()}", file=sys.stderr)
        return 1

    # 抽样：英雄广场.md 必须可读且同源
    sample = "英雄广场.md"
    if (SRC / sample).is_file():
        if (DST / sample).read_bytes() != (SRC / sample).read_bytes():
            print(f"ERROR: 抽样文件不一致：{sample}", file=sys.stderr)
            return 1

    print(f"OK docs-preview-sync (symlink -> {SRC})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
