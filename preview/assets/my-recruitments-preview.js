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

  const EMPTY_STATES = {
    draft: {
      icon: '📝',
      title: '暂无草稿',
      hint: '创建赛事招募后可保存为草稿，方便稍后继续编辑',
      actionText: '发布赛事招募',
      actionHref: 'recruitment-create.html',
    },
    active: {
      icon: '📢',
      title: '暂无进行中的招募',
      hint: '发布赛事招募，开始招募学员与参赛选手',
      actionText: '发布赛事招募',
      actionHref: 'recruitment-create.html',
    },
    ended: {
      icon: '📋',
      title: '暂无已结束的招募',
      hint: '已结束的活动会显示在这里，方便查看历史数据',
      actionText: '',
      actionHref: '',
    },
  };

  function enrichItem(item) {
    const badge = BADGE_MAP[item.displayStatus] || BADGE_MAP.recruiting;
    let actionType = 'active';
    if (item.listTab === 'draft') actionType = 'draft';
    else if (item.displayStatus === 'closed' || item.displayStatus === 'ended') actionType = 'closed';
    return {
      ...item,
      badgeLabel: badge.label,
      badgeType: badge.type,
      actionType,
      timeDisplay:
        item.timeDisplay ||
        (window.formatRecruitmentTimeRange
          ? window.formatRecruitmentTimeRange(item.start_at, item.end_at)
          : item.start_at),
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
      `<div class="my-recruit__empty-icon">${state.icon}</div>` +
      `<div class="my-recruit__empty-title">${state.title}</div>` +
      `<div class="my-recruit__empty-hint">${state.hint}</div>` +
      actionBtn +
      `</div>`
    );
  }

  function progress(signed, total) {
    return total ? Math.min(100, Math.round((signed / total) * 100)) : 0;
  }

  function actions(item) {
    if (item.actionType === 'active') {
      return (
        `<div class="my-recruit__actions">` +
        `<a class="my-recruit__btn my-recruit__btn--primary nav-forward" href="signup-list.html"><span class="my-recruit__btn-icon">👥</span><span>查看报名</span></a>` +
        `<a class="my-recruit__btn my-recruit__btn--outline nav-forward" href="recruitment-edit.html?id=${item.recruit_id}"><span class="my-recruit__btn-icon">✎</span><span>编辑</span></a>` +
        `<button type="button" class="my-recruit__btn my-recruit__btn--danger" data-unpublish-id="${item.recruit_id}" data-unpublish="${item.title}">下架</button>` +
        `</div>`
      );
    }
    if (item.actionType === 'closed') {
      return (
        `<div class="my-recruit__actions">` +
        `<a class="my-recruit__btn my-recruit__btn--primary nav-forward" href="signup-list.html"><span class="my-recruit__btn-icon">📋</span><span>查看名单</span></a>` +
        `<button type="button" class="my-recruit__btn my-recruit__btn--outline" data-stats>📊 数据</button>` +
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
      ? `<div class="my-recruit__row"><span class="my-recruit__row-icon">📍</span><span class="my-recruit__row-text">${item.location}</span></div>`
      : '';
    return (
      `<article class="my-recruit__card my-recruit__card--draft">` +
      `<div class="my-recruit__draft-head">` +
      `<div class="my-recruit__draft-icon-wrap">📝</div>` +
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
    const muted = item.badgeType === 'closed' || item.badgeType === 'ended' ? ' my-recruit__fee--muted' : '';
    const pct = progress(item.signed, item.total);
    return (
      `<article class="my-recruit__card" data-href="recruitment-detail.html?id=${item.recruit_id}">` +
      `<div class="my-recruit__card-head"><h3 class="my-recruit__title">${item.title}</h3>` +
      `<span class="my-recruit__badge my-recruit__badge--${item.badgeType}">${item.badgeLabel}</span></div>` +
      `<div class="my-recruit__row"><span class="my-recruit__row-icon">📅</span><span class="my-recruit__row-text">${item.timeDisplay}</span></div>` +
      `<div class="my-recruit__row"><span class="my-recruit__row-icon">📍</span><span class="my-recruit__row-text">${item.location}</span></div>` +
      `<div class="my-recruit__signup-row">` +
      `<div class="my-recruit__signup-main"><div class="my-recruit__signup-text">已报 ${item.signed}/${item.total} 人</div>` +
      `<div class="my-recruit__bar"><div class="my-recruit__bar-inner" style="width:${pct}%"></div></div></div>` +
      `<span class="my-recruit__fee${muted}">¥${item.fee}/人</span></div>` +
      actions(item) +
      `</article>`
    );
  }

  async function handleUnpublish(id, title) {
    if (!window.confirm(`确定下架「${title}」？下架后用户将无法报名。`)) return;
    if (!window.HeroPlazaDB) return;
    try {
      const item = await window.HeroPlazaDB.getRecruitment(id);
      await window.HeroPlazaDB.updateRecruitment(id, {
        ...item,
        displayStatus: 'closed',
        listTab: 'ended',
        scope: 'mine_ended',
      });
      lists = await loadLists();
      render();
    } catch (err) {
      window.alert('下架失败');
      console.error(err);
    }
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

  function render() {
    const current = lists[activeTab] || [];
    const tabs = [
      { key: 'draft', label: '草稿', count: lists.draft.length },
      { key: 'active', label: '进行中', count: lists.active.length },
      { key: 'ended', label: '已结束', count: lists.ended.length },
    ];

    const overview =
      activeTab === 'draft'
        ? ''
        : `<div class="my-recruit__overview">` +
          `<div class="my-recruit__stat-card my-recruit__stat-card--signup"><span class="my-recruit__stat-num">28</span><span class="my-recruit__stat-label">本月报名人次</span></div>` +
          `<div class="my-recruit__stat-card my-recruit__stat-card--income"><span class="my-recruit__stat-num">¥8,520</span><span class="my-recruit__stat-label">本月收入</span></div>` +
          `</div>`;

    root.innerHTML =
      `<div class="my-recruit">` +
      `<div class="my-recruit__tabs">${tabs
        .map(
          (t) =>
            `<button type="button" class="my-recruit__tab${activeTab === t.key ? ' my-recruit__tab--active' : ''}" data-tab="${t.key}">${tabDisplay(t.label, t.count)}</button>`,
        )
        .join('')}</div>` +
      overview +
      `<div class="my-recruit__list">${current.map(card).join('') || emptyState(activeTab)}</div>` +
      `</div>`;

    root.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });

    root.querySelectorAll('[data-unpublish-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleUnpublish(btn.dataset.unpublishId, btn.dataset.unpublish);
      });
    });
    root.querySelectorAll('[data-delete-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDelete(btn.dataset.deleteId, btn.dataset.delete);
      });
    });
    root.querySelectorAll('[data-stats]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.alert('预览：数据报表开发中');
      });
    });

    root.querySelectorAll('.my-recruit__actions a, .my-recruit__actions button').forEach((el) => {
      el.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  async function refresh() {
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
