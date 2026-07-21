/**
 * 截取预览中的全局弹框 → preview/assets/dialog-gallery/
 * 仅用于预览「弹框总览」，不写入 docs。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(
  '/Users/xml/Desktop/英雄广场',
  'preview/assets/dialog-gallery',
);
const BASE = 'http://127.0.0.1:8765/miniprogram';

async function hideChrome(page) {
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
}

async function shotFrame(page, name) {
  const dest = path.join(OUT, name);
  await page.locator('.device__frame').screenshot({ path: dest, type: 'png' });
  console.log('saved', dest);
}

async function goto(page, file, waitSel) {
  await page.goto(`${BASE}/${file}${file.includes('?') ? '&' : '?'}t=${Date.now()}`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  if (waitSel) await page.waitForSelector(waitSel, { timeout: 20000 });
  await page.waitForTimeout(400);
  await hideChrome(page);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1000 },
    deviceScaleFactor: 2,
  });

  // 个人中心 · 发布选项
  await goto(page, 'profile.html', '#profile-root');
  await page.evaluate(() => {
    const sheet = document.createElement('div');
    sheet.className = 'profile-action-sheet mobile-overlay';
    sheet.innerHTML = `
      <div class="profile-action-sheet__mask"></div>
      <div class="profile-action-sheet__panel" role="dialog" aria-modal="true" aria-label="选择发布类型">
        <button type="button" class="profile-action-sheet__item">发布赛事招募</button>
        <button type="button" class="profile-action-sheet__item">申请课程</button>
        <button type="button" class="profile-action-sheet__item profile-action-sheet__item--cancel">取消</button>
      </div>`;
    (document.querySelector('.device__frame') || document.body).appendChild(sheet);
    document.querySelector('.mobile-shell')?.classList.add('mobile-shell--overlay');
  });
  await page.waitForTimeout(200);
  await shotFrame(page, 'profile-publish-sheet.png');

  // 英雄详情 · 驳回弹窗 / 分享 / 海报
  await goto(page, 'hero-detail.html?id=1', '#hero-detail-footer');
  await page.evaluate(() => {
    document.getElementById('hero-detail-reject-dialog')?.remove();
    const dialog = document.createElement('div');
    dialog.id = 'hero-detail-reject-dialog';
    dialog.className = 'profile-dialog';
    dialog.innerHTML =
      `<div class="profile-dialog__mask"></div>` +
      `<div class="profile-dialog__panel" role="dialog" aria-modal="true">` +
      `<div class="profile-dialog__title">温馨提示</div>` +
      `<div class="profile-dialog__body">您的英雄申请未通过审核，请前往个人中心查看原因并重新提交。</div>` +
      `<div class="profile-dialog__actions">` +
      `<button type="button" class="profile-dialog__btn">取消</button>` +
      `<button type="button" class="profile-dialog__btn profile-dialog__btn--primary">去处理</button>` +
      `</div></div>`;
    (document.querySelector('.device__frame') || document.body).appendChild(dialog);
  });
  await page.waitForTimeout(200);
  await shotFrame(page, 'hero-detail-reject-dialog.png');

  await page.evaluate(() => {
    document.getElementById('hero-detail-reject-dialog')?.remove();
    if (window.HeroShare) {
      const hero =
        window.HeroShare._hero ||
        (window.HEROES_DATA && window.HEROES_DATA[0]) || {
          name: '船长阿明',
          about_me: '十年帆船教学经验',
          avatar_img: 'hero-1.jpg',
        };
      window.HeroShare.open(hero, window.HeroShare._heroId || '1');
    }
  });
  await page.waitForTimeout(300);
  await shotFrame(page, 'hero-share-sheet.png');

  await page.evaluate(() => {
    document.querySelector('.share-sheet [data-action="poster"]')?.click();
  });
  await page.waitForTimeout(400);
  await shotFrame(page, 'hero-poster-modal.png');

  // 申请页 · 各类 sheet / dialog
  await goto(page, 'hero-apply.html', 'main.content');
  const openSheet = async (id) => {
    await page.evaluate((sheetId) => {
      document
        .querySelectorAll(
          '#apply-cert-sheet, #apply-project-sheet, #apply-id-doc-type-sheet, #apply-showcase-media-sheet',
        )
        .forEach((el) => {
          el.hidden = true;
        });
      document
        .querySelectorAll('#apply-cert-name-dialog, #apply-custom-cert-dialog')
        .forEach((el) => el.remove());
      const sheet = document.getElementById(sheetId);
      if (sheet) {
        sheet.hidden = false;
        document.querySelector('.mobile-shell')?.classList.add('mobile-shell--overlay');
      }
    }, id);
    await page.waitForTimeout(250);
  };

  await openSheet('apply-id-doc-type-sheet');
  await shotFrame(page, 'apply-id-doc-sheet.png');

  await openSheet('apply-cert-sheet');
  await shotFrame(page, 'apply-cert-sheet.png');

  await openSheet('apply-project-sheet');
  await shotFrame(page, 'apply-project-sheet.png');

  await openSheet('apply-showcase-media-sheet');
  await shotFrame(page, 'apply-showcase-media-sheet.png');

  await page.evaluate(() => {
    document
      .querySelectorAll(
        '#apply-cert-sheet, #apply-project-sheet, #apply-id-doc-type-sheet, #apply-showcase-media-sheet',
      )
      .forEach((el) => {
        el.hidden = true;
      });
    document.getElementById('apply-cert-name-dialog')?.remove();
    const dialog = document.createElement('div');
    dialog.id = 'apply-cert-name-dialog';
    dialog.className = 'profile-dialog';
    dialog.innerHTML =
      `<div class="profile-dialog__mask"></div>` +
      `<div class="profile-dialog__panel" role="dialog" aria-modal="true">` +
      `<div class="profile-dialog__title">命名证书</div>` +
      `<div class="profile-dialog__body">` +
      `<img class="apply-cert-name-dialog__preview" src="../assets/images/hero-1.jpg" alt="证书预览">` +
      `<input type="text" class="profile-dialog__input" placeholder="请输入证书名称" value="帆船教练证书" />` +
      `</div>` +
      `<div class="profile-dialog__actions">` +
      `<button type="button" class="profile-dialog__btn">取消</button>` +
      `<button type="button" class="profile-dialog__btn profile-dialog__btn--primary">确认添加</button>` +
      `</div></div>`;
    (document.querySelector('.device__frame') || document.body).appendChild(dialog);
  });
  await page.waitForTimeout(250);
  await shotFrame(page, 'apply-cert-name-dialog.png');

  await page.evaluate(() => {
    document.getElementById('apply-cert-name-dialog')?.remove();
    const dialog = document.createElement('div');
    dialog.id = 'apply-custom-cert-dialog';
    dialog.className = 'profile-dialog';
    dialog.innerHTML = `
      <div class="profile-dialog__mask"></div>
      <div class="profile-dialog__panel" role="dialog" aria-modal="true">
        <div class="profile-dialog__title">自定义教练资质等级</div>
        <div class="profile-dialog__body">
          <input type="text" class="profile-dialog__input" placeholder="请输入资质等级名称" />
        </div>
        <div class="profile-dialog__actions">
          <button type="button" class="profile-dialog__btn">取消</button>
          <button type="button" class="profile-dialog__btn profile-dialog__btn--primary">确定</button>
        </div>
      </div>`;
    (document.querySelector('.device__frame') || document.body).appendChild(dialog);
  });
  await page.waitForTimeout(250);
  await shotFrame(page, 'apply-custom-cert-dialog.png');

  // 发布招募 · 确认发起
  await goto(page, 'recruitment-create.html', 'main.content');
  await page.evaluate(() => {
    document.getElementById('initiate-confirm-dialog')?.remove();
    const dialog = document.createElement('div');
    dialog.id = 'initiate-confirm-dialog';
    dialog.className = 'profile-dialog';
    dialog.innerHTML =
      `<div class="profile-dialog__mask"></div>` +
      `<div class="profile-dialog__panel" role="dialog" aria-modal="true">` +
      `<div class="profile-dialog__title">确认发起赛事招募</div>` +
      `<div class="profile-dialog__body">确认发起赛事招募后，在我的页>服务中心>我的活动赛事中查看。</div>` +
      `<div class="profile-dialog__actions">` +
      `<button type="button" class="profile-dialog__btn">取消</button>` +
      `<button type="button" class="profile-dialog__btn profile-dialog__btn--primary">确认开始招募</button>` +
      `</div></div>`;
    (document.querySelector('.device__frame') || document.body).appendChild(dialog);
  });
  await page.waitForTimeout(250);
  await shotFrame(page, 'recruit-initiate-dialog.png');

  // 通用 · 图片预览
  await goto(page, 'hero-detail.html?id=1', '#hero-detail-footer');
  await page.evaluate(() => {
    if (window.ImageViewer && typeof window.ImageViewer.open === 'function') {
      window.ImageViewer.open(['../assets/images/hero-1.jpg', '../assets/images/hero-2.jpg'], 0);
      return;
    }
    document.getElementById('image-viewer')?.remove();
    const root = document.createElement('div');
    root.id = 'image-viewer';
    root.className = 'image-viewer image-viewer--visible';
    root.innerHTML = `
      <div class="image-viewer__mask"></div>
      <div class="image-viewer__panel">
        <div class="image-viewer__top">
          <span class="image-viewer__index">1 / 2</span>
          <button type="button" class="image-viewer__close" aria-label="关闭">×</button>
        </div>
        <div class="image-viewer__stage">
          <button type="button" class="image-viewer__nav image-viewer__nav--prev" aria-label="上一张">‹</button>
          <div class="image-viewer__viewport">
            <img class="image-viewer__img" alt="预览图" src="../assets/images/hero-1.jpg" draggable="false" />
          </div>
          <button type="button" class="image-viewer__nav image-viewer__nav--next" aria-label="下一张">›</button>
        </div>
        <div class="image-viewer__actions">
          <button type="button" class="image-viewer__btn" data-action="save"><span class="image-viewer__btn-icon">↓</span><span>保存</span></button>
          <button type="button" class="image-viewer__btn" data-action="share"><span class="image-viewer__btn-icon">↗</span><span>分享</span></button>
        </div>
      </div>`;
    (document.querySelector('.device__frame') || document.body).appendChild(root);
  });
  await page.waitForTimeout(300);
  await shotFrame(page, 'image-viewer.png');

  await browser.close();
  console.log('dialog gallery shots done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
