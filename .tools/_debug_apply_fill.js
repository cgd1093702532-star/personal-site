const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  page.on('console', (msg) => console.log('PAGE:', msg.text()));

  await page.goto('http://127.0.0.1:8765/miniprogram/hero-apply.html?t=' + Date.now(), {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await page.waitForTimeout(2000);

  const info = await page.evaluate(async () => {
    const nick = document.querySelector('[data-field="nickname"]')?.value;
    const name = document.querySelector('[data-field="name"]')?.value;
    const phone = document.querySelector('[data-field="phone"]')?.value;
    const cert = document.querySelector('#apply-cert')?.value;
    const idCard = document.querySelector('[data-field="id_card"]')?.value;
    const bio = document.querySelector('[data-field="bio"]')?.value;
    const certRows = document.querySelectorAll('#apply-cert-grid .apply-cert-row').length;
    const years = document.querySelector('#apply-years-tags .apply-tag--active')?.dataset?.years || '';
    const project = document.querySelector('#apply-project-types')?.value;
    const localDraft = localStorage.getItem('hero_plaza_hero_apply_local_draft');
    const oldForm = localStorage.getItem('hero_plaza_hero_apply_form');
    let status = null;
    let appStateLocal = null;
    let appStateForm = null;
    try {
      if (window.HeroPlazaDB) {
        status = await window.HeroPlazaDB.getHeroApplyStatus();
        appStateLocal = await window.HeroPlazaDB.getAppState('hero_apply_local_draft');
        appStateForm = await window.HeroPlazaDB.getAppState('hero_apply_form');
      }
    } catch (e) {
      status = { error: String(e) };
    }
    return {
      nick, name, phone, cert, idCard, bioLen: (bio||'').length, certRows, years, project,
      localDraft: localDraft ? localDraft.slice(0, 200) : null,
      oldForm: oldForm ? oldForm.slice(0, 200) : null,
      appStateLocal,
      appStateForm: appStateForm ? { nickname: appStateForm.nickname, name: appStateForm.name } : appStateForm,
      status: status && {
        status: status.status,
        hasApp: !!status.application,
        appNick: status.application?.nickname,
        appName: status.application?.name,
      },
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
