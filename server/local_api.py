#!/usr/bin/env python3
"""英雄广场 · 本地 REST API（SQLite）"""

from __future__ import annotations

import json
import re
import sys
import time
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
            items = [
                h for h in db.list_heroes()
                if h.get("enabled") is not False
            ]
            json_response(self, 200, {"items": items})
            return

        if path == "/api/heroes/apply/status":
            user_id = qs.get("user_id", [db.DEFAULT_USER_ID])[0]
            json_response(self, 200, db.get_hero_apply_status(user_id))
            return

        m = re.match(r"^/api/heroes/([^/]+)/students$", path)
        if m:
            json_response(self, 200, {"items": db.list_hero_students(m.group(1))})
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
            user_id = qs.get("user_id", [db.DEFAULT_USER_ID])[0]
            items = db.list_my_recruitments(tab, user_id=user_id)
            json_response(self, 200, {
                "items": items,
                "tab": tab,
                "hero_id": db.resolve_user_hero_id(user_id),
            })
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
            hero_id = qs.get("hero_id", [None])[0]
            json_response(self, 200, {"items": db.list_courses_by_hero(hero_id)})
            return

        m = re.match(r"^/api/courses/([^/]+)$", path)
        if m:
            course = db.get_course(m.group(1))
            if course:
                json_response(self, 200, course)
            else:
                json_response(self, 404, {"error": "course_not_found"})
            return

        if path == "/api/signups/mine":
            user_id = qs.get("user_id", [db.DEFAULT_USER_ID])[0]
            json_response(self, 200, {"items": db.list_my_signups(user_id)})
            return

        if path == "/api/signups":
            json_response(
                self,
                200,
                {
                    "items": db.list_signups(
                        user_id=qs.get("user_id", [None])[0],
                        recruit_id=qs.get("recruit_id", [None])[0],
                        course_id=qs.get("course_id", [None])[0],
                        hero_id=qs.get("hero_id", [None])[0],
                    )
                },
            )
            return

        m = re.match(r"^/api/signups/([^/]+)$", path)
        if m:
            item = db.get_signup(m.group(1))
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "signup_not_found"})
            return

        if path == "/api/reviews/mine":
            user_id = qs.get("user_id", [db.DEFAULT_USER_ID])[0]
            json_response(self, 200, {"items": db.list_reviews(user_id=user_id, include_hidden=False)})
            return

        if path == "/api/reviews":
            json_response(
                self,
                200,
                {
                    "items": db.list_reviews(
                        hero_id=qs.get("hero_id", [None])[0],
                        user_id=qs.get("user_id", [None])[0],
                        status=qs.get("status", [None])[0],
                        q=qs.get("q", [None])[0],
                        include_hidden=qs.get("include_hidden", ["0"])[0] in ("1", "true", "True"),
                    )
                },
            )
            return

        m = re.match(r"^/api/app-state/([^/]+)$", path)
        if m:
            value = db.get_app_state(m.group(1))
            json_response(self, 200, {"key": m.group(1), "value": value})
            return

        # ---- admin ----
        if path == "/api/admin/dashboard":
            json_response(self, 200, db.get_admin_dashboard())
            return

        if path == "/api/admin/courses":
            json_response(self, 200, {"items": db.list_courses()})
            return

        if path == "/api/admin/signups":
            json_response(
                self,
                200,
                {
                    "items": db.list_admin_signups(
                        status=qs.get("status", [None])[0],
                        pay_status=qs.get("pay_status", [None])[0],
                        q=qs.get("q", [None])[0],
                    )
                },
            )
            return

        if path == "/api/admin/recruitments":
            json_response(
                self,
                200,
                {
                    "items": db.list_admin_recruitments(
                        status=qs.get("status", [None])[0],
                        q=qs.get("q", [None])[0],
                    )
                },
            )
            return

        m = re.match(r"^/api/admin/recruitments/([^/]+)/signups$", path)
        if m:
            json_response(self, 200, {"items": db.list_recruitment_signups(m.group(1))})
            return

        m = re.match(r"^/api/admin/recruitments/([^/]+)$", path)
        if m:
            item = db.get_recruitment(m.group(1))
            if item:
                json_response(self, 200, db.recruit_admin_view(item))
            else:
                json_response(self, 404, {"error": "recruitment_not_found"})
            return

        if path == "/api/admin/heroes":
            json_response(self, 200, {"items": db.list_admin_heroes(q=qs.get("q", [None])[0])})
            return

        m = re.match(r"^/api/admin/signups/([^/]+)$", path)
        if m:
            item = db.get_signup(m.group(1))
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "signup_not_found"})
            return

        if path == "/api/admin/applications":
            json_response(
                self,
                200,
                db.list_hero_applications(
                    status=qs.get("status", [None])[0],
                    page=int(qs.get("page", ["1"])[0] or 1),
                    page_size=int(qs.get("page_size", ["50"])[0] or 50),
                ),
            )
            return

        m = re.match(r"^/api/admin/applications/([^/]+)$", path)
        if m:
            app = db.get_hero_application(m.group(1))
            if app:
                json_response(self, 200, app)
            else:
                json_response(self, 404, {"error": "application_not_found"})
            return

        if path == "/api/admin/reviews":
            json_response(
                self,
                200,
                {
                    "items": db.list_reviews(
                        status=qs.get("status", [None])[0],
                        q=qs.get("q", [None])[0],
                        include_hidden=True,
                    )
                },
            )
            return

        if path == "/api/admin/users":
            json_response(
                self,
                200,
                {
                    "items": db.list_users(
                        q=qs.get("q", [None])[0],
                        status=qs.get("status", [None])[0],
                    )
                },
            )
            return

        if path == "/api/admin/profile-changes":
            json_response(
                self,
                200,
                {"items": db.list_profile_changes(status=qs.get("status", [None])[0])},
            )
            return

        m = re.match(r"^/api/admin/profile-changes/([^/]+)$", path)
        if m:
            item = db.get_profile_change(m.group(1))
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "change_not_found"})
            return

        if path == "/api/admin/settings":
            json_response(self, 200, db.get_settings())
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

        m = re.match(r"^/api/courses/([^/]+)$", path)
        if m:
            cid = m.group(1)
            existing = db.get_course(cid) or {}
            merged = {**existing, **body, "course_id": cid}
            item = db.upsert_course(cid, merged)
            json_response(self, 200, item)
            return

        m = re.match(r"^/api/signups/([^/]+)$", path)
        if m:
            item = db.update_signup(m.group(1), body)
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "signup_not_found"})
            return

        m = re.match(r"^/api/app-state/([^/]+)$", path)
        if m:
            value = db.set_app_state(m.group(1), body.get("value"))
            json_response(self, 200, {"key": m.group(1), "value": value})
            return

        if path == "/api/admin/settings":
            json_response(self, 200, db.update_settings(body))
            return

        json_response(self, 404, {"error": "not_found"})

    def do_PATCH(self) -> None:
        self.do_PUT()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        body = read_json(self)

        if path == "/api/reset":
            db.reset_db()
            db.ensure_default_user()
            json_response(self, 200, {"ok": True, "message": "database reseeded"})
            return

        if path == "/api/migrate-legacy":
            result = db.migrate_legacy_app_state()
            json_response(self, 200, {"ok": True, "migrated": result})
            return

        if path == "/api/recruitments":
            rid = body.get("recruit_id") or f"r{int(time.time() * 1000)}"
            user_id = body.get("user_id") or db.DEFAULT_USER_ID
            item = {**body, "recruit_id": rid}
            if not item.get("hero_id"):
                item["hero_id"] = db.resolve_user_hero_id(user_id) or "1"
            scope = body.get("scope") or "public"
            if scope in ("active", "ended", "draft"):
                scope = f"mine_{scope}"
            db.upsert_recruitment(item, scope=scope)
            json_response(self, 201, item)
            return

        if path == "/api/courses":
            cid = body.get("course_id") or f"c{int(time.time() * 1000)}"
            item = db.upsert_course(cid, {**body, "course_id": cid})
            json_response(self, 201, item)
            return

        if path == "/api/signups":
            item = db.create_signup(body)
            json_response(self, 201, item)
            return

        m = re.match(r"^/api/signups/([^/]+)/checkin$", path)
        if m:
            item = db.checkin_signup(m.group(1))
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "signup_not_found"})
            return

        if path == "/api/reviews":
            item = db.create_review(body)
            json_response(self, 201, item)
            return

        m = re.match(r"^/api/heroes/([^/]+)/profile-changes$", path)
        if m:
            try:
                item = db.submit_profile_change(
                    m.group(1),
                    body.get("patch") or body,
                    body.get("change_type") or "profile",
                )
                json_response(self, 201, item)
            except LookupError:
                json_response(self, 404, {"error": "hero_not_found"})
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
                json_response(self, 400, {"error": "invalid_status"})
            return

        m = re.match(r"^/api/admin/applications/([^/]+)/reject$", path)
        if m:
            try:
                app = db.reject_hero_application(m.group(1), body.get("reason") or "")
                json_response(self, 200, app)
            except LookupError:
                json_response(self, 404, {"error": "application_not_found"})
            except ValueError:
                json_response(self, 400, {"error": "invalid_status"})
            return

        m = re.match(r"^/api/admin/signups/([^/]+)/cancel$", path)
        if m:
            item = db.cancel_signup(m.group(1))
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "signup_not_found"})
            return

        m = re.match(r"^/api/admin/recruitments/([^/]+)/close$", path)
        if m:
            item = db.close_recruitment(m.group(1))
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "recruitment_not_found"})
            return

        m = re.match(r"^/api/admin/reviews/([^/]+)/hide$", path)
        if m:
            item = db.set_review_status(m.group(1), "hidden")
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "review_not_found"})
            return

        m = re.match(r"^/api/admin/reviews/([^/]+)/delete$", path)
        if m:
            item = db.set_review_status(m.group(1), "deleted")
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "review_not_found"})
            return

        m = re.match(r"^/api/admin/users/([^/]+)/disable$", path)
        if m:
            item = db.set_user_status(m.group(1), "disabled")
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "user_not_found"})
            return

        m = re.match(r"^/api/admin/users/([^/]+)/enable$", path)
        if m:
            item = db.set_user_status(m.group(1), "active")
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "user_not_found"})
            return

        m = re.match(r"^/api/admin/heroes/([^/]+)/enable$", path)
        if m:
            item = db.set_hero_enabled(m.group(1), True)
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "hero_not_found"})
            return

        if path == "/api/admin/heroes":
            try:
                item = db.create_hero(body)
                json_response(self, 201, item)
            except ValueError as exc:
                code = str(exc)
                status = 409 if code == "hero_exists" else 400
                json_response(self, status, {"error": code})
            return

        m = re.match(r"^/api/admin/heroes/([^/]+)/disable$", path)
        if m:
            item = db.set_hero_enabled(m.group(1), False)
            if item:
                json_response(self, 200, item)
            else:
                json_response(self, 404, {"error": "hero_not_found"})
            return

        m = re.match(r"^/api/admin/profile-changes/([^/]+)/approve$", path)
        if m:
            try:
                item = db.approve_profile_change(m.group(1))
                json_response(self, 200, item)
            except LookupError:
                json_response(self, 404, {"error": "change_not_found"})
            except ValueError:
                json_response(self, 400, {"error": "invalid_status"})
            return

        m = re.match(r"^/api/admin/profile-changes/([^/]+)/reject$", path)
        if m:
            try:
                item = db.reject_profile_change(m.group(1), body.get("reason") or "")
                json_response(self, 200, item)
            except LookupError:
                json_response(self, 404, {"error": "change_not_found"})
            except ValueError:
                json_response(self, 400, {"error": "invalid_status"})
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

        m = re.match(r"^/api/admin/applications/([^/]+)$", path)
        if m:
            ok = db.delete_hero_application(m.group(1))
            json_response(self, 200 if ok else 404, {"ok": ok})
            return

        m = re.match(r"^/api/admin/heroes/([^/]+)$", path)
        if m:
            ok = db.delete_hero(m.group(1))
            json_response(self, 200 if ok else 404, {"ok": ok})
            return

        json_response(self, 404, {"error": "not_found"})


def main() -> None:
    conn = db.connect()
    db.init_schema(conn)
    seeded = db.seed_if_empty(conn)
    conn.close()
    db.ensure_default_user()
    try:
        db.migrate_legacy_app_state()
    except Exception as exc:  # noqa: BLE001
        print(f"[local-api] legacy migrate skipped: {exc}")
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
