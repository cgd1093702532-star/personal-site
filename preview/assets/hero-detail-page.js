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

  const certLevel = hero.certification || hero.certification_level || '—';
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
    .map(
      (h) =>
        `<div class="hero-detail__honor"><div class="hero-detail__honor-body"><div class="hero-detail__honor-name">${h.name}</div></div></div>`
    )
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

  const recruitments = (hero.recruitments || [])
    .map((r) => {
      const cover = recruitCover(r);
      return (
        `<a class="hero-detail__recruit-card nav-forward" href="recruitment-detail.html?id=${r.recruit_id}">` +
        `<div class="hero-detail__recruit-thumb"><img src="${imgBase}${cover}" alt="${r.title}"></div>` +
        `<div class="hero-detail__recruit-body">` +
        `<div class="hero-detail__recruit-title">${r.title}</div>` +
        `<div class="hero-detail__recruit-meta">${r.timeDisplay}</div>` +
        `<div class="hero-detail__recruit-meta">赛事地点：${r.location}</div>` +
        `<div class="hero-detail__recruit-bottom">` +
        `<span class="hero-detail__recruit-fee">¥${r.fee}/人</span>` +
        `<span class="hero-detail__recruit-signup">${r.signupDisplay}</span>` +
        `</div></div></a>`
      );
    })
    .join('');

  const recruitBlock = (hero.recruitments || []).length
    ? `<div class="hero-detail__block"><div class="hero-detail__label-row"><div class="hero-detail__label">赛事招募</div><div class="hero-detail__label-extra">共${hero.recruitments.length}个</div></div>${recruitments}</div>`
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

  root.innerHTML = `<div class="hero-detail">
  <div class="hero-profile">
    <div class="hero-profile__cover"></div>
    <div class="hero-profile__main">
      <div class="hero-profile__avatar"><img src="${imgBase}${hero.avatar_img}" alt="${hero.name}"></div>
      <button type="button" class="hero-detail__share" data-hero-share><span class="hero-detail__share-icon">↗</span><span class="hero-detail__share-text">分享</span></button>
      <div class="hero-profile__name">${hero.name}</div>
      <div class="hero-profile__subtitle">${subtitle}</div>
      <div class="hero-profile__rating"><div class="hero-profile__stars">${stars}</div><span class="hero-profile__score">${rating}</span></div>
      <div class="hero-profile__tags">${tags.map((t) => `<span class="hero-profile__tag">${t}</span>`).join('')}</div>
      <div class="hero-profile__stats">
        <div class="hero-profile__stat"><span class="hero-profile__stat-num">${hero.student_count || 0}</span><span class="hero-profile__stat-label">学员</span></div>
        <div class="hero-profile__stat"><span class="hero-profile__stat-num hero-profile__stat-num--text">${certLevel}</span><span class="hero-profile__stat-label">资质等级</span></div>
        <div class="hero-profile__stat"><span class="hero-profile__stat-num">${hero.honors_count || 0}</span><span class="hero-profile__stat-label">荣誉</span></div>
      </div>
    </div>
  </div>
  <div class="hero-detail__block"><div class="hero-detail__label">关于我</div><div class="hero-detail__bio">${hero.about_me}</div></div>
  <div class="hero-detail__block"><div class="hero-detail__label">过往荣誉</div>${honors}</div>
  <div class="hero-detail__block"><div class="hero-detail__label">资质证书</div><div class="hero-detail__cert-scroll">${certs}</div></div>
  <div class="hero-detail__block"><div class="hero-detail__label">个人展示</div><div class="hero-detail__gallery">${moments}</div></div>
  ${recruitBlock}
  ${courseBlock}
  <div class="hero-detail__bottom-spacer"></div>
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

  if (window.HeroShare) window.HeroShare.init(hero, id);
})();
