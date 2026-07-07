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
      },
    ],
  };

  let lists = { active: [], ended: [] };
  let activeTab = 'active';

  const EMPTY_STATES = {
    active: {
      icon: '📚',
      title: '暂无进行中的课程',
      hint: '发布课程，开始招募学员',
    },
    ended: {
      icon: '✅',
      title: '暂无已结束的课程',
      hint: '已结束的课程会显示在这里，方便查看历史记录',
    },
  };

  function formatTabDisplay(label, count) {
    return count > 0 ? `${label}(${count})` : label;
  }

  function enrichCourse(course) {
    const total = course.total ?? course.headcount ?? 0;
    const signed = course.signed ?? 0;
    const price = course.price ?? course.fee ?? 0;
    return {
      ...course,
      course_id: course.course_id || course.id,
      price,
      signed,
      total,
      progress: total ? Math.min(100, Math.round((signed / total) * 100)) : 0,
      timeDisplay: course.timeDisplay || course.time || '',
    };
  }

  function splitCourseLists(source) {
    const now = Date.now();
    const active = [];
    const ended = [];
    (source || []).forEach((raw) => {
      const item = enrichCourse(raw);
      if (item.listTab === 'ended') {
        ended.push({ ...item, listTab: 'ended' });
        return;
      }
      if (item.listTab === 'active') {
        active.push({ ...item, listTab: 'active' });
        return;
      }
      const endMs = item.end_at ? new Date(item.end_at).getTime() : null;
      if (endMs != null && !Number.isNaN(endMs) && endMs < now) {
        ended.push({ ...item, listTab: 'ended' });
      } else {
        active.push({ ...item, listTab: 'active' });
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
        const stored = (await window.HeroPlazaDB.getAppState('my_courses')) || [];
        stored.forEach((item) => {
          const id = item.course_id || item.id;
          if (id) map.set(id, { ...map.get(id), ...item });
        });
      } catch (err) {
        console.warn('[my-courses] 数据库加载失败，回退静态数据', err);
      }
    }
    return splitCourseLists([...map.values()]);
  }

  function emptyState(tab) {
    const state = EMPTY_STATES[tab] || EMPTY_STATES.active;
    return (
      `<div class="my-courses__empty">` +
      `<div class="my-courses__empty-icon">${state.icon}</div>` +
      `<div class="my-courses__empty-title">${state.title}</div>` +
      `<div class="my-courses__empty-hint">${state.hint}</div>` +
      `</div>`
    );
  }

  function card(item) {
    const badge = item.listTab === 'ended' ? `<span class="my-courses__badge">已结束</span>` : '';
    const progress =
      item.listTab !== 'ended'
        ? `<div class="my-courses__progress">` +
          `<span>已报名 ${item.signed}/${item.total}</span>` +
          `<div class="my-courses__bar"><div class="my-courses__bar-inner" style="width:${item.progress}%;"></div></div>` +
          `</div>`
        : '';
    return (
      `<article class="my-courses__card">` +
      `<div class="my-courses__card-head">` +
      `<span class="my-courses__title">${item.title}</span>` +
      badge +
      `</div>` +
      `<span class="my-courses__meta">${item.timeDisplay} · ${item.location}</span>` +
      `<span class="my-courses__price">¥${item.price}/人</span>` +
      progress +
      `</article>`
    );
  }

  function render() {
    const current = lists[activeTab] || [];
    const tabs = [
      { key: 'active', label: '进行中', count: lists.active.length },
      { key: 'ended', label: '已结束', count: lists.ended.length },
    ];
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
  }

  async function init() {
    lists = await loadLists();
    render();
  }

  init();
  window.addEventListener('preview:navigate', () => {
    init();
  });
})();
