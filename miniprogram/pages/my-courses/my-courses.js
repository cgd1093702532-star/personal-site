const data = require('../../utils/data.js');

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

function applyLists(page, lists) {
  page.setData({
    lists,
    tabs: [
      { key: 'active', label: '进行中', count: lists.active.length, display: formatTabDisplay('进行中', lists.active.length) },
      { key: 'ended', label: '已结束', count: lists.ended.length, display: formatTabDisplay('已结束', lists.ended.length) },
    ],
    currentList: lists[page.data.activeTab] || lists.active,
    emptyState: EMPTY_STATES[page.data.activeTab] || EMPTY_STATES.active,
  });
}

Page({
  data: {
    tabs: [
      { key: 'active', label: '进行中', count: 0, display: '进行中' },
      { key: 'ended', label: '已结束', count: 0, display: '已结束' },
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
});
