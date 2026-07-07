/** 招募详情 · 预览页（数据来自我的招募） */
(function () {
  const root = document.getElementById('recruitment-detail-root');
  if (!root || !window.getRecruitmentById) return;

  const id = new URLSearchParams(location.search).get('id') || 'r1';
  const item = window.getRecruitmentById(id);
  const imgBase = window.RECRUITMENTS_IMG_BASE || '../assets/images/';

  if (!item) {
    root.innerHTML =
      '<div class="heroes-empty-state" style="display:flex;padding:40px 16px"><div>活动不存在</div></div>';
    return;
  }

  const titleEl = document.getElementById('navbar-recruit-title');
  if (titleEl) titleEl.textContent = item.title;
  document.title = `${item.title} · 英雄广场`;

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

  const imgs = item.cover_images || ['recruit-cover.jpg'];
  const slides = imgs
    .map((img) => `<div class="cover-carousel__slide"><img src="${imgBase}/${img}" alt="活动封面"></div>`)
    .join('');
  const dots = imgs
    .map((_, i) => `<span class="cover-carousel__dot${i === 0 ? ' is-active' : ''}"></span>`)
    .join('');
  const pct = item.total ? Math.min(100, Math.round((item.signed / item.total) * 100)) : 0;
  const canSignup = item.displayStatus !== 'closed' && item.displayStatus !== 'ended';
  const tagStyle =
    item.type === 'event' ? 'background:#fecf13;color:#222' : 'background:#e8f1fa;color:#1b579c';

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

  root.innerHTML =
    `<div class="recruit-detail-preview recruit-detail-preview--immersive">` +
    `<div class="cover-carousel cover-carousel--immersive" data-cover-carousel>` +
    `<div class="cover-carousel__viewport"><div class="cover-carousel__track">${slides}</div></div>` +
    (imgs.length > 1 ? `<div class="cover-carousel__dots">${dots}</div>` : '') +
    `</div>` +
    `<div class="recruit-detail-preview__body">` +
    `<span class="tag" style="${tagStyle}">${item.typeLabel}</span>` +
    `<h2 class="recruit-detail-preview__title">${item.title}</h2>` +
    `<div class="card__meta">🕐 ${item.timeDisplay}</div>` +
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
    `<p class="recruit-detail-preview__desc">${item.description}</p>` +
    renderProfile(item.organizer_profile) +
    `</div></div>` +
    `<div class="recruit-detail-preview__footer">` +
    `<span class="recruit-detail-preview__price">¥${item.fee}<span>/人</span></span>` +
    `<button type="button" class="recruit-detail-preview__btn${canSignup ? '' : ' recruit-detail-preview__btn--disabled'}" id="recruit-signup-btn">${canSignup ? '立即报名' : '报名已截止'}</button>` +
    `</div></div>`;

  const shell = document.querySelector('.mobile-shell');
  const footer = root.querySelector('.recruit-detail-preview__footer');
  if (shell && footer) {
    shell.appendChild(footer);
  }

  const signupBtn = document.getElementById('recruit-signup-btn');
  if (signupBtn && canSignup) {
    signupBtn.addEventListener('click', async () => {
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
          recruit_id: id,
          title: item.title,
          name: name.trim(),
          phone,
          signed_at: new Date().toISOString(),
        };
        const signups = (await db.getAppState('my_signups')) || [];
        await db.setAppState('my_signups', [entry, ...signups]);
        const nextSigned = (item.signed || 0) + 1;
        await db.updateRecruitment(id, { ...item, signed: nextSigned });
        item.signed = nextSigned;
        const bar = root.querySelector('.recruit-detail-preview__bar-inner');
        const text = root.querySelector('.recruit-detail-preview__progress-text');
        if (bar && text) {
          const pct = item.total ? Math.min(100, Math.round((nextSigned / item.total) * 100)) : 0;
          bar.style.width = `${pct}%`;
          text.textContent = `已报名 ${nextSigned} / ${item.total} 人`;
        }
        window.alert('报名成功');
      } catch (err) {
        window.alert('报名失败');
        console.error(err);
      }
    });
  }

  const carousel = root.querySelector('[data-cover-carousel]');
  if (carousel && imgs.length > 1 && window.initCoverCarousel) {
    window.initCoverCarousel(carousel);
  }

  initImmersiveNav();
})();
