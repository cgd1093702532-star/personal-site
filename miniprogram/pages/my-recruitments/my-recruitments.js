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
  else if (item.displayStatus === 'closed' || item.displayStatus === 'ended') actionType = 'closed';

  const cover = (item.cover_images && item.cover_images[0]) || 'recruit-cover.jpg';
  const desc = String(item.description || item.highlights || item.location || '').trim();
  const coverSrc = cover.startsWith('http') || cover.startsWith('/')
    ? cover
    : `/assets/images/${cover}`;

  return {
    ...item,
    badgeLabel: badge.label,
    badgeType: badge.type,
    progress,
    timeDisplay: item.timeDisplay || data.formatRecruitmentTimeRange(item.start_at, item.end_at),
    actionType,
    typeLabel: item.typeLabel || (item.type === 'course' ? '课程' : '赛事'),
    coverSrc,
    descSnippet: desc.length > 36 ? `${desc.slice(0, 36)}…` : desc,
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

function applyLists(page, lists) {
  const activeTab = page.data.activeTab === 'draft' ? 'active' : page.data.activeTab;
  page.setData({
    lists,
    activeTab,
    tabs: [
      { key: 'active', label: '进行中', count: lists.active.length, display: formatTabDisplay('进行中', lists.active.length) },
      { key: 'ended', label: '已结束', count: lists.ended.length, display: formatTabDisplay('已结束', lists.ended.length) },
    ],
    currentList: lists[activeTab] || lists.active,
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
    lists: { active: [], ended: [], draft: [] },
    currentList: [],
    emptyState: getEmptyState('active'),
  },

  onLoad(options) {
    if (options.tab === 'active' || options.tab === 'ended') {
      this.setData({ activeTab: options.tab, emptyState: getEmptyState(options.tab) });
    }
    data.getMyRecruitmentLists().then((source) => {
      applyLists(this, buildLists(source));
    });
  },

  onShow() {
    data.getMyRecruitmentLists().then((source) => {
      applyLists(this, buildLists(source));
    });
  },

  onTabChange(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      activeTab: key,
      currentList: this.data.lists[key] || [],
      emptyState: getEmptyState(key),
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
    const { title } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/signup-list/signup-list?title=${encodeURIComponent(title || '招募报名')}`,
    });
  },

  onViewData() {
    wx.showToast({ title: '数据报表开发中', icon: 'none' });
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
