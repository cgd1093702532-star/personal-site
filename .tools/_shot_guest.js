
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto("http://127.0.0.1:8765/miniprogram/profile.html?guest=1&t=1784001004.081883", { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#profile-root', { timeout: 20000 });
  await page.waitForTimeout(900);
  await page.addStyleTag({ content: `
    .preview-doc-aside { display: none !important; }
    body.has-preview-doc .device.device--with-doc { justify-content: center !important; padding: 32px !important; }
    body { background: #2a2a30 !important; }
  `});
  const text = await page.locator('#profile-root').innerText();
  if (!text.includes('授权登录')) {
    console.error('guest UI missing', text.slice(0, 200));
    process.exit(2);
  }
  await page.locator('.device__frame').screenshot({ path: "/Users/xml/Desktop/\u82f1\u96c4\u5e7f\u573a/docs/miniprogram/pages/images/profile/state-guest.png", type: 'png' });
  console.log('saved', "/Users/xml/Desktop/\u82f1\u96c4\u5e7f\u573a/docs/miniprogram/pages/images/profile/state-guest.png");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
