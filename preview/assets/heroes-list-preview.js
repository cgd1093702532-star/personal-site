/** 英雄列表 · 从本地 API（与后台「英雄管理」同源）渲染卡片；API 不可用时保留静态兜底 */
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

  function yearsHonor(hero) {
    const y = hero.years_exp;
    if (y == null || y === '') return '';
    let s = String(y).trim();
    if (!s) return '';
    s = s.replace(/[~～－–—−‐‑﹣]/g, '—').replace(/-/g, '—').replace(/\s*—\s*/g, '—');
    if (/经验/.test(s)) return s.replace(/执教经验/, '经验');
    if (/年/.test(s)) return s.includes('经验') ? s : `${s}经验`;
    return `${s}年经验`;
  }

  function honorHtml(hero) {
    let titles = hero.honor_titles || [];
    if (!titles.length) {
      const cert = hero.certification || hero.certification_level || '';
      if (cert) titles = [cert];
    }
    if (!titles.length) return '';
    const primary = titles[0];
    const secondary = yearsHonor(hero) || titles[1] || '';
    let html =
      `<span class="hero-card__honor hero-card__honor--primary">` +
      `<span class="hero-card__honor-icon"><img class="hero-card__honor-icon-img" src="../assets/icons/crown.png" alt=""></span>` +
      `<span class="hero-card__honor-text">${escapeHtml(primary)}</span></span>`;
    if (secondary) {
      html +=
        `<span class="hero-card__honor hero-card__honor--secondary">` +
        `<span class="hero-card__honor-text">${escapeHtml(secondary)}</span></span>`;
    }
    return html;
  }

  function truncateLabel(text, maxLen = 6) {
    const s = String(text || '');
    return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
  }

  function typeTags(hero) {
    return (hero.project_types || [])
      .slice(0, 3)
      .map((t) => `<span class="tag tag--skill">${escapeHtml(truncateLabel(t))}</span>`)
      .join('');
  }

  function pickEventActivityCourse(hero) {
    const nested = Array.isArray(hero.recruitments) ? hero.recruitments : [];
    const apiEvents = Array.isArray(hero.events) ? hero.events : [];
    const apiCourses = Array.isArray(hero.courses) ? hero.courses : [];
    const event =
      apiEvents.find((e) => (e.type || 'event') === 'event') ||
      nested.find((r) => r.type === 'event') ||
      null;
    const activity =
      apiEvents.find((e) => e.type === 'activity') ||
      nested.find((r) => r.type === 'activity') ||
      null;
    const course =
      apiCourses[0] ||
      nested.find((r) => r.type === 'course') ||
      null;
    return { event, activity, course };
  }

  function statusLabel(raw, fallback) {
    const s = String(raw || '').trim();
    if (!s) return fallback;
    if (/[\u4e00-\u9fff]/.test(s)) return s;
    const map = {
      recruiting: fallback === '报名中' ? '报名中' : '招募中',
      ongoing: '进行中',
      closed: '已满员',
      ended: '已结束',
      draft: '草稿',
    };
    return map[s] || s;
  }

  function rowLinks(hero) {
    const { event, activity, course } = pickEventActivityCourse(hero);
    const rows = [];
    if (event) {
      const id = event.recruit_id || event.id || event.target_id;
      const title = event.title || '';
      const status = statusLabel(event.status_label || event.status, '招募中');
      rows.push(
        `<a class="hero-card__row nav-forward" href="recruitment-detail.html?id=${escapeHtml(id)}"><span class="tag tag--event">赛事</span><span class="hero-card__row-text">${escapeHtml(status)} | ${escapeHtml(title)}</span><span class="hero-card__row-arrow">›</span></a>`,
      );
    }
    if (activity) {
      const id = activity.recruit_id || activity.id || activity.target_id;
      const title = activity.title || '';
      const status = statusLabel(activity.status_label || activity.status, '报名中');
      rows.push(
        `<a class="hero-card__row nav-forward" href="recruitment-detail.html?id=${escapeHtml(id)}"><span class="tag tag--activity">活动</span><span class="hero-card__row-text">${escapeHtml(status)} | ${escapeHtml(title)}</span><span class="hero-card__row-arrow">›</span></a>`,
      );
    }
    if (course) {
      const id = course.course_id || course.id || course.target_id;
      const title = course.title || '';
      rows.push(
        `<a class="hero-card__row nav-forward" href="course-detail.html?id=${escapeHtml(id)}"><span class="tag tag--course">课程</span><span class="hero-card__row-text">${escapeHtml(title)}</span><span class="hero-card__row-arrow">›</span></a>`,
      );
    }
    return rows.join('');
  }

  function enrichHeroes(heroes, recruitments, courses) {
    const enriched = heroes.map((h) => {
      const hid = String(h.hero_id || h.id);
      const fromApiEvents = (recruitments || []).filter(
        (r) => String(r.hero_id || '') === hid && (r.type === 'event' || !r.type),
      );
      const fromApiActivities = (recruitments || []).filter(
        (r) => String(r.hero_id || '') === hid && r.type === 'activity',
      );
      const fromApiCourses = (courses || []).filter((c) => String(c.hero_id || '') === hid);
      const nested = h.recruitments || [];
      const nestedCourses = h.courses || [];
      return {
        ...h,
        events: (fromApiEvents.length
          ? fromApiEvents
          : nested.filter((r) => r.type === 'event' || !r.type)
        )
          .slice(0, 1)
          .concat(
            (fromApiActivities.length
              ? fromApiActivities
              : nested.filter((r) => r.type === 'activity')
            ).slice(0, 1),
          ),
        courses: (fromApiCourses.length
          ? fromApiCourses
          : nestedCourses.length
            ? nestedCourses
            : nested.filter((r) => r.type === 'course')
        ).slice(0, 1),
      };
    });
    return enriched.sort((a, b) => {
      const score = (h) =>
        (h.events && h.events.length ? 1 : 0) + (h.courses && h.courses.length ? 1 : 0);
      return score(b) - score(a);
    });
  }

  function cardHtml(hero) {
    const id = hero.hero_id || hero.id;
    const name = hero.nickname || hero.name || '英雄';
    const types = (hero.project_types || []).join(',');
    const years = hero.years_exp || '';
    const rating = hero.rating != null ? hero.rating : '';
    const bio = hero.about_me || hero.bio || '';
    const honors = (hero.honor_titles || []).join(',');
    const rows = rowLinks(hero);
    return (
      `<div class="hero-card hero-card--list" data-hero-id="${escapeHtml(id)}" data-name="${escapeHtml(hero.name || name)}" data-nickname="${escapeHtml(name)}" data-types="${escapeHtml(types)}" data-years="${escapeHtml(years)}" data-rating="${escapeHtml(rating)}" data-bio="${escapeHtml(bio)}" data-honors="${escapeHtml(honors)}">` +
      `<a class="hero-card__head nav-forward" href="hero-detail.html?id=${escapeHtml(id)}">` +
      `<div class="hero-card__avatar"><img src="${avatarSrc(hero)}" alt="${escapeHtml(name)}"></div>` +
      `<div class="hero-card__meta"><div class="hero-card__name-row"><span class="hero-card__name">${escapeHtml(name)}</span>${typeTags(hero)}</div>` +
      `<div class="hero-card__honors">${honorHtml(hero)}</div></div></a>` +
      (rows ? `<div class="hero-card__rows">${rows}</div>` : '') +
      `</div>`
    );
  }

  function setEmptyVisible(show, mode) {
    if (!empty) return;
    empty.style.display = show ? 'flex' : 'none';
    const title = empty.querySelector('.heroes-empty-state__title');
    const hint = empty.querySelector('.heroes-empty-state__hint');
    const iconImg = empty.querySelector('.heroes-empty-state__icon img');
    if (!show) return;
    if (mode === 'search') {
      if (title) title.textContent = '未找到相关教练和项目';
      if (hint) {
        hint.style.display = '';
        hint.textContent = '试试调整搜索词';
      }
      if (iconImg) iconImg.src = '../assets/icons/search.png';
      return;
    }
    if (mode === 'filter') {
      if (title) title.textContent = '广场暂无数据';
      if (hint) {
        hint.style.display = 'none';
        hint.textContent = '';
      }
      if (iconImg) iconImg.src = '../assets/icons/empty.png';
      return;
    }
    if (title) title.textContent = '广场暂无数据';
    if (hint) {
      hint.style.display = 'none';
      hint.textContent = '';
    }
    if (iconImg) iconImg.src = '../assets/icons/empty.png';
  }

  function showPlazaEmpty() {
    list.innerHTML = '';
    list.style.display = 'none';
    setEmptyVisible(true, 'plaza');
    document.dispatchEvent(new CustomEvent('heroes-list-updated'));
  }

  function loadFromMock() {
    const heroes =
      typeof window.listPlazaHeroesMock === 'function'
        ? window.listPlazaHeroesMock().filter((h) => h && (h.enabled !== false || h.stale_list_demo))
        : [];
    if (!heroes.length) {
      // 无 mock 时保留 HTML 静态兜底
      list.style.display = '';
      setEmptyVisible(false);
      document.dispatchEvent(new CustomEvent('heroes-list-updated'));
      return false;
    }
    const enriched = enrichHeroes(heroes, [], []);
    list.innerHTML = enriched.map(cardHtml).join('');
    list.style.display = '';
    setEmptyVisible(false);
    document.dispatchEvent(new CustomEvent('heroes-list-updated'));
    return true;
  }

  async function loadFromApi() {
    // 业务 API 已移除：英雄广场固定走本地 mock（与首页英雄区同源）
    return loadFromMock();
  }

  function refreshIfVisible() {
    if (document.hidden) return;
    loadFromApi();
  }

  /** 预览端模拟下拉刷新（对齐小程序 enablePullDownRefresh） */
  function bindPullToRefresh() {
    const scroller = document.querySelector('.content.content--tab') || document.querySelector('.content');
    if (!scroller) return;
    let startY = 0;
    let pulling = false;
    let refreshing = false;
    const THRESHOLD = 56;

    let hint = scroller.querySelector('.heroes-ptr-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'heroes-ptr-hint';
      hint.setAttribute('aria-hidden', 'true');
      hint.textContent = '下拉刷新';
      scroller.insertBefore(hint, scroller.firstChild);
    }

    scroller.addEventListener(
      'touchstart',
      (e) => {
        if (refreshing || scroller.scrollTop > 0) return;
        startY = e.touches[0].clientY;
        pulling = true;
      },
      { passive: true },
    );

    scroller.addEventListener(
      'touchmove',
      (e) => {
        if (!pulling || refreshing) return;
        const dy = e.touches[0].clientY - startY;
        if (dy <= 0 || scroller.scrollTop > 0) {
          hint.classList.remove('heroes-ptr-hint--ready', 'heroes-ptr-hint--show');
          return;
        }
        hint.classList.add('heroes-ptr-hint--show');
        hint.classList.toggle('heroes-ptr-hint--ready', dy >= THRESHOLD);
        hint.textContent = dy >= THRESHOLD ? '松开刷新' : '下拉刷新';
      },
      { passive: true },
    );

    scroller.addEventListener(
      'touchend',
      async () => {
        if (!pulling || refreshing) return;
        const shouldRefresh = hint.classList.contains('heroes-ptr-hint--ready');
        pulling = false;
        hint.classList.remove('heroes-ptr-hint--ready', 'heroes-ptr-hint--show');
        hint.textContent = '下拉刷新';
        if (!shouldRefresh) return;
        refreshing = true;
        hint.classList.add('heroes-ptr-hint--show');
        hint.textContent = '刷新中…';
        try {
          await loadFromApi();
        } finally {
          refreshing = false;
          hint.classList.remove('heroes-ptr-hint--show');
          hint.textContent = '下拉刷新';
        }
      },
      { passive: true },
    );
  }

  window.HeroesListPreview = { refresh: loadFromApi };

  loadFromApi();
  bindPullToRefresh();
  window.addEventListener('focus', refreshIfVisible);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshIfVisible();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'hero_plaza_heroes_updated') refreshIfVisible();
  });
})();