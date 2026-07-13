/** 英雄列表 · 从本地 API（与后台「英雄管理」同源）渲染卡片 */
(function () {
  const list = document.getElementById('hero-list');
  if (!list) return;

  const empty = document.getElementById('hero-empty');
  const imgBase = '../assets/images/';

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function avatarSrc(hero) {
    const img = hero.avatar_img || hero.avatar || 'hero-1.jpg';
    if (String(img).startsWith('http') || String(img).startsWith('../') || String(img).startsWith('/')) {
      return img;
    }
    return `${imgBase}${img}`;
  }

  function honorHtml(hero) {
    let titles = hero.honor_titles || [];
    if (!titles.length) {
      const cert = hero.certification || hero.certification_level || '';
      if (cert) titles = [cert];
    }
    if (!titles.length) {
      const years = hero.years_exp != null && hero.years_exp !== '' ? String(hero.years_exp).trim() : '';
      if (years) {
        const yearsLabel = /年/.test(years) ? `${years}执教经验` : `${years}年执教经验`;
        titles = [yearsLabel];
      }
    }
    if (!titles.length) return '';
    return titles
      .slice(0, 2)
      .map(
        (t, i) =>
          `<span class="hero-card__honor hero-card__honor--${i === 0 ? 'primary' : 'secondary'}">${
            i === 0
              ? '<span class="hero-card__honor-icon"><img class="hero-card__honor-icon-img" src="../assets/icons/crown.png" alt=""></span>'
              : ''
          }<span class="hero-card__honor-text">${escapeHtml(t)}</span></span>`,
      )
      .join('');
  }

  function typeTags(hero) {
    return (hero.project_types || [])
      .slice(0, 3)
      .map((t) => `<span class="tag tag--skill">${escapeHtml(t)}</span>`)
      .join('');
  }

  function rowLinks(hero) {
    const rows = [];
    const events = (hero.events || hero.recruitments || []).slice(0, 1);
    const courses = (hero.courses || []).slice(0, 1);
    events.forEach((e) => {
      const id = e.recruit_id || e.id || e.target_id;
      const title = e.title || '';
      const status = e.status_label || e.status || '招募中';
      rows.push(
        `<a class="hero-card__row nav-forward" href="recruitment-detail.html?id=${escapeHtml(id)}"><span class="tag tag--event">赛事</span><span class="hero-card__row-text">${escapeHtml(status)} | ${escapeHtml(title)}</span><span class="hero-card__row-arrow">›</span></a>`,
      );
    });
    courses.forEach((c) => {
      const id = c.course_id || c.id || c.target_id;
      rows.push(
        `<a class="hero-card__row nav-forward" href="course-detail.html?id=${escapeHtml(id)}"><span class="tag tag--course">课程</span><span class="hero-card__row-text">报名中 | ${escapeHtml(c.title || '')}</span><span class="hero-card__row-arrow">›</span></a>`,
      );
    });
    return rows.join('');
  }

  function cardHtml(hero) {
    const id = hero.hero_id || hero.id;
    const name = hero.name || '英雄';
    const types = (hero.project_types || []).join(',');
    const years = hero.years_exp || '';
    const rating = hero.rating != null ? hero.rating : '';
    const bio = hero.about_me || hero.bio || '';
    const honors = (hero.honor_titles || []).join(',');
    const rows = rowLinks(hero);
    return (
      `<div class="hero-card hero-card--list" data-hero-id="${escapeHtml(id)}" data-name="${escapeHtml(name)}" data-types="${escapeHtml(types)}" data-years="${escapeHtml(years)}" data-rating="${escapeHtml(rating)}" data-bio="${escapeHtml(bio)}" data-honors="${escapeHtml(honors)}">` +
      `<a class="hero-card__head nav-forward" href="hero-detail.html?id=${escapeHtml(id)}">` +
      `<div class="hero-card__avatar"><img src="${avatarSrc(hero)}" alt="${escapeHtml(name)}"></div>` +
      `<div class="hero-card__meta"><div class="hero-card__name-row"><span class="hero-card__name">${escapeHtml(name)}</span>${typeTags(hero)}</div>` +
      `<div class="hero-card__honors">${honorHtml(hero)}</div></div></a>` +
      (rows ? `<div class="hero-card__rows">${rows}</div>` : '') +
      `</div>`
    );
  }

  function setEmptyVisible(show, isError) {
    if (!empty) return;
    empty.style.display = show ? '' : 'none';
    const title = empty.querySelector('.heroes-empty-state__title');
    const hint = empty.querySelector('.heroes-empty-state__hint');
    if (title) title.textContent = isError ? '加载失败' : '暂无认证教练';
    if (hint) {
      hint.textContent = isError ? '请检查本地服务后重试' : '后台「英雄管理」开启后将显示在此';
    }
  }

  async function loadFromApi() {
    if (!window.HeroPlazaDB || !(await window.HeroPlazaDB.isAvailable())) {
      list.innerHTML = '';
      setEmptyVisible(true, true);
      return false;
    }
    try {
      list.innerHTML = '<p style="padding:32px 16px;text-align:center;color:#999;font-size:14px">加载中…</p>';
      setEmptyVisible(false);
      const heroes = await window.HeroPlazaDB.listHeroes();
      if (!heroes.length) {
        list.innerHTML = '';
        setEmptyVisible(true, false);
        document.dispatchEvent(new CustomEvent('heroes-list-updated'));
        return true;
      }
      let recruitments = [];
      let courses = [];
      try {
        recruitments = await window.HeroPlazaDB.listRecruitments({ scope: 'public' });
      } catch (_) {
        recruitments = [];
      }
      try {
        courses = await window.HeroPlazaDB.listCourses();
      } catch (_) {
        courses = [];
      }
      const enriched = heroes.map((h) => {
        const hid = String(h.hero_id || h.id);
        return {
          ...h,
          events: recruitments.filter((r) => String(r.hero_id || '') === hid).slice(0, 2),
          courses: courses.filter((c) => String(c.hero_id || '') === hid).slice(0, 2),
        };
      });
      list.innerHTML = enriched.map(cardHtml).join('');
      setEmptyVisible(false);
      document.dispatchEvent(new CustomEvent('heroes-list-updated'));
      return true;
    } catch (err) {
      console.warn('[heroes-list] API 加载失败', err);
      list.innerHTML = '';
      setEmptyVisible(true, true);
      return false;
    }
  }

  function refreshIfVisible() {
    if (document.hidden) return;
    loadFromApi();
  }

  loadFromApi();
  window.addEventListener('focus', refreshIfVisible);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshIfVisible();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'hero_plaza_heroes_updated') refreshIfVisible();
  });
})();
