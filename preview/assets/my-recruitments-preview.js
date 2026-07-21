/** 我的招募 · 预览页（从本地数据库加载） */
(function () {
  const root = document.getElementById('my-recruitments-root');
  if (!root) return;

  const BADGE_MAP = {
    recruiting: { label: '报名中', type: 'recruiting' },
    ongoing: { label: '进行中', type: 'ongoing' },
    closed: { label: '已截止', type: 'closed' },
    ended: { label: '已结束', type: 'ended' },
    draft: { label: '草稿', type: 'draft' },
  };

  let lists = { active: [], ended: [], draft: [] };
  let activeTab = 'active';
  let onlyMine = false;
  /** 已认证英雄才展示「仅显示我发起的」 */
  let showOnlyMineFilter = false;

  const EMPTY_STATES = {
    draft: {
      icon: '../assets/icons/edit.png',
      title: '暂无草稿',
      hint: '创建赛事招募后可保存为草稿，方便稍后继续编辑',
      actionText: '发布赛事招募',
      actionHref: 'recruitment-create.html',
    },
    active: {
      icon: '../assets/icons/announce.png',
      title: '暂无进行中的招募',
      hint: '发布赛事招募，开始招募学员与参赛选手',
      actionText: '发布赛事招募',
      actionHref: 'recruitment-create.html',
    },
    ended: {
      icon: '../assets/icons/list.png',
      title: '暂无已结束的招募',
      hint: '已结束的活动会显示在这里，方便查看历史数据',
      actionText: '',
      actionHref: '',
    },
  };

  function parseDate(value) {
    if (!value) return null;
    const d = new Date(String(value).replace(/-/g, '/').replace('T', ' '));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /** 与发布赛事招募列表一致：如「06/08 (周六) 09:00-16:00」 */
  function formatCardTimeRange(startAt, endAt) {
    const start = parseDate(startAt);
    const end = parseDate(endAt);
    if (!start) return startAt || '';
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const pad = (n) => String(n).padStart(2, '0');
    const startPart = `${pad(start.getMonth() + 1)}/${pad(start.getDate())} (${weekdays[start.getDay()]}) ${pad(start.getHours())}:${pad(start.getMinutes())}`;
    if (!end) return startPart;
    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();
    if (sameDay) return `${startPart}-${pad(end.getHours())}:${pad(end.getMinutes())}`;
    return `${startPart}-${pad(end.getMonth() + 1)}/${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }

  function formatQuota(signed, total, item) {
    const s = Number(signed) || 0;
    const hasTotal = total != null && total !== '';
    const t = hasTotal ? Number(total) : NaN;
    const base = Number.isFinite(t) ? `招募名额：${s}/${t}` : `招募名额：${s}/不限`;
    // 已结束 Tab / 活动已结束 → 已结束；报名截止(closed) → 已招满
    if (item && (item.listTab === 'ended' || item.displayStatus === 'ended')) {
      return `${base} · 已结束`;
    }
    if (item && item.displayStatus === 'closed') {
      return `${base} · 已招满`;
    }
    const full = Number.isFinite(t) && s >= t && t > 0;
    const status = full ? '已招满' : '进行中';
    return `${base} · ${status}`;
  }

  function placeLabelForType(type) {
    if (type === 'activity') return '活动地点';
    if (type === 'course') return '课程地点';
    return '赛事地点';
  }

  /** is_mine=false → 我参加的；缺省/true → 我发起的 */
  function resolveRelation(item) {
    const isMine = item.is_mine !== false;
    return {
      isMine,
      relationLabel: isMine ? '我发起的' : '我参加的',
      canViewSignup: isMine,
    };
  }

  function enrichItem(item) {
    const badge = BADGE_MAP[item.displayStatus] || BADGE_MAP.recruiting;
    let actionType = 'active';
    if (item.listTab === 'draft') actionType = 'draft';
    else if (
      item.listTab === 'ended' ||
      item.displayStatus === 'closed' ||
      item.displayStatus === 'ended'
    ) {
      actionType = 'closed';
    }
    const cover = (item.cover_images && item.cover_images[0]) || 'recruit-cover.jpg';
    const type = item.type === 'activity' ? 'activity' : item.type === 'course' ? 'course' : 'event';
    const typeLabel =
      item.typeLabel || (type === 'activity' ? '活动' : type === 'course' ? '课程' : '赛事');
    const relation = resolveRelation(item);
    return {
      ...item,
      type,
      badgeLabel: badge.label,
      badgeType: badge.type,
      actionType,
      typeLabel,
      placeLabel: placeLabelForType(type),
      quotaText: formatQuota(item.signed, item.total, {
        listTab: item.listTab,
        displayStatus: item.displayStatus,
      }),
      coverSrc: cover.startsWith('http') || cover.startsWith('../') || cover.startsWith('/')
        ? cover
        : `../assets/images/${cover}`,
      timeDisplay: formatCardTimeRange(item.start_at, item.end_at) || item.timeDisplay || '',
      ...relation,
    };
  }

  async function loadLists() {
    let raw = null;
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        raw = await window.HeroPlazaDB.getMyRecruitmentLists();
      } catch (err) {
        console.warn('[my-recruitments] 数据库加载失败，回退静态数据', err);
      }
    }
    if (!raw && window.getMyRecruitmentLists) {
      raw = window.getMyRecruitmentLists();
    }
    const data = window.sortMyRecruitmentLists
      ? window.sortMyRecruitmentLists(raw || { active: [], ended: [], draft: [] })
      : raw || { active: [], ended: [], draft: [] };
    return {
      active: (data.active || []).map(enrichItem),
      ended: (data.ended || []).map(enrichItem),
      draft: (data.draft || []).map(enrichItem),
    };
  }

  function emptyState(tab) {
    const state = EMPTY_STATES[tab] || EMPTY_STATES.active;
    const actionBtn = state.actionText
      ? `<a class="my-recruit__empty-btn nav-forward" href="${state.actionHref}">${state.actionText}</a>`
      : '';
    return (
      `<div class="my-recruit__empty">` +
      `<div class="my-recruit__empty-icon"><img src="${state.icon}" alt=""></div>` +
      `<div class="my-recruit__empty-title">${state.title}</div>` +
      `<div class="my-recruit__empty-hint">${state.hint}</div>` +
      actionBtn +
      `</div>`
    );
  }

  function actions(item) {
    const titleQ = encodeURIComponent(item.title || '');
    const signedQ = `&signed=${encodeURIComponent(Number(item.signed) || 0)}`;
    const idQ = item.recruit_id ? `&id=${encodeURIComponent(item.recruit_id)}` : '';
    if (item.actionType === 'active' || item.actionType === 'closed') {
      if (!item.canViewSignup) return '';
      return (
        `<div class="my-recruit__actions">` +
        `<a class="my-recruit__btn my-recruit__btn--primary nav-forward" href="signup-list.html?title=${titleQ}${signedQ}${idQ}">已报名人员</a>` +
        `</div>`
      );
    }
    return (
      `<div class="my-recruit__actions">` +
      `<a class="my-recruit__btn my-recruit__btn--primary nav-forward" href="recruitment-edit.html?id=${item.recruit_id}">继续编辑</a>` +
      `<button type="button" class="my-recruit__btn my-recruit__btn--outline" data-delete-id="${item.recruit_id}" data-delete="${item.title}">删除</button>` +
      `</div>`
    );
  }

  function draftCard(item) {
    const loc = item.location
      ? `<div class="my-recruit__row"><img class="my-recruit__row-icon" src="../assets/icons/location.png" alt=""><span class="my-recruit__row-text">${item.location}</span></div>`
      : '';
    return (
      `<article class="my-recruit__card my-recruit__card--draft">` +
      `<div class="my-recruit__relation">${item.relationLabel || '我发起的'}</div>` +
      `<div class="my-recruit__draft-head">` +
      `<div class="my-recruit__draft-icon-wrap"><img class="my-recruit__draft-icon" src="../assets/icons/edit.png" alt=""></div>` +
      `<div class="my-recruit__draft-body"><h3 class="my-recruit__title">${item.title}</h3>` +
      `<span class="my-recruit__draft-hint">未发布 · 信息待完善</span></div>` +
      `<span class="my-recruit__badge my-recruit__badge--draft">${item.badgeLabel}</span></div>` +
      `<div class="my-recruit__draft-meta">${loc}` +
      `<span class="my-recruit__draft-plan">计划招募 ${item.total} 人 · ¥${item.fee}/人</span></div>` +
      actions(item) +
      `</article>`
    );
  }

  function card(item) {
    if (item.actionType === 'draft') return draftCard(item);
    // 仅活动已结束才灰化；报名截止(closed)/已招满仍用进行中卡色
    const ended = item.listTab === 'ended' || item.displayStatus === 'ended';
    const muted = ended ? ' my-recruit__fee--muted' : '';
    const detailPage = item.type === 'activity' ? 'activity-detail.html' : 'recruitment-detail.html';
    return (
      `<article class="my-recruit__card${ended ? ' my-recruit__card--ended' : ''}" data-href="${detailPage}?id=${item.recruit_id}">` +
      `<div class="my-recruit__relation">${item.relationLabel || '我发起的'}</div>` +
      `<div class="my-recruit__main">` +
      `<div class="my-recruit__cover">` +
      `<img class="my-recruit__cover-img" src="${item.coverSrc}" alt="">` +
      `</div>` +
      `<div class="my-recruit__info">` +
      `<div class="my-recruit__info-top">` +
      `<h3 class="my-recruit__title">${item.title}</h3>` +
      `<span class="my-recruit__type-tag my-recruit__type-tag--${item.type}">${item.typeLabel || '赛事'}</span>` +
      `</div>` +
      `<div class="my-recruit__time">${item.timeDisplay || ''}</div>` +
      `<div class="my-recruit__place">${item.placeLabel}：${item.location || '地点待定'}</div>` +
      `<div class="my-recruit__fee${muted}">¥${item.fee}/人</div>` +
      `</div></div>` +
      `<div class="my-recruit__bar">` +
      `<span class="my-recruit__quota">${item.quotaText}</span>` +
      actions(item) +
      `</div>` +
      `</article>`
    );
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`确定删除草稿「${title}」？`)) return;
    if (!window.HeroPlazaDB) return;
    try {
      await window.HeroPlazaDB.deleteRecruitment(id);
      lists = await loadLists();
      render();
    } catch (err) {
      window.alert('删除失败');
      console.error(err);
    }
  }

  function tabDisplay(label, count) {
    return count > 0 ? `${label}(${count})` : label;
  }

  function visibleItems(tab) {
    const all = lists[tab] || [];
    if (!onlyMine) return all;
    return all.filter((item) => item.isMine !== false);
  }

  function render() {
    const rawCurrent = lists[activeTab] || [];
    const current = visibleItems(activeTab);
    const tabs = [
      { key: 'active', label: '进行中', count: visibleItems('active').length },
      { key: 'ended', label: '已结束', count: visibleItems('ended').length },
    ];
    const checkIcon = onlyMine
      ? `<img class="my-recruit__filter-check" src="../assets/icons/check-primary.png" alt="">`
      : '';
    // 当前 Tab 无数据（空态）时不展示筛选；筛选后变空仍展示，便于取消勾选
    const toolbar =
      showOnlyMineFilter && rawCurrent.length > 0
        ? `<div class="my-recruit__toolbar">` +
          `<button type="button" class="my-recruit__filter${onlyMine ? ' my-recruit__filter--on' : ''}" data-filter-mine aria-pressed="${onlyMine ? 'true' : 'false'}">` +
          `<span class="my-recruit__filter-box">${checkIcon}</span>` +
          `<span class="my-recruit__filter-label">仅显示我发起的</span>` +
          `</button></div>`
        : '';

    root.innerHTML =
      `<div class="my-recruit">` +
      `<div class="my-recruit__tabs"><div class="my-recruit__tabs-track">${tabs
        .map(
          (t) =>
            `<button type="button" class="my-recruit__tab${activeTab === t.key ? ' my-recruit__tab--active' : ''}" data-tab="${t.key}">${tabDisplay(t.label, t.count)}</button>`,
        )
        .join('')}</div></div>` +
      toolbar +
      `<div class="my-recruit__list">${current.map(card).join('') || emptyState(activeTab)}</div>` +
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

    root.querySelectorAll('[data-delete-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDelete(btn.dataset.deleteId, btn.dataset.delete);
      });
    });
    root.querySelectorAll('.my-recruit__actions a, .my-recruit__actions button').forEach((el) => {
      el.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  function applySessionTab() {
    const tab = sessionStorage.getItem('my-recruitments-tab');
    if (tab === 'active' || tab === 'ended') {
      activeTab = tab;
      sessionStorage.removeItem('my-recruitments-tab');
    } else if (tab === 'draft') {
      activeTab = 'active';
      sessionStorage.removeItem('my-recruitments-tab');
    }
  }

  async function resolveShowOnlyMineFilter() {
    try {
      if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
        const res = await window.HeroPlazaDB.getHeroApplyStatus();
        return res && res.status === 'approved' && res.hero_enabled !== false;
      }
    } catch (err) {
      console.warn('[my-recruitments] 身份读取失败', err);
    }
    return false;
  }

  async function refresh() {
    applySessionTab();
    showOnlyMineFilter = await resolveShowOnlyMineFilter();
    if (!showOnlyMineFilter) onlyMine = false;
    lists = await loadLists();
    render();
  }

  window.MyRecruitmentsPreview = { refresh };

  window.addEventListener('preview:navigate', (e) => {
    const url = (e.detail && e.detail.url) || '';
    if (url.includes('my-recruitments.html')) {
      refresh();
    }
  });

  refresh();
})();
