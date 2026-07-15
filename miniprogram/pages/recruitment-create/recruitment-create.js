const mock = require('../../utils/mock.js');

const TAB_KEY = 'recruitment_create_tab';

function mapCard(e) {
  return {
    ...e,
    time: e.time || e.timeDisplay || '',
    feeDisplay:
      e.feeDisplay ||
      (e.fee != null ? String(e.fee).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''),
    typeLabel: e.typeLabel || (e.type === 'activity' ? '活动' : '赛事'),
    is_mine: e.is_mine !== false,
  };
}

function withAction(item, tab) {
  if (tab === 'ended') {
    return {
      ...item,
      actionText: '活动已结束',
      actionDisabled: true,
      actionKind: 'none',
    };
  }
  return {
    ...item,
    actionText: '发起招募',
    actionDisabled: false,
    actionKind: 'initiate',
  };
}

function tabLabel(label, count) {
  return count > 0 ? `${label}(${count})` : label;
}

function normalizeTab(tab) {
  return tab === 'ended' ? 'ended' : 'active';
}

Page({
  data: {
    activeTab: 'active',
    lists: { active: [], ended: [] },
    list: [],
    activeTabLabel: '招募进行中',
    endedTabLabel: '招募已结束',
    emptyText: '暂无赛事招募',
    showInitiateConfirm: false,
    pendingRecruitId: '',
    statusBarHeight: 20,
    navBarHeight: 44,
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    let lists = { active: [], ended: [] };
    if (typeof mock.getMyRecruitmentLists === 'function') {
      const raw = mock.getMyRecruitmentLists() || {};
      lists = {
        active: (raw.active || []).map(mapCard),
        ended: (raw.ended || []).map(mapCard),
      };
    } else {
      lists = {
        active: (mock.events || [])
          .filter((e) => e && e.status !== 'ended')
          .slice(0, 10)
          .map(mapCard),
        ended: (mock.events || [])
          .filter((e) => e && e.status === 'ended')
          .map(mapCard),
      };
    }
    this._restoreTabOnShow = false;
    try {
      wx.setStorageSync(TAB_KEY, 'active');
    } catch (_) {
      /* ignore */
    }
    this.setData(
      {
        lists,
        statusBarHeight: sys.statusBarHeight || 20,
        navBarHeight: 44,
      },
      () => this.applyTab('active'),
    );
  },

  onShow() {
    if (!this._restoreTabOnShow) return;
    this._restoreTabOnShow = false;
    let saved = 'active';
    try {
      const v = wx.getStorageSync(TAB_KEY);
      if (v === 'active' || v === 'ended') saved = v;
    } catch (_) {
      /* ignore */
    }
    if (saved !== this.data.activeTab) {
      this.applyTab(saved);
    }
  },

  onBack() {
    try {
      wx.setStorageSync(TAB_KEY, 'active');
    } catch (_) {
      /* ignore */
    }
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  onBackPress() {
    this.onBack();
    return true;
  },

  applyTab(tab) {
    const next = normalizeTab(tab);
    const lists = this.data.lists;
    const list = (lists[next] || []).map((item) => withAction(item, next));
    try {
      wx.setStorageSync(TAB_KEY, next);
    } catch (_) {
      /* ignore */
    }
    this.setData({
      activeTab: next,
      list,
      activeTabLabel: tabLabel('招募进行中', lists.active.length),
      endedTabLabel: tabLabel('招募已结束', lists.ended.length),
      emptyText: next === 'ended' ? '暂无已结束的赛事招募' : '暂无赛事招募',
    });
  },

  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab;
    if (!tab || tab === this.data.activeTab) return;
    this.applyTab(tab);
  },

  onItemTap(e) {
    const id = e.detail?.recruit_id;
    if (!id) return;
    this._restoreTabOnShow = true;
    try {
      wx.setStorageSync(TAB_KEY, this.data.activeTab);
    } catch (_) {
      /* ignore */
    }
    wx.navigateTo({ url: `/pages/recruitment-detail/recruitment-detail?id=${id}` });
  },

  onItemAction(e) {
    const type = e.detail?.type;
    const id = e.detail?.recruit_id;
    if (type !== 'initiate' || !id) return;
    this.setData({ showInitiateConfirm: true, pendingRecruitId: id });
  },

  onCloseInitiateConfirm() {
    this.setData({ showInitiateConfirm: false, pendingRecruitId: '' });
  },

  onConfirmInitiate() {
    this.setData({ showInitiateConfirm: false, pendingRecruitId: '' });
    wx.navigateTo({ url: '/pages/my-recruitments/my-recruitments' });
  },

  noop() {},
});
