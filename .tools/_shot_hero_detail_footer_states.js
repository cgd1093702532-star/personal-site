const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1000 },
    deviceScaleFactor: 2,
  });

  await page.goto(
    `http://127.0.0.1:8765/miniprogram/hero-detail.html?id=1&t=${Date.now()}`,
    { waitUntil: 'networkidle', timeout: 60000 },
  );
  await page.waitForSelector('#hero-detail-footer', { timeout: 20000 });
  await page.waitForTimeout(500);

  const outputDir =
    '/Users/xml/Desktop/英雄广场/docs/miniprogram/pages/images/hero-detail';
  const footer = page.locator('#hero-detail-footer');

  await page.evaluate(() => {
    const foot = document.getElementById('hero-detail-footer');
    const apply = document.getElementById('hero-detail-apply-btn');
    foot.classList.remove('hero-detail__footer--share-only');
    apply.hidden = false;
  });
  await footer.screenshot({
    path: `${outputDir}/footer-unverified.png`,
    type: 'png',
  });

  await page.evaluate(() => {
    const foot = document.getElementById('hero-detail-footer');
    const apply = document.getElementById('hero-detail-apply-btn');
    foot.classList.add('hero-detail__footer--share-only');
    apply.hidden = true;
  });
  await footer.screenshot({
    path: `${outputDir}/footer-approved.png`,
    type: 'png',
  });

  console.log('saved hero detail footer states');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
