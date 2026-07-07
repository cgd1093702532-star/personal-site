const mock = require('../../utils/mock.js');

Page({
  data: {
    statusBarHeight: 20,
    banner: {},
    shortNav: [],
    membership: {},
    heroes: [],
    events: [],
    courses: [],
    products: [],
    news: [],
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 });
    this.loadData();
  },

  loadData() {
    this.setData({
      banner: mock.banner,
      shortNav: mock.shortNav,
      membership: mock.membership,
      heroes: mock.heroes,
      events: mock.events,
      courses: mock.courses,
      products: mock.products,
      news: mock.news,
    });
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  onHeroMore() {
    wx.switchTab({ url: '/pages/heroes/heroes' });
  },

  onHeroTap(e) {
    const { hero_id } = e.detail;
    wx.navigateTo({ url: `/pages/hero-detail/hero-detail?id=${hero_id}` });
  },

  onEventTap(e) {
    const { recruit_id } = e.detail;
    wx.navigateTo({ url: `/pages/recruitment-detail/recruitment-detail?id=${recruit_id}` });
  },

  onBannerCta() {
    if (this.data.events[0]) {
      wx.navigateTo({
        url: `/pages/recruitment-detail/recruitment-detail?id=${this.data.events[0].recruit_id}`,
      });
    }
  },
});
