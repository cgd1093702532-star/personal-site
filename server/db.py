"""本地 SQLite 数据库 · 英雄广场 M1"""

from __future__ import annotations

import json
import re
import sqlite3
import time
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "data" / "local.db"
SEED_PATH = ROOT / "data" / "seed.json"
DEFAULT_USER_ID = "mock-user-1"


def _now() -> float:
    return time.time()


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS heroes (
            hero_id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recruitments (
            recruit_id TEXT PRIMARY KEY,
            hero_id TEXT,
            scope TEXT NOT NULL DEFAULT 'public',
            payload TEXT NOT NULL,
            updated_at REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS courses (
            course_id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS app_state (
            key TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS hero_applications (
            application_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            payload TEXT NOT NULL,
            reject_reason TEXT,
            hero_id TEXT,
            submitted_at REAL NOT NULL,
            reviewed_at REAL,
            updated_at REAL NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_hero_applications_user ON hero_applications(user_id);
        CREATE INDEX IF NOT EXISTS idx_hero_applications_status ON hero_applications(status);
        CREATE TABLE IF NOT EXISTS signups (
            signup_id TEXT PRIMARY KEY,
            status TEXT NOT NULL DEFAULT 'confirmed',
            pay_status TEXT NOT NULL DEFAULT 'unpaid',
            payload TEXT NOT NULL,
            updated_at REAL NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_signups_status ON signups(status);
        CREATE INDEX IF NOT EXISTS idx_signups_pay_status ON signups(pay_status);
        CREATE TABLE IF NOT EXISTS reviews (
            review_id TEXT PRIMARY KEY,
            hero_id TEXT,
            user_id TEXT,
            status TEXT NOT NULL DEFAULT 'visible',
            score REAL NOT NULL DEFAULT 5,
            payload TEXT NOT NULL,
            updated_at REAL NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_reviews_hero ON reviews(hero_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            status TEXT NOT NULL DEFAULT 'active',
            payload TEXT NOT NULL,
            updated_at REAL NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
        CREATE TABLE IF NOT EXISTS profile_change_requests (
            change_id TEXT PRIMARY KEY,
            hero_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            payload TEXT NOT NULL,
            reject_reason TEXT,
            submitted_at REAL NOT NULL,
            reviewed_at REAL,
            updated_at REAL NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_profile_changes_status ON profile_change_requests(status);
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at REAL NOT NULL
        );
        """
    )
    conn.commit()


def load_seed() -> dict[str, Any]:
    if not SEED_PATH.exists():
        raise FileNotFoundError(f"缺少种子文件: {SEED_PATH}，请先运行 scripts/generate-seed.py")
    return json.loads(SEED_PATH.read_text(encoding="utf-8"))


def seed_if_empty(conn: sqlite3.Connection) -> bool:
    # 已初始化标记：允许清空 heroes 后不再被 seed 自动回填
    if conn.execute("SELECT 1 FROM app_state WHERE key = '_db_seeded' LIMIT 1").fetchone():
        return False
    row = conn.execute("SELECT COUNT(*) AS c FROM heroes").fetchone()
    if row and row["c"] > 0:
        conn.execute(
            "INSERT OR REPLACE INTO app_state (key, payload, updated_at) VALUES ('_db_seeded', ?, ?)",
            (json.dumps(True, ensure_ascii=False), _now()),
        )
        return False
    apply_seed(conn, load_seed())
    conn.execute(
        "INSERT OR REPLACE INTO app_state (key, payload, updated_at) VALUES ('_db_seeded', ?, ?)",
        (json.dumps(True, ensure_ascii=False), _now()),
    )
    return True


def apply_seed(conn: sqlite3.Connection, seed: dict[str, Any]) -> None:
    ts = _now()
    conn.execute("DELETE FROM heroes")
    heroes = seed.get("heroes") or {}
    for hero_id, payload in heroes.items():
        conn.execute(
            "INSERT OR REPLACE INTO heroes (hero_id, payload, updated_at) VALUES (?, ?, ?)",
            (hero_id, json.dumps(payload, ensure_ascii=False), ts),
        )

    conn.execute("DELETE FROM recruitments")
    for item in seed.get("public_recruitments") or []:
        rid = item["recruit_id"]
        conn.execute(
            "INSERT OR REPLACE INTO recruitments (recruit_id, hero_id, scope, payload, updated_at) VALUES (?, ?, 'public', ?, ?)",
            (rid, item.get("hero_id"), json.dumps(item, ensure_ascii=False), ts),
        )

    mine = seed.get("my_recruitment_lists") or {}
    for tab, items in mine.items():
        scope = f"mine_{tab}"
        for item in items:
            rid = item["recruit_id"]
            conn.execute(
                "INSERT OR REPLACE INTO recruitments (recruit_id, hero_id, scope, payload, updated_at) VALUES (?, ?, ?, ?, ?)",
                (rid, item.get("hero_id", "1"), scope, json.dumps(item, ensure_ascii=False), ts),
            )

    conn.execute("DELETE FROM courses")
    conn.execute("DELETE FROM hero_applications")
    for item in seed.get("courses") or []:
        cid = item.get("course_id") or item.get("id")
        conn.execute(
            "INSERT OR REPLACE INTO courses (course_id, payload, updated_at) VALUES (?, ?, ?)",
            (cid, json.dumps(item, ensure_ascii=False), ts),
        )

    for key, value in (seed.get("app_state") or {}).items():
        conn.execute(
            "INSERT OR REPLACE INTO app_state (key, payload, updated_at) VALUES (?, ?, ?)",
            (key, json.dumps(value, ensure_ascii=False), ts),
        )

    conn.execute("DELETE FROM signups")
    for item in seed.get("signups") or []:
        sid = item.get("signup_id") or item.get("id")
        status = item.get("status") or "confirmed"
        pay_status = item.get("pay_status") or "unpaid"
        payload = {k: v for k, v in item.items() if k not in ("signup_id", "id", "status", "pay_status")}
        conn.execute(
            "INSERT OR REPLACE INTO signups (signup_id, status, pay_status, payload, updated_at) VALUES (?, ?, ?, ?, ?)",
            (sid, status, pay_status, json.dumps(payload, ensure_ascii=False), ts),
        )

    conn.execute("DELETE FROM reviews")
    for item in seed.get("reviews") or []:
        rid = item.get("review_id") or item.get("id")
        conn.execute(
            "INSERT OR REPLACE INTO reviews (review_id, hero_id, user_id, status, score, payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                rid,
                item.get("hero_id"),
                item.get("user_id"),
                item.get("status") or "visible",
                float(item.get("score") or 5),
                json.dumps(item, ensure_ascii=False),
                ts,
            ),
        )

    conn.execute("DELETE FROM users")
    for item in seed.get("users") or []:
        uid = item.get("user_id") or item.get("id")
        conn.execute(
            "INSERT OR REPLACE INTO users (user_id, status, payload, updated_at) VALUES (?, ?, ?, ?)",
            (uid, item.get("status") or "active", json.dumps(item, ensure_ascii=False), ts),
        )

    conn.execute("DELETE FROM profile_change_requests")
    for item in seed.get("profile_change_requests") or []:
        cid = item.get("change_id") or item.get("id")
        submitted = _iso_ts(item.get("submitted_at"), ts)
        conn.execute(
            """
            INSERT OR REPLACE INTO profile_change_requests
            (change_id, hero_id, status, payload, reject_reason, submitted_at, reviewed_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                cid,
                item.get("hero_id"),
                item.get("status") or "pending",
                json.dumps(item, ensure_ascii=False),
                item.get("reject_reason"),
                submitted,
                _iso_ts(item.get("reviewed_at"), 0) or None,
                ts,
            ),
        )

    conn.execute("DELETE FROM settings")
    for key, value in (seed.get("settings") or {}).items():
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, payload, updated_at) VALUES (?, ?, ?)",
            (key, json.dumps(value, ensure_ascii=False), ts),
        )

    conn.commit()


def reset_db() -> None:
    conn = connect()
    init_schema(conn)
    apply_seed(conn, load_seed())
    conn.execute(
        "INSERT OR REPLACE INTO app_state (key, payload, updated_at) VALUES ('_db_seeded', ?, ?)",
        (json.dumps(True, ensure_ascii=False), _now()),
    )
    conn.commit()
    conn.close()


def list_heroes() -> list[dict[str, Any]]:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    rows = conn.execute("SELECT hero_id, payload FROM heroes ORDER BY hero_id").fetchall()
    conn.close()
    return [{**json.loads(r["payload"]), "hero_id": r["hero_id"]} for r in rows]


def get_hero(hero_id: str) -> dict[str, Any] | None:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    row = conn.execute("SELECT payload FROM heroes WHERE hero_id = ?", (hero_id,)).fetchone()
    conn.close()
    return json.loads(row["payload"]) if row else None


def create_hero(payload: dict[str, Any]) -> dict[str, Any]:
    """后台创建供方（英雄）。"""
    ts = _now()
    hero_id = str(payload.get("hero_id") or f"hero-{int(ts * 1000)}")
    if get_hero(hero_id):
        raise ValueError("hero_exists")

    types = payload.get("project_types") or []
    if isinstance(types, str):
        types = [s.strip() for s in re.split(r"[、,，]", types) if s.strip()]

    existing_ids = []
    for h in list_heroes():
        sid = str(h.get("supplier_id") or "")
        if sid.isdigit():
            existing_ids.append(int(sid))
    supplier_id = str(payload.get("supplier_id") or (max(existing_ids, default=10238332) + 1))

    now_iso = datetime.fromtimestamp(ts).isoformat(timespec="seconds")
    hero = {
        "hero_id": hero_id,
        "supplier_id": supplier_id,
        "name": (payload.get("name") or "").strip(),
        "real_name": (payload.get("real_name") or "").strip(),
        "id_card": (payload.get("id_card") or "").strip(),
        "phone": (payload.get("phone") or "").strip(),
        "city": (payload.get("city") or payload.get("address") or "").strip(),
        "address": (payload.get("address") or payload.get("city") or "").strip(),
        "bank_account": (payload.get("bank_account") or "").strip(),
        "certification": (payload.get("certification") or "").strip(),
        "certification_images": payload.get("certification_images") or [],
        "years_exp": payload.get("years_exp") if payload.get("years_exp") is not None else "",
        "project_types": types,
        "avatar_img": payload.get("avatar_img") or "hero-1.jpg",
        "bio": (payload.get("bio") or payload.get("about_me") or "").strip(),
        "about_me": (payload.get("bio") or payload.get("about_me") or "").strip(),
        "teaching_philosophy": (payload.get("teaching_philosophy") or "").strip(),
        "event_experience": (payload.get("event_experience") or "").strip(),
        "social_contribution": (payload.get("social_contribution") or "").strip(),
        "teaching_images": payload.get("teaching_images") or [],
        "event_images": payload.get("event_images") or [],
        "social_images": payload.get("social_images") or [],
        "enabled": payload.get("enabled", True) is not False,
        "audit_status": payload.get("audit_status") or "approved",
        "reviewer": payload.get("reviewer") or "小李",
        "reviewed_at": payload.get("reviewed_at") or now_iso,
        "channel": payload.get("channel") or "后台创建",
        "applied_at": payload.get("applied_at") or now_iso,
        "rating": payload.get("rating", 5.0),
        "student_count": payload.get("student_count", 0),
        "honors_count": len(payload.get("honor_titles") or payload.get("past_honors") or []),
        "honor_titles": payload.get("honor_titles") or [],
        "cert_badges": [payload.get("certification")] if payload.get("certification") else [],
        "past_honors": payload.get("past_honors") or [],
        "moments": payload.get("moments") or [],
        "custom_sections": payload.get("custom_sections") or [],
        "certificates": payload.get("certificates") or [],
    }
    if not hero["name"]:
        raise ValueError("name_required")

    conn = connect()
    init_schema(conn)
    conn.execute(
        "INSERT OR REPLACE INTO heroes (hero_id, payload, updated_at) VALUES (?, ?, ?)",
        (hero_id, json.dumps(hero, ensure_ascii=False), ts),
    )
    conn.commit()
    conn.close()
    return hero


def update_hero(hero_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
    hero = get_hero(hero_id)
    if not hero:
        return None
    hero.update(patch)
    ts = _now()
    conn = connect()
    conn.execute(
        "INSERT OR REPLACE INTO heroes (hero_id, payload, updated_at) VALUES (?, ?, ?)",
        (hero_id, json.dumps(hero, ensure_ascii=False), ts),
    )
    conn.commit()
    conn.close()
    return hero


def _iso_ts(value: str | None, default: float) -> float:
    if not value:
        return default
    try:
        return datetime.fromisoformat(value).timestamp()
    except (ValueError, TypeError):
        return default


def sort_mine_recruitments(items: list[dict[str, Any]], tab: str) -> list[dict[str, Any]]:
    """进行中/草稿：开始时间正序；已结束：结束时间倒序。"""
    if tab in ("active", "draft"):
        return sorted(items, key=lambda x: _iso_ts(x.get("start_at"), float("inf")))
    if tab == "ended":
        return sorted(items, key=lambda x: _iso_ts(x.get("end_at"), float("-inf")), reverse=True)
    return items


def list_recruitments(scope: str | None = None, hero_id: str | None = None) -> list[dict[str, Any]]:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    sql = "SELECT hero_id, payload FROM recruitments WHERE 1=1"
    params: list[Any] = []
    if scope:
        sql += " AND scope = ?"
        params.append(scope)
    if hero_id:
        sql += " AND hero_id = ?"
        params.append(hero_id)
    sql += " ORDER BY updated_at DESC"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    items = []
    for r in rows:
        item = json.loads(r["payload"])
        if r["hero_id"] and not item.get("hero_id"):
            item["hero_id"] = r["hero_id"]
        items.append(item)
    return items


def resolve_user_hero_id(user_id: str = DEFAULT_USER_ID) -> str | None:
    """当前用户对应的已认证英雄 ID；无认证则返回 None。"""
    status = get_hero_apply_status(user_id)
    if status.get("status") != "approved":
        return None
    app = status.get("application") or {}
    hero_id = app.get("hero_id")
    if hero_id:
        return str(hero_id)
    # 旧演示：仅 app_state 标记已认证、无申请单时，回落到种子英雄
    return "1"


def list_my_recruitments(tab: str, user_id: str = DEFAULT_USER_ID) -> list[dict[str, Any]]:
    hero_id = resolve_user_hero_id(user_id)
    if not hero_id:
        return []
    items = list_recruitments(scope=f"mine_{tab}", hero_id=hero_id)
    # 兼容历史数据：scope 正确但 hero_id 列为空、payload 也无 hero_id 的种子项，仅归属演示英雄 "1"
    if hero_id == "1":
        orphans = [
            i
            for i in list_recruitments(scope=f"mine_{tab}")
            if not i.get("hero_id")
        ]
        seen = {i.get("recruit_id") for i in items}
        for item in orphans:
            rid = item.get("recruit_id")
            if rid and rid not in seen:
                item = {**item, "hero_id": "1"}
                items.append(item)
    # 演示兜底：当前英雄尚无「我的招募」时，回落展示种子演示数据（hero_id=1）
    if not items and str(hero_id) != "1":
        demo = list_recruitments(scope=f"mine_{tab}", hero_id="1")
        if not demo:
            demo = [
                i
                for i in list_recruitments(scope=f"mine_{tab}")
                if not i.get("hero_id") or str(i.get("hero_id")) == "1"
            ]
        items = [{**i, "hero_id": hero_id} for i in demo]
    return sort_mine_recruitments(items, tab)


def get_recruitment(recruit_id: str) -> dict[str, Any] | None:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    row = conn.execute("SELECT payload FROM recruitments WHERE recruit_id = ?", (recruit_id,)).fetchone()
    conn.close()
    return json.loads(row["payload"]) if row else None


def upsert_recruitment(item: dict[str, Any], scope: str = "public") -> dict[str, Any]:
    rid = item["recruit_id"]
    ts = _now()
    conn = connect()
    init_schema(conn)
    conn.execute(
        "INSERT OR REPLACE INTO recruitments (recruit_id, hero_id, scope, payload, updated_at) VALUES (?, ?, ?, ?, ?)",
        (rid, item.get("hero_id"), scope, json.dumps(item, ensure_ascii=False), ts),
    )
    conn.commit()
    conn.close()
    return item


def delete_recruitment(recruit_id: str) -> bool:
    conn = connect()
    cur = conn.execute("DELETE FROM recruitments WHERE recruit_id = ?", (recruit_id,))
    conn.commit()
    deleted = cur.rowcount > 0
    conn.close()
    return deleted


def get_course(course_id: str) -> dict[str, Any] | None:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    row = conn.execute("SELECT payload FROM courses WHERE course_id = ?", (course_id,)).fetchone()
    conn.close()
    return json.loads(row["payload"]) if row else None


def list_courses() -> list[dict[str, Any]]:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    rows = conn.execute("SELECT payload FROM courses ORDER BY course_id").fetchall()
    conn.close()
    return [json.loads(r["payload"]) for r in rows]


def upsert_course(course_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    ts = _now()
    item = {**payload, "course_id": course_id}
    conn = connect()
    init_schema(conn)
    conn.execute(
        "INSERT OR REPLACE INTO courses (course_id, payload, updated_at) VALUES (?, ?, ?)",
        (course_id, json.dumps(item, ensure_ascii=False), ts),
    )
    conn.commit()
    conn.close()
    return item


def get_app_state(key: str) -> Any:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    row = conn.execute("SELECT payload FROM app_state WHERE key = ?", (key,)).fetchone()
    conn.close()
    return json.loads(row["payload"]) if row else None


def set_app_state(key: str, value: Any) -> Any:
    ts = _now()
    conn = connect()
    init_schema(conn)
    conn.execute(
        "INSERT OR REPLACE INTO app_state (key, payload, updated_at) VALUES (?, ?, ?)",
        (key, json.dumps(value, ensure_ascii=False), ts),
    )
    conn.commit()
    conn.close()
    return value


def _application_row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    payload = json.loads(row["payload"])
    return {
        "application_id": row["application_id"],
        "user_id": row["user_id"],
        "status": row["status"],
        "reject_reason": row["reject_reason"],
        "hero_id": row["hero_id"],
        "submitted_at": row["submitted_at"],
        "reviewed_at": row["reviewed_at"],
        **payload,
    }


def _latest_application(conn: sqlite3.Connection, user_id: str) -> sqlite3.Row | None:
    return conn.execute(
        """
        SELECT * FROM hero_applications
        WHERE user_id = ?
        ORDER BY submitted_at DESC
        LIMIT 1
        """,
        (user_id,),
    ).fetchone()


def submit_hero_application(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    ts = _now()
    conn = connect()
    init_schema(conn)
    latest = _latest_application(conn, user_id)
    if latest and latest["status"] == "pending":
        conn.close()
        raise ValueError("application_pending")
    if latest and latest["status"] == "approved":
        conn.close()
        raise ValueError("already_approved")

    app_id = f"app-{int(ts * 1000)}"
    body = {
        **payload,
        "channel": payload.get("channel") or "自主申请",
        "submitted_at": payload.get("submitted_at") or datetime.fromtimestamp(ts).isoformat(),
    }
    conn.execute(
        """
        INSERT INTO hero_applications
        (application_id, user_id, status, payload, reject_reason, hero_id, submitted_at, reviewed_at, updated_at)
        VALUES (?, ?, 'pending', ?, NULL, NULL, ?, NULL, ?)
        """,
        (app_id, user_id, json.dumps(body, ensure_ascii=False), ts, ts),
    )
    conn.commit()
    conn.close()
    set_app_state("mock_hero_role", "pending")
    set_app_state("hero_apply_form", body)
    return get_hero_application(app_id) or {}


def get_pending_profile_change(
    hero_id: str | None, conn: sqlite3.Connection | None = None
) -> dict[str, Any] | None:
    """同一英雄最多一条 pending；取最新提交。"""
    if not hero_id:
        return None
    own = conn is None
    if own:
        conn = connect()
        init_schema(conn)
    row = conn.execute(
        """
        SELECT * FROM profile_change_requests
        WHERE hero_id = ? AND status = 'pending'
        ORDER BY submitted_at DESC
        LIMIT 1
        """,
        (str(hero_id),),
    ).fetchone()
    if own:
        conn.close()
    return _profile_change_row_to_dict(row) if row else None


def has_pending_profile_change(hero_id: str | None, conn: sqlite3.Connection | None = None) -> bool:
    return get_pending_profile_change(hero_id, conn) is not None


def _apply_status_payload(
    *,
    status: str,
    application_id: str | None = None,
    reject_reason: str | None = None,
    hero_id: str | None = None,
    application: dict[str, Any] | None = None,
    pending_profile_change: dict[str, Any] | None = None,
    hero_enabled: bool = True,
    disable_reason: str | None = None,
) -> dict[str, Any]:
    return {
        "status": status,
        "application_id": application_id,
        "reject_reason": reject_reason,
        "hero_id": hero_id,
        "application": application,
        "profile_change_pending": bool(pending_profile_change),
        "pending_profile_change": pending_profile_change,
        "hero_enabled": bool(hero_enabled),
        "disable_reason": disable_reason or "",
    }


def _hero_enablement(hero_id: str | None) -> tuple[bool, str]:
    if not hero_id:
        return True, ""
    hero = get_hero(str(hero_id))
    if not hero:
        return True, ""
    enabled = hero.get("enabled") is not False
    reason = str(hero.get("disable_reason") or "").strip()
    return enabled, reason


def get_hero_apply_status(user_id: str = DEFAULT_USER_ID) -> dict[str, Any]:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    latest = _latest_application(conn, user_id)
    if latest:
        app = _application_row_to_dict(latest)
        status = app["status"]
        hero_id = app.get("hero_id")
        # 已批准但英雄记录已被删：视为未认证并回写
        if status == "approved" and hero_id:
            hero_row = conn.execute(
                "SELECT hero_id FROM heroes WHERE hero_id = ?",
                (hero_id,),
            ).fetchone()
            if not hero_row:
                conn.execute(
                    "DELETE FROM hero_applications WHERE application_id = ?",
                    (app["application_id"],),
                )
                conn.commit()
                _sync_mock_hero_role_for_user(user_id, conn)
                latest = _latest_application(conn, user_id)
                conn.close()
                if latest:
                    app2 = _application_row_to_dict(latest)
                    hid2 = app2.get("hero_id")
                    pending2 = (
                        get_pending_profile_change(hid2)
                        if app2["status"] == "approved"
                        else None
                    )
                    enabled2, disable2 = (
                        _hero_enablement(hid2) if app2["status"] == "approved" else (True, "")
                    )
                    return _apply_status_payload(
                        status=app2["status"],
                        application_id=app2["application_id"],
                        reject_reason=app2.get("reject_reason"),
                        hero_id=hid2,
                        application=app2,
                        pending_profile_change=pending2,
                        hero_enabled=enabled2,
                        disable_reason=disable2,
                    )
                return _apply_status_payload(status="none")
        pending_change = (
            get_pending_profile_change(hero_id, conn) if status == "approved" else None
        )
        conn.close()
        enabled, disable_reason = (
            _hero_enablement(hero_id) if status == "approved" else (True, "")
        )
        return _apply_status_payload(
            status=status,
            application_id=app["application_id"],
            reject_reason=app.get("reject_reason"),
            hero_id=hero_id,
            application=app,
            pending_profile_change=pending_change,
            hero_enabled=enabled,
            disable_reason=disable_reason,
        )
    conn.close()

    role = get_app_state("mock_hero_role") or "none"
    if role == "approved":
        # 预览兜底角色：英雄已被后台删除时视为未认证
        hero_id = "1"
        hero = get_hero(hero_id)
        if not hero:
            set_app_state("mock_hero_role", "")
            set_app_state("hero_apply_form", None)
            return _apply_status_payload(status="none")
        pending = get_pending_profile_change(hero_id)
        enabled, disable_reason = _hero_enablement(hero_id)
        return _apply_status_payload(
            status="approved",
            hero_id=hero_id,
            pending_profile_change=pending,
            hero_enabled=enabled,
            disable_reason=disable_reason,
        )
    if role in ("pending", "rejected"):
        return _apply_status_payload(status=role, hero_id=None)
    return _apply_status_payload(status="none")


def list_hero_applications(
    status: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> dict[str, Any]:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    sql = "SELECT * FROM hero_applications WHERE 1=1"
    params: list[Any] = []
    if status:
        sql += " AND status = ?"
        params.append(status)
    sql += " ORDER BY submitted_at DESC"
    rows = conn.execute(sql, params).fetchall()
    conn.close()

    items = [_application_row_to_dict(r) for r in rows]
    total = len(items)
    start = max(0, (page - 1) * page_size)
    end = start + page_size
    page_items = items[start:end]
    summaries = []
    for app in page_items:
        types = app.get("project_types") or []
        summaries.append(
            {
                "application_id": app["application_id"],
                "user_id": app["user_id"],
                "name": app.get("name", ""),
                "phone": app.get("phone", ""),
                "project_types": types,
                "project_types_display": "、".join(types) if types else "—",
                "city": app.get("city") or "",
                "certification": app.get("certification") or "",
                "years_exp": app.get("years_exp") or "",
                "avatar_img": app.get("avatar_img") or "",
                "channel": app.get("channel") or "自主申请",
                "reviewer": app.get("reviewer") or "",
                "status": app["status"],
                "status_label": {"pending": "待审核", "approved": "审核通过", "rejected": "审核驳回"}.get(
                    app["status"], app["status"]
                ),
                "submitted_at": app.get("submitted_at"),
                "reviewed_at": app.get("reviewed_at"),
                "reject_reason": app.get("reject_reason"),
                "hero_id": app.get("hero_id"),
            }
        )
    return {"items": summaries, "total": total, "page": page, "page_size": page_size}


def get_hero_application(application_id: str) -> dict[str, Any] | None:
    conn = connect()
    init_schema(conn)
    row = conn.execute(
        "SELECT * FROM hero_applications WHERE application_id = ?",
        (application_id,),
    ).fetchone()
    conn.close()
    return _application_row_to_dict(row) if row else None


def _hero_payload_from_application(app: dict[str, Any], hero_id: str) -> dict[str, Any]:
    types = app.get("project_types") or []
    honors_raw = app.get("honors") or ""
    honor_titles = [s.strip() for s in re.split(r"[,，、;；\n]", honors_raw) if s.strip()][:2]
    certificates = app.get("certificates") or []
    if not certificates:
        images = app.get("certification_images") or []
        if images:
            certificates = [
                {"name": f"证书{i + 1}", "image": img}
                for i, img in enumerate(images[:10])
                if img
            ]
        else:
            try:
                cert_count = max(0, int(app.get("cert_count") or 0))
            except (TypeError, ValueError):
                cert_count = 0
            if cert_count > 0:
                certificates = [
                    {"name": f"证书{i + 1}", "image": "cert.jpg"}
                    for i in range(min(10, cert_count))
                ]
    return {
        "hero_id": hero_id,
        "name": app.get("name") or app.get("nickname") or "",
        "nickname": app.get("nickname") or app.get("name") or "",
        "phone": app.get("phone", ""),
        "id_card": app.get("id_card", ""),
        "project_types": types,
        "city": app.get("city", ""),
        "address": app.get("address") or app.get("city") or "",
        "certification": app.get("certification", ""),
        "years_exp": app.get("years_exp", ""),
        "honors": honors_raw,
        "bio": app.get("bio", ""),
        "about_me": app.get("bio", ""),
        "rating": 5.0,
        "student_count": 0,
        "honors_count": len(honor_titles),
        "avatar_img": "hero-1.jpg",
        "honor_titles": honor_titles or ([app.get("certification")] if app.get("certification") else []),
        "cert_badges": [app.get("certification")] if app.get("certification") else [],
        "past_honors": [],
        "moments": [],
        "certificates": certificates,
        "application_id": app.get("application_id"),
        "enabled": True,
        "audit_status": "approved",
        "channel": app.get("channel") or "自主申请",
        "applied_at": app.get("submitted_at") or "",
    }


def approve_hero_application(application_id: str) -> dict[str, Any]:
    app = get_hero_application(application_id)
    if not app:
        raise LookupError("application_not_found")
    if app["status"] != "pending":
        raise ValueError("invalid_status")

    ts = _now()
    hero_id = f"hero-{int(ts)}"
    hero_payload = _hero_payload_from_application(app, hero_id)

    conn = connect()
    init_schema(conn)
    conn.execute(
        "INSERT OR REPLACE INTO heroes (hero_id, payload, updated_at) VALUES (?, ?, ?)",
        (hero_id, json.dumps(hero_payload, ensure_ascii=False), ts),
    )
    conn.execute(
        """
        UPDATE hero_applications
        SET status = 'approved', hero_id = ?, reviewed_at = ?, updated_at = ?
        WHERE application_id = ?
        """,
        (hero_id, ts, ts, application_id),
    )
    conn.commit()
    conn.close()

    set_app_state("mock_hero_role", "approved")
    return get_hero_application(application_id) or {}


def reject_hero_application(application_id: str, reason: str = "") -> dict[str, Any]:
    app = get_hero_application(application_id)
    if not app:
        raise LookupError("application_not_found")
    if app["status"] != "pending":
        raise ValueError("invalid_status")

    ts = _now()
    conn = connect()
    init_schema(conn)
    conn.execute(
        """
        UPDATE hero_applications
        SET status = 'rejected', reject_reason = ?, reviewed_at = ?, updated_at = ?
        WHERE application_id = ?
        """,
        (reason or "未通过审核", ts, ts, application_id),
    )
    conn.commit()
    conn.close()

    set_app_state("mock_hero_role", "rejected")
    return get_hero_application(application_id) or {}


def _sync_mock_hero_role_for_user(user_id: str, conn: sqlite3.Connection | None = None) -> None:
    """按该用户最新申请回写 mock_hero_role；无申请则未认证。"""
    own = conn is None
    if own:
        conn = connect()
        init_schema(conn)
    latest = _latest_application(conn, user_id)
    if own:
        conn.close()
    if latest:
        st = latest["status"]
        if st in ("approved", "pending", "rejected"):
            set_app_state("mock_hero_role", st)
        else:
            set_app_state("mock_hero_role", "none")
        return
    set_app_state("mock_hero_role", "")
    set_app_state("hero_apply_form", None)


def withdraw_hero_application(user_id: str = DEFAULT_USER_ID) -> bool:
    conn = connect()
    init_schema(conn)
    latest = _latest_application(conn, user_id)
    if not latest or latest["status"] != "pending":
        conn.close()
        return False
    conn.execute("DELETE FROM hero_applications WHERE application_id = ?", (latest["application_id"],))
    conn.commit()
    conn.close()
    set_app_state("mock_hero_role", "")
    set_app_state("hero_apply_form", None)
    return True


def delete_hero_application(application_id: str) -> bool:
    app = get_hero_application(application_id)
    if not app:
        return False

    user_id = app.get("user_id") or DEFAULT_USER_ID
    hero_id = app.get("hero_id")

    conn = connect()
    init_schema(conn)
    if hero_id:
        conn.execute("DELETE FROM heroes WHERE hero_id = ?", (hero_id,))
    conn.execute("DELETE FROM hero_applications WHERE application_id = ?", (application_id,))
    conn.commit()
    _sync_mock_hero_role_for_user(user_id, conn)
    conn.close()
    return True


SIGNUP_STATUS_LABELS = {
    "pending": "待确认",
    "confirmed": "已确认",
    "cancelled": "已取消",
    "refunded": "已退款",
}

PAY_STATUS_LABELS = {
    "unpaid": "待支付",
    "paid": "已支付",
    "refunded": "已退款",
}

RECRUIT_STATUS_LABELS = {
    "recruiting": "招募中",
    "enrolling": "报名中",
    "ongoing": "进行中",
    "full": "已满员",
    "ended": "已结束",
    "cancelled": "已取消",
}


def _signup_row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    payload = json.loads(row["payload"])
    status = row["status"]
    pay_status = row["pay_status"]
    return {
        "signup_id": row["signup_id"],
        "status": status,
        "pay_status": pay_status,
        "status_label": SIGNUP_STATUS_LABELS.get(status, status),
        "pay_status_label": PAY_STATUS_LABELS.get(pay_status, pay_status),
        **payload,
    }


def _resolve_recruit_admin_status(item: dict[str, Any]) -> str:
    raw = item.get("displayStatus") or item.get("status") or "recruiting"
    if raw in ("cancelled", "ended", "full", "draft"):
        return raw
    signed = int(item.get("signed") or 0)
    total = int(item.get("total") or 0)
    if total > 0 and signed >= total:
        return "full"
    now = _now()
    end_at = item.get("end_at")
    if end_at:
        try:
            if datetime.fromisoformat(end_at).timestamp() < now:
                return "ended"
        except (ValueError, TypeError):
            pass
    return raw


def recruit_admin_view(item: dict[str, Any]) -> dict[str, Any]:
    status = _resolve_recruit_admin_status(item)
    signed = int(item.get("signed") or 0)
    total = int(item.get("total") or 0)
    return {
        **item,
        "admin_status": status,
        "admin_status_label": RECRUIT_STATUS_LABELS.get(status, status),
        "signup_summary": f"{signed}/{total} 人" if total else f"{signed} 人",
    }


def list_admin_signups(
    *,
    status: str | None = None,
    pay_status: str | None = None,
    q: str | None = None,
) -> list[dict[str, Any]]:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    sql = "SELECT * FROM signups WHERE 1=1"
    params: list[Any] = []
    if status:
        sql += " AND status = ?"
        params.append(status)
    if pay_status:
        sql += " AND pay_status = ?"
        params.append(pay_status)
    sql += " ORDER BY updated_at DESC"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    items = [_enrich_signup_dict(_signup_row_to_dict(r)) for r in rows]
    if q:
        needle = q.strip().lower()
        items = [
            item
            for item in items
            if needle in (item.get("name") or "").lower() or needle in (item.get("phone") or "")
        ]
    return items


def get_signup(signup_id: str) -> dict[str, Any] | None:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    row = conn.execute("SELECT * FROM signups WHERE signup_id = ?", (signup_id,)).fetchone()
    conn.close()
    return _enrich_signup_dict(_signup_row_to_dict(row)) if row else None


def cancel_signup(signup_id: str) -> dict[str, Any] | None:
    item = get_signup(signup_id)
    if not item:
        return None
    ts = _now()
    payload = {k: v for k, v in item.items() if k not in ("signup_id", "status", "pay_status", "status_label", "pay_status_label")}
    payload["signup_status"] = "已取消"
    conn = connect()
    conn.execute(
        "UPDATE signups SET status = ?, payload = ?, updated_at = ? WHERE signup_id = ?",
        ("cancelled", json.dumps(payload, ensure_ascii=False), ts, signup_id),
    )
    conn.commit()
    conn.close()
    return get_signup(signup_id)


def list_admin_recruitments(*, status: str | None = None, q: str | None = None) -> list[dict[str, Any]]:
    items = [recruit_admin_view(i) for i in list_recruitments(scope="public")]
    if status:
        items = [i for i in items if i["admin_status"] == status]
    if q:
        needle = q.strip().lower()
        items = [i for i in items if needle in (i.get("title") or "").lower()]
    return items


def list_recruitment_signups(recruit_id: str) -> list[dict[str, Any]]:
    items = list_admin_signups()
    return [s for s in items if s.get("recruit_id") == recruit_id or s.get("course_id") == recruit_id]


def close_recruitment(recruit_id: str) -> dict[str, Any] | None:
    item = get_recruitment(recruit_id)
    if not item:
        return None
    item["status"] = "cancelled"
    item["displayStatus"] = "cancelled"
    upsert_recruitment(item, scope="public")
    conn = connect()
    row = conn.execute(
        "SELECT scope FROM recruitments WHERE recruit_id = ? AND scope != 'public'",
        (recruit_id,),
    ).fetchall()
    conn.close()
    for r in row:
        mine = get_recruitment(recruit_id)
        if mine:
            mine["status"] = "cancelled"
            mine["displayStatus"] = "cancelled"
            upsert_recruitment(mine, scope=r["scope"])
    return recruit_admin_view(item)


def list_admin_heroes(*, q: str | None = None) -> list[dict[str, Any]]:
    items = []
    for hero in list_heroes():
        hero_id = hero.get("hero_id") or hero.get("id")
        enabled = hero.get("enabled")
        if enabled is None:
            enabled = True
        cert = (
            hero.get("certification")
            or hero.get("certification_level")
            or ((hero.get("cert_badges") or [None])[0])
            or ((hero.get("honor_titles") or [None])[0])
            or ""
        )
        audit = hero.get("audit_status") or "approved"
        channel = hero.get("channel")
        if channel is None:
            channel = "" if audit == "pending" else "后台创建"
        reviewer = hero.get("reviewer")
        if reviewer is None:
            reviewer = "" if audit == "pending" else "小李"
        entry = {
            "hero_id": hero_id,
            "supplier_id": hero.get("supplier_id") or "",
            "name": hero.get("name"),
            "avatar_img": hero.get("avatar_img"),
            "rating": hero.get("rating"),
            "years_exp": hero.get("years_exp"),
            "student_count": hero.get("student_count"),
            "project_types": hero.get("project_types") or [],
            "project_types_display": "、".join(hero.get("project_types") or []),
            "honor_titles": hero.get("honor_titles") or [],
            "city": hero.get("city") or hero.get("location") or "",
            "certification": cert,
            "bio": hero.get("bio") or hero.get("about_me") or "",
            "phone": hero.get("phone") or "",
            "enabled": bool(enabled),
            "status_label": "启用" if enabled else "禁用",
            "audit_status": audit,
            "audit_status_label": {"pending": "待审核", "approved": "审核通过", "rejected": "审核驳回"}.get(
                audit, "审核通过"
            ),
            "reviewer": reviewer if reviewer is not None else "",
            "reviewed_at": hero.get("reviewed_at") or "",
            "channel": channel,
            "applied_at": hero.get("applied_at") or hero.get("created_at") or "",
            "application_id": hero.get("application_id") or "",
        }
        items.append(entry)
    if q:
        needle = q.strip().lower()
        items = [
            h
            for h in items
            if needle in (h.get("name") or "").lower()
            or needle in (h.get("phone") or "").lower()
            or needle in str(h.get("supplier_id") or h.get("hero_id") or "").lower()
        ]
    return items


def set_hero_enabled(
    hero_id: str, enabled: bool, reason: str | None = None
) -> dict[str, Any] | None:
    hero = get_hero(hero_id)
    if not hero:
        return None
    patch: dict[str, Any] = {"enabled": bool(enabled)}
    if enabled:
        patch["disable_reason"] = ""
    else:
        text = (reason or "").strip()
        if not text:
            raise ValueError("disable_reason_required")
        patch["disable_reason"] = text
    return update_hero(hero_id, patch)


def withdraw_profile_change(hero_id: str) -> bool:
    """C 端撤回资料变更待审：删除该英雄唯一 pending 记录。"""
    item = get_pending_profile_change(hero_id)
    if not item:
        return False
    change_id = item.get("change_id")
    if not change_id:
        return False
    conn = connect()
    init_schema(conn)
    cur = conn.execute(
        "DELETE FROM profile_change_requests WHERE change_id = ? AND status = 'pending'",
        (change_id,),
    )
    conn.commit()
    deleted = cur.rowcount > 0
    conn.close()
    return deleted


def delete_hero(hero_id: str) -> bool:
    """删除供方；连带删除关联入驻申请，并回写小程序认证状态为未认证（无其余申请时）。"""
    conn = connect()
    init_schema(conn)
    row = conn.execute("SELECT hero_id FROM heroes WHERE hero_id = ?", (hero_id,)).fetchone()
    app_rows = conn.execute(
        "SELECT application_id, user_id FROM hero_applications WHERE hero_id = ?",
        (hero_id,),
    ).fetchall()
    if not row and not app_rows:
        conn.close()
        return False

    user_ids = {str(r["user_id"] or DEFAULT_USER_ID) for r in app_rows}
    # M1 预览默认用户：删除已入驻供方后也需同步认证态
    user_ids.add(DEFAULT_USER_ID)

    conn.execute("DELETE FROM hero_applications WHERE hero_id = ?", (hero_id,))
    if row:
        conn.execute("DELETE FROM heroes WHERE hero_id = ?", (hero_id,))
    conn.commit()

    for uid in user_ids:
        _sync_mock_hero_role_for_user(uid, conn)
    conn.close()
    # 再读一次：无申请时强制未认证，避免预览 mock 残留 approved
    for uid in user_ids:
        _sync_mock_hero_role_for_user(uid)
    return True


# ---------- Signups (frontend + admin) ----------

FRONTEND_SIGNUP_STATUS = {
    "pending": "待确认",
    "confirmed": "已报名",
    "cancelled": "已取消",
    "refunded": "已退款",
    "checked_in": "已签到",
    "completed": "已完成",
}

FRONTEND_PAY_STATUS = {
    "unpaid": "待支付",
    "paid": "已支付",
    "refunded": "已退款",
}


def _normalize_signup_status(raw: str | None) -> str:
    if not raw:
        return "confirmed"
    mapping = {
        "已报名": "confirmed",
        "已确认": "confirmed",
        "待确认": "pending",
        "已取消": "cancelled",
        "已退款": "refunded",
        "已签到": "checked_in",
        "已完成": "completed",
        "pending": "pending",
        "confirmed": "confirmed",
        "cancelled": "cancelled",
        "refunded": "refunded",
        "checked_in": "checked_in",
        "completed": "completed",
    }
    return mapping.get(raw, raw if raw in mapping.values() else "confirmed")


def _normalize_pay_status(raw: str | None) -> str:
    if not raw:
        return "unpaid"
    mapping = {
        "待支付": "unpaid",
        "已支付": "paid",
        "已退款": "refunded",
        "unpaid": "unpaid",
        "paid": "paid",
        "refunded": "refunded",
    }
    return mapping.get(raw, "unpaid")


def _enrich_signup_dict(item: dict[str, Any]) -> dict[str, Any]:
    status = item.get("status") or "confirmed"
    pay_status = item.get("pay_status") or "unpaid"
    signup_type = item.get("type") or ("course" if item.get("course_id") else "event")
    type_label = item.get("type_label") or ("课程" if signup_type == "course" else "赛事")
    return {
        **item,
        "id": item.get("signup_id") or item.get("id"),
        "signup_id": item.get("signup_id") or item.get("id"),
        "status": status,
        "pay_status": pay_status,
        "status_label": SIGNUP_STATUS_LABELS.get(status) or FRONTEND_SIGNUP_STATUS.get(status, status),
        "pay_status_label": PAY_STATUS_LABELS.get(pay_status) or FRONTEND_PAY_STATUS.get(pay_status, pay_status),
        "signup_status": FRONTEND_SIGNUP_STATUS.get(status, item.get("signup_status") or status),
        "payStatus": FRONTEND_PAY_STATUS.get(pay_status, item.get("payStatus") or pay_status),
        "type": signup_type,
        "type_label": type_label,
        "user_id": item.get("user_id") or DEFAULT_USER_ID,
    }


def create_signup(body: dict[str, Any]) -> dict[str, Any]:
    ts = _now()
    sid = body.get("signup_id") or body.get("id") or f"su-{int(ts * 1000)}"
    status = _normalize_signup_status(body.get("status") or body.get("signup_status"))
    pay_status = _normalize_pay_status(body.get("pay_status") or body.get("payStatus"))
    signup_type = body.get("type") or ("course" if body.get("course_id") else "event")
    payload = {
        **body,
        "signup_id": sid,
        "user_id": body.get("user_id") or DEFAULT_USER_ID,
        "type": signup_type,
        "type_label": body.get("type_label") or ("课程" if signup_type == "course" else "赛事"),
        "created_at": body.get("created_at") or datetime.fromtimestamp(ts).isoformat(timespec="seconds"),
        "checked_in": bool(body.get("checked_in")),
        "name": body.get("name") or "本地用户",
        "phone": body.get("phone") or "",
    }
    # bump recruit/course signed count
    recruit_id = payload.get("recruit_id")
    course_id = payload.get("course_id")
    if recruit_id:
        rec = get_recruitment(recruit_id)
        if rec:
            rec["signed"] = int(rec.get("signed") or 0) + 1
            # keep existing scope rows in sync via public + mine scopes
            conn = connect()
            rows = conn.execute(
                "SELECT scope FROM recruitments WHERE recruit_id = ?", (recruit_id,)
            ).fetchall()
            conn.close()
            scopes = [r["scope"] for r in rows] or ["public"]
            for scope in scopes:
                upsert_recruitment({**rec, "recruit_id": recruit_id}, scope=scope)
            payload.setdefault("title", rec.get("title"))
            payload.setdefault("location", rec.get("location"))
            payload.setdefault("fee", rec.get("fee"))
            payload.setdefault("start_at", rec.get("start_at"))
            payload.setdefault("end_at", rec.get("end_at"))
            payload.setdefault("hero_id", rec.get("hero_id"))
    if course_id:
        course = get_course(course_id)
        if course:
            course["signed"] = int(course.get("signed") or 0) + 1
            upsert_course(course_id, course)
            payload.setdefault("title", course.get("title"))
            payload.setdefault("location", course.get("location"))
            payload.setdefault("fee", course.get("price") or course.get("fee"))
            payload.setdefault("start_at", course.get("start_at"))
            payload.setdefault("end_at", course.get("end_at"))
            payload.setdefault("hero_id", course.get("hero_id"))

    conn = connect()
    init_schema(conn)
    conn.execute(
        "INSERT OR REPLACE INTO signups (signup_id, status, pay_status, payload, updated_at) VALUES (?, ?, ?, ?, ?)",
        (sid, status, pay_status, json.dumps(payload, ensure_ascii=False), ts),
    )
    conn.commit()
    conn.close()
    return _enrich_signup_dict({**payload, "status": status, "pay_status": pay_status})


def update_signup(signup_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
    item = get_signup(signup_id)
    if not item:
        return None
    status = _normalize_signup_status(patch.get("status") or patch.get("signup_status") or item.get("status"))
    pay_status = _normalize_pay_status(patch.get("pay_status") or patch.get("payStatus") or item.get("pay_status"))
    payload = {
        k: v
        for k, v in {**item, **patch}.items()
        if k not in ("status_label", "pay_status_label", "signup_status", "payStatus")
    }
    payload["signup_id"] = signup_id
    if "checked_in" in patch:
        payload["checked_in"] = bool(patch["checked_in"])
        if payload["checked_in"]:
            payload["checkin_at"] = patch.get("checkin_at") or datetime.now().isoformat(timespec="seconds")
            status = "checked_in"
    ts = _now()
    conn = connect()
    conn.execute(
        "UPDATE signups SET status = ?, pay_status = ?, payload = ?, updated_at = ? WHERE signup_id = ?",
        (status, pay_status, json.dumps(payload, ensure_ascii=False), ts, signup_id),
    )
    conn.commit()
    conn.close()
    return get_signup(signup_id)


def checkin_signup(signup_id: str) -> dict[str, Any] | None:
    return update_signup(signup_id, {"checked_in": True, "status": "checked_in"})


def list_signups(
    *,
    user_id: str | None = None,
    recruit_id: str | None = None,
    course_id: str | None = None,
    hero_id: str | None = None,
) -> list[dict[str, Any]]:
    items = [_enrich_signup_dict(s) for s in list_admin_signups()]
    if user_id:
        items = [i for i in items if (i.get("user_id") or DEFAULT_USER_ID) == user_id]
    if recruit_id:
        items = [i for i in items if i.get("recruit_id") == recruit_id]
    if course_id:
        items = [i for i in items if i.get("course_id") == course_id]
    if hero_id:
        items = [i for i in items if str(i.get("hero_id") or "") == str(hero_id)]
    return items


def list_my_signups(user_id: str = DEFAULT_USER_ID) -> list[dict[str, Any]]:
    return list_signups(user_id=user_id)


def list_courses_by_hero(hero_id: str | None = None) -> list[dict[str, Any]]:
    items = list_courses()
    if hero_id:
        items = [c for c in items if str(c.get("hero_id") or "") == str(hero_id)]
    return items


def list_hero_students(hero_id: str) -> list[dict[str, Any]]:
    """Aggregate students from signups for a hero's recruitments/courses."""
    hero_recruit_ids = {
        r.get("recruit_id") for r in list_recruitments() if str(r.get("hero_id") or "") == str(hero_id)
    }
    hero_course_ids = {
        c.get("course_id") or c.get("id")
        for c in list_courses()
        if str(c.get("hero_id") or "") == str(hero_id)
    }
    buckets: dict[str, dict[str, Any]] = {}
    for s in list_admin_signups():
        if s.get("status") == "cancelled":
            continue
        rid = s.get("recruit_id")
        cid = s.get("course_id")
        if rid not in hero_recruit_ids and cid not in hero_course_ids and str(s.get("hero_id") or "") != str(hero_id):
            continue
        key = s.get("user_id") or s.get("phone") or s.get("name") or s.get("signup_id")
        entry = buckets.get(key) or {
            "id": key,
            "nickname": s.get("name") or "学员",
            "avatar": s.get("avatar") or "",
            "phone": s.get("phone") or "",
            "course_count": 0,
            "last_active": s.get("created_at") or "",
        }
        entry["course_count"] += 1
        if (s.get("created_at") or "") > (entry.get("last_active") or ""):
            entry["last_active"] = s.get("created_at") or entry["last_active"]
        buckets[key] = entry
    return sorted(buckets.values(), key=lambda x: x.get("last_active") or "", reverse=True)


# ---------- Reviews ----------

REVIEW_STATUS_LABELS = {
    "visible": "正常",
    "hidden": "已隐藏",
    "deleted": "已删除",
}


def _review_row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    payload = json.loads(row["payload"])
    status = row["status"]
    return {
        **payload,
        "review_id": row["review_id"],
        "id": row["review_id"],
        "hero_id": row["hero_id"],
        "user_id": row["user_id"],
        "status": status,
        "status_label": REVIEW_STATUS_LABELS.get(status, status),
        "score": float(row["score"]),
    }


def list_reviews(
    *,
    hero_id: str | None = None,
    user_id: str | None = None,
    status: str | None = None,
    q: str | None = None,
    include_hidden: bool = False,
) -> list[dict[str, Any]]:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    sql = "SELECT * FROM reviews WHERE 1=1"
    params: list[Any] = []
    if hero_id:
        sql += " AND hero_id = ?"
        params.append(hero_id)
    if user_id:
        sql += " AND user_id = ?"
        params.append(user_id)
    if status:
        sql += " AND status = ?"
        params.append(status)
    elif not include_hidden:
        sql += " AND status = 'visible'"
    sql += " ORDER BY updated_at DESC"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    items = [_review_row_to_dict(r) for r in rows]
    if q:
        needle = q.strip().lower()
        items = [
            i
            for i in items
            if needle in (i.get("content") or "").lower()
            or needle in (i.get("reviewer_nickname") or "").lower()
            or needle in (i.get("title") or "").lower()
        ]
    return items


def list_my_account_reviews(
    user_id: str = DEFAULT_USER_ID,
    *,
    include_hidden: bool = False,
) -> list[dict[str, Any]]:
    """当前账号相关评价：我发出的，或作为认证供方收到的（与后台评价列表同源）。"""
    hero_id = resolve_user_hero_id(user_id)
    items = list_reviews(include_hidden=include_hidden)
    uid = str(user_id or "")
    hid = str(hero_id or "") if hero_id else ""
    result: list[dict[str, Any]] = []
    for item in items:
        status = item.get("status") or "visible"
        if status == "deleted":
            continue
        if str(item.get("user_id") or "") == uid:
            result.append(item)
            continue
        if hid and str(item.get("hero_id") or "") == hid:
            result.append(item)
    return result


def create_review(body: dict[str, Any]) -> dict[str, Any]:
    ts = _now()
    rid = body.get("review_id") or body.get("id") or f"rv-{int(ts * 1000)}"
    score = float(body.get("score") or 5)
    payload = {
        **body,
        "review_id": rid,
        "hero_id": body.get("hero_id"),
        "user_id": body.get("user_id") or DEFAULT_USER_ID,
        "score": score,
        "status": body.get("status") or "visible",
        "reviewed_at": body.get("reviewed_at") or datetime.fromtimestamp(ts).isoformat(timespec="seconds"),
        "reviewer_nickname": body.get("reviewer_nickname") or body.get("nickname") or "本地用户",
        "reviewer_avatar": body.get("reviewer_avatar") or "",
        "content": body.get("content") or "",
        "title": body.get("title") or "",
        "scene": body.get("scene") or body.get("type") or "赛事",
    }
    conn = connect()
    init_schema(conn)
    conn.execute(
        "INSERT OR REPLACE INTO reviews (review_id, hero_id, user_id, status, score, payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            rid,
            payload.get("hero_id"),
            payload.get("user_id"),
            payload["status"],
            score,
            json.dumps(payload, ensure_ascii=False),
            ts,
        ),
    )
    conn.commit()
    conn.close()
    return payload


def set_review_status(review_id: str, status: str) -> dict[str, Any] | None:
    conn = connect()
    init_schema(conn)
    row = conn.execute("SELECT * FROM reviews WHERE review_id = ?", (review_id,)).fetchone()
    if not row:
        conn.close()
        return None
    payload = json.loads(row["payload"])
    payload["status"] = status
    ts = _now()
    conn.execute(
        "UPDATE reviews SET status = ?, payload = ?, updated_at = ? WHERE review_id = ?",
        (status, json.dumps(payload, ensure_ascii=False), ts, review_id),
    )
    conn.commit()
    conn.close()
    items = list_reviews(include_hidden=True)
    for item in items:
        if item["review_id"] == review_id:
            return item
    return None


# ---------- Users ----------

USER_STATUS_LABELS = {"active": "正常", "disabled": "已禁用"}


def _user_row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    payload = json.loads(row["payload"])
    status = row["status"]
    return {
        **payload,
        "user_id": row["user_id"],
        "status": status,
        "status_label": USER_STATUS_LABELS.get(status, status),
    }


def list_users(*, q: str | None = None, status: str | None = None) -> list[dict[str, Any]]:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    sql = "SELECT * FROM users WHERE 1=1"
    params: list[Any] = []
    if status:
        sql += " AND status = ?"
        params.append(status)
    sql += " ORDER BY updated_at DESC"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    items = [_user_row_to_dict(r) for r in rows]
    # attach signup counts
    all_signups = list_admin_signups()
    for item in items:
        uid = item["user_id"]
        phone = item.get("phone") or ""
        count = sum(
            1
            for s in all_signups
            if s.get("user_id") == uid or (phone and s.get("phone") == phone)
        )
        item["signup_count"] = count
    if q:
        needle = q.strip().lower()
        items = [
            i
            for i in items
            if needle in (i.get("nickname") or "").lower()
            or needle in (i.get("phone") or "")
            or needle in (i.get("name") or "").lower()
        ]
    return items


def set_user_status(user_id: str, status: str) -> dict[str, Any] | None:
    conn = connect()
    init_schema(conn)
    row = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
    if not row:
        conn.close()
        return None
    payload = json.loads(row["payload"])
    payload["status"] = status
    ts = _now()
    conn.execute(
        "UPDATE users SET status = ?, payload = ?, updated_at = ? WHERE user_id = ?",
        (status, json.dumps(payload, ensure_ascii=False), ts, user_id),
    )
    conn.commit()
    conn.close()
    for item in list_users():
        if item["user_id"] == user_id:
            return item
    return None


def ensure_default_user() -> None:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    row = conn.execute("SELECT user_id FROM users WHERE user_id = ?", (DEFAULT_USER_ID,)).fetchone()
    if not row:
        ts = _now()
        payload = {
            "user_id": DEFAULT_USER_ID,
            "nickname": "本地用户",
            "name": "本地用户",
            "phone": "13800000000",
            "status": "active",
            "registered_at": datetime.fromtimestamp(ts).isoformat(timespec="seconds"),
            "hero_id": None,
        }
        conn.execute(
            "INSERT INTO users (user_id, status, payload, updated_at) VALUES (?, ?, ?, ?)",
            (DEFAULT_USER_ID, "active", json.dumps(payload, ensure_ascii=False), ts),
        )
        conn.commit()
    conn.close()


# ---------- Profile change requests ----------

PROFILE_CHANGE_STATUS_LABELS = {
    "pending": "待审核",
    "approved": "已通过",
    "rejected": "已驳回",
}


def _profile_change_row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    payload = json.loads(row["payload"])
    status = row["status"]
    return {
        **payload,
        "change_id": row["change_id"],
        "hero_id": row["hero_id"],
        "status": status,
        "status_label": PROFILE_CHANGE_STATUS_LABELS.get(status, status),
        "reject_reason": row["reject_reason"],
        "submitted_at": row["submitted_at"],
        "reviewed_at": row["reviewed_at"],
    }


def submit_profile_change(hero_id: str, patch: dict[str, Any], change_type: str = "profile") -> dict[str, Any]:
    """提交资料变更。同一英雄仅保留一条 pending：再次提交时覆盖 after。"""
    hero = get_hero(hero_id)
    if not hero:
        raise LookupError("hero_not_found")
    ts = _now()
    before = {k: hero.get(k) for k in patch.keys()}
    submitted_at = datetime.fromtimestamp(ts).isoformat(timespec="seconds")
    change_type_label = {"profile": "资料变更", "honors": "荣誉变更", "certs": "证书变更"}.get(
        change_type, change_type
    )

    conn = connect()
    init_schema(conn)
    existing = conn.execute(
        """
        SELECT change_id FROM profile_change_requests
        WHERE hero_id = ? AND status = 'pending'
        ORDER BY submitted_at DESC
        LIMIT 1
        """,
        (str(hero_id),),
    ).fetchone()

    if existing:
        change_id = existing["change_id"]
        payload = {
            "change_id": change_id,
            "hero_id": hero_id,
            "hero_name": hero.get("name"),
            "change_type": change_type,
            "change_type_label": change_type_label,
            "before": before,
            "after": patch,
            "submitted_at": submitted_at,
            "status": "pending",
        }
        conn.execute(
            """
            UPDATE profile_change_requests
            SET payload = ?, reject_reason = NULL, submitted_at = ?, reviewed_at = NULL, updated_at = ?
            WHERE change_id = ?
            """,
            (json.dumps(payload, ensure_ascii=False), ts, ts, change_id),
        )
    else:
        change_id = f"pc-{int(ts * 1000)}"
        payload = {
            "change_id": change_id,
            "hero_id": hero_id,
            "hero_name": hero.get("name"),
            "change_type": change_type,
            "change_type_label": change_type_label,
            "before": before,
            "after": patch,
            "submitted_at": submitted_at,
            "status": "pending",
        }
        conn.execute(
            """
            INSERT INTO profile_change_requests
            (change_id, hero_id, status, payload, reject_reason, submitted_at, reviewed_at, updated_at)
            VALUES (?, ?, 'pending', ?, NULL, ?, NULL, ?)
            """,
            (change_id, hero_id, json.dumps(payload, ensure_ascii=False), ts, ts),
        )
    conn.commit()
    conn.close()
    return get_profile_change(change_id) or payload


def list_profile_changes(*, status: str | None = None) -> list[dict[str, Any]]:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    sql = "SELECT * FROM profile_change_requests WHERE 1=1"
    params: list[Any] = []
    if status:
        sql += " AND status = ?"
        params.append(status)
    sql += " ORDER BY submitted_at DESC"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [_profile_change_row_to_dict(r) for r in rows]


def get_profile_change(change_id: str) -> dict[str, Any] | None:
    conn = connect()
    init_schema(conn)
    row = conn.execute(
        "SELECT * FROM profile_change_requests WHERE change_id = ?", (change_id,)
    ).fetchone()
    conn.close()
    return _profile_change_row_to_dict(row) if row else None


def delete_profile_changes(change_ids: list[str]) -> int:
    """后台批量删除资料变更记录，返回实际删除条数。"""
    ids = [str(x).strip() for x in (change_ids or []) if str(x).strip()]
    if not ids:
        return 0
    conn = connect()
    init_schema(conn)
    placeholders = ",".join("?" for _ in ids)
    cur = conn.execute(
        f"DELETE FROM profile_change_requests WHERE change_id IN ({placeholders})",
        ids,
    )
    deleted = cur.rowcount if cur.rowcount is not None and cur.rowcount >= 0 else 0
    conn.commit()
    conn.close()
    return int(deleted)


def approve_profile_change(change_id: str) -> dict[str, Any]:
    item = get_profile_change(change_id)
    if not item:
        raise LookupError("change_not_found")
    if item["status"] != "pending":
        raise ValueError("invalid_status")
    after = item.get("after") or {}
    update_hero(item["hero_id"], after)
    ts = _now()
    payload = {**item, "status": "approved"}
    conn = connect()
    conn.execute(
        """
        UPDATE profile_change_requests
        SET status = 'approved', payload = ?, reviewed_at = ?, updated_at = ?
        WHERE change_id = ?
        """,
        (json.dumps(payload, ensure_ascii=False), ts, ts, change_id),
    )
    conn.commit()
    conn.close()
    return get_profile_change(change_id) or payload


def reject_profile_change(change_id: str, reason: str = "") -> dict[str, Any]:
    item = get_profile_change(change_id)
    if not item:
        raise LookupError("change_not_found")
    if item["status"] != "pending":
        raise ValueError("invalid_status")
    ts = _now()
    payload = {**item, "status": "rejected", "reject_reason": reason or "未通过审核"}
    conn = connect()
    conn.execute(
        """
        UPDATE profile_change_requests
        SET status = 'rejected', reject_reason = ?, payload = ?, reviewed_at = ?, updated_at = ?
        WHERE change_id = ?
        """,
        (reason or "未通过审核", json.dumps(payload, ensure_ascii=False), ts, ts, change_id),
    )
    conn.commit()
    conn.close()
    return get_profile_change(change_id) or payload


# ---------- Settings ----------

DEFAULT_SETTINGS: dict[str, Any] = {
    "scenarios": [
        {"id": "water", "name": "水上运动", "code": "water", "status": "active"},
        {"id": "hotel", "name": "酒店预订", "code": "hotel", "status": "active"},
        {"id": "venue", "name": "场地预约", "code": "venue", "status": "disabled"},
    ],
    "copy": {"hero": "英雄", "recruitment": "招募", "signup": "报名"},
    "features": {
        "hero_apply": True,
        "rating": True,
        "certificates": True,
        "online_pay": False,
        "geolocation": False,
    },
}


def get_settings() -> dict[str, Any]:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    rows = conn.execute("SELECT key, payload FROM settings").fetchall()
    conn.close()
    if not rows:
        return dict(DEFAULT_SETTINGS)
    result = dict(DEFAULT_SETTINGS)
    for row in rows:
        result[row["key"]] = json.loads(row["payload"])
    return result


def update_settings(patch: dict[str, Any]) -> dict[str, Any]:
    current = get_settings()
    merged = {**current, **patch}
    ts = _now()
    conn = connect()
    init_schema(conn)
    for key, value in merged.items():
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, payload, updated_at) VALUES (?, ?, ?)",
            (key, json.dumps(value, ensure_ascii=False), ts),
        )
    conn.commit()
    conn.close()
    return get_settings()


# ---------- Dashboard ----------

def get_admin_dashboard() -> dict[str, Any]:
    heroes = list_heroes()
    recruitments = [recruit_admin_view(i) for i in list_recruitments(scope="public")]
    active_recruits = [
        r for r in recruitments if r.get("admin_status") in ("recruiting", "enrolling", "ongoing", "full")
    ]
    apps = list_hero_applications(status="pending")
    signups = list_admin_signups()
    now = datetime.now()
    month_prefix = f"{now.year}-{now.month:02d}"
    month_signups = [s for s in signups if str(s.get("created_at") or "").startswith(month_prefix)]
    pending_signups = [s for s in signups if s.get("status") == "pending"]
    reviews = list_reviews(include_hidden=True)
    profile_pending = list_profile_changes(status="pending")

    activities: list[dict[str, Any]] = []
    for app in list_hero_applications()["items"][:20]:
        if app["status"] in ("approved", "rejected"):
            activities.append(
                {
                    "type": "hero_review",
                    "text": f"英雄认证「{app.get('name') or '申请人'}」{app.get('status_label')}",
                    "time": app.get("submitted_at"),
                }
            )
    for r in recruitments[:10]:
        activities.append(
            {
                "type": "recruitment",
                "text": f"赛事「{r.get('title') or '未命名'}」状态：{r.get('admin_status_label')}",
                "time": r.get("start_at") or r.get("created_at"),
            }
        )
    for s in signups[:10]:
        activities.append(
            {
                "type": "signup",
                "text": f"{s.get('name') or '用户'} 报名「{s.get('title') or ''}」",
                "time": s.get("created_at"),
            }
        )
    for rv in reviews[:10]:
        activities.append(
            {
                "type": "review",
                "text": f"{rv.get('reviewer_nickname') or '用户'} 评价 {rv.get('score')} 星",
                "time": rv.get("reviewed_at"),
            }
        )
    activities.sort(key=lambda x: str(x.get("time") or ""), reverse=True)

    return {
        "stats": {
            "heroes": len(heroes),
            "active_recruitments": len(active_recruits),
            "month_signups": len(month_signups),
            "pending_applications": apps.get("total", 0),
            "pending_signups": len(pending_signups),
            "pending_profile_changes": len(profile_pending),
            "reviews": len([r for r in reviews if r.get("status") == "visible"]),
        },
        "activities": activities[:20],
    }


def migrate_legacy_app_state() -> dict[str, int]:
    """One-shot: move my_signups / my_courses / my_reviews from app_state into tables."""
    migrated = {"signups": 0, "courses": 0, "reviews": 0}
    legacy_signups = get_app_state("my_signups") or []
    if isinstance(legacy_signups, list):
        existing_ids = {s.get("signup_id") for s in list_admin_signups()}
        for item in legacy_signups:
            sid = item.get("signup_id") or item.get("id")
            if sid and sid in existing_ids:
                continue
            create_signup(
                {
                    **item,
                    "user_id": item.get("user_id") or DEFAULT_USER_ID,
                    "status": item.get("status") or "confirmed",
                    "pay_status": item.get("pay_status") or item.get("payStatus") or "unpaid",
                }
            )
            migrated["signups"] += 1
        if legacy_signups:
            set_app_state("my_signups", [])

    legacy_courses = get_app_state("my_courses") or []
    if isinstance(legacy_courses, list):
        existing = {c.get("course_id") for c in list_courses()}
        for item in legacy_courses:
            cid = item.get("course_id") or item.get("id")
            if not cid or cid in existing:
                continue
            upsert_course(cid, item)
            migrated["courses"] += 1
        if legacy_courses:
            set_app_state("my_courses", [])

    for key, hero_id in (("my_reviews", None), ("hero_ratings", "1")):
        legacy = get_app_state(key) or []
        if not isinstance(legacy, list) or not legacy:
            continue
        for item in legacy:
            create_review(
                {
                    **item,
                    "hero_id": item.get("hero_id") or hero_id or "1",
                    "user_id": item.get("user_id") or DEFAULT_USER_ID,
                }
            )
            migrated["reviews"] += 1
        set_app_state(key, [])

    ensure_default_user()
    return migrated
