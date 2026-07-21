/** 我的课程 · 预览页 */
(function () {
  const root = document.getElementById('my-courses-root');
  if (!root) return;

  const DEFAULT_MY_COURSE_LISTS = {
    active: [
      {
        course_id: 'c1',
        title: 'ASA101-103培训课',
        timeDisplay: '7月26日 09:00 - 16:30',
        location: '滴水湖二号码头',
        price: 1280,
        signed: 10,
        total: 16,
        start_at: '2026-07-26T09:00:00',
        end_at: '2026-07-26T16:30:00',
        listTab: 'active',
        is_mine: true,
      },
      {
        course_id: 'c4',
        title: '周末帆船体验课',
        timeDisplay: '8月3日 14:00 - 17:00',
        location: '滴水湖帆船基地',
        price: 680,
        signed: 6,
        total: 12,
        start_at: '2026-08-03T14:00:00',
        end_at: '2026-08-03T17:00:00',
        listTab: 'active',
        is_mine: false,
      },
    ],
    ended: [
      {
        course_id: 'c9',
        title: '冬季帆船入门课',
        timeDisplay: '2025/12/01',
        location: '滴水湖',
        price: 880,
        signed: 12,
        total: 12,
        start_at: '2025-12-01T09:00:00',
        end_at: '2025-12-01T17:00:00',
        listTab: 'ended',
        is_mine: true,
      },
    ],
  };

  let lists = { active: [], ended: [] };
  let activeTab = 'active';
  let onlyMine = false;
  let showOnlyMineFilter = false;

  const EMPTY_STATES = {
    active: {
      icon: '../assets/icons/book.png',
      title: '暂无进行中的课程',
      hint: '可从个人中心「申请课程」发布',
    },
    ended: {
      icon: '../assets/icons/check.png',
      title: '暂无已结束的课程',
      hint: '已结束的课程会显示在这里，方便查看历史记录',
    },
  };

  function formatTabDisplay(label, count) {
    return count > 0 ? `${label}(${count})` : label;
  }

  function parseDate(value) {
    if (!value) return null;
    const d = new Date(String(value).replace(/-/g, '/').replace('T', ' '));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatCardTimeRange(startAt, endAt) {
    const start = parseDate(startAt);
    const end = parseDate(endAt);
    if (!start) return '';
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

  function formatQuota(signed, total, item) {
    const s = Number(signed) || 0;
    const hasTotal = total != null && total !== '';
    const t = hasTotal ? Number(total) : NaN;
    const base = Number.isFinite(t) ? `招募名额：${s}/${t}` : `招募名额：${s}/不限`;
    if (item && item.listTab === 'ended') {
      return `${base} · 已结束`;
    }
    const full = Number.isFinite(t) && s >= t && t > 0;
    const status = full ? '已招满' : '进行中';
    return `${base} · ${status}`;
  }

  function resolveCoverSrc(course) {
    const raw =
      (course.cover_images && course.cover_images[0]) ||
      course.cover_image ||
      (course.banner_images && course.banner_images[0]) ||
      'course.jpg';
    const s = String(raw);
    if (s.startsWith('http') || s.startsWith('../') || s.startsWith('/') || s.startsWith('data:')) {
      return s.replace(/^\/assets\//, '../assets/');
    }
    const file = s.includes('.') ? s : `${s}.jpg`;
    return `../assets/images/${file}`;
  }

  function enrichCourse(course) {
    const total = course.total ?? course.headcount ?? 0;
    const signed = course.signed ?? 0;
    const price = course.price ?? course.fee ?? 0;
    const startAt = course.start_at || '';
    const endAt = course.end_at || '';
    const timeDisplay =
      formatCardTimeRange(startAt, endAt) ||
      course.timeDisplay ||
      course.time ||
      '';
    /** is_mine=false → 我参与的；缺省/true → 我发起的 */
    const isMine = course.is_mine !== false;
    const listTab = course.listTab || 'active';
    return {
      ...course,
      course_id: course.course_id || course.id,
      type: 'course',
      typeLabel: course.typeLabel || '课程',
      price,
      signed,
      total,
      progress: total ? Math.min(100, Math.round((signed / total) * 100)) : 0,
      timeDisplay,
      placeLabel: '课程地点',
      listTab,
      quotaText: formatQuota(signed, total, { listTab }),
      coverSrc: resolveCoverSrc(course),
      isMine,
      relationLabel: isMine ? '我发起的' : '我参与的',
      canViewSignup: isMine,
    };
  }

  function splitCourseLists(source) {
    const now = Date.now();
    const active = [];
    const ended = [];
    (source || []).forEach((raw) => {
      const item = enrichCourse(raw);
      const push = (tab, list) => {
        const row = {
          ...item,
          listTab: tab,
          quotaText: formatQuota(item.signed, item.total, { listTab: tab }),
        };
        list.push(row);
      };
      if (item.listTab === 'ended') {
        push('ended', ended);
        return;
      }
      if (item.listTab === 'active') {
        push('active', active);
        return;
      }
      const endMs = item.end_at ? new Date(item.end_at).getTime() : null;
      if (endMs != null && !Number.isNaN(endMs) && endMs < now) {
        push('ended', ended);
      } else {
        push('active', active);
      }
    });
    return window.sortMyCourseLists
      ? window.sortMyCourseLists({ active, ended })
      : { active, ended };
  }

  async function loadLists() {
    const defaults = [...DEFAULT_MY_COURSE_LISTS.active, ...DEFAULT_MY_COURSE_LISTS.ended];
    const map = new Map();
    defaults.forEach((item) => map.set(item.course_id, item));
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        const stored = (await window.HeroPlazaDB.listCourses({ hero_id: '1' })) || [];
        stored.forEach((item) => {
          const id = item.course_id || item.id;
          if (!id) return;
          map.set(id, { ...map.get(id), ...item });
        });
      } catch (err) {
        console.warn('[my-courses] 数据库加载失败，回退静态数据', err);
      }
    }
    return splitCourseLists([...map.values()]);
  }

  function visibleItems(tab) {
    const all = lists[tab] || [];
    if (!onlyMine) return all;
    return all.filter((item) => item.isMine !== false);
  }

  function emptyState(tab) {
    const state = EMPTY_STATES[tab] || EMPTY_STATES.active;
    return (
      `<div class="my-courses__empty">` +
      `<div class="my-courses__empty-icon"><img src="${state.icon}" alt=""></div>` +
      `<div class="my-courses__empty-title">${state.title}</div>` +
      `<div class="my-courses__empty-hint">${state.hint}</div>` +
      `</div>`
    );
  }

  function card(item) {
    const id = encodeURIComponent(item.course_id || '');
    const title = encodeURIComponent(item.title || '课程报名');
    const ended = item.listTab === 'ended';
    const muted = ended ? ' my-courses__fee--muted' : '';
    const quotaText = formatQuota(item.signed, item.total, item);
    const membersBtn = item.canViewSignup
      ? `<div class="my-courses__actions">` +
        `<a class="my-courses__btn my-courses__btn--primary nav-forward" href="signup-list.html?course_id=${id}&title=${title}">已报名成员</a>` +
        `</div>`
      : '';
    return (
      `<article class="my-courses__card${ended ? ' my-courses__card--ended' : ''}" data-href="course-detail.html?id=${id}" role="link" tabindex="0">` +
      `<div class="my-courses__relation">${item.relationLabel || '我发起的'}</div>` +
      `<div class="my-courses__main">` +
      `<div class="my-courses__cover"><img class="my-courses__cover-img" src="${item.coverSrc}" alt=""></div>` +
      `<div class="my-courses__info">` +
      `<div class="my-courses__info-top">` +
      `<h3 class="my-courses__title">${item.title}</h3>` +
      `<span class="my-courses__type-tag my-courses__type-tag--course">${item.typeLabel || '课程'}</span>` +
      `</div>` +
      `<div class="my-courses__time">${item.timeDisplay || ''}</div>` +
      `<div class="my-courses__place">${item.placeLabel || '课程地点'}：${item.location || '地点待定'}</div>` +
      `<div class="my-courses__fee${muted}">¥${item.price}/人</div>` +
      `</div></div>` +
      `<div class="my-courses__bar">` +
      `<span class="my-courses__quota">${quotaText}</span>` +
      membersBtn +
      `</div>` +
      `</article>`
    );
  }

  async function resolveShowOnlyMineFilter() {
    try {
      if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
        const res = await window.HeroPlazaDB.getHeroApplyStatus();
        return res && res.status === 'approved' && res.hero_enabled !== false;
      }
    } catch (err) {
      console.warn('[my-courses] 身份读取失败', err);
    }
    // 预览无 API 时默认展示（本页面向已认证英雄）
    return true;
  }

  function render() {
    const current = visibleItems(activeTab);
    const tabs = [
      { key: 'active', label: '进行中', count: visibleItems('active').length },
      { key: 'ended', label: '已结束', count: visibleItems('ended').length },
    ];
    const checkIcon = onlyMine
      ? `<img class="my-courses__filter-check" src="../assets/icons/check-primary.png" alt="">`
      : '';
    const toolbar = showOnlyMineFilter
      ? `<div class="my-courses__toolbar">` +
        `<button type="button" class="my-courses__filter${onlyMine ? ' my-courses__filter--on' : ''}" data-filter-mine aria-pressed="${onlyMine ? 'true' : 'false'}">` +
        `<span class="my-courses__filter-box">${checkIcon}</span>` +
        `<span class="my-courses__filter-label">仅显示我发起的</span>` +
        `</button></div>`
      : '';
    root.innerHTML =
      `<div class="my-courses">` +
      `<div class="my-courses__tabs">` +
      tabs
        .map(
          (tab) =>
            `<button type="button" class="my-courses__tab${activeTab === tab.key ? ' my-courses__tab--active' : ''}" data-tab="${tab.key}">${formatTabDisplay(tab.label, tab.count)}</button>`,
        )
        .join('') +
      `</div>` +
      toolbar +
      `<div class="my-courses__list">` +
      (current.length ? current.map(card).join('') : emptyState(activeTab)) +
      `</div>` +
      `</div>`;

    root.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });

    root.querySelector('[data-filter-mine]')?.addEventListener('click', () => {
      onlyMine = !onlyMine;
      render();
    });
  }

  async function init() {
    showOnlyMineFilter = await resolveShowOnlyMineFilter();
    if (!showOnlyMineFilter) onlyMine = false;
    lists = await loadLists();
    render();
  }

  init();
  window.addEventListener('preview:navigate', () => {
    init();
  });
})();
