const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outGallery = path.join(__dirname, '../preview/assets/dialog-gallery/apply-save-edit-dialog.png');
const outDoc = path.join(
  __dirname,
  '../docs/miniprogram/pages/images/hero-apply/state-save-edit-dialog.png',
);

(async () => {
  fs.mkdirSync(path.dirname(outDoc), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8765/miniprogram/hero-apply.html?t=' + Date.now(), {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForSelector('#apply-root, .apply, [data-field="nickname"]', { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.addStyleTag({
    content: `
    .preview-doc-aside { display: none !important; }
    .preview-page-nav { display: none !important; }
    body.has-preview-doc .device.device--with-doc { justify-content: center !important; padding: 32px !important; }
    body { background: #2a2a30 !important; }
  `,
  });
  const nick = page.locator('[data-field="nickname"]').first();
  await nick.waitFor({ timeout: 15000 });
  await nick.fill('草稿测试昵称');
  await page.waitForTimeout(200);
  await page.locator('.mp-navbar__back.nav-back, a.nav-back').first().click();
  await page.waitForSelector('#apply-save-edit-dialog', { timeout: 8000 });
  await page.waitForTimeout(300);
  await page.locator('.device__frame').screenshot({ path: outGallery, type: 'png' });
  await page.locator('.device__frame').screenshot({ path: outDoc, type: 'png' });
  console.log('saved', outGallery);
  console.log('saved', outDoc);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
