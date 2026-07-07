#!/usr/bin/env python3
"""英雄广场 · 本地 REST API（SQLite）"""

from __future__ import annotations

import json
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from server import db  # noqa: E402

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8787


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict | list) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()
    handler.wfile.write(body)


def read_json(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length") or 0)
    if length <= 0:
        return {}
    raw = handler.rfile.read(length)
    return json.loads(raw.decode("utf-8"))


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print(f"[local-api] {self.address_string()} {fmt % args}")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        qs = parse_qs(parsed.query)

        if path == "/api/health":
            json_response(self, 200, {"ok": True, "db": str(db.DB_PATH)})
            return

        if path == "/api/heroes":
            json_response(self, 200, {"items": db.list_heroes()})
            return

        if path == "/api/heroes/apply/status":
            user_id = qs.get("user_id", [db.DEFAULT_USER_ID])[0]
            json_response(self, 200, db.get_hero_apply_status(user_id))
            return

        m = re.match(r"^/api/heroes/([^/]+)$", path)
        if m:
            hero = db.get_hero(m.group(1))
            if hero:
                json_response(self, 200, hero)
            else:
                json_response(self, 404, {"error": "hero_not_found"})
            return

        if path == "/api/recruitments":
            scope = qs.get("scope", [None])[0]
            hero_id = qs.get("hero_id", [None])[0]
            json_response(self, 200, {"items": db.list_recruitments(scope=scope, hero_id=hero_id)})
            return

        m = re.match(r"^/api/recruitments/mine/([^/]+)$", path)
        if m:
            tab = m.group(1)
            items = db.list_recruitments(scope=f"mine_{tab}")
            items = db.sort_mine_recruitments(items, tab)
            json_response(self, 200, {"items": items, "tab": tab})
            return

        m = re.match(r"^/api/recruitments/([^/]+)$", path)
        if m:
            item = db.get_recruitment(m.group(1))
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "recruitment_not_found"})
            return

        if path == "/api/courses":
            json_response(self, 200, {"items": db.list_courses()})
            return

        m = re.match(r"^/api/courses/([^/]+)$", path)
        if m:
            course = db.get_course(m.group(1))
            if course:
                json_response(self, 200, course)
            else:
                json_response(self, 404, {"error": "course_not_found"})
            return

        m = re.match(r"^/api/app-state/([^/]+)$", path)
        if m:
            value = db.get_app_state(m.group(1))
            json_response(self, 200, {"key": m.group(1), "value": value})
            return

        if path == "/api/admin/applications":
            status = qs.get("status", [None])[0]
            page = int(qs.get("page", ["1"])[0] or 1)
            page_size = int(qs.get("page_size", ["50"])[0] or 50)
            json_response(self, 200, db.list_hero_applications(status=status, page=page, page_size=page_size))
            return

        m = re.match(r"^/api/admin/applications/([^/]+)$", path)
        if m:
            app = db.get_hero_application(m.group(1))
            if app:
                json_response(self, 200, app)
            else:
                json_response(self, 404, {"error": "application_not_found"})
            return

        json_response(self, 404, {"error": "not_found"})

    def do_PUT(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        body = read_json(self)

        m = re.match(r"^/api/heroes/([^/]+)$", path)
        if m:
            hero = db.update_hero(m.group(1), body)
            if hero:
                json_response(self, 200, hero)
            else:
                json_response(self, 404, {"error": "hero_not_found"})
            return

        m = re.match(r"^/api/recruitments/([^/]+)$", path)
        if m:
            rid = m.group(1)
            existing = db.get_recruitment(rid) or {}
            merged = {**existing, **body, "recruit_id": rid}
            scope = body.get("scope")
            if not scope:
                scope = f"mine_{existing['listTab']}" if existing.get("listTab") else "public"
            elif scope in ("active", "ended", "draft"):
                scope = f"mine_{scope}"
            item = db.upsert_recruitment(merged, scope=scope)
            json_response(self, 200, item)
            return

        m = re.match(r"^/api/app-state/([^/]+)$", path)
        if m:
            value = db.set_app_state(m.group(1), body.get("value"))
            json_response(self, 200, {"key": m.group(1), "value": value})
            return

        json_response(self, 404, {"error": "not_found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        body = read_json(self)

        if path == "/api/reset":
            db.reset_db()
            json_response(self, 200, {"ok": True, "message": "database reseeded"})
            return

        if path == "/api/recruitments":
            rid = body.get("recruit_id") or f"r{int(__import__('time').time() * 1000)}"
            item = {**body, "recruit_id": rid}
            scope = body.get("scope") or "public"
            if scope in ("active", "ended", "draft"):
                scope = f"mine_{scope}"
            db.upsert_recruitment(item, scope=scope)
            json_response(self, 201, item)
            return

        if path == "/api/heroes/apply":
            user_id = body.get("user_id") or db.DEFAULT_USER_ID
            try:
                app = db.submit_hero_application(user_id, body)
                json_response(self, 201, app)
            except ValueError as exc:
                code = str(exc)
                status = 409 if code in ("application_pending", "already_approved") else 400
                json_response(self, status, {"error": code})
            return

        if path == "/api/heroes/apply/withdraw":
            user_id = body.get("user_id") or db.DEFAULT_USER_ID
            ok = db.withdraw_hero_application(user_id)
            json_response(self, 200, {"ok": ok})
            return

        m = re.match(r"^/api/admin/applications/([^/]+)/approve$", path)
        if m:
            try:
                app = db.approve_hero_application(m.group(1))
                json_response(self, 200, app)
            except LookupError:
                json_response(self, 404, {"error": "application_not_found"})
            except ValueError:
                json_response(self, 404, {"error": "invalid_status"})
            return

        m = re.match(r"^/api/admin/applications/([^/]+)/reject$", path)
        if m:
            try:
                app = db.reject_hero_application(m.group(1), body.get("reason") or "")
                json_response(self, 200, app)
            except LookupError:
                json_response(self, 404, {"error": "application_not_found"})
            except ValueError:
                json_response(self, 404, {"error": "invalid_status"})
            return

        json_response(self, 404, {"error": "not_found"})

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")

        m = re.match(r"^/api/recruitments/([^/]+)$", path)
        if m:
            ok = db.delete_recruitment(m.group(1))
            json_response(self, 200 if ok else 404, {"ok": ok})
            return

        json_response(self, 404, {"error": "not_found"})


def main() -> None:
    conn = db.connect()
    db.init_schema(conn)
    seeded = db.seed_if_empty(conn)
    conn.close()
    if seeded:
        print(f"[local-api] 已初始化数据库并导入种子: {db.DB_PATH}")
    else:
        print(f"[local-api] 使用已有数据库: {db.DB_PATH}")

    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"[local-api] 本地 API: http://127.0.0.1:{PORT}/api/health")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[local-api] 已停止")
        server.server_close()


if __name__ == "__main__":
    main()
