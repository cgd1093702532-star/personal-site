Page({
  data: {
    fromHeroDetail: false,
    heroId: '1',
    backText: '返回个人中心',
  },

  onLoad(options) {
    const fromHeroDetail = options?.from === 'hero-detail';
    this.setData({
      fromHeroDetail,
      heroId: options?.hero_id || '1',
      backText: fromHeroDetail ? '返回英雄详情' : '返回个人中心',
    });
  },

  onBack() {
    if (this.data.fromHeroDetail) {
      wx.redirectTo({
        url: `/pages/hero-detail/hero-detail?id=${encodeURIComponent(this.data.heroId)}`,
      });
      return;
    }
    wx.switchTab({ url: '/pages/profile/profile' });
  },
});
