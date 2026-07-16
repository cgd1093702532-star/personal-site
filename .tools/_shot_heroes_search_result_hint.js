const { chromium } = require('playwright');
const path = require('path');
const out = path.join(__dirname, '../docs/miniprogram/pages/images/heroes/state-search-result-hint.png');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8765/miniprogram/heroes.html?t=' + Date.now(), { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#hero-search', { timeout: 20000 });
  await page.waitForTimeout(800);
  await page.addStyleTag({ content: `
    .preview-doc-aside { display: none !important; }
    body.has-preview-doc .device.device--with-doc { justify-content: center !important; padding: 32px !important; }
    body { background: #2a2a30 !important; }
    #hero-keyboard { display: none !important; }
    .mobile-shell--keyboard { padding-bottom: 0 !important; }
  `});
  await page.evaluate(() => {
    const input = document.getElementById('hero-search');
    input.value = '帆船';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => {
    const status = document.getElementById('hero-search-status');
    if (!status) return false;
    const text = (status.textContent || '').trim();
    const visible = getComputedStyle(status).display !== 'none';
    return visible && /^找到\s*\d+\s*位教练$/.test(text);
  }, { timeout: 15000 });
  await page.waitForTimeout(400);
  await page.locator('.device__frame').screenshot({ path: out, type: 'png' });
  console.log('saved', out);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
