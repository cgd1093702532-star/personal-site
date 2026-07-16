const { chromium } = require('playwright');
const path = require('path');
const out = path.join(__dirname, '../docs/miniprogram/pages/images/heroes/state-search-empty.png');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8765/miniprogram/heroes.html?t=' + Date.now(), { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#hero-search', { timeout: 20000 });
  await page.waitForTimeout(600);
  await page.addStyleTag({ content: `
    .preview-doc-aside { display: none !important; }
    body.has-preview-doc .device.device--with-doc { justify-content: center !important; padding: 32px !important; }
    body { background: #2a2a30 !important; }
    #hero-keyboard { display: none !important; }
    .mobile-shell--keyboard { padding-bottom: 0 !important; }
  `});
  await page.evaluate(() => {
    const input = document.getElementById('hero-search');
    input.value = 'zzzz无此教练';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => {
    const empty = document.getElementById('hero-empty');
    const title = empty && empty.querySelector('.heroes-empty-state__title');
    return empty && empty.style.display !== 'none' && title && title.textContent.includes('未找到');
  }, { timeout: 10000 });
  await page.waitForTimeout(300);
  await page.locator('.device__frame').screenshot({ path: out, type: 'png' });
  console.log('saved', out);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
