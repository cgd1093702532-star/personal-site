const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  await page.goto('http://127.0.0.1:8765/miniprogram/hero-apply.html?t=' + Date.now(), {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForSelector('[data-field="nickname"]', { timeout: 20000 });
  await page.waitForTimeout(1200);
  // clear mistaken keys + new draft key so first-enter is blank
  await page.evaluate(async () => {
    localStorage.removeItem('hero_plaza_hero_apply_form');
    localStorage.removeItem('hero_plaza_hero_apply_local_draft');
    if (window.HeroPlazaDB?.setAppState) {
      try {
        await window.HeroPlazaDB.setAppState('hero_apply_local_draft', null);
      } catch (_) {}
    }
  });
  await page.goto('http://127.0.0.1:8765/miniprogram/hero-apply.html?t=' + Date.now(), {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForSelector('[data-field="nickname"]', { timeout: 20000 });
  await page.waitForTimeout(1200);
  const nick = await page.locator('[data-field="nickname"]').first().inputValue();
  const name = await page.locator('[data-field="name"]').first().inputValue();
  console.log('first enter nickname:', JSON.stringify(nick), 'name:', JSON.stringify(name));
  // save draft then reenter
  await page.locator('[data-field="nickname"]').first().fill('主动保存草稿');
  await page.locator('a.nav-back').first().click();
  await page.waitForSelector('#apply-save-edit-dialog');
  await page.locator('[data-save-edit-save]').click();
  await page.waitForTimeout(600);
  await page.goto('http://127.0.0.1:8765/miniprogram/hero-apply.html?t=' + Date.now(), {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForSelector('[data-field="nickname"]', { timeout: 20000 });
  await page.waitForTimeout(1200);
  const nick2 = await page.locator('[data-field="nickname"]').first().inputValue();
  console.log('after save&exit nickname:', JSON.stringify(nick2));
  if (nick !== '' || nick2 !== '主动保存草稿') {
    console.error('FAIL');
    process.exit(1);
  }
  console.log('OK');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
