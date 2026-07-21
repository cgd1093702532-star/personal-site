#!/usr/bin/env python3
"""截取个人中心未登录 + 五种身份预览图（含「修改资料」审核中角标），写入 docs 配图目录，并尽量恢复原状态。"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from server import db  # noqa: E402

OUT_DIR = ROOT / "docs" / "miniprogram" / "pages" / "images" / "profile"
PREVIEW_URL = "http://127.0.0.1:8765/miniprogram/profile.html"
USER_ID = db.DEFAULT_USER_ID


def row_dict(row) -> dict:
    return {k: row[k] for k in row.keys()}


def backup_state():
    conn = db.connect()
    db.init_schema(conn)
    apps = [
        row_dict(r)
        for r in conn.execute(
            "SELECT * FROM hero_applications WHERE user_id = ?", (USER_ID,)
        ).fetchall()
    ]
    hero_ids = {a.get("hero_id") for a in apps if a.get("hero_id")}
    heroes = []
    for hid in hero_ids:
        row = conn.execute("SELECT * FROM heroes WHERE hero_id = ?", (hid,)).fetchone()
        if row:
            heroes.append(row_dict(row))
    profile_changes = [
        row_dict(r) for r in conn.execute("SELECT * FROM profile_change_requests").fetchall()
    ]
    role = conn.execute(
        "SELECT payload FROM app_state WHERE key = 'mock_hero_role'"
    ).fetchone()
    conn.close()
    return {
        "apps": apps,
        "heroes": heroes,
        "profile_changes": profile_changes,
        "mock_hero_role": json.loads(role["payload"]) if role else None,
    }


def restore_state(snap):
    conn = db.connect()
    db.init_schema(conn)
    conn.execute("DELETE FROM hero_applications WHERE user_id = ?", (USER_ID,))
    conn.execute("DELETE FROM profile_change_requests")
    for h in snap["heroes"]:
        conn.execute(
            "INSERT OR REPLACE INTO heroes (hero_id, payload, updated_at) VALUES (?, ?, ?)",
            (h["hero_id"], h["payload"], h["updated_at"]),
        )
    for a in snap["apps"]:
        conn.execute(
            """
            INSERT OR REPLACE INTO hero_applications
            (application_id, user_id, status, payload, reject_reason, hero_id,
             submitted_at, reviewed_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                a["application_id"],
                a["user_id"],
                a["status"],
                a["payload"],
                a["reject_reason"],
                a["hero_id"],
                a["submitted_at"],
                a["reviewed_at"],
                a["updated_at"],
            ),
        )
    for pc in snap.get("profile_changes") or []:
        conn.execute(
            """
            INSERT OR REPLACE INTO profile_change_requests
            (change_id, hero_id, status, payload, reject_reason, submitted_at, reviewed_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                pc["change_id"],
                pc["hero_id"],
                pc["status"],
                pc["payload"],
                pc["reject_reason"],
                pc["submitted_at"],
                pc["reviewed_at"],
                pc["updated_at"],
            ),
        )
    conn.commit()
    conn.close()
    db.set_app_state(
        "mock_hero_role",
        "" if snap["mock_hero_role"] is None else snap["mock_hero_role"],
    )


def ensure_base_approved_app():
    status = db.get_hero_apply_status(USER_ID)
    if status.get("status") == "approved" and status.get("hero_id") and status.get("application_id"):
        return status["application_id"], str(status["hero_id"])

    conn = db.connect()
    db.init_schema(conn)
    latest = db._latest_application(conn, USER_ID)
    ts = db._now()
    if latest:
        app_id = latest["application_id"]
        hero_id = latest["hero_id"] or f"hero-shot-{int(ts)}"
        payload = json.loads(latest["payload"])
    else:
        app_id = f"app-shot-{int(ts)}"
        hero_id = f"hero-shot-{int(ts)}"
        payload = {
            "nickname": "航海用户",
            "name": "航海用户",
            "phone": "13800138000",
            "id_card": "110101199001011234",
            "project_types": ["帆船"],
            "certification": "国家级教练",
            "years_exp": "5-10年",
            "bio": "截图用示例资料",
            "channel": "自主申请",
        }
        conn.execute(
            """
            INSERT INTO hero_applications
            (application_id, user_id, status, payload, reject_reason, hero_id,
             submitted_at, reviewed_at, updated_at)
            VALUES (?, ?, 'approved', ?, NULL, ?, ?, ?, ?)
            """,
            (app_id, USER_ID, json.dumps(payload, ensure_ascii=False), hero_id, ts, ts, ts),
        )

    if not db.get_hero(str(hero_id)):
        hero = {
            "hero_id": str(hero_id),
            "name": payload.get("name") or "航海用户",
            "nickname": payload.get("nickname") or "航海用户",
            "phone": payload.get("phone") or "",
            "enabled": True,
            "audit_status": "approved",
            "project_types": payload.get("project_types") or ["帆船"],
            "avatar_img": "hero-1.jpg",
            "disable_reason": "",
        }
        conn.execute(
            "INSERT OR REPLACE INTO heroes (hero_id, payload, updated_at) VALUES (?, ?, ?)",
            (str(hero_id), json.dumps(hero, ensure_ascii=False), ts),
        )

    conn.execute(
        """
        UPDATE hero_applications
        SET status = 'approved', hero_id = ?, reject_reason = NULL, reviewed_at = ?, updated_at = ?
        WHERE application_id = ?
        """,
        (str(hero_id), ts, ts, app_id),
    )
    conn.commit()
    conn.close()
    db.set_app_state("mock_hero_role", "approved")
    return app_id, str(hero_id)


def set_state(name: str, app_id: str, hero_id: str):
    conn = db.connect()
    db.init_schema(conn)
    ts = db._now()

    if name == "none":
        conn.execute("DELETE FROM hero_applications WHERE user_id = ?", (USER_ID,))
        conn.commit()
        conn.close()
        db.set_app_state("mock_hero_role", "none")
        return

    # 保证申请行存在
    row = conn.execute(
        "SELECT application_id FROM hero_applications WHERE application_id = ?",
        (app_id,),
    ).fetchone()
    if not row:
        conn.close()
        app_id, hero_id = ensure_base_approved_app()
        conn = db.connect()
        db.init_schema(conn)
        ts = db._now()

    if name == "pending":
        conn.execute(
            """
            UPDATE hero_applications
            SET status = 'pending', reject_reason = NULL, hero_id = NULL,
                reviewed_at = NULL, updated_at = ?
            WHERE application_id = ?
            """,
            (ts, app_id),
        )
        conn.commit()
        conn.close()
        db.set_app_state("mock_hero_role", "pending")
        return

    if name == "rejected":
        conn.execute(
            """
            UPDATE hero_applications
            SET status = 'rejected', reject_reason = ?, hero_id = NULL,
                reviewed_at = ?, updated_at = ?
            WHERE application_id = ?
            """,
            ("资质材料不完整，请补充证书后重新提交", ts, ts, app_id),
        )
        conn.commit()
        conn.close()
        db.set_app_state("mock_hero_role", "rejected")
        return

    conn.execute(
        """
        UPDATE hero_applications
        SET status = 'approved', reject_reason = NULL, hero_id = ?,
            reviewed_at = ?, updated_at = ?
        WHERE application_id = ?
        """,
        (hero_id, ts, ts, app_id),
    )
    hrow = conn.execute("SELECT payload FROM heroes WHERE hero_id = ?", (hero_id,)).fetchone()
    payload = json.loads(hrow["payload"]) if hrow else {"hero_id": hero_id, "name": "航海用户"}
    if name == "disabled":
        payload["enabled"] = False
        # 空原因 → 弹窗正文走兜底「您的英雄身份不可用，具体原因可联系客服处理」
        payload["disable_reason"] = ""
    else:
        payload["enabled"] = True
        payload["disable_reason"] = ""
    conn.execute(
        "INSERT OR REPLACE INTO heroes (hero_id, payload, updated_at) VALUES (?, ?, ?)",
        (hero_id, json.dumps(payload, ensure_ascii=False), ts),
    )
    conn.commit()
    conn.close()
    db.set_app_state("mock_hero_role", "approved")


def clear_profile_pending(hero_id: str):
    conn = db.connect()
    db.init_schema(conn)
    conn.execute(
        "DELETE FROM profile_change_requests WHERE hero_id = ? AND status = 'pending'",
        (str(hero_id),),
    )
    conn.commit()
    conn.close()


def ensure_profile_pending(hero_id: str):
    clear_profile_pending(hero_id)
    db.submit_profile_change(str(hero_id), {"bio": "截图用资料变更待审"}, change_type="profile")


def run_one_shot(path: Path, dialog: bool, guest: bool = False):
    qs = f"guest=1&t={time.time()}" if guest else f"t={time.time()}"
    url = f"{PREVIEW_URL}?{qs}"
    js = f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const browser = await chromium.launch({{ headless: true }});
  const page = await browser.newPage({{ viewport: {{ width: 1100, height: 1000 }}, deviceScaleFactor: 2 }});
  await page.goto({json.dumps(url)}, {{ waitUntil: 'networkidle', timeout: 60000 }});
  await page.waitForSelector('#profile-root', {{ timeout: 20000 }});
  await page.waitForTimeout(900);
  await page.addStyleTag({{ content: `
    .preview-doc-aside {{ display: none !important; }}
    body.has-preview-doc .device.device--with-doc {{ justify-content: center !important; padding: 32px !important; }}
    body {{ background: #2a2a30 !important; }}
  `}});
  if ({json.dumps(dialog)}) {{
    await page.click('#profile-apply-hero');
    await page.waitForTimeout(500);
  }}
  await page.locator('.device__frame').screenshot({{ path: {json.dumps(str(path))}, type: 'png' }});
  console.log('saved', {json.dumps(str(path))});
  await browser.close();
}})().catch((e) => {{ console.error(e); process.exit(1); }});
"""
    tmp = ROOT / ".tools" / "_shot_profile_one.js"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    tmp.write_text(js, encoding="utf-8")
    subprocess.check_call(["node", str(tmp)], cwd=str(ROOT))


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    snap = backup_state()
    try:
        print("shoot guest")
        run_one_shot(OUT_DIR / "state-guest.png", dialog=False, guest=True)

        app_id, hero_id = ensure_base_approved_app()
        sequence = [
            ("none", "state-none.png", False),
            ("pending", "state-pending.png", False),
            ("rejected", "state-rejected.png", False),
            ("rejected", "state-rejected-dialog.png", True),
            ("approved", "state-approved.png", False),
            ("approved-profile-pending", "state-approved-profile-pending.png", False),
            ("disabled", "state-disabled.png", False),
            ("disabled", "state-disabled-dialog.png", True),
        ]
        for state, filename, dialog in sequence:
            if state == "approved-profile-pending":
                set_state("approved", app_id, hero_id)
                st = db.get_hero_apply_status(USER_ID)
                if st.get("hero_id"):
                    hero_id = str(st["hero_id"])
                ensure_profile_pending(hero_id)
                st = db.get_hero_apply_status(USER_ID)
                print(
                    "shoot",
                    state,
                    "status=",
                    st.get("status"),
                    "profile_pending=",
                    st.get("profile_change_pending"),
                )
                run_one_shot(OUT_DIR / filename, dialog)
                clear_profile_pending(hero_id)
                continue

            set_state(state, app_id, hero_id)
            st = db.get_hero_apply_status(USER_ID)
            if st.get("application_id"):
                app_id = st["application_id"]
            if st.get("hero_id"):
                hero_id = str(st["hero_id"])
            print(
                "shoot",
                state,
                "status=",
                st.get("status"),
                "enabled=",
                st.get("hero_enabled"),
            )
            run_one_shot(OUT_DIR / filename, dialog)
            if state == "none":
                app_id, hero_id = ensure_base_approved_app()
        print("OK", OUT_DIR)
    finally:
        restore_state(snap)
        print("restored", db.get_hero_apply_status(USER_ID).get("status"))


if __name__ == "__main__":
    main()
