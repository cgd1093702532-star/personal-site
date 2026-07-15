/** 英雄详情 · 按 id 渲染，UGC 个人主页风格 */
(async function () {
  const COURSES_BY_HERO = {
    1: ['c1'],
    2: ['c1'],
    3: ['c2', 'c3'],
    4: ['c1'],
  };

  const COURSE_CATALOG = {
    c1: {
      course_id: 'c1',
      title: 'ASA101-103培训课',
      timeDisplay: '7月26日 09:00 - 16:30',
      location: '滴水湖二号码头',
      fee: 1280,
      cover_image: 'course.jpg',
    },
    c2: {
      course_id: 'c2',
      title: '桨板入门体验课',
      timeDisplay: '7月18日 10:00 - 12:00',
      location: '太湖桨板营地',
      fee: 198,
      cover_image: 'course.jpg',
    },
    c3: {
      course_id: 'c3',
      title: '潜水基础课程',
      timeDisplay: '8月10日 09:00 - 17:00',
      location: '三亚开放水域基地',
      fee: 2680,
      cover_image: 'course.jpg',
    },
  };

  function resolveCourses(hero, heroId) {
    if (hero.courses && hero.courses.length) return hero.courses;
    return (COURSES_BY_HERO[heroId] || [])
      .map((cid) => COURSE_CATALOG[cid])
      .filter(Boolean);
  }

  function recruitCover(item) {
    if (item.cover_image) return item.cover_image;
    if (item.cover_images && item.cover_images.length) return item.cover_images[0];
    return 'recruit-cover.jpg';
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 荣誉图标：图片路径 / emoji / 默认奖牌 */
  function honorIconHtml(icon) {
    const raw = String(icon || '').trim();
    let src = '';
    if (!raw) {
      src = '../assets/icons/medal.png';
    } else if (/^https?:\/\//.test(raw) || raw.startsWith('../') || raw.startsWith('data:')) {
      src = raw;
    } else if (raw.startsWith('/assets/')) {
      src = `..${raw}`;
    } else if (/\.(png|jpe?g|svg|webp)$/i.test(raw) || raw.includes('/')) {
      src = raw.startsWith('assets/') ? `../${raw}` : `../assets/icons/${raw.replace(/^icons\//, '')}`;
    } else if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(raw)) {
      return `<div class="hero-detail__honor-icon" aria-hidden="true"><span class="hero-detail__honor-emoji">${escapeHtml(raw)}</span></div>`;
    } else {
      src = '../assets/icons/medal.png';
    }
    return `<div class="hero-detail__honor-icon"><img class="hero-detail__honor-icon-img" src="${escapeHtml(src)}" alt=""></div>`;
  }

  const root = document.getElementById('hero-detail-root');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id') || '1';
  let hero = null;
  if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
    try {
      hero = await window.HeroPlazaDB.getHero(id);
    } catch (_) {
      /* fallback */
    }
  }
  if (!hero && window.HEROES_DATA) {
    hero = window.HEROES_DATA[id];
  }
  if (!hero) {
    root.innerHTML = '<div class="heroes-empty-state" style="display:flex;padding:40px 16px"><div>教练不存在</div></div>';
    return;
  }

  const titleEl = document.getElementById('navbar-hero-title');
  if (titleEl) titleEl.textContent = hero.name;

  const tags = [...(hero.honor_titles || []), ...(hero.cert_badges || [])].slice(0, 3);
  const rating = hero.rating;
  const stars = [1, 2, 3, 4, 5]
    .map((i) => {
      let cls = 'hero-profile__star';
      if (rating >= i) cls += ' hero-profile__star--filled';
      else if (rating >= i - 0.5) cls += ' hero-profile__star--half';
      return `<span class="${cls}">★</span>`;
    })
    .join('');

  const subtitle = `${(hero.project_types || []).join(' · ')} · ${hero.years_exp || ''}年经验`;
  const honors = (hero.past_honors || [])
    .map((h) => {
      const name = escapeHtml(h.name || '');
      const iconHtml = honorIconHtml(h.icon);
      return (
        `<div class="hero-detail__honor">` +
        iconHtml +
        `<div class="hero-detail__honor-body">` +
        `<div class="hero-detail__honor-name">${name}</div>` +
        `</div></div>`
      );
    })
    .join('');

  const imgBase = '../assets/images/';
  const momentUrls = (hero.moments || []).slice(0, 10).map((img) => `${imgBase}${img}`);
  const certUrls = (hero.certificates || []).slice(0, 10).map((c) => {
    const item = typeof c === 'string' ? { name: '资质证书', image: c } : c;
    return `${imgBase}${item.image}`;
  });

  const moments = momentUrls
    .map((url) => `<div class="hero-detail__gallery-item hero-detail__thumb" data-url="${url}" role="button" tabindex="0"><img src="${url}" alt="个人展示"></div>`)
    .join('');

  const certs = (hero.certificates || [])
    .slice(0, 10)
    .map((c) => {
      const item = typeof c === 'string' ? { name: '资质证书', image: c } : c;
      const url = `${imgBase}${item.image}`;
      return `<div class="hero-detail__cert-card hero-detail__thumb" data-url="${url}"><div class="hero-detail__cert-img"><img src="${url}" alt="${item.name}"></div><div class="hero-detail__cert-name">${item.name}</div></div>`;
    })
    .join('');

  function formatRecruitFee(r) {
    if (r.feeDisplay != null && r.feeDisplay !== '') return `¥${r.feeDisplay}/人`;
    const n = Number(r.fee);
    if (Number.isFinite(n)) return `¥${n.toLocaleString('en-US')}/人`;
    return `¥${r.fee}/人`;
  }

  const RECRUIT_PREVIEW_LIMIT = 2;
  const allRecruitments = hero.recruitments || [];
  const recruitNeedExpand = allRecruitments.length > RECRUIT_PREVIEW_LIMIT;

  const recruitments = allRecruitments
    .map((r, index) => {
      const cover = recruitCover(r);
      const isActivity = r.type === 'activity';
      const typeLabel = r.typeLabel || (isActivity ? '活动' : '赛事');
      const tagClass = isActivity ? 'tag--activity' : 'tag--event';
      const dotClass = isActivity ? ' event-card__dot--activity' : '';
      const timeText = r.time || r.timeDisplay || '';
      const collapsed =
        recruitNeedExpand && index >= RECRUIT_PREVIEW_LIMIT
          ? ' event-card--collapsed'
          : '';
      return (
        `<a class="event-card event-card--hero${collapsed} nav-forward" href="recruitment-detail.html?id=${r.recruit_id}">` +
        `<div class="event-card__bg"><img src="${imgBase}${cover}" alt="${escapeHtml(r.title || '')}"></div>` +
        `<div class="event-card__scrim"></div>` +
        `<div class="event-card__top">` +
        `<span class="event-card__time"><i class="event-card__dot${dotClass}" aria-hidden="true"></i>${escapeHtml(timeText)}</span>` +
        `</div>` +
        `<div class="event-card__bottom">` +
        `<div class="event-card__info">` +
        `<span class="tag ${tagClass}">${typeLabel}</span>` +
        `<div class="event-card__title">${escapeHtml(r.title || '')}</div>` +
        `<div class="event-card__meta">${escapeHtml(r.location || '')}</div>` +
        `</div>` +
        `<div class="event-card__footer">` +
        `<span class="event-card__price">${formatRecruitFee(r)}</span>` +
        `<span class="event-card__btn">立即报名</span>` +
        `</div></div></a>`
      );
    })
    .join('');

  const recruitExpandBtn = recruitNeedExpand
    ? `<button type="button" class="hero-detail__recruit-expand" id="hero-recruit-expand">展开全部（${allRecruitments.length - RECRUIT_PREVIEW_LIMIT}）</button>`
    : '';

  const recruitBlock = allRecruitments.length
    ? `<div class="hero-detail__block"><div class="hero-detail__label-row"><div class="hero-detail__label">活动与赛事</div><div class="hero-detail__label-extra">共${allRecruitments.length}个</div></div><div class="hero-detail__recruit-list">${recruitments}${recruitExpandBtn}</div></div>`
    : '';

  const heroCourses = resolveCourses(hero, id);

  const courses = heroCourses
    .map((c) => {
      const cover = c.cover_image || 'course.jpg';
      return (
        `<a class="hero-detail__course-card nav-forward" href="course-detail.html?id=${c.course_id}">` +
        `<div class="hero-detail__course-thumb"><img src="${imgBase}${cover}" alt="${c.title}"></div>` +
        `<div class="hero-detail__course-body">` +
        `<div class="hero-detail__recruit-title">${c.title}</div>` +
        `<div class="hero-detail__recruit-meta">${c.timeDisplay}</div>` +
        `<div class="hero-detail__recruit-meta">课程地点：${c.location}</div>` +
        `<div class="hero-detail__recruit-bottom">` +
        `<span class="hero-detail__recruit-fee">¥${c.fee}/人</span>` +
        `</div></div></a>`
      );
    })
    .join('');

  const courseBlock = heroCourses.length
    ? `<div class="hero-detail__block"><div class="hero-detail__label-row"><div class="hero-detail__label">我的课程</div><div class="hero-detail__label-extra">共${heroCourses.length}门</div></div>${courses}</div>`
    : '';

  function showToast(msg, type) {
    if (window.PreviewToast) window.PreviewToast.show(msg, type || 'none', 2000);
    else window.alert(msg);
  }

  async function getApplyStatus() {
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        const res = await window.HeroPlazaDB.getHeroApplyStatus();
        const status = res?.status || 'none';
        if (status && status !== 'none') {
          return {
            status,
            reject_reason: res?.reject_reason || res?.application?.reject_reason || '',
          };
        }
      } catch (_) {
        /* fallback */
      }
    }
    if (window.HeroPlazaDB) {
      try {
        const role = await window.HeroPlazaDB.getAppState('mock_hero_role');
        if (role === 'pending' || role === 'approved' || role === 'rejected') {
          return { status: role, reject_reason: '' };
        }
      } catch (_) {
        /* ignore */
      }
    }
    return { status: 'none', reject_reason: '' };
  }

  function navigateApplyPage(role) {
    const target = role === 'pending' ? 'hero-apply-submitted.html' : 'hero-apply.html';
    if (window.PreviewNav?.navigateTo) {
      window.PreviewNav.navigateTo(target, 'forward');
    } else {
      sessionStorage.setItem('page-transition', 'forward');
      window.location.href = target;
    }
  }

  function closeRejectDialog() {
    document.getElementById('hero-detail-reject-dialog')?.remove();
  }

  function showRejectReasonDialog(reason) {
    closeRejectDialog();
    const text = (reason || '').trim() || '暂无驳回原因';
    const dialog = document.createElement('div');
    dialog.id = 'hero-detail-reject-dialog';
    dialog.className = 'profile-dialog';
    dialog.innerHTML =
      `<div class="profile-dialog__mask" data-dialog-close></div>` +
      `<div class="profile-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="hero-detail-reject-title">` +
      `<div class="profile-dialog__title" id="hero-detail-reject-title">申请失败</div>` +
      `<div class="profile-dialog__body">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` +
      `<div class="profile-dialog__actions">` +
      `<button type="button" class="profile-dialog__btn profile-dialog__btn--cancel" data-dialog-close>取消</button>` +
      `<button type="button" class="profile-dialog__btn profile-dialog__btn--primary" data-dialog-edit>去修改</button>` +
      `</div></div>`;
    const shell = root.closest('.mobile-shell') || document.body;
    shell.appendChild(dialog);
    dialog.addEventListener('click', (e) => {
      if (e.target.closest('[data-dialog-edit]')) {
        closeRejectDialog();
        navigateApplyPage('none');
        return;
      }
      if (e.target.closest('[data-dialog-close]')) closeRejectDialog();
    });
  }

  const teaching = hero.teaching_philosophy;
  const teachingBlock =
    teaching && Array.isArray(teaching.points) && teaching.points.length
      ? `<div class="hero-detail__block"><div class="hero-teaching">` +
        `<div class="hero-teaching__head">` +
        `<img class="hero-teaching__icon" src="../assets/icons/boat.png" alt="">` +
        `<span class="hero-teaching__title">教学理念</span></div>` +
        `<div class="hero-teaching__intro">${escapeHtml(teaching.intro || '')}</div>` +
        `<div class="hero-teaching__lead">${escapeHtml(teaching.belief_lead || '他相信：')}</div>` +
        teaching.points
          .map(
            (p) =>
              `<div class="hero-teaching__item">` +
              `<span class="hero-teaching__item-title">${escapeHtml(p.title || '')}</span>` +
              `<span class="hero-teaching__item-desc">${escapeHtml(p.desc || '')}</span>` +
              `</div>`,
          )
          .join('') +
        `</div></div>`
      : '';

  const race = hero.race_showcase;
  const raceBlock =
    race && Array.isArray(race.items) && race.items.length
      ? `<div class="hero-detail__block"><div class="hero-race">` +
        `<div class="hero-race__head">` +
        `<img class="hero-race__icon" src="../assets/icons/trophy.png" alt="">` +
        `<span class="hero-race__title">赛事经验</span></div>` +
        `<div class="hero-race__intro">${escapeHtml(race.intro || '')}</div>` +
        race.items
          .map((item, index) => {
            const side = index % 2 === 0 ? 'photo-right' : 'photo-left';
            const img = item.image || 'event.jpg';
            return (
              `<div class="hero-race__item hero-race__item--${side}">` +
              `<span class="hero-race__label">${escapeHtml(item.title || '')}</span>` +
              `<div class="hero-race__media"><img src="${imgBase}${img}" alt=""></div>` +
              `</div>`
            );
          })
          .join('') +
        `</div></div>`
      : '';

  const social = hero.social_showcase;
  const socialBlock =
    social && Array.isArray(social.points) && social.points.length
      ? `<div class="hero-detail__block"><div class="hero-social">` +
        `<div class="hero-social__head">` +
        `<span class="hero-social__badge" aria-hidden="true">★</span>` +
        `<span class="hero-social__title">社会贡献</span></div>` +
        `<div class="hero-social__intro">${escapeHtml(social.intro || '')}</div>` +
        social.points
          .map(
            (p) =>
              `<div class="hero-social__item">` +
              `<span class="hero-social__dot" aria-hidden="true"></span>` +
              `<span class="hero-social__text">${escapeHtml(p)}</span>` +
              `</div>`,
          )
          .join('') +
        `</div></div>`
      : '';

  root.innerHTML = `<div class="hero-detail">
  <div class="hero-profile">
    <div class="hero-profile__cover"></div>
    <div class="hero-profile__main">
      <div class="hero-profile__avatar"><img src="${imgBase}${hero.avatar_img}" alt="${hero.name}"></div>
      <div class="hero-profile__name">${hero.name}</div>
      <div class="hero-profile__subtitle">${subtitle}</div>
      <div class="hero-profile__rating"><div class="hero-profile__stars">${stars}</div><span class="hero-profile__score">${rating}</span></div>
      <div class="hero-profile__tags">${tags.map((t) => `<span class="hero-profile__tag">${t}</span>`).join('')}</div>
      <div class="hero-profile__stats">
        <div class="hero-profile__stat"><span class="hero-profile__stat-num">${hero.student_count || 0}</span><span class="hero-profile__stat-label">学员</span></div>
        <div class="hero-profile__stat"><span class="hero-profile__stat-num">${rating}</span><span class="hero-profile__stat-label">评分</span></div>
        <div class="hero-profile__stat"><span class="hero-profile__stat-num">${hero.honors_count || 0}</span><span class="hero-profile__stat-label">荣誉</span></div>
      </div>
    </div>
  </div>
  <div class="hero-detail__block"><div class="hero-detail__label">关于我</div><div class="hero-detail__bio">${hero.about_me}</div></div>
  <div class="hero-detail__block"><div class="hero-detail__label">荣誉成就</div>${honors}</div>
  <div class="hero-detail__block"><div class="hero-detail__label">资质证书</div><div class="hero-detail__cert-scroll">${certs}</div></div>
  ${teachingBlock}
  ${raceBlock}
  <div class="hero-detail__block"><div class="hero-detail__label">个人展示</div><div class="hero-detail__gallery">${moments}</div></div>
  ${socialBlock}
  ${recruitBlock}
  ${courseBlock}
  <div class="hero-detail__bottom-spacer hero-detail__bottom-spacer--cta"></div>
  <div class="hero-detail__footer" id="hero-detail-footer">
    <button type="button" class="hero-detail__share" data-hero-share><span class="hero-detail__share-icon">↗</span><span class="hero-detail__share-text">分享</span></button>
    <button type="button" class="hero-detail__apply-btn" id="hero-detail-apply-btn">申请成为英雄</button>
  </div>
</div>`;

  function bindGallery(selector, urls) {
    root.querySelectorAll(selector).forEach((el) => {
      const url = el.dataset.url;
      el.addEventListener('click', () => {
        if (window.ImageViewer) window.ImageViewer.open(urls, url);
      });
    });
  }

  bindGallery('.hero-detail__gallery .hero-detail__thumb', momentUrls);
  bindGallery('.hero-detail__cert-scroll .hero-detail__thumb', certUrls);

  document.getElementById('hero-recruit-expand')?.addEventListener('click', (e) => {
    e.preventDefault();
    root.querySelectorAll('.event-card--collapsed').forEach((el) => {
      el.classList.remove('event-card--collapsed');
    });
    e.currentTarget.remove();
  });

  const shell = document.querySelector('.mobile-shell');
  const footer = root.querySelector('.hero-detail__footer');
  if (shell && footer) shell.appendChild(footer);

  async function syncFooterByRole() {
    const status = await getApplyStatus();
    const approved = status.status === 'approved';
    const applyBtn = document.getElementById('hero-detail-apply-btn');
    const foot = document.getElementById('hero-detail-footer');
    if (applyBtn) applyBtn.hidden = approved;
    if (foot) foot.classList.toggle('hero-detail__footer--share-only', approved);
  }

  syncFooterByRole();

  document.getElementById('hero-detail-apply-btn')?.addEventListener('click', async () => {
    const status = await getApplyStatus();
    const role = status.status;
    if (role === 'approved') {
      showToast('您已是认证英雄');
      return;
    }
    if (role === 'pending') {
      navigateApplyPage('pending');
      return;
    }
    if (role === 'rejected') {
      showRejectReasonDialog(status.reject_reason);
      return;
    }
    navigateApplyPage('none');
  });

  if (window.HeroShare) window.HeroShare.init(hero, id);
})();
