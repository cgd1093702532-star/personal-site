/** 招募详情 · 预览页 */
(function () {
  const root = document.getElementById('recruitment-detail-root');
  if (!root) return;

  const imgBase = window.RECRUITMENTS_IMG_BASE || '../assets/images/';

  function closeInitiateConfirm() {
    document.getElementById('initiate-confirm-dialog')?.remove();
  }

  function openInitiateConfirm() {
    closeInitiateConfirm();
    const dialog = document.createElement('div');
    dialog.id = 'initiate-confirm-dialog';
    dialog.className = 'profile-dialog';
    dialog.innerHTML =
      `<div class="profile-dialog__mask" data-initiate-cancel></div>` +
      `<div class="profile-dialog__panel" role="dialog" aria-modal="true">` +
      `<div class="profile-dialog__title">确认发起赛事招募</div>` +
      `<div class="profile-dialog__body">确认发起赛事招募后，在我的页>服务中心>我的招募中查看。</div>` +
      `<div class="profile-dialog__actions">` +
      `<button type="button" class="profile-dialog__btn" data-initiate-cancel>取消</button>` +
      `<button type="button" class="profile-dialog__btn profile-dialog__btn--primary" data-initiate-confirm>确认开始招募</button>` +
      `</div></div>`;
    (root.closest('.mobile-shell') || document.body).appendChild(dialog);
    dialog.addEventListener('click', (e) => {
      if (e.target.closest('[data-initiate-confirm]')) {
        closeInitiateConfirm();
        window.location.href = 'my-recruitments.html';
        return;
      }
      if (e.target.closest('[data-initiate-cancel]')) closeInitiateConfirm();
    });
  }

  async function loadRecruitment(id) {
    let item = null;
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        item = await window.HeroPlazaDB.getRecruitment(id);
      } catch (err) {
        console.warn('[recruitment-detail] 数据库读取失败', err);
      }
    }
    if (!item && window.getRecruitmentById) item = window.getRecruitmentById(id);
    if (!item) return null;
    /* 静态 mock 封面优先（避免库内旧多图） */
    const staticItem = window.getRecruitmentById ? window.getRecruitmentById(id) : null;
    if (staticItem && Array.isArray(staticItem.cover_images) && staticItem.cover_images.length) {
      item = { ...item, cover_images: staticItem.cover_images.slice() };
    } else if (Array.isArray(item.cover_images) && item.cover_images.length > 1) {
      item = { ...item, cover_images: [item.cover_images[0]] };
    }
    return item;
  }

  async function loadSignup(recruitId) {
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        const list = await window.HeroPlazaDB.listSignups({ recruit_id: recruitId });
        if (list && list.length) return list[0];
        const mine = await window.HeroPlazaDB.listMySignups();
        return mine.find((s) => s.recruit_id === recruitId) || null;
      } catch (_) {
        /* fall through */
      }
    }
    return null;
  }

  function formatFeeDisplay(fee) {
    const n = Number(fee);
    if (!Number.isFinite(n)) {
      return `<span class="recruit-detail-preview__price-symbol">¥</span><span class="recruit-detail-preview__price-num">${fee ?? ''}</span>`;
    }
    const fixed = n.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    return (
      `<span class="recruit-detail-preview__price-symbol">¥</span>` +
      `<span class="recruit-detail-preview__price-num">${intPart}</span>` +
      `<span class="recruit-detail-preview__price-dec">.${decPart}</span>`
    );
  }

  function renderSummaryTags(tags) {
    const list = (Array.isArray(tags) ? tags : [])
      .map((t) => String(t || '').trim())
      .filter(Boolean)
      .slice(0, 3);
    if (!list.length) return '';
    return (
      `<div class="recruit-detail-preview__tags">` +
      list.map((t) => `<span class="recruit-detail-preview__tag">${t}</span>`).join('') +
      `</div>`
    );
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

  function updateFooterButton(footer, action) {
    const btn = footer.querySelector('#recruit-signup-btn');
    if (!btn) return;
    btn.textContent = action.label;
    btn.disabled = action.disabled;
    btn.classList.toggle('recruit-detail-preview__btn--disabled', action.disabled);
    btn.dataset.action = action.action;
  }

  async function isApprovedHero() {
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        const res = await window.HeroPlazaDB.getHeroApplyStatus();
        if (res && res.status === 'approved') return true;
      } catch (_) {
        /* fall through */
      }
    }
    try {
      const role =
        typeof window.HeroPlazaDB?.getAppState === 'function'
          ? await window.HeroPlazaDB.getAppState('mock_hero_role')
          : null;
      return role === 'approved';
    } catch (_) {
      return false;
    }
  }

  function resolveFooter(item, approvedHero) {
    const resolve =
      window.SignupActionPreview?.resolveSignupFooter ||
      (() => ({ label: '立即报名', disabled: false, action: 'signup' }));
    return resolve({ recruitment: item, isApprovedHero: approvedHero });
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
    const approvedHero = await isApprovedHero();
    let footerAction = resolveFooter(item, approvedHero);

    const titleEl = document.getElementById('navbar-recruit-title');
    if (titleEl) titleEl.textContent = item.title;
    document.title = `${item.title} · 英雄广场`;

    const imgs = item.cover_images || ['recruit-cover.jpg'];
    const coverHtml =
      imgs.length > 1
        ? `<div class="cover-carousel cover-carousel--immersive" data-cover-carousel>` +
          `<div class="cover-carousel__viewport"><div class="cover-carousel__track">` +
          imgs
            .map((img) => `<div class="cover-carousel__slide"><img src="${imgBase}/${img}" alt="活动封面"></div>`)
            .join('') +
          `</div></div>` +
          `<div class="cover-carousel__dots">` +
          imgs
            .map((_, i) => `<span class="cover-carousel__dot${i === 0 ? ' is-active' : ''}"></span>`)
            .join('') +
          `</div></div>`
        : `<div class="cover-carousel cover-carousel--immersive cover-carousel--single">` +
          `<img class="cover-carousel__single-img" src="${imgBase}/${imgs[0]}" alt="活动封面">` +
          `</div>`;
    const tagStyle =
      item.type === 'event'
        ? 'background:#fecf13;color:#fff'
        : item.type === 'activity'
          ? 'background:#f47528;color:#fff'
          : 'background:#e8f1fa;color:#1b579c';

    root.innerHTML =
      `<div class="recruit-detail-preview recruit-detail-preview--immersive">` +
      coverHtml +
      `<div class="recruit-detail-preview__body">` +
      `<div class="recruit-detail-preview__card recruit-detail-preview__card--summary">` +
      `<span class="tag" style="${tagStyle}">${item.typeLabel}</span>` +
      `<h2 class="recruit-detail-preview__title">${item.title}</h2>` +
      renderSummaryTags(item.tags) +
      `<div class="recruit-detail-preview__price-row">` +
      `<div class="recruit-detail-preview__price">${formatFeeDisplay(item.fee)}</div>` +
      `<button type="button" class="recruit-detail-preview__share" data-share aria-label="分享">` +
      `<img src="../assets/icons/share.svg" alt="" width="20" height="20">` +
      `</button>` +
      `</div></div>` +
      `<button type="button" class="recruit-detail-preview__vip" data-vip>` +
      `<span class="recruit-detail-preview__vip-left">` +
      `<img class="recruit-detail-preview__vip-icon" src="../assets/icons/vip-v.svg" alt="" width="22" height="22">` +
      `<span class="recruit-detail-preview__vip-text">VIP会员卡 · 可享5大权益</span>` +
      `</span>` +
      `<span class="recruit-detail-preview__vip-cta">立即尊享 <span aria-hidden="true">›</span></span>` +
      `</button>` +
      `<div class="recruit-detail-preview__card recruit-detail-preview__meta-card">` +
      `<div class="recruit-detail-preview__meta-row">` +
      `<img class="recruit-detail-preview__meta-icon" src="../assets/icons/time.png" alt="">` +
      `<span class="recruit-detail-preview__meta-text">${item.timeDisplay || item.start_at || ''}</span>` +
      `</div>` +
      `<button type="button" class="recruit-detail-preview__meta-row recruit-detail-preview__meta-row--loc" data-meta-location>` +
      `<img class="recruit-detail-preview__meta-icon" src="../assets/icons/location.png" alt="">` +
      `<span class="recruit-detail-preview__meta-text">${item.location || ''}</span>` +
      `<span class="recruit-detail-preview__meta-arrow" aria-hidden="true">›</span>` +
      `</button>` +
      `<button type="button" class="recruit-detail-preview__meta-row" data-organizer>` +
      `<img class="recruit-detail-preview__meta-icon" src="../assets/icons/landmark.svg" alt="">` +
      `<span class="recruit-detail-preview__meta-text">${item.hero_name || ''}主办</span>` +
      `</button>` +
      `<div class="recruit-detail-preview__field">` +
      `<span class="recruit-detail-preview__field-label">备注</span>` +
      `<span class="recruit-detail-preview__field-value">${item.remark || '—'}</span>` +
      `</div>` +
      `</div>` +
      `<div class="recruit-detail-preview__card recruit-detail-preview__card--detail">` +
      `<div class="recruit-detail-preview__label">活动详情</div>` +
      `<p class="recruit-detail-preview__desc">${item.description || ''}</p>` +
      renderProfile(item.organizer_profile) +
      `</div></div>` +
      `<div class="recruit-detail-preview__footer">` +
      `<div class="recruit-detail-preview__footer-nav">` +
      `<a class="recruit-detail-preview__footer-link" href="index.html">` +
      `<img class="recruit-detail-preview__footer-icon" src="../assets/icons/tab-home.png" alt="" width="22" height="22">` +
      `<span>首页</span></a>` +
      `<button type="button" class="recruit-detail-preview__footer-link" data-footer-cs>` +
      `<img class="recruit-detail-preview__footer-icon" src="../assets/icons/customer-service.svg" alt="" width="22" height="22">` +
      `<span>客服</span></button>` +
      `</div>` +
      `<button type="button" class="recruit-detail-preview__btn${footerAction.disabled ? ' recruit-detail-preview__btn--disabled' : ''}" id="recruit-signup-btn" data-action="${footerAction.action}"${footerAction.disabled ? ' disabled' : ''}>${footerAction.label}</button>` +
      `</div></div>`;

    const shell = document.querySelector('.mobile-shell');
    const footer = root.querySelector('.recruit-detail-preview__footer');
    if (shell && footer) shell.appendChild(footer);

    footer?.querySelector('[data-footer-cs]')?.addEventListener('click', () => {
      if (window.PreviewToast) window.PreviewToast.show('功能开发中', 'info');
      else window.alert('功能开发中');
    });

    root.querySelector('[data-meta-location]')?.addEventListener('click', () => {
      if (window.PreviewToast) window.PreviewToast.show('地图功能开发中', 'info');
      else window.alert('地图功能开发中');
    });

    root.querySelector('[data-organizer]')?.addEventListener('click', () => {
      const hid = item.hero_id || '1';
      window.location.href = `hero-detail.html?id=${encodeURIComponent(hid)}`;
    });

    root.querySelector('[data-share]')?.addEventListener('click', () => {
      if (window.PreviewToast) window.PreviewToast.show('分享功能开发中', 'info');
      else window.alert('分享功能开发中');
    });

    root.querySelector('[data-vip]')?.addEventListener('click', () => {
      if (window.PreviewToast) window.PreviewToast.show('即将开放', 'info');
      else window.alert('即将开放');
    });

    const signupBtn = document.getElementById('recruit-signup-btn');
    signupBtn?.addEventListener('click', async () => {
      footerAction = resolveFooter(item, approvedHero);
      if (footerAction.disabled || footerAction.action === 'none') return;

      if (footerAction.action === 'initiate') {
        openInitiateConfirm();
        return;
      }

      if (footerAction.action !== 'signup') return;

      if (signup) {
        if (window.PreviewToast) window.PreviewToast.show('您已报名', 'info');
        else window.alert('您已报名');
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
        const created = await db.createSignup({
          recruit_id: id,
          title: item.title,
          name: name.trim(),
          phone,
          start_at: item.start_at,
          end_at: item.end_at,
          location: item.location,
          fee: item.fee,
          hero_id: item.hero_id,
          type: 'event',
          status: '已报名',
          pay_status: '待支付',
          checked_in: false,
        });
        const nextSigned = (item.signed || 0) + 1;
        item.signed = nextSigned;
        signup = created;
        footerAction = resolveFooter(item, approvedHero);
        updateFooterButton(footer, footerAction);
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
