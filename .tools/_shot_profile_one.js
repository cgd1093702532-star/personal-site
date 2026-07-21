
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto("http://127.0.0.1:8765/miniprogram/profile.html?t=1784535711.032594", { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#profile-root', { timeout: 20000 });
  await page.waitForTimeout(900);
  await page.addStyleTag({ content: `
    .preview-doc-aside { display: none !important; }
    body.has-preview-doc .device.device--with-doc { justify-content: center !important; padding: 32px !important; }
    body { background: #2a2a30 !important; }
  `});
  if (true) {
    await page.click('#profile-apply-hero');
    await page.waitForTimeout(500);
  }
  await page.locator('.device__frame').screenshot({ path: "/Users/xml/Desktop/\u82f1\u96c4\u5e7f\u573a/docs/miniprogram/pages/images/profile/state-disabled-dialog.png", type: 'png' });
  console.log('saved', "/Users/xml/Desktop/\u82f1\u96c4\u5e7f\u573a/docs/miniprogram/pages/images/profile/state-disabled-dialog.png");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
