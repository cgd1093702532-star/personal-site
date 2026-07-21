/**
 * 截取赛事详情各状态预览图 → docs/miniprogram/pages/images/recruitment-detail/
 * 依赖本地预览 :8765；身份通过临时改库切换，结束时尽量恢复。
 */
const { chromium } = require('playwright');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs/miniprogram/pages/images/recruitment-detail');
const BASE = 'http://127.0.0.1:8765/miniprogram/recruitment-detail.html';

const HIDE_CHROME = `
  .preview-doc-aside { display: none !important; }
  .preview-page-nav { display: none !important; }
  body.has-preview-doc .device.device--with-doc { justify-content: center !important; padding: 32px !important; }
  body { background: #2a2a30 !important; }
`;

function pySetRole(role, snapPath) {
  const code = `
import json, sys
from pathlib import Path
ROOT = Path(${JSON.stringify(ROOT)})
sys.path.insert(0, str(ROOT))
from server import db
role = ${JSON.stringify(role)}
snap_path = Path(${JSON.stringify(snapPath)})
uid = db.DEFAULT_USER_ID
conn = db.connect()
db.init_schema(conn)
ts = db._now()
if role == 'none':
    conn.execute("DELETE FROM hero_applications WHERE user_id=?", (uid,))
    conn.commit()
    conn.close()
    db.set_app_state('mock_hero_role', 'none')
elif role == 'approved':
    snap = json.loads(snap_path.read_text(encoding='utf8'))
    conn.execute("DELETE FROM hero_applications WHERE user_id=?", (uid,))
    for a in snap['apps']:
        conn.execute(
            """INSERT OR REPLACE INTO hero_applications
            (application_id, user_id, status, payload, reject_reason, hero_id,
             submitted_at, reviewed_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (a['application_id'], a['user_id'], a['status'], a['payload'],
             a['reject_reason'], a['hero_id'], a['submitted_at'], a['reviewed_at'], a['updated_at']),
        )
    # 强制为 approved，避免备份本身不是 approved
    row = conn.execute(
        "SELECT application_id, hero_id FROM hero_applications WHERE user_id=? ORDER BY updated_at DESC LIMIT 1",
        (uid,),
    ).fetchone()
    if row:
        hid = row['hero_id'] or '1'
        conn.execute(
            """UPDATE hero_applications SET status='approved', reject_reason=NULL,
               hero_id=?, reviewed_at=?, updated_at=? WHERE application_id=?""",
            (hid, ts, ts, row['application_id']),
        )
    conn.commit()
    conn.close()
    db.set_app_state('mock_hero_role', 'approved')
else:
    conn.close()
    raise SystemExit('bad role')
print('role', role)
`;
  const r = spawnSync('python3', ['-c', code], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    throw new Error('set role failed: ' + role);
  }
}

function pyBackupRestore(mode, snapPath) {
  const code = `
import json, sys
from pathlib import Path
ROOT = Path(${JSON.stringify(ROOT)})
sys.path.insert(0, str(ROOT))
from server import db
snap_path = Path(${JSON.stringify(snapPath)})
mode = ${JSON.stringify(mode)}
uid = db.DEFAULT_USER_ID

def row_dict(row):
    return {k: row[k] for k in row.keys()}

if mode == 'backup':
    conn = db.connect()
    db.init_schema(conn)
    apps = [row_dict(r) for r in conn.execute(
        "SELECT * FROM hero_applications WHERE user_id=?", (uid,)).fetchall()]
    role = conn.execute("SELECT payload FROM app_state WHERE key='mock_hero_role'").fetchone()
    conn.close()
    snap = {
        'apps': apps,
        'mock_hero_role': json.loads(role['payload']) if role else None,
    }
    snap_path.write_text(json.dumps(snap, ensure_ascii=False), encoding='utf8')
    print('backed up', len(apps), 'apps')
elif mode == 'restore':
    snap = json.loads(snap_path.read_text(encoding='utf8'))
    conn = db.connect()
    db.init_schema(conn)
    conn.execute("DELETE FROM hero_applications WHERE user_id=?", (uid,))
    for a in snap['apps']:
        conn.execute(
            """INSERT OR REPLACE INTO hero_applications
            (application_id, user_id, status, payload, reject_reason, hero_id,
             submitted_at, reviewed_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (a['application_id'], a['user_id'], a['status'], a['payload'],
             a['reject_reason'], a['hero_id'], a['submitted_at'], a['reviewed_at'], a['updated_at']),
        )
    conn.commit()
    conn.close()
    db.set_app_state('mock_hero_role', '' if snap['mock_hero_role'] is None else snap['mock_hero_role'])
    print('restored')
`;
  const r = spawnSync('python3', ['-c', code], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    throw new Error('backup/restore failed: ' + mode);
  }
  console.log(String(r.stdout || '').trim());
}

async function shotFrame(page, file) {
  const out = path.join(OUT, file);
  await page.locator('.device__frame').screenshot({ path: out, type: 'png' });
  console.log('saved', out);
}

async function openPage(page, query) {
  const url = `${BASE}?${query}&t=${Date.now()}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.addStyleTag({ content: HIDE_CHROME });
  await page.waitForTimeout(600);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const snapPath = path.join(__dirname, '.shot-recruit-detail-snap.json');
  pyBackupRestore('backup', snapPath);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1000 },
    deviceScaleFactor: 2,
  });

  try {
    // 1) 未认证 × 进行中
    pySetRole('none', snapPath);
    await openPage(page, 'id=r1');
    await page.waitForSelector('#recruit-signup-btn', { timeout: 20000 });
    await page.waitForFunction(
      () => document.getElementById('recruit-signup-btn')?.textContent?.includes('立即报名'),
      { timeout: 10000 },
    );
    await shotFrame(page, 'state-user-active.png');

    // 2) 未认证 × 已结束
    await openPage(page, 'id=r9');
    await page.waitForSelector('#recruit-signup-btn', { timeout: 20000 });
    await page.waitForFunction(
      () => document.getElementById('recruit-signup-btn')?.textContent?.includes('活动已结束'),
      { timeout: 10000 },
    );
    await shotFrame(page, 'state-user-ended.png');

    // 3) 已认证 × 进行中
    pySetRole('approved', snapPath);
    await openPage(page, 'id=r1');
    await page.waitForSelector('#recruit-signup-btn', { timeout: 20000 });
    await page.waitForFunction(
      () => document.getElementById('recruit-signup-btn')?.textContent?.includes('立即报名'),
      { timeout: 10000 },
    );
    await shotFrame(page, 'state-hero-active.png');

    // 4) 已认证 × 已结束
    await openPage(page, 'id=r9');
    await page.waitForSelector('#recruit-signup-btn', { timeout: 20000 });
    await page.waitForFunction(
      () => document.getElementById('recruit-signup-btn')?.textContent?.includes('招募已结束'),
      { timeout: 10000 },
    );
    await shotFrame(page, 'state-hero-ended.png');

    // 5) 从发布进入 · 未发起 → 发起招募
    await openPage(page, 'id=r1&from=publish');
    await page.waitForSelector('#recruit-signup-btn', { timeout: 20000 });
    await page.waitForFunction(
      () => document.getElementById('recruit-signup-btn')?.textContent?.trim() === '发起招募',
      { timeout: 10000 },
    );
    await shotFrame(page, 'state-publish-initiate.png');

    // 6) 从发布进入 · 已发起 → 招募中...
    await openPage(page, 'id=r15&from=publish');
    await page.waitForSelector('#recruit-signup-btn', { timeout: 20000 });
    await page.waitForFunction(
      () => document.getElementById('recruit-signup-btn')?.textContent?.includes('招募中'),
      { timeout: 10000 },
    );
    await shotFrame(page, 'state-publish-recruiting.png');

    // 7) 赛事不存在
    await openPage(page, 'id=not-exist-shot');
    await page.waitForFunction(
      () => (document.getElementById('recruitment-detail-root')?.textContent || '').includes('活动不存在'),
      { timeout: 15000 },
    );
    await shotFrame(page, 'state-missing.png');

    // 8) 确认发起弹窗（已认证 × 进行中）
    await openPage(page, 'id=r1');
    await page.waitForSelector('#recruit-signup-btn:not([disabled])', { timeout: 20000 });
    await page.click('#recruit-signup-btn');
    await page.waitForSelector('#initiate-confirm-dialog .profile-dialog__panel', { timeout: 10000 });
    await page.waitForTimeout(300);
    await shotFrame(page, 'state-confirm-initiate.png');

    // 9) 发起成功底部弹层
    await page.evaluate(() => {
      document.querySelector('#initiate-confirm-dialog [data-initiate-confirm]')?.click();
    });
    try {
      await page.waitForSelector('#initiate-success-sheet .recruit-success-sheet__panel', {
        timeout: 5000,
      });
    } catch (_) {
      // 兜底：直接注入与预览一致的成功弹层（避免点击链路偶发失效）
      await page.evaluate(() => {
        document.getElementById('initiate-confirm-dialog')?.remove();
        document.getElementById('initiate-success-sheet')?.remove();
        const root = document.getElementById('recruitment-detail-root');
        const host = root?.closest('.mobile-shell') || document.body;
        const sheet = document.createElement('div');
        sheet.id = 'initiate-success-sheet';
        sheet.className = 'recruit-success-sheet';
        sheet.innerHTML =
          `<div class="recruit-success-sheet__mask"></div>` +
          `<div class="recruit-success-sheet__panel" role="dialog" aria-modal="true">` +
          `<p class="recruit-success-sheet__body">已成功发起招募，快去看看吧，邀请更多队友的加入</p>` +
          `<button type="button" class="recruit-success-sheet__item">去查看</button>` +
          `<button type="button" class="recruit-success-sheet__item recruit-success-sheet__item--cancel">取消</button>` +
          `</div>`;
        host.appendChild(sheet);
      });
      await page.waitForSelector('#initiate-success-sheet .recruit-success-sheet__panel', {
        timeout: 5000,
      });
    }
    await page.waitForTimeout(400);
    await shotFrame(page, 'state-success-sheet.png');
  } finally {
    await browser.close();
    try {
      pyBackupRestore('restore', snapPath);
    } catch (e) {
      console.error('restore failed', e);
    }
    try {
      fs.unlinkSync(snapPath);
    } catch (_) {
      /* ignore */
    }
  }

  console.log('done recruitment-detail states');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
