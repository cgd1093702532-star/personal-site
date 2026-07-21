const data = require('../../utils/data.js');

const EMPTY_STATES = {
  draft: {
    icon: '/assets/icons/edit.png',
    title: '暂无草稿',
    hint: '创建赛事招募后可保存为草稿，方便稍后继续编辑',
    actionText: '发布赛事招募',
  },
  active: {
    icon: '/assets/icons/announce.png',
    title: '暂无进行中的招募',
    hint: '发布赛事招募，开始招募学员与参赛选手',
    actionText: '发布赛事招募',
  },
  ended: {
    icon: '/assets/icons/list.png',
    title: '暂无已结束的招募',
    hint: '已结束的活动会显示在这里，方便查看历史数据',
    actionText: '',
  },
};

function getEmptyState(tab) {
  return EMPTY_STATES[tab] || EMPTY_STATES.active;
}

const BADGE_MAP = {
  recruiting: { label: '报名中', type: 'recruiting' },
  ongoing: { label: '进行中', type: 'ongoing' },
  closed: { label: '已截止', type: 'closed' },
  ended: { label: '已结束', type: 'ended' },
  draft: { label: '草稿', type: 'draft' },
};

function enrichItem(item) {
  const badge = BADGE_MAP[item.displayStatus] || BADGE_MAP.recruiting;
  const progress = item.total ? Math.min(100, Math.round((item.signed / item.total) * 100)) : 0;
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
  const coverSrc = cover.startsWith('http') || cover.startsWith('/')
    ? cover
    : `/assets/images/${cover}`;
  const type = item.type === 'activity' ? 'activity' : item.type === 'course' ? 'course' : 'event';
  const typeLabel =
    item.typeLabel || (type === 'activity' ? '活动' : type === 'course' ? '课程' : '赛事');
  const placeLabel = type === 'activity' ? '活动地点' : type === 'course' ? '课程地点' : '赛事地点';
  const quotaBase = data.formatRecruitmentSignup(item.signed, item.total);
  const signedNum = Number(item.signed) || 0;
  const hasTotal = item.total != null && item.total !== '';
  const totalNum = hasTotal ? Number(item.total) : NaN;
  const quotaFull = Number.isFinite(totalNum) && signedNum >= totalNum && totalNum > 0;
  let fillStatus = quotaFull ? '已招满' : '进行中';
  if (item.listTab === 'ended' || item.displayStatus === 'ended') {
    fillStatus = '已结束';
  } else if (item.displayStatus === 'closed') {
    fillStatus = '已招满';
  }
  const quotaText = quotaBase ? `${quotaBase} · ${fillStatus}` : fillStatus;
  const isMine = item.is_mine !== false;
  const relationLabel = isMine ? '我发起的' : '我参加的';
  const canViewSignup = isMine;

  return {
    ...item,
    type,
    badgeLabel: badge.label,
    badgeType: badge.type,
    progress,
    timeDisplay:
      data.formatRecruitmentTimeRange(item.start_at, item.end_at) || item.timeDisplay || '',
    actionType,
    typeLabel,
    placeLabel,
    quotaText,
    coverSrc,
    isMine,
    relationLabel,
    canViewSignup,
  };
}

function buildLists(source) {
  return {
    active: (source.active || []).map(enrichItem),
    ended: (source.ended || []).map(enrichItem),
    draft: (source.draft || []).map(enrichItem),
  };
}

function formatTabDisplay(label, count) {
  return count > 0 ? `${label}(${count})` : label;
}

function visibleItems(list, onlyMine) {
  const rows = list || [];
  if (!onlyMine) return rows;
  return rows.filter((item) => item.isMine !== false);
}

function applyLists(page, lists) {
  const activeTab = page.data.activeTab === 'draft' ? 'active' : page.data.activeTab;
  const showOnlyMineFilter = !!page.data.showOnlyMineFilter;
  const onlyMine = showOnlyMineFilter && !!page.data.onlyMine;
  const activeVisible = visibleItems(lists.active, onlyMine);
  const endedVisible = visibleItems(lists.ended, onlyMine);
  const currentSource = activeTab === 'ended' ? endedVisible : activeVisible;
  const rawCurrent = activeTab === 'ended' ? lists.ended || [] : lists.active || [];
  // 当前 Tab 无数据（空态）时不展示筛选；筛选后变空仍展示，便于取消勾选
  const showFilterToolbar = showOnlyMineFilter && rawCurrent.length > 0;
  page.setData({
    lists,
    activeTab,
    onlyMine,
    showOnlyMineFilter,
    showFilterToolbar,
    tabs: [
      { key: 'active', label: '进行中', count: activeVisible.length, display: formatTabDisplay('进行中', activeVisible.length) },
      { key: 'ended', label: '已结束', count: endedVisible.length, display: formatTabDisplay('已结束', endedVisible.length) },
    ],
    currentList: currentSource,
    emptyState: getEmptyState(activeTab),
  });
}

Page({
  data: {
    tabs: [
      { key: 'active', label: '进行中', count: 0, display: '进行中' },
      { key: 'ended', label: '已结束', count: 0, display: '已结束' },
    ],
    activeTab: 'active',
    onlyMine: false,
    showOnlyMineFilter: false,
    showFilterToolbar: false,
    lists: { active: [], ended: [], draft: [] },
    currentList: [],
    emptyState: getEmptyState('active'),
  },

  onLoad(options) {
    if (options.tab === 'active' || options.tab === 'ended') {
      this.setData({ activeTab: options.tab, emptyState: getEmptyState(options.tab) });
    }
    this.reload();
  },

  onShow() {
    this.reload();
  },

  reload() {
    Promise.all([data.getMyRecruitmentLists(), data.getHeroApplyStatus()]).then(([source, status]) => {
      const showOnlyMineFilter =
        status && status.status === 'approved' && status.hero_enabled !== false;
      const onlyMine = showOnlyMineFilter ? !!this.data.onlyMine : false;
      this.setData({ showOnlyMineFilter, onlyMine }, () => {
        applyLists(this, buildLists(source));
      });
    });
  },

  onTabChange(e) {
    const key = e.currentTarget.dataset.key;
    const onlyMine = !!this.data.showOnlyMineFilter && !!this.data.onlyMine;
    const raw = this.data.lists[key] || [];
    const list = visibleItems(raw, onlyMine);
    this.setData({
      activeTab: key,
      currentList: list,
      showFilterToolbar: !!this.data.showOnlyMineFilter && raw.length > 0,
      emptyState: getEmptyState(key),
    });
  },

  onToggleOnlyMine() {
    const onlyMine = !this.data.onlyMine;
    this.setData({ onlyMine }, () => {
      applyLists(this, this.data.lists);
    });
  },

  onEmptyAction() {
    wx.navigateTo({ url: '/pages/recruitment-create/recruitment-create' });
  },

  onViewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/recruitment-detail/recruitment-detail?id=${id}` });
  },

  onViewSignup(e) {
    const { title, signed, id } = e.currentTarget.dataset;
    const signedNum = Number(signed);
    const signedQ = Number.isFinite(signedNum) ? `&signed=${signedNum}` : '';
    const idQ = id ? `&id=${encodeURIComponent(id)}` : '';
    wx.navigateTo({
      url: `/pages/signup-list/signup-list?title=${encodeURIComponent(title || '招募报名')}${signedQ}${idQ}`,
    });
  },

  onEditDraft(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/recruitment-edit/recruitment-edit?id=${id}` });
  },

  onDeleteDraft(e) {
    const { id, title } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除草稿',
      content: `确定删除草稿「${title}」？`,
      confirmColor: '#1b579c',
      success: (res) => {
        if (!res.confirm) return;
        data.deleteRecruitment(id).then(() => {
          wx.showToast({ title: '已删除', icon: 'success' });
          return data.getMyRecruitmentLists();
        }).then((source) => {
          applyLists(this, buildLists(source));
        }).catch(() => {
          wx.showToast({ title: '删除失败', icon: 'none' });
        });
      },
    });
  },
});
