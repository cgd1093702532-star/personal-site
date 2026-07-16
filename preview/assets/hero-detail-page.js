/** 英雄详情 · 按 id 渲染，UGC 个人主页风格 */
(async function () {
  function resolveCourses(hero, heroId) {
    const fromHero = Array.isArray(hero.courses) ? hero.courses : [];
    if (fromHero.length) return fromHero;
    const staticCourses = window.HEROES_DATA?.[heroId]?.courses;
    return Array.isArray(staticCourses) ? staticCourses : [];
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

  /** 经验年限展示：选项全文 +「经验」；区间用 —；避免「年年经验」 */
  function formatYearsExpDisplay(yearsExp) {
    const raw = String(yearsExp ?? '').trim();
    if (!raw) return '';
    let s = raw.replace(/[~～－–—−‐‑﹣]/g, '—').replace(/-/g, '—').replace(/\s*—\s*/g, '—');
    if (/经验/.test(s)) return s.replace(/执教经验/g, '经验');
    if (/年/.test(s)) return `${s}经验`;
    return `${s}年经验`;
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
  if (!hero || hero.enabled === false) {
    root.innerHTML =
      '<div class="hero-detail-missing">' +
      '<div class="hero-detail-missing__icon" aria-hidden="true">' +
      '<img src="../assets/icons/empty.png" alt="" width="40" height="40">' +
      '</div>' +
      '<div class="hero-detail-missing__title">教练不存在</div>' +
      '<div class="hero-detail-missing__hint">该教练不存在，可重新返回广场浏览</div>' +
      '</div>';
    const titleEl = document.getElementById('navbar-hero-title');
    if (titleEl) titleEl.textContent = '英雄详情';
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

  const subtitle = `${(hero.project_types || []).join(' · ')} · ${formatYearsExpDisplay(hero.years_exp)}`;
  const honors = (hero.past_honors || [])
    .map((h) => {
      const name = escapeHtml(h.name || '');
      // 荣誉成就统一奖牌图标
      const iconHtml = honorIconHtml('');
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
  const certUrls = (hero.certificates || []).slice(0, 10).map((c) => {
    const item = typeof c === 'string' ? { name: '资质证书', image: c } : c;
    return `${imgBase}${item.image}`;
  });

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

  function parseRecruitDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /** 报名起止，参考图样式：7月12日 09:30 – 16:00 */
  function formatSignupTimeRange(startAt, endAt) {
    const start = parseRecruitDate(startAt);
    const end = parseRecruitDate(endAt);
    if (!start) return startAt || '';
    const pad = (n) => String(n).padStart(2, '0');
    const dayPart = `${start.getMonth() + 1}月${start.getDate()}日`;
    const startClock = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    if (!end) return `${dayPart} ${startClock}`;
    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();
    const endClock = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    if (sameDay) return `${dayPart} ${startClock} – ${endClock}`;
    return `${dayPart} ${startClock} – ${end.getMonth() + 1}月${end.getDate()}日 ${endClock}`;
  }

  function formatRecruitSignup(signed, total) {
    const s = Number(signed);
    const t = Number(total);
    if (Number.isFinite(s) && Number.isFinite(t)) {
      return `招募名额：${s}/${t}`;
    }
    if (Number.isFinite(s)) {
      return `招募名额：${s}/不限`;
    }
    return '';
  }

  const RECRUIT_PREVIEW_LIMIT = 2;
  const heroRecruitments = Array.isArray(hero.recruitments) ? hero.recruitments : [];
  const staticRecruitments = window.HEROES_DATA?.[id]?.recruitments;
  const allRecruitments = heroRecruitments.length
    ? heroRecruitments
    : Array.isArray(staticRecruitments)
      ? staticRecruitments
      : [];
  const recruitNeedExpand = allRecruitments.length > RECRUIT_PREVIEW_LIMIT;

  const recruitments = allRecruitments
    .map((r, index) => {
      const cover = recruitCover(r);
      const isActivity = r.type === 'activity';
      const typeLabel = r.typeLabel || (isActivity ? '活动' : '赛事');
      const tagClass = isActivity ? 'tag--activity' : 'tag--event';
      const signupStart = r.signup_start_at || r.start_at;
      const signupEnd = r.signup_end_at || r.end_at;
      const signupTime =
        r.signupTimeDisplay ||
        formatSignupTimeRange(signupStart, signupEnd) ||
        r.timeDisplay ||
        r.time ||
        '';
      const locationPrefix = isActivity ? '活动地点：' : '赛事地点：';
      const locationText =
        r.locationDisplay || `${locationPrefix}${r.location || ''}`;
      const signupText =
        r.signupDisplay || formatRecruitSignup(r.signed, r.total);
      const collapsed =
        recruitNeedExpand && index >= RECRUIT_PREVIEW_LIMIT
          ? ' hero-detail__activity-card--collapsed'
          : '';
      return (
        `<a class="hero-detail__activity-card${collapsed} nav-forward" href="recruitment-detail.html?id=${r.recruit_id}">` +
        `<div class="hero-detail__activity-main">` +
        `<div class="hero-detail__activity-thumb"><img src="${imgBase}${cover}" alt=""></div>` +
        `<div class="hero-detail__activity-body">` +
        `<div class="hero-detail__activity-title-row">` +
        `<div class="hero-detail__activity-title">${escapeHtml(r.title || '')}</div>` +
        `<span class="tag ${tagClass}">${typeLabel}</span>` +
        `</div>` +
        `<div class="hero-detail__activity-meta">${escapeHtml(signupTime)}</div>` +
        `<div class="hero-detail__activity-meta">${escapeHtml(locationText)}</div>` +
        `<div class="hero-detail__activity-fee">${formatRecruitFee(r)}</div>` +
        `</div></div>` +
        `<div class="hero-detail__activity-footer">` +
        `<span class="hero-detail__activity-signup">${escapeHtml(signupText)}</span>` +
        `<span class="hero-detail__activity-btn">立即报名</span>` +
        `</div></a>`
      );
    })
    .join('');

  const recruitExpandBtn = recruitNeedExpand
    ? `<button type="button" class="hero-detail__recruit-expand" id="hero-recruit-expand">展开全部（${allRecruitments.length - RECRUIT_PREVIEW_LIMIT}）</button>`
    : '';

  const recruitBlock = allRecruitments.length
    ? `<div class="hero-detail__block"><div class="hero-detail__label-row"><div class="hero-detail__label">活动与赛事</div><div class="hero-detail__label-extra">共${allRecruitments.length}个</div></div><div class="hero-detail__recruit-list">${recruitments}${recruitExpandBtn}</div></div>`
    : '';

  const COURSE_PREVIEW_LIMIT = 2;
  const allCourses = resolveCourses(hero, id);
  const courseNeedExpand = allCourses.length > COURSE_PREVIEW_LIMIT;

  const courses = allCourses
    .map((c, index) => {
      const cover = c.cover_image || 'course.jpg';
      const signupTime = c.signupTimeDisplay || c.timeDisplay || c.time || '';
      const locationText =
        c.locationDisplay || `课程地点：${c.location || ''}`;
      const signupText =
        c.signupDisplay || formatRecruitSignup(c.signed, c.total);
      const collapsed =
        courseNeedExpand && index >= COURSE_PREVIEW_LIMIT
          ? ' hero-detail__activity-card--collapsed'
          : '';
      return (
        `<a class="hero-detail__activity-card${collapsed} nav-forward" href="course-detail.html?id=${c.course_id}">` +
        `<div class="hero-detail__activity-main">` +
        `<div class="hero-detail__activity-thumb"><img src="${imgBase}${cover}" alt=""></div>` +
        `<div class="hero-detail__activity-body">` +
        `<div class="hero-detail__activity-title-row">` +
        `<div class="hero-detail__activity-title">${escapeHtml(c.title || '')}</div>` +
        `<span class="tag tag--course">课程</span>` +
        `</div>` +
        `<div class="hero-detail__activity-meta">${escapeHtml(signupTime)}</div>` +
        `<div class="hero-detail__activity-meta">${escapeHtml(locationText)}</div>` +
        `<div class="hero-detail__activity-fee">${formatRecruitFee(c)}</div>` +
        `</div></div>` +
        `<div class="hero-detail__activity-footer">` +
        `<span class="hero-detail__activity-signup">${escapeHtml(signupText)}</span>` +
        `<span class="hero-detail__activity-btn">立即报名</span>` +
        `</div></a>`
      );
    })
    .join('');

  const courseExpandBtn = courseNeedExpand
    ? `<button type="button" class="hero-detail__recruit-expand" id="hero-course-expand">展开全部（${allCourses.length - COURSE_PREVIEW_LIMIT}）</button>`
    : '';

  const courseBlock = allCourses.length
    ? `<div class="hero-detail__block"><div class="hero-detail__label-row"><div class="hero-detail__label">我的课程</div><div class="hero-detail__label-extra">共${allCourses.length}门</div></div><div class="hero-detail__course-list">${courses}${courseExpandBtn}</div></div>`
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
    const params = new URLSearchParams({
      from: 'hero-detail',
      hero_id: String(id),
    });
    const page = role === 'pending' ? 'hero-apply-submitted.html' : 'hero-apply.html';
    const target = `${page}?${params.toString()}`;
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

  function showRejectedDialog() {
    closeRejectDialog();
    const dialog = document.createElement('div');
    dialog.id = 'hero-detail-reject-dialog';
    dialog.className = 'profile-dialog';
    dialog.innerHTML =
      `<div class="profile-dialog__mask" data-dialog-close></div>` +
      `<div class="profile-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="hero-detail-reject-title">` +
      `<div class="profile-dialog__title" id="hero-detail-reject-title">温馨提示</div>` +
      `<div class="profile-dialog__body">您提交的申请被驳回，请前往处理</div>` +
      `<div class="profile-dialog__actions">` +
      `<button type="button" class="profile-dialog__btn profile-dialog__btn--cancel" data-dialog-close>取消</button>` +
      `<button type="button" class="profile-dialog__btn profile-dialog__btn--primary" data-dialog-handle>去处理</button>` +
      `</div></div>`;
    const shell = root.closest('.mobile-shell') || document.body;
    shell.appendChild(dialog);
    dialog.addEventListener('click', (e) => {
      if (e.target.closest('[data-dialog-handle]')) {
        closeRejectDialog();
        if (window.PreviewNav?.navigateTo) {
          window.PreviewNav.navigateTo('profile.html', 'forward');
        } else {
          window.location.href = 'profile.html';
        }
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

  const personal = hero.personal_showcase;
  const personalItems = Array.isArray(personal?.items) ? personal.items.slice(0, 10) : [];
  const personalUrls = personalItems.map((item) => `${imgBase}${item.image || item || 'event.jpg'}`);
  const personalBlock =
    personalItems.length
      ? `<div class="hero-detail__block"><div class="hero-race">` +
        `<div class="hero-race__head">` +
        `<img class="hero-race__icon" src="../assets/icons/image.png" alt="">` +
        `<span class="hero-race__title">个人展示</span></div>` +
        `<div class="hero-race__intro">${escapeHtml(personal.intro || '')}</div>` +
        `<div class="hero-race__grid">` +
        personalItems
          .map((item, index) => {
            const img = item.image || item || 'event.jpg';
            const url = `${imgBase}${img}`;
            return (
              `<div class="hero-race__grid-item hero-detail__thumb" data-url="${url}" role="button" tabindex="0">` +
              `<img src="${url}" alt="${escapeHtml(item.title || `展示${index + 1}`)}">` +
              `</div>`
            );
          })
          .join('') +
        `</div></div></div>`
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
  <div class="hero-detail__block"><div class="hero-detail__label">关于我</div><div class="hero-detail__bio">${escapeHtml(String(hero.about_me || '').slice(0, 200))}</div></div>
  <div class="hero-detail__block"><div class="hero-detail__label">荣誉成就</div>${honors}</div>
  <div class="hero-detail__block"><div class="hero-cert"><div class="hero-cert__head"><img class="hero-cert__icon" src="../assets/icons/medal.png" alt=""><span class="hero-cert__title">资质证书</span></div><div class="hero-detail__cert-scroll">${certs}</div></div></div>
  ${teachingBlock}
  ${raceBlock}
  ${socialBlock}
  ${personalBlock}
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

  bindGallery('.hero-race__grid .hero-detail__thumb', personalUrls);
  bindGallery('.hero-detail__cert-scroll .hero-detail__thumb', certUrls);

  document.getElementById('hero-recruit-expand')?.addEventListener('click', (e) => {
    e.preventDefault();
    root
      .querySelectorAll('.hero-detail__recruit-list .hero-detail__activity-card--collapsed')
      .forEach((el) => {
        el.classList.remove('hero-detail__activity-card--collapsed');
      });
    e.currentTarget.remove();
  });

  document.getElementById('hero-course-expand')?.addEventListener('click', (e) => {
    e.preventDefault();
    root
      .querySelectorAll('.hero-detail__course-list .hero-detail__activity-card--collapsed')
      .forEach((el) => {
        el.classList.remove('hero-detail__activity-card--collapsed');
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
      showToast('您的申请在审核中，无需重复提交');
      return;
    }
    if (role === 'rejected') {
      showRejectedDialog();
      return;
    }
    navigateApplyPage('none');
  });

  if (window.HeroShare) window.HeroShare.init(hero, id);
})();
