/** 截取：综合评分弹层 + 待评价详情 + 已评价详情 → docs 配图 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/xml/Desktop/英雄广场';
const BASE = 'http://127.0.0.1:8765/miniprogram';
const OUT_ORDERS = path.join(ROOT, 'docs/miniprogram/pages/images/my-orders');
const OUT_DETAIL = path.join(ROOT, 'docs/miniprogram/pages/images/order-detail');

async function hideChrome(page) {
  await page.addStyleTag({
    content: `
      .preview-doc-aside, .preview-page-nav, .preview-dialog-gallery { display: none !important; }
      body.has-preview-doc .device.device--with-doc,
      body.has-preview-page-nav .device {
        justify-content: center !important;
        padding: 32px !important;
      }
      body { background: #2a2a30 !important; }
    `,
  });
}

async function shotFrame(page, dest) {
  await page.locator('.device__frame').screenshot({ path: dest, type: 'png' });
  console.log('saved', dest);
}

(async () => {
  fs.mkdirSync(OUT_ORDERS, { recursive: true });
  fs.mkdirSync(OUT_DETAIL, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1000 },
    deviceScaleFactor: 2,
  });

  // 清除 o2 评分缓存，保证待评价态干净
  await page.goto(`${BASE}/order-detail.html?id=o2&t=${Date.now()}`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.evaluate(() => {
    try {
      sessionStorage.removeItem('order-rate-score:o2');
      sessionStorage.removeItem('order-detail-open-rate');
    } catch (e) {
      /* ignore */
    }
  });

  // 1) 待评价页（无弹层）
  await page.goto(`${BASE}/order-detail.html?id=o2&t=${Date.now()}`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForSelector('.order-detail__status', { timeout: 20000 });
  await page.waitForTimeout(400);
  await hideChrome(page);
  const pending = path.join(OUT_DETAIL, 'state-pending-rate.png');
  await shotFrame(page, pending);
  fs.copyFileSync(pending, path.join(OUT_ORDERS, 'state-pending-rate.png'));

  // 2) 评分对话框（选 4 星）
  await page.goto(`${BASE}/order-detail.html?id=o2&rate=1&t=${Date.now()}`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForSelector('.order-rate-sheet:not(.is-hidden)', { timeout: 20000 });
  await page.waitForTimeout(450);
  await page.locator('.order-rate-sheet__star[data-star="4"]').click();
  await page.waitForTimeout(200);
  await hideChrome(page);
  const rateSheet = path.join(OUT_ORDERS, 'state-rate-sheet.png');
  await shotFrame(page, rateSheet);
  fs.copyFileSync(rateSheet, path.join(OUT_DETAIL, 'state-rate-sheet.png'));

  // 3) 已评价页（o3）
  await page.goto(`${BASE}/order-detail.html?id=o3&t=${Date.now()}`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForSelector('.order-detail__rating', { timeout: 20000 });
  await page.waitForTimeout(400);
  await hideChrome(page);
  const rated = path.join(OUT_DETAIL, 'state-rated.png');
  await shotFrame(page, rated);
  fs.copyFileSync(rated, path.join(OUT_ORDERS, 'state-rated.png'));

  await browser.close();
  console.log('order rate docs shots done');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
