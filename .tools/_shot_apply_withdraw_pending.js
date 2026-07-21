/**
 * 截取：修改资料 · 有待审时底部仅「撤回审核」
 * 依赖：本地预览 8765、API 8787；调用前由 Python 设好 approved + profile pending。
 */
const { chromium } = require('playwright');
const path = require('path');

const out = path.join(
  __dirname,
  '../docs/miniprogram/pages/images/hero-apply/state-edit-pending-withdraw.png',
);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
  const url = 'http://127.0.0.1:8765/miniprogram/hero-apply.html?mode=edit&t=' + Date.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#apply-footer', { timeout: 20000 });
  await page.waitForSelector('#apply-withdraw', { timeout: 15000 });
  await page.waitForFunction(() => !document.getElementById('apply-submit'), { timeout: 5000 });
  await page.waitForTimeout(600);
  await page.addStyleTag({
    content: `
    .preview-doc-aside { display: none !important; }
    .preview-page-nav { display: none !important; }
    body.has-preview-doc .device.device--with-doc { justify-content: center !important; padding: 32px !important; }
    body { background: #2a2a30 !important; }
  `,
  });
  // 滚到底部，露出固定底栏
  await page.evaluate(() => {
    const footer = document.getElementById('apply-footer');
    footer?.scrollIntoView({ block: 'end' });
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(400);
  await page.locator('.device__frame').screenshot({ path: out, type: 'png' });
  console.log('saved', out);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
