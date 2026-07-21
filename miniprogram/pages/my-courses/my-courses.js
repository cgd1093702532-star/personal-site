const data = require('../../utils/data.js');

const EMPTY_STATES = {
  active: {
    icon: '/assets/icons/book.png',
    title: '暂无进行中的课程',
    hint: '请在管理后台维护课程后，再回来查看',
  },
  ended: {
    icon: '/assets/icons/check.png',
    title: '暂无已结束的课程',
    hint: '已结束的课程会显示在这里，方便查看历史记录',
  },
};

function formatTabDisplay(label, count) {
  return count > 0 ? `${label}(${count})` : label;
}

function withMineFlag(item) {
  const isMine = item.is_mine !== false;
  const signedNum = Number(item.signed) || 0;
  const hasTotal = item.total != null && item.total !== '';
  const totalNum = hasTotal ? Number(item.total) : NaN;
  const quotaBase = Number.isFinite(totalNum)
    ? `招募名额：${signedNum}/${totalNum}`
    : `招募名额：${signedNum}/不限`;
  let fillStatus =
    Number.isFinite(totalNum) && totalNum > 0 && signedNum >= totalNum ? '已招满' : '进行中';
  if (item.listTab === 'ended') {
    fillStatus = '已结束';
  }
  return {
    ...item,
    isMine,
    relationLabel: isMine ? '我发起的' : '我参与的',
    canViewSignup: isMine,
    quotaText: `${quotaBase} · ${fillStatus}`,
  };
}

function visibleItems(list, onlyMine) {
  const rows = list || [];
  if (!onlyMine) return rows;
  return rows.filter((item) => item.isMine !== false);
}

function applyLists(page, lists) {
  const showOnlyMineFilter = !!page.data.showOnlyMineFilter;
  const onlyMine = showOnlyMineFilter && !!page.data.onlyMine;
  const activeVisible = visibleItems(lists.active, onlyMine);
  const endedVisible = visibleItems(lists.ended, onlyMine);
  const activeTab = page.data.activeTab || 'active';
  page.setData({
    lists,
    onlyMine,
    showOnlyMineFilter,
    tabs: [
      {
        key: 'active',
        label: '进行中',
        count: activeVisible.length,
        display: formatTabDisplay('进行中', activeVisible.length),
      },
      {
        key: 'ended',
        label: '已结束',
        count: endedVisible.length,
        display: formatTabDisplay('已结束', endedVisible.length),
      },
    ],
    currentList: activeTab === 'ended' ? endedVisible : activeVisible,
    emptyState: EMPTY_STATES[activeTab] || EMPTY_STATES.active,
  });
}

function normalizeLists(source) {
  return {
    active: (source.active || []).map(withMineFlag),
    ended: (source.ended || []).map(withMineFlag),
  };
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
    lists: { active: [], ended: [] },
    currentList: [],
    emptyState: EMPTY_STATES.active,
  },

  onLoad() {
    this.reload();
  },

  onShow() {
    this.reload();
  },

  reload() {
    Promise.all([data.getMyCourseLists(), data.getHeroApplyStatus()]).then(([source, status]) => {
      const showOnlyMineFilter =
        status && status.status === 'approved' && status.hero_enabled !== false;
      const onlyMine = showOnlyMineFilter ? !!this.data.onlyMine : false;
      this.setData({ showOnlyMineFilter, onlyMine }, () => {
        applyLists(this, normalizeLists(source));
      });
    });
  },

  onTabChange(e) {
    const key = e.currentTarget.dataset.key;
    const onlyMine = !!this.data.showOnlyMineFilter && !!this.data.onlyMine;
    const list = visibleItems(this.data.lists[key] || [], onlyMine);
    this.setData({
      activeTab: key,
      currentList: list,
      emptyState: EMPTY_STATES[key] || EMPTY_STATES.active,
    });
  },

  onToggleOnlyMine() {
    const onlyMine = !this.data.onlyMine;
    this.setData({ onlyMine }, () => {
      applyLists(this, this.data.lists);
    });
  },

  onViewDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/course-detail/course-detail?id=${id}` });
  },

  onViewMembers(e) {
    const { id, title } = e.currentTarget.dataset;
    if (!id) return;
    const qTitle = encodeURIComponent(title || '课程报名');
    wx.navigateTo({
      url: `/pages/signup-list/signup-list?course_id=${id}&title=${qTitle}`,
    });
  },
});
