const { chromium } = require('playwright');
const path = require('path');
const out = path.join(__dirname, '../docs/miniprogram/pages/images/heroes/state-plaza-empty.png');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8765/miniprogram/heroes.html?t=' + Date.now(), { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#hero-empty', { state: 'attached', timeout: 20000 });
  await page.waitForTimeout(600);
  await page.addStyleTag({ content: `
    .preview-doc-aside { display: none !important; }
    body.has-preview-doc .device.device--with-doc { justify-content: center !important; padding: 32px !important; }
    body { background: #2a2a30 !important; }
    #hero-keyboard { display: none !important; }
    .mobile-shell--keyboard { padding-bottom: 0 !important; }
  `});
  await page.evaluate(() => {
    const list = document.getElementById('hero-list');
    const empty = document.getElementById('hero-empty');
    const input = document.getElementById('hero-search');
    const clearBtn = document.getElementById('hero-search-clear');
    const status = document.getElementById('hero-search-status');
    if (input) input.value = '';
    if (clearBtn) clearBtn.hidden = true;
    if (status) { status.style.display = 'none'; status.textContent = ''; }
    if (list) { list.innerHTML = ''; list.style.display = 'none'; }
    if (empty) {
      empty.style.display = 'flex';
      const title = empty.querySelector('.heroes-empty-state__title');
      const hint = empty.querySelector('.heroes-empty-state__hint');
      const iconImg = empty.querySelector('.heroes-empty-state__icon img');
      if (title) title.textContent = '广场暂无数据';
      if (hint) { hint.style.display = 'none'; hint.textContent = ''; }
      if (iconImg) iconImg.src = '../assets/icons/empty.png';
    }
    const banner = document.getElementById('heroes-banner');
    if (banner) {
      banner.hidden = true;
      banner.style.display = 'none';
    }
  });
  await page.waitForFunction(() => {
    const empty = document.getElementById('hero-empty');
    const title = empty && empty.querySelector('.heroes-empty-state__title');
    const banner = document.getElementById('heroes-banner');
    const bannerHidden = !banner || banner.hidden || getComputedStyle(banner).display === 'none';
    return (
      empty &&
      getComputedStyle(empty).display !== 'none' &&
      title &&
      title.textContent.includes('广场暂无数据') &&
      bannerHidden
    );
  }, { timeout: 10000 });
  await page.waitForTimeout(300);
  await page.locator('.device__frame').screenshot({ path: out, type: 'png' });
  console.log('saved', out);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
