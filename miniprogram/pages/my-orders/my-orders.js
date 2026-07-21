const orders = require('../../utils/orders.js');

Page({
  data: {
    tabs: orders.TABS,
    activeTab: 'all',
    list: [],
  },

  onLoad(options) {
    this.applyTab(orders.normalizeTab(options && options.tab));
  },

  onShow() {
    this.applyTab(this.data.activeTab);
  },

  applyTab(tab) {
    const activeTab = orders.normalizeTab(tab);
    const list = orders.listOrders(activeTab).map(orders.enrichOrder);
    this.setData({ activeTab, list });
  },

  onTabChange(e) {
    const key = e.currentTarget.dataset.key;
    this.applyTab(key);
  },

  onOpenVoucher(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/order-voucher/order-voucher?id=${id}` });
  },

  onRate(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}&rate=1` });
  },

  onOpenDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` });
  },
});
