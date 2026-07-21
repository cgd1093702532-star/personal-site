const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto('http://127.0.0.1:8765/miniprogram/profile.html?t=' + Date.now(), {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForTimeout(1200);

  // left nav: profile -> hero-apply -> recruitment-detail (teleports)
  await page.click('.preview-page-nav__link[data-html="hero-apply.html"]');
  await page.waitForTimeout(900);
  await page.click('.preview-page-nav__link[data-html="recruitment-detail.html"]');
  await page.waitForTimeout(1200);

  const before = await page.evaluate(() => {
    try {
      return JSON.parse(sessionStorage.getItem('preview-nav-stack') || '[]').map((u) =>
        u.split('/').pop(),
      );
    } catch (_) {
      return [];
    }
  });
  console.log('stack after left-nav teleports:', before);

  // phone back should go to heroes (fallback), NOT hero-apply
  await page.click('a.nav-back, a.mp-navbar__back');
  await page.waitForTimeout(1000);
  const afterUrl = await page.evaluate(() => location.pathname.split('/').pop());
  const afterStack = await page.evaluate(() => {
    try {
      return JSON.parse(sessionStorage.getItem('preview-nav-stack') || '[]').map((u) =>
        u.split('/').pop(),
      );
    } catch (_) {
      return [];
    }
  });
  console.log('after phone back url:', afterUrl, 'stack:', afterStack);

  // phone forward path: heroes -> recruitment-detail via in-phone link if any;
  // instead: from profile go to my-recruitments then click into detail via phone... 
  // simpler: navigate to heroes, click a card that goes to recruitment if available
  await page.click('.preview-page-nav__link[data-html="heroes.html"]');
  await page.waitForTimeout(1000);
  // open recruitment via PreviewNav forward (simulate phone)
  await page.evaluate(() => {
    window.PreviewNav.navigateTo('recruitment-detail.html', 'forward');
  });
  await page.waitForTimeout(1000);
  const phoneStack = await page.evaluate(() => {
    try {
      return JSON.parse(sessionStorage.getItem('preview-nav-stack') || '[]').map((u) =>
        u.split('/').pop().split('?')[0],
      );
    } catch (_) {
      return [];
    }
  });
  console.log('stack after phone forward:', phoneStack);
  await page.click('a.nav-back, a.mp-navbar__back');
  await page.waitForTimeout(1000);
  const backFromPhone = await page.evaluate(() => location.pathname.split('/').pop());
  console.log('back after phone forward:', backFromPhone);

  let ok = true;
  if (before.length !== 1 || !String(before[0]).startsWith('recruitment-detail')) {
    console.error('FAIL: left-nav should reset stack to single page');
    ok = false;
  }
  if (afterUrl !== 'heroes.html') {
    console.error('FAIL: after left-nav teleport, back should use fallback heroes.html, got', afterUrl);
    ok = false;
  }
  if (!phoneStack.includes('heroes.html') || !phoneStack.some((x) => x.startsWith('recruitment-detail'))) {
    console.error('FAIL: phone forward should keep stack');
    ok = false;
  }
  if (backFromPhone !== 'heroes.html') {
    console.error('FAIL: phone back should return to heroes, got', backFromPhone);
    ok = false;
  }
  if (!ok) process.exit(1);
  console.log('OK');
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
