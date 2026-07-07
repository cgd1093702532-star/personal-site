/** 招募详情 · 预览页 */
(function () {
  const root = document.getElementById('recruitment-detail-root');
  if (!root) return;

  const imgBase = window.RECRUITMENTS_IMG_BASE || '../assets/images/';

  async function loadRecruitment(id) {
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        const item = await window.HeroPlazaDB.getRecruitment(id);
        if (item) return item;
      } catch (err) {
        console.warn('[recruitment-detail] 数据库读取失败', err);
      }
    }
    if (window.getRecruitmentById) return window.getRecruitmentById(id);
    return null;
  }

  async function loadSignup(recruitId) {
    let list = [];
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        list = (await window.HeroPlazaDB.getAppState('my_signups')) || [];
      } catch (_) {
        list = [];
      }
    }
    if (!list.length && window.getDefaultMySignups) {
      list = window.getDefaultMySignups();
    }
    return list.find((s) => s.recruit_id === recruitId) || null;
  }

  async function saveCheckin(recruitId) {
    if (!window.HeroPlazaDB || !(await window.HeroPlazaDB.isAvailable())) return false;
    const list = (await window.HeroPlazaDB.getAppState('my_signups')) || [];
    const next = list.map((item) =>
      item.recruit_id === recruitId
        ? {
            ...item,
            checked_in: true,
            checkin_at: new Date().toISOString(),
            status: '已签到',
          }
        : item,
    );
    await window.HeroPlazaDB.setAppState('my_signups', next);
    return true;
  }

  function initImmersiveNav() {
    const shell = document.querySelector('.mobile-shell--immersive');
    const scrollEl = document.getElementById('immersive-scroll');
    const chrome = document.getElementById('immersive-chrome');
    const cover = root.querySelector('.cover-carousel--immersive');
    if (!shell || !scrollEl || !chrome || !cover) return;

    const update = () => {
      const threshold = Math.max(0, cover.offsetHeight - chrome.offsetHeight);
      shell.classList.toggle('is-nav-solid', scrollEl.scrollTop >= threshold);
    };

    scrollEl.addEventListener('scroll', update, { passive: true });
    update();
  }

  function renderProfile(profile) {
    if (!profile) return '';
    const dims = [
      ['专业资质与荣誉', profile.credentials],
      ['教学理念', profile.teaching_philosophy],
      ['丰富的赛事经验', profile.race_experience],
      ['卓越长航领队教学特色', profile.leadership_style],
      ['社会贡献', profile.social_contribution],
    ]
      .filter(([, text]) => text)
      .map(
        ([label, text]) =>
          `<div class="recruit-detail-preview__dim">` +
          `<div class="recruit-detail-preview__dim-label">${label}</div>` +
          `<p class="recruit-detail-preview__dim-text">${text}</p></div>`,
      )
      .join('');
    const slogan = profile.slogan
      ? `<blockquote class="recruit-detail-preview__slogan">${profile.slogan}</blockquote>`
      : '';
    return dims + slogan;
  }

  function showCheckinModal(title, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'recruit-checkin-modal mobile-overlay';
    overlay.innerHTML =
      `<div class="recruit-checkin-modal__mask"></div>` +
      `<div class="recruit-checkin-modal__panel">` +
      `<div class="recruit-checkin-modal__title">签到二维码</div>` +
      `<div class="recruit-checkin-modal__qr" aria-hidden="true">▦</div>` +
      `<p class="recruit-checkin-modal__hint">${title}<br>请向工作人员出示此码完成核销</p>` +
      `<button type="button" class="recruit-checkin-modal__close" data-action="confirm">模拟核销</button>` +
      `</div>`;
    document.querySelector('.mobile-shell')?.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('.recruit-checkin-modal__mask')?.addEventListener('click', close);
    overlay.querySelector('[data-action="confirm"]')?.addEventListener('click', async () => {
      if (onConfirm) await onConfirm();
      close();
    });
  }

  function updateFooterButton(footer, action) {
    const btn = footer.querySelector('#recruit-signup-btn');
    if (!btn) return;
    btn.textContent = action.label;
    btn.disabled = action.disabled;
    btn.classList.toggle('recruit-detail-preview__btn--disabled', action.disabled);
    btn.dataset.action = action.action;
  }

  async function init() {
    const id = new URLSearchParams(location.search).get('id') || 'r1';
    const item = await loadRecruitment(id);
    if (!item) {
      root.innerHTML =
        '<div class="heroes-empty-state" style="display:flex;padding:40px 16px"><div>活动不存在</div></div>';
      return;
    }

    let signup = await loadSignup(id);
    const resolve = window.SignupActionPreview?.resolveSignupFooter || (() => ({
      label: '立即报名',
      disabled: false,
      action: 'signup',
    }));
    let footerAction = resolve({ recruitment: item, signup });

    const titleEl = document.getElementById('navbar-recruit-title');
    if (titleEl) titleEl.textContent = item.title;
    document.title = `${item.title} · 英雄广场`;

    const imgs = item.cover_images || ['recruit-cover.jpg'];
    const slides = imgs
      .map((img) => `<div class="cover-carousel__slide"><img src="${imgBase}/${img}" alt="活动封面"></div>`)
      .join('');
    const dots = imgs
      .map((_, i) => `<span class="cover-carousel__dot${i === 0 ? ' is-active' : ''}"></span>`)
      .join('');
    const pct = item.total ? Math.min(100, Math.round((item.signed / item.total) * 100)) : 0;
    const tagStyle =
      item.type === 'event' ? 'background:#fecf13;color:#222' : 'background:#e8f1fa;color:#1b579c';

    root.innerHTML =
      `<div class="recruit-detail-preview recruit-detail-preview--immersive">` +
      `<div class="cover-carousel cover-carousel--immersive" data-cover-carousel>` +
      `<div class="cover-carousel__viewport"><div class="cover-carousel__track">${slides}</div></div>` +
      (imgs.length > 1 ? `<div class="cover-carousel__dots">${dots}</div>` : '') +
      `</div>` +
      `<div class="recruit-detail-preview__body">` +
      `<span class="tag" style="${tagStyle}">${item.typeLabel}</span>` +
      `<h2 class="recruit-detail-preview__title">${item.title}</h2>` +
      `<div class="card__meta">🕐 ${item.timeDisplay || item.start_at || ''}</div>` +
      `<div class="card__meta">📍 ${item.location}</div>` +
      `<div class="recruit-detail-preview__publisher">` +
      `<span class="recruit-detail-preview__publisher-label">发布</span>` +
      `<span class="recruit-detail-preview__publisher-name">${item.hero_name}</span>` +
      `</div>` +
      `<div class="recruit-detail-preview__progress">` +
      `<div class="recruit-detail-preview__progress-text">已报名 ${item.signed} / ${item.total} 人</div>` +
      `<div class="recruit-detail-preview__bar"><div class="recruit-detail-preview__bar-inner" style="width:${pct}%"></div></div>` +
      `</div>` +
      `<div class="recruit-detail-preview__section">` +
      `<div class="recruit-detail-preview__label">活动详情</div>` +
      `<p class="recruit-detail-preview__desc">${item.description || ''}</p>` +
      renderProfile(item.organizer_profile) +
      `</div></div>` +
      `<div class="recruit-detail-preview__footer">` +
      `<span class="recruit-detail-preview__price">¥${item.fee}<span>/人</span></span>` +
      `<button type="button" class="recruit-detail-preview__btn${footerAction.disabled ? ' recruit-detail-preview__btn--disabled' : ''}" id="recruit-signup-btn" data-action="${footerAction.action}"${footerAction.disabled ? ' disabled' : ''}>${footerAction.label}</button>` +
      `</div></div>`;

    const shell = document.querySelector('.mobile-shell');
    const footer = root.querySelector('.recruit-detail-preview__footer');
    if (shell && footer) shell.appendChild(footer);

    const signupBtn = document.getElementById('recruit-signup-btn');
    signupBtn?.addEventListener('click', async () => {
      footerAction = resolve({ recruitment: item, signup });
      if (footerAction.disabled || footerAction.action === 'none') return;

      if (footerAction.action === 'checkin') {
        showCheckinModal(item.title, async () => {
          await saveCheckin(id);
          signup = await loadSignup(id);
          footerAction = resolve({ recruitment: item, signup });
          updateFooterButton(footer, footerAction);
          if (window.PreviewToast) window.PreviewToast.show('核销成功', 'success');
        });
        return;
      }

      const name = window.prompt('联系人姓名');
      if (!name || !name.trim()) return;
      const phone = window.prompt('手机号');
      if (!phone || !/^1\d{10}$/.test(phone)) {
        window.alert('请填写有效手机号');
        return;
      }
      const db = window.HeroPlazaDB;
      if (!db || !(await db.isAvailable())) {
        window.alert('报名失败，请确认本地数据库服务已启动（:8787）');
        return;
      }
      try {
        const entry = {
          id: `s${Date.now()}`,
          recruit_id: id,
          title: item.title,
          name: name.trim(),
          phone,
          signed_at: new Date().toISOString(),
          start_at: item.start_at,
          end_at: item.end_at,
          location: item.location,
          fee: item.fee,
          status: '已报名',
          payStatus: '待支付',
          checked_in: false,
        };
        const signups = (await db.getAppState('my_signups')) || [];
        await db.setAppState('my_signups', [entry, ...signups]);
        const nextSigned = (item.signed || 0) + 1;
        await db.updateRecruitment(id, { ...item, signed: nextSigned });
        item.signed = nextSigned;
        signup = entry;
        footerAction = resolve({ recruitment: item, signup });
        updateFooterButton(footer, footerAction);
        const bar = root.querySelector('.recruit-detail-preview__bar-inner');
        const text = root.querySelector('.recruit-detail-preview__progress-text');
        if (bar && text) {
          const p = item.total ? Math.min(100, Math.round((nextSigned / item.total) * 100)) : 0;
          bar.style.width = `${p}%`;
          text.textContent = `已报名 ${nextSigned} / ${item.total} 人`;
        }
        if (window.PreviewToast) window.PreviewToast.show('报名成功', 'success');
        else window.alert('报名成功');
      } catch (err) {
        window.alert('报名失败');
        console.error(err);
      }
    });

    const carousel = root.querySelector('[data-cover-carousel]');
    if (carousel && imgs.length > 1 && window.initCoverCarousel) {
      window.initCoverCarousel(carousel);
    }
    initImmersiveNav();
  }

  init().catch((err) => console.error('[recruitment-detail]', err));
})();
