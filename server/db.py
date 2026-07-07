"""本地 SQLite 数据库 · 英雄广场 M1"""

from __future__ import annotations

import json
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
        """
    )
    conn.commit()


def load_seed() -> dict[str, Any]:
    if not SEED_PATH.exists():
        raise FileNotFoundError(f"缺少种子文件: {SEED_PATH}，请先运行 scripts/generate-seed.py")
    return json.loads(SEED_PATH.read_text(encoding="utf-8"))


def seed_if_empty(conn: sqlite3.Connection) -> bool:
    row = conn.execute("SELECT COUNT(*) AS c FROM heroes").fetchone()
    if row and row["c"] > 0:
        return False
    apply_seed(conn, load_seed())
    return True


def apply_seed(conn: sqlite3.Connection, seed: dict[str, Any]) -> None:
    ts = _now()
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

    conn.commit()


def reset_db() -> None:
    conn = connect()
    init_schema(conn)
    apply_seed(conn, load_seed())
    conn.close()


def list_heroes() -> list[dict[str, Any]]:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    rows = conn.execute("SELECT payload FROM heroes ORDER BY hero_id").fetchall()
    conn.close()
    return [json.loads(r["payload"]) for r in rows]


def get_hero(hero_id: str) -> dict[str, Any] | None:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    row = conn.execute("SELECT payload FROM heroes WHERE hero_id = ?", (hero_id,)).fetchone()
    conn.close()
    return json.loads(row["payload"]) if row else None


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
    sql = "SELECT payload FROM recruitments WHERE 1=1"
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
    return [json.loads(r["payload"]) for r in rows]


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
    body = {**payload, "submitted_at": payload.get("submitted_at") or datetime.fromtimestamp(ts).isoformat()}
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


def get_hero_apply_status(user_id: str = DEFAULT_USER_ID) -> dict[str, Any]:
    conn = connect()
    init_schema(conn)
    seed_if_empty(conn)
    latest = _latest_application(conn, user_id)
    conn.close()

    if latest:
        app = _application_row_to_dict(latest)
        return {
            "status": app["status"],
            "application_id": app["application_id"],
            "reject_reason": app.get("reject_reason"),
            "application": app,
        }

    role = get_app_state("mock_hero_role") or "none"
    if role in ("approved", "pending", "rejected"):
        return {"status": role, "application_id": None, "reject_reason": None, "application": None}
    return {"status": "none", "application_id": None, "reject_reason": None, "application": None}


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
                "status": app["status"],
                "status_label": {"pending": "待审核", "approved": "已通过", "rejected": "已驳回"}.get(
                    app["status"], app["status"]
                ),
                "submitted_at": app.get("submitted_at"),
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
    return {
        "hero_id": hero_id,
        "name": app.get("name", ""),
        "phone": app.get("phone", ""),
        "project_types": types,
        "city": app.get("city", ""),
        "certification": app.get("certification", ""),
        "years_exp": app.get("years_exp", ""),
        "honors": app.get("honors", ""),
        "bio": app.get("bio", ""),
        "about_me": app.get("bio", ""),
        "rating": 5.0,
        "student_count": 0,
        "honors_count": 0,
        "avatar_img": "hero-1.jpg",
        "honor_titles": [],
        "cert_badges": [app.get("certification")] if app.get("certification") else [],
        "past_honors": [],
        "moments": [],
        "certificates": [],
        "application_id": app.get("application_id"),
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

    set_app_state("mock_hero_role", "none")
    return get_hero_application(application_id) or {}


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
