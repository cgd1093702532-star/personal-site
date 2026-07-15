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

function applyLists(page, lists) {
  page.setData({
    lists,
    tabs: [
      { key: 'active', label: '招生进行中', count: lists.active.length, display: formatTabDisplay('招生进行中', lists.active.length) },
      { key: 'ended', label: '招生已结束', count: lists.ended.length, display: formatTabDisplay('招生已结束', lists.ended.length) },
    ],
    currentList: lists[page.data.activeTab] || lists.active,
    emptyState: EMPTY_STATES[page.data.activeTab] || EMPTY_STATES.active,
  });
}

Page({
  data: {
    tabs: [
      { key: 'active', label: '招生进行中', count: 0, display: '招生进行中' },
      { key: 'ended', label: '招生已结束', count: 0, display: '招生已结束' },
    ],
    activeTab: 'active',
    lists: { active: [], ended: [] },
    currentList: [],
    emptyState: EMPTY_STATES.active,
  },

  onLoad() {
    this.loadLists();
  },

  onShow() {
    this.loadLists();
  },

  loadLists() {
    data.getMyCourseLists().then((lists) => {
      applyLists(this, lists);
    });
  },

  onTabChange(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      activeTab: key,
      currentList: this.data.lists[key] || [],
      emptyState: EMPTY_STATES[key] || EMPTY_STATES.active,
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
