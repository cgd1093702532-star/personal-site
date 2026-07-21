/** 截取订单综合评分底部弹层 → dialog-gallery */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join('/Users/xml/Desktop/英雄广场', 'preview/assets/dialog-gallery');
const BASE = 'http://127.0.0.1:8765/miniprogram';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1000 },
    deviceScaleFactor: 2,
  });

  await page.goto(`${BASE}/order-detail.html?id=o2&rate=1&t=${Date.now()}`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForSelector('.order-rate-sheet:not(.is-hidden)', { timeout: 20000 });
  await page.waitForTimeout(400);
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
  const dest = path.join(OUT, 'order-rate-sheet.png');
  await page.locator('.device__frame').screenshot({ path: dest, type: 'png' });
  console.log('saved', dest);
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
