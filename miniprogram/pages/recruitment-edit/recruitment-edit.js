Page({
  data: {},
  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '缺少招募 ID', icon: 'none' });
    }
  },
});
