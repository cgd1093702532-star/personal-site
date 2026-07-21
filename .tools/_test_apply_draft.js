const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  const url = 'http://127.0.0.1:8765/miniprogram/hero-apply.html?t=' + Date.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('[data-field="nickname"]', { timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.locator('[data-field="nickname"]').first().fill('回显昵称ABC');
  await page.locator('a.nav-back').first().click();
  await page.waitForSelector('#apply-save-edit-dialog', { timeout: 8000 });
  await page.locator('[data-save-edit-save]').click();
  await page.waitForTimeout(800);
  // re-enter
  await page.goto('http://127.0.0.1:8765/miniprogram/hero-apply.html?t=' + Date.now(), {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForSelector('[data-field="nickname"]', { timeout: 20000 });
  await page.waitForTimeout(1200);
  const val = await page.locator('[data-field="nickname"]').first().inputValue();
  console.log('nickname after reenter:', val);
  if (val !== '回显昵称ABC') {
    process.exitCode = 1;
    console.error('FAIL: draft not restored');
  } else {
    console.log('OK draft restore');
  }
  // clean: back without change should not dialog
  await page.locator('a.nav-back').first().click();
  await page.waitForTimeout(400);
  const dialog = await page.$('#apply-save-edit-dialog');
  console.log('dirty dialog after no change:', !!dialog);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
