/** 我的报名 · 预览页（从本地数据库加载） */
(function () {
  const root = document.getElementById('my-signups-root');
  if (!root) return;

  const DEFAULT_MY_SIGNUPS = [
    { id: 'mock-s1', recruit_id: 'r1', title: '企业家杯月赛', status: '已报名', payStatus: '待支付', checked_in: false },
    {
      id: 'mock-s2',
      recruit_id: 'r2',
      title: '周末帆船体验营',
      status: '已报名',
      payStatus: '已支付',
      checked_in: true,
      checkin_at: '2026-07-07T10:00:00',
    },
    {
      id: 'mock-s3',
      recruit_id: 'r11',
      title: '春季企业团建帆船赛',
      status: '已完成',
      payStatus: '已支付',
      start_at: '2026-04-18T08:30:00',
      end_at: '2026-04-18T16:30:00',
    },
  ];

  window.getDefaultMySignups = () => DEFAULT_MY_SIGNUPS.map((item) => ({ ...item }));

  let lists = { active: [], ended: [] };
  let activeTab = 'active';

  const EMPTY_STATES = {
    active: {
      icon: '../assets/icons/list.png',
      title: '暂无进行中的报名',
      hint: '去首页看看热门招募，报名参加精彩水上活动',
    },
    ended: {
      icon: '../assets/icons/check.png',
      title: '暂无已结束的报名',
      hint: '已结束的活动会显示在这里，方便查看历史记录',
    },
  };

  function formatTabDisplay(label, count) {
    return count > 0 ? `${label}(${count})` : label;
  }

  function enrichSignup(signup, recruitment) {
    const rec = recruitment || {};
    const start_at = signup.start_at || rec.start_at;
    const end_at = signup.end_at || rec.end_at;
    return {
      ...signup,
      id: signup.id || `s-${signup.recruit_id}`,
      title: signup.title || rec.title || '',
      location: signup.location || rec.location || '',
      fee: signup.fee != null ? signup.fee : rec.fee,
      start_at,
      end_at,
      status: signup.status || '已报名',
      payStatus: signup.payStatus || signup.pay_status || '待支付',
      timeDisplay:
        signup.timeDisplay ||
        (window.formatRecruitmentTimeRange && start_at
          ? window.formatRecruitmentTimeRange(start_at, end_at)
          : signup.time || ''),
    };
  }

  function splitSignupLists(source, recruitments) {
    const recMap = {};
    (recruitments || []).forEach((rec) => {
      if (rec && rec.recruit_id) recMap[rec.recruit_id] = rec;
    });
    const now = Date.now();
    const active = [];
    const ended = [];
    (source || []).forEach((raw) => {
      const item = enrichSignup(raw, recMap[raw.recruit_id]);
      const endMs = item.end_at ? new Date(item.end_at).getTime() : null;
      if (endMs != null && !Number.isNaN(endMs) && endMs < now) {
        ended.push({ ...item, listTab: 'ended' });
      } else {
        active.push({ ...item, listTab: 'active' });
      }
    });
    return window.sortMySignupLists
      ? window.sortMySignupLists({ active, ended })
      : { active, ended };
  }

  async function loadLists() {
    let source = null;
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        source = (await window.HeroPlazaDB.listMySignups()) || [];
      } catch (err) {
        console.warn('[my-signups] 数据库加载失败，回退静态数据', err);
      }
    }
    if (!source || !source.length) source = DEFAULT_MY_SIGNUPS;

    const recruitIds = [...new Set(source.map((s) => s.recruit_id).filter(Boolean))];
    const recruitments = await Promise.all(
      recruitIds.map(async (id) => {
        if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
          try {
            return await window.HeroPlazaDB.getRecruitment(id);
          } catch (_) {
            return null;
          }
        }
        if (window.getRecruitmentById) return window.getRecruitmentById(id);
        return null;
      }),
    );
    return splitSignupLists(source, recruitments);
  }

  function emptyState(tab) {
    const state = EMPTY_STATES[tab] || EMPTY_STATES.active;
    return (
      `<div class="my-signup__empty">` +
      `<div class="my-signup__empty-icon"><img src="${state.icon}" alt=""></div>` +
      `<div class="my-signup__empty-title">${state.title}</div>` +
      `<div class="my-signup__empty-hint">${state.hint}</div>` +
      `</div>`
    );
  }

  function card(item) {
    const badgeLabel = item.listTab === 'ended' ? '已结束' : '进行中';
    const locationRow = item.location
      ? `<div class="my-signup__row"><img class="my-signup__row-icon" src="../assets/icons/location.png" alt=""><span class="my-signup__row-text">${item.location}</span></div>`
      : '';
    return (
      `<a class="my-signup__card nav-forward" href="${item.type === 'activity' ? 'activity-detail.html' : 'recruitment-detail.html'}?id=${item.recruit_id}">` +
      `<div class="my-signup__card-head">` +
      `<span class="my-signup__title">${item.title}</span>` +
      `<span class="my-signup__badge my-signup__badge--${item.listTab}">${badgeLabel}</span>` +
      `</div>` +
      `<div class="my-signup__row"><img class="my-signup__row-icon" src="../assets/icons/calendar.png" alt=""><span class="my-signup__row-text">${item.timeDisplay || '时间待定'}</span></div>` +
      locationRow +
      `<span class="my-signup__meta">¥${item.fee != null ? item.fee : '—'} · ${item.status} · ${item.payStatus}</span>` +
      `</a>`
    );
  }

  function render() {
    const current = lists[activeTab] || [];
    const tabs = [
      { key: 'active', label: '进行中', count: lists.active.length },
      { key: 'ended', label: '已结束', count: lists.ended.length },
    ];
    root.innerHTML =
      `<div class="my-signup">` +
      `<div class="my-signup__tabs">` +
      tabs
        .map(
          (tab) =>
            `<button type="button" class="my-signup__tab${activeTab === tab.key ? ' my-signup__tab--active' : ''}" data-tab="${tab.key}">${formatTabDisplay(tab.label, tab.count)}</button>`,
        )
        .join('') +
      `</div>` +
      `<div class="my-signup__list">` +
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
