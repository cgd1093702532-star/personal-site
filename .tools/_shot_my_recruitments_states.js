/**
 * 我的活动赛事各状态截图 → docs/miniprogram/pages/images/my-recruitments/
 * 依赖本地预览 :8765 + API :8787（有数据态）
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs/miniprogram/pages/images/my-recruitments');
const BASE = 'http://127.0.0.1:8765/miniprogram/my-recruitments.html';

const HIDE_CHROME = `
  .preview-doc-aside { display: none !important; }
  .preview-page-nav { display: none !important; }
  body.has-preview-doc .device.device--with-doc,
  body.has-preview-page-nav .device {
    justify-content: center !important;
    padding: 32px !important;
  }
  body { background: #2a2a30 !important; }
`;

async function shotFrame(page, file) {
  const out = path.join(OUT, file);
  await page.locator('.device__frame').screenshot({ path: out, type: 'png' });
  console.log('saved', out);
}

async function openPage(page) {
  await page.goto(`${BASE}?t=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.addStyleTag({ content: HIDE_CHROME });
  await page.waitForSelector('#my-recruitments-root .my-recruit', { timeout: 20000 });
  await page.waitForTimeout(600);
}

async function clickTab(page, key, label) {
  await page.click(`.my-recruit__tab[data-tab="${key}"]`);
  await page.waitForFunction(
    (lab) => {
      const active = document.querySelector('.my-recruit__tab--active');
      return active && active.textContent.includes(lab);
    },
    label,
    { timeout: 10000 },
  );
  await page.waitForTimeout(300);
}

async function setOnlyMine(page, on) {
  const pressed = await page.evaluate(() => {
    const btn = document.querySelector('[data-filter-mine]');
    return btn && btn.getAttribute('aria-pressed') === 'true';
  });
  if (pressed !== on) {
    await page.click('[data-filter-mine]');
    await page.waitForTimeout(300);
  }
}

async function forceEmpty(page, tabKey) {
  await page.evaluate((key) => {
    const root = document.getElementById('my-recruitments-root');
    if (!root) return;
    const emptyMap = {
      active: {
        icon: '../assets/icons/announce.png',
        title: '暂无进行中的招募',
        hint: '发布赛事招募，开始招募学员与参赛选手',
        actionText: '发布赛事招募',
        actionHref: 'recruitment-create.html',
      },
      ended: {
        icon: '../assets/icons/list.png',
        title: '暂无已结束的招募',
        hint: '已结束的活动会显示在这里，方便查看历史数据',
        actionText: '',
        actionHref: '',
      },
    };
    const state = emptyMap[key];
    const actionBtn = state.actionText
      ? `<a class="my-recruit__empty-btn nav-forward" href="${state.actionHref}">${state.actionText}</a>`
      : '';
    const tabs =
      key === 'active'
        ? `<button type="button" class="my-recruit__tab my-recruit__tab--active" data-tab="active">进行中</button>` +
          `<button type="button" class="my-recruit__tab" data-tab="ended">已结束</button>`
        : `<button type="button" class="my-recruit__tab" data-tab="active">进行中</button>` +
          `<button type="button" class="my-recruit__tab my-recruit__tab--active" data-tab="ended">已结束</button>`;
    root.innerHTML =
      `<div class="my-recruit">` +
      `<div class="my-recruit__tabs"><div class="my-recruit__tabs-track">${tabs}</div></div>` +
      `<div class="my-recruit__list">` +
      `<div class="my-recruit__empty">` +
      `<div class="my-recruit__empty-icon"><img src="${state.icon}" alt=""></div>` +
      `<div class="my-recruit__empty-title">${state.title}</div>` +
      `<div class="my-recruit__empty-hint">${state.hint}</div>` +
      actionBtn +
      `</div></div></div>`;
  }, tabKey);
  await page.waitForTimeout(200);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1000 },
    deviceScaleFactor: 2,
  });

  try {
    await openPage(page);

    // 1) 进行中 · 有数据
    await clickTab(page, 'active', '进行中');
    await setOnlyMine(page, false);
    await page.waitForSelector('.my-recruit__card', { timeout: 15000 });
    await shotFrame(page, 'state-active.png');

    // 2) 进行中 · 仅显示我发起的
    await setOnlyMine(page, true);
    await page.waitForTimeout(200);
    await shotFrame(page, 'state-active-only-mine.png');

    // 3) 已结束 · 有数据
    await setOnlyMine(page, false);
    await clickTab(page, 'ended', '已结束');
    await page.waitForSelector('.my-recruit__card', { timeout: 15000 });
    await shotFrame(page, 'state-ended.png');

    // 4) 已结束 · 仅显示我发起的
    await setOnlyMine(page, true);
    await page.waitForTimeout(200);
    await shotFrame(page, 'state-ended-only-mine.png');

    // 5) 进行中 · 空态
    await openPage(page);
    await forceEmpty(page, 'active');
    await page.waitForSelector('.my-recruit__empty-title', { timeout: 5000 });
    await shotFrame(page, 'state-active-empty.png');

    // 6) 已结束 · 空态
    await forceEmpty(page, 'ended');
    await page.waitForSelector('.my-recruit__empty-title', { timeout: 5000 });
    await shotFrame(page, 'state-ended-empty.png');

    console.log('OK', OUT);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
