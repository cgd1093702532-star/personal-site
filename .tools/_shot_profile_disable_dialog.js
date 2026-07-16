const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1000 },
    deviceScaleFactor: 2,
  });
  await page.goto(`http://127.0.0.1:8765/miniprogram/profile.html?t=${Date.now()}`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForSelector('#profile-root', { timeout: 20000 });
  await page.waitForTimeout(500);
  await page.addStyleTag({
    content: `
      .preview-doc-aside, .preview-page-nav, .preview-dialog-gallery { display: none !important; }
      body.has-preview-doc .device.device--with-doc,
      body.has-preview-page-nav .device {
        justify-content: center !important;
        padding: 32px !important;
      }
      body { background: #2a2a30 !important; }
    `,
  });

  // 强制禁用态数据并重渲染，再打开弹窗
  await page.evaluate(async () => {
    if (window.HeroPlazaDB?.setAppState) {
      await window.HeroPlazaDB.setAppState('mock_hero_role', 'approved');
    }
    // 直接注入禁用弹窗（文案以当前实现为准）
    document.getElementById('profile-disable-dialog')?.remove();
    const dialog = document.createElement('div');
    dialog.id = 'profile-disable-dialog';
    dialog.className = 'profile-dialog';
    dialog.innerHTML = `
      <div class="profile-dialog__mask"></div>
      <div class="profile-dialog__panel" role="dialog" aria-modal="true">
        <div class="profile-dialog__title">英雄身份禁用</div>
        <div class="profile-dialog__body">您的英雄身份不可用，具体原因可联系客服处理</div>
        <div class="profile-dialog__actions">
          <button type="button" class="profile-dialog__btn profile-dialog__btn--primary">知道了</button>
        </div>
      </div>`;
    const host =
      document.querySelector('#profile-root')?.closest('.mobile-shell') ||
      document.querySelector('.device__frame') ||
      document.body;
    // 尽量把页面改成禁用引导条外观（不依赖接口）
    const cta = document.querySelector('.profile-hero-cta');
    if (cta) {
      cta.classList.add('profile-hero-cta--rejected');
      const hint = cta.querySelector('.profile-hero-cta__hint');
      const btn = cta.querySelector('.profile-hero-cta__btn');
      if (hint) hint.textContent = '您的英雄身份不可用，可联系客服处理';
      if (btn) btn.textContent = '查看原因';
    }
    const tag = document.querySelector('.profile-user__cert, .profile-cert-tag, [class*="cert"]');
    if (tag && /未认证/.test(tag.textContent || '')) tag.textContent = '已认证英雄';
    host.appendChild(dialog);
  });
  await page.waitForTimeout(300);
  const out =
    '/Users/xml/Desktop/英雄广场/docs/miniprogram/pages/images/profile/state-disabled-dialog.png';
  await page.locator('.device__frame').screenshot({ path: out, type: 'png' });
  console.log('saved', out);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
