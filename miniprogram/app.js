App({
  onLaunch() {
    // 铁律：全局提示统一黑底白字 → 强制 icon:none（微信文案 Toast）
    const rawShowToast = wx.showToast.bind(wx);
    wx.showToast = function showToastUnified(options) {
      const opts = options || {};
      return rawShowToast({
        ...opts,
        icon: 'none',
      });
    };
  },
  globalData: {
    userInfo: null,
  },
});
