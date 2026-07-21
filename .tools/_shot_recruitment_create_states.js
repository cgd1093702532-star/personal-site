/**
 * 截取发布赛事招募各状态预览图 → docs/miniprogram/pages/images/recruitment-create/
 * 依赖本地预览 :8765
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs/miniprogram/pages/images/recruitment-create');
const BASE = 'http://127.0.0.1:8765/miniprogram/recruitment-create.html';

const HIDE_CHROME = `
  .preview-doc-aside { display: none !important; }
  .preview-page-nav { display: none !important; }
  body.has-preview-doc .device.device--with-doc { justify-content: center !important; padding: 32px !important; }
  body { background: #2a2a30 !important; }
`;

async function shotFrame(page, file) {
  const out = path.join(OUT, file);
  await page.locator('.device__frame').screenshot({ path: out, type: 'png' });
  console.log('saved', out);
}

async function openPage(page) {
  await page.goto(`${BASE}?t=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.addStyleTag({ content: HIDE_CHROME });
  await page.waitForSelector('.recruit-publish-list', { timeout: 20000 });
  await page.waitForTimeout(500);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1000 },
    deviceScaleFactor: 2,
  });

  try {
    // 1) 进行中 Tab（含「发起招募」/「招募中...」）
    await openPage(page);
    await page.waitForFunction(
      () => {
        const active = document.querySelector('.my-recruit__tab--active');
        return active && active.textContent.includes('进行中');
      },
      { timeout: 10000 },
    );
    await shotFrame(page, 'state-active.png');

    // 2) 已结束 Tab（按钮「活动已结束」）
    await page.click('.my-recruit__tab[data-tab="ended"]');
    await page.waitForFunction(
      () => {
        const active = document.querySelector('.my-recruit__tab--active');
        const btn = document.querySelector('.event-card__btn--disabled');
        return (
          active &&
          active.textContent.includes('已结束') &&
          btn &&
          btn.textContent.includes('活动已结束')
        );
      },
      { timeout: 10000 },
    );
    await page.waitForTimeout(300);
    await shotFrame(page, 'state-ended.png');

    // 3) 进行中空态
    await page.click('.my-recruit__tab[data-tab="active"]');
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const list = document.querySelector('.recruit-publish-list');
      if (list) {
        list.innerHTML =
          `<div class="recruit-publish-list__empty">` +
          `<div class="recruit-publish-list__empty-icon"><img src="../assets/icons/empty.png" alt=""></div>` +
          `<div class="recruit-publish-list__empty-title">暂无数据</div>` +
          `</div>`;
      }
      document.querySelectorAll('.my-recruit__tab').forEach((btn) => {
        const key = btn.getAttribute('data-tab');
        btn.textContent = key === 'ended' ? '已结束' : '进行中';
      });
    });
    await page.waitForFunction(
      () => (document.querySelector('.recruit-publish-list__empty-title')?.textContent || '').includes('暂无数据'),
      { timeout: 5000 },
    );
    await page.waitForTimeout(200);
    await shotFrame(page, 'state-empty.png');
  } finally {
    await browser.close();
  }

  console.log('done recruitment-create states');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
