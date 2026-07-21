const { chromium } = require('playwright');
const path = require('path');
const out = path.join(__dirname, '../docs/miniprogram/pages/images/signup-list/state-empty.png');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
  const url =
    'http://127.0.0.1:8765/miniprogram/signup-list.html?title=' +
    encodeURIComponent('周末帆船体验营') +
    '&signed=0&t=' +
    Date.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.signup-member__empty-title', { timeout: 20000 });
  await page.waitForTimeout(500);
  await page.addStyleTag({
    content: `
    .preview-doc-aside { display: none !important; }
    .preview-page-nav { display: none !important; }
    body.has-preview-doc .device.device--with-doc { justify-content: center !important; padding: 32px !important; }
    body { background: #2a2a30 !important; }
  `,
  });
  await page.waitForFunction(() => {
    const t = document.querySelector('.signup-member__empty-title');
    return t && t.textContent.includes('暂无报名人员');
  }, { timeout: 10000 });
  await page.locator('.device__frame').screenshot({ path: out, type: 'png' });
  console.log('saved', out);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
