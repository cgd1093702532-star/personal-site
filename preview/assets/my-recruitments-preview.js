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

  function enrichItem(item) {
    const badge = BADGE_MAP[item.displayStatus] || BADGE_MAP.recruiting;
    let actionType = 'active';
    if (item.listTab === 'draft') actionType = 'draft';
    else if (item.displayStatus === 'closed' || item.displayStatus === 'ended') actionType = 'closed';
    const cover = (item.cover_images && item.cover_images[0]) || 'recruit-cover.jpg';
    const desc = (item.description || item.highlights || item.location || '').trim();
    return {
      ...item,
      badgeLabel: badge.label,
      badgeType: badge.type,
      actionType,
      typeLabel: item.typeLabel || (item.type === 'course' ? '课程' : '赛事'),
      coverSrc: cover.startsWith('http') || cover.startsWith('../') || cover.startsWith('/')
        ? cover
        : `../assets/images/${cover}`,
      descSnippet: desc.length > 36 ? `${desc.slice(0, 36)}…` : desc,
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
      `<div class="my-recruit__empty-icon"><img src="${state.icon}" alt=""></div>` +
      `<div class="my-recruit__empty-title">${state.title}</div>` +
      `<div class="my-recruit__empty-hint">${state.hint}</div>` +
      actionBtn +
      `</div>`
    );
  }

  function actions(item) {
    if (item.actionType === 'active') {
      return (
        `<div class="my-recruit__actions">` +
        `<a class="my-recruit__btn my-recruit__btn--primary nav-forward" href="signup-list.html">查看报名</a>` +
        `</div>`
      );
    }
    if (item.actionType === 'closed') {
      return (
        `<div class="my-recruit__actions">` +
        `<a class="my-recruit__btn my-recruit__btn--primary nav-forward" href="signup-list.html"><img class="my-recruit__btn-icon" src="../assets/icons/list.png" alt=""><span>查看名单</span></a>` +
        `<button type="button" class="my-recruit__btn my-recruit__btn--outline" data-stats><img class="my-recruit__btn-icon" src="../assets/icons/chart.png" alt=""> 数据</button>` +
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
    const muted = item.badgeType === 'closed' || item.badgeType === 'ended' ? ' my-recruit__fee--muted' : '';
    return (
      `<article class="my-recruit__card" data-href="${item.type === 'activity' ? 'activity-detail.html' : 'recruitment-detail.html'}?id=${item.recruit_id}">` +
      `<div class="my-recruit__meta">` +
      `<span class="my-recruit__meta-id">编号：${item.recruit_id}</span>` +
      `<span class="my-recruit__meta-time">${item.timeDisplay || ''}</span>` +
      `</div>` +
      `<div class="my-recruit__body">` +
      `<div class="my-recruit__cover">` +
      `<img class="my-recruit__cover-img" src="${item.coverSrc}" alt="">` +
      `<span class="my-recruit__cover-tag">${item.typeLabel || '赛事'}</span>` +
      `</div>` +
      `<div class="my-recruit__info">` +
      `<h3 class="my-recruit__title">${item.title}</h3>` +
      (item.descSnippet
        ? `<p class="my-recruit__desc">${item.descSnippet}</p>`
        : item.location
          ? `<p class="my-recruit__desc">${item.location}</p>`
          : '') +
      `<div class="my-recruit__foot">` +
      `<span class="my-recruit__foot-stat">已报 ${item.signed || 0}/${item.total || 0} 人 · ${item.badgeLabel}</span>` +
      `<span class="my-recruit__fee${muted}">¥${item.fee}/人</span>` +
      `</div>` +
      `</div></div>` +
      actions(item) +
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

  function render() {
    const current = lists[activeTab] || [];
    const tabs = [
      { key: 'active', label: '招募', count: lists.active.length },
      { key: 'ended', label: '招募已结束', count: lists.ended.length },
    ];

    root.innerHTML =
      `<div class="my-recruit">` +
      `<div class="my-recruit__tabs">${tabs
        .map(
          (t) =>
            `<button type="button" class="my-recruit__tab${activeTab === t.key ? ' my-recruit__tab--active' : ''}" data-tab="${t.key}">${tabDisplay(t.label, t.count)}</button>`,
        )
        .join('')}</div>` +
      `<div class="my-recruit__list">${current.map(card).join('') || emptyState(activeTab)}</div>` +
      `</div>`;

    root.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        render();
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

  async function refresh() {
    applySessionTab();
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
