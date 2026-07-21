const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGEERROR', err.message));
  page.on('response', (res) => {
    if (res.url().includes('preview-page-nav') || res.status() >= 400) {
      console.log('RESP', res.status(), res.url());
    }
  });
  await page.goto('http://127.0.0.1:8765/miniprogram/recruitment-detail.html?t=' + Date.now(), {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const nav = document.querySelector('.preview-page-nav');
    const device = document.querySelector('.device');
    return {
      hasNav: !!nav,
      navHtml: nav ? nav.outerHTML.slice(0, 400) : null,
      bodyClass: document.body.className,
      deviceClass: device?.className,
      linkCount: document.querySelectorAll('.preview-page-nav__link').length,
      width: window.innerWidth,
      display: nav ? getComputedStyle(nav).display : null,
      visibility: nav ? getComputedStyle(nav).visibility : null,
      widthCss: nav ? getComputedStyle(nav).width : null,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
