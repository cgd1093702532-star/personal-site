/** 首页英雄横滑 · 与后台「英雄管理」同源；教练卡 + 赛事/活动/课程行 */
(function () {
  const section = document.getElementById('home-heroes-section');
  const track = document.getElementById('home-hero-track');
  if (!track || !window.HeroPlazaDB) return;

  const imgBase = '../assets/images/';
  const fallbackHtml = track.innerHTML;

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function truncateLabel(text, maxLen = 6) {
    const s = String(text || '');
    return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
  }

  function avatarSrc(hero) {
    const img = hero.avatar_img || hero.avatar || 'hero-1.jpg';
    if (String(img).startsWith('http') || String(img).startsWith('../') || String(img).startsWith('/')) {
      return img;
    }
    return `${imgBase}${img}`;
  }

  function displayName(hero) {
    return hero.nickname || hero.name || '英雄';
  }

  function typeTags(hero) {
    return (hero.project_types || [])
      .slice(0, 3)
      .map((t) => `<span class="tag tag--skill">${escapeHtml(truncateLabel(t))}</span>`)
      .join('');
  }

  function yearsHonor(hero) {
    const y = hero.years_exp;
    if (y == null || y === '') return '';
    const s = String(y).trim();
    if (!s) return '';
    if (/经验/.test(s)) return s.replace(/执教经验/, '经验');
    if (/年/.test(s)) return s.includes('经验') ? s : `${s.replace(/年.*/, '年')}经验`;
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
      `<div class="hero-card__honors"><span class="hero-card__honor hero-card__honor--primary">` +
      `<span class="hero-card__honor-icon"><img class="hero-card__honor-icon-img" src="../assets/icons/crown.png" alt=""></span>` +
      `<span class="hero-card__honor-text">${escapeHtml(primary)}</span></span>`;
    if (secondary) {
      html +=
        `<span class="hero-card__honor hero-card__honor--secondary">` +
        `<span class="hero-card__honor-text">${escapeHtml(secondary)}</span></span>`;
    }
    html += '</div>';
    return html;
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

  function taggedRow(href, type, text) {
    const labels = { event: '赛事', activity: '活动', course: '课程' };
    const label = labels[type] || '活动';
    return (
      `<a class="hero-card__row nav-forward" href="${href}">` +
      `<span class="tag tag--${type}">${label}</span>` +
      `<span class="hero-card__row-text">${escapeHtml(text)}</span>` +
      `<span class="hero-card__row-arrow">›</span></a>`
    );
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
      const quota = event.quota_text || event.signup_hint || '';
      let quotaText = quota;
      if (!quotaText && event.total != null) {
        const left = Math.max(0, Number(event.total) - Number(event.signed || 0));
        if (left > 0) quotaText = `招募${left}人`;
      }
      const text = quotaText ? `${status} | ${title} ${quotaText}` : `${status} | ${title}`;
      rows.push(
        taggedRow(`recruitment-detail.html?id=${escapeHtml(id)}&from=home`, 'event', text),
      );
    }
    if (activity) {
      const id = activity.recruit_id || activity.id || activity.target_id;
      const title = activity.title || '';
      const status = statusLabel(activity.status_label || activity.status, '报名中');
      rows.push(
        taggedRow(
          `activity-detail.html?id=${escapeHtml(id)}&from=home`,
          'activity',
          `${status} | ${title}`,
        ),
      );
    }
    if (course) {
      const id = course.course_id || course.id || course.target_id;
      const title = course.title || '';
      rows.push(taggedRow(`course-detail.html?id=${escapeHtml(id)}&from=home`, 'course', title));
    }
    return rows.join('');
  }

  function cardHtml(hero) {
    const id = hero.hero_id || hero.id;
    const name = displayName(hero);
    const rows = rowLinks(hero);
    return (
      `<div class="hero-card hero-card--home" data-hero-id="${escapeHtml(id)}">` +
      `<a class="hero-card__head nav-forward" href="hero-detail.html?id=${escapeHtml(id)}">` +
      `<div class="hero-card__avatar"><img src="${avatarSrc(hero)}" alt="${escapeHtml(name)}"></div>` +
      `<div class="hero-card__meta"><div class="hero-card__name-row"><span class="hero-card__name">${escapeHtml(name)}</span>${typeTags(hero)}</div>` +
      `${honorHtml(hero)}</div></a>` +
      (rows ? `<div class="hero-card__rows">${rows}</div>` : '') +
      `</div>`
    );
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

  function setSectionVisible(visible) {
    if (!section) return;
    section.hidden = !visible;
    section.style.display = visible ? '' : 'none';
  }

  async function load() {
    try {
      const heroes =
        typeof window.listPlazaHeroesMock === 'function'
          ? window.listPlazaHeroesMock().filter((h) => h && h.enabled !== false)
          : [];
      if (!heroes.length) {
        setSectionVisible(/class="hero-card[\s"]/.test(fallbackHtml));
        return;
      }
      setSectionVisible(true);
      const enriched = enrichHeroes(heroes.slice(0, 8), [], []);
      track.innerHTML = enriched.map(cardHtml).join('');
    } catch (err) {
      console.warn('[home-heroes] mock 加载失败', err);
      setSectionVisible(/class="hero-card[\s"]/.test(fallbackHtml));
    }
  }

  load();
  window.addEventListener('focus', load);
  window.addEventListener('storage', (e) => {
    if (e.key === 'hero_plaza_heroes_updated') load();
  });
})();
