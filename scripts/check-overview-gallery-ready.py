#!/usr/bin/env python3
"""推送前检查：总览大全脏标记已清除，且 gallery 真源文件存在。

用法：
  python3 scripts/check-overview-gallery-ready.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FLAG = ROOT / ".tools" / ".overview-gallery-dirty"
GALLERY_JS = ROOT / "preview" / "assets" / "preview-dialog-gallery.js"
GALLERY_DIR = ROOT / "preview" / "assets" / "dialog-gallery"


def main() -> int:
    errors: list[str] = []

    if not GALLERY_JS.is_file():
        errors.append(f"缺少总览真源: {GALLERY_JS.relative_to(ROOT)}")
    if not GALLERY_DIR.is_dir():
        errors.append(f"缺少弹框截图目录: {GALLERY_DIR.relative_to(ROOT)}")

    if FLAG.is_file():
        files = [ln.strip() for ln in FLAG.read_text(encoding="utf-8").splitlines() if ln.strip()]
        names = ", ".join(Path(f).name for f in files) or "(未知文件)"
        errors.append(
            "总览大全未同步：存在脏标记 .tools/.overview-gallery-dirty "
            f"（涉及: {names}）。请按 preview-overview-gallery-sync.mdc 更新 "
            "preview-dialog-gallery.js / dialog-gallery 后再推送。"
        )

    if errors:
        print("OVERVIEW GALLERY CHECK FAILED:")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("OK overview-gallery-ready")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
