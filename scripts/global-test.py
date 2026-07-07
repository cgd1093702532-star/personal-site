#!/usr/bin/env python3
"""英雄广场 · 全局冒烟测试（预览 + 本地数据库 API）"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PREVIEW = "http://127.0.0.1:8765"
API = "http://127.0.0.1:8787"

PREVIEW_PAGES = [
    "/",
    "/miniprogram/index.html",
    "/miniprogram/heroes.html",
    "/miniprogram/hero-detail.html?id=1",
    "/miniprogram/hero-profile.html",
    "/miniprogram/profile.html",
    "/miniprogram/recruitment-detail.html?id=r1",
    "/miniprogram/my-recruitments.html",
]

API_CHECKS = [
    ("GET", "/api/health", None),
    ("GET", "/api/heroes", None),
    ("GET", "/api/heroes/1", None),
    ("GET", "/api/recruitments/mine/active", None),
    ("GET", "/api/courses", None),
]


def fetch(url: str, method: str = "GET", body: dict | None = None) -> tuple[int, str]:
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, res.read().decode("utf-8", errors="replace")[:200]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")[:200]
    except Exception as e:
        return 0, str(e)


def ok(label: str, passed: bool, detail: str = "") -> bool:
    mark = "PASS" if passed else "FAIL"
    line = f"[{mark}] {label}"
    if detail:
        line += f" — {detail}"
    print(line)
    return passed


def main() -> int:
    print("=== 英雄广场 全局冒烟测试 ===\n")
    all_pass = True

    print("-- 预览服务 (8765) --")
    for path in PREVIEW_PAGES:
        code, _ = fetch(f"{PREVIEW}{path}")
        all_pass &= ok(f"preview {path}", code == 200, f"HTTP {code}")

    print("\n-- 本地数据库 API (8787) --")
    for method, path, body in API_CHECKS:
        code, text = fetch(f"{API}{path}", method, body)
        all_pass &= ok(f"api {method} {path}", code == 200, f"HTTP {code}")
        if path == "/api/health" and code == 200:
            try:
                data = json.loads(text)
                all_pass &= ok("api health ok field", data.get("ok") is True)
            except json.JSONDecodeError:
                all_pass &= ok("api health json", False, "invalid json")

    print("\n-- 数据文件 --")
    all_pass &= ok("seed.json exists", (ROOT / "data/seed.json").exists())
    all_pass &= ok("local.db exists", (ROOT / "data/local.db").exists())

    print("\n-- 关键脚本 --")
    for rel in [
        "preview/assets/preview-nav.js",
        "preview/assets/db-client.js",
        "miniprogram/utils/data.js",
        "server/local_api.py",
    ]:
        all_pass &= ok(rel, (ROOT / rel).exists())

    print()
    if all_pass:
        print("全部通过 ✓")
        return 0
    print("存在失败项 ✗")
    return 1


if __name__ == "__main__":
    sys.exit(main())
