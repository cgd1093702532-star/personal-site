Component({
  properties: {
    visible: { type: Boolean, value: false },
    urls: { type: Array, value: [] },
    current: { type: Number, value: 0 },
  },

  methods: {
    noop() {},

    onClose() {
      this.triggerEvent('close');
    },

    onSwiperChange(e) {
      this.setData({ current: e.detail.current });
      this.triggerEvent('change', { current: e.detail.current });
    },

    getCurrentUrl() {
      const { urls, current } = this.data;
      return urls[current] || '';
    },

    onSave() {
      const url = this.getCurrentUrl();
      if (!url) return;
      if (!/^https?:\/\//.test(url)) {
        wx.showToast({ title: '示例图暂不可保存', icon: 'none' });
        return;
      }
      wx.showLoading({ title: '保存中' });
      wx.downloadFile({
        url,
        success: (res) => {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => wx.showToast({ title: '已保存到相册' }),
            fail: () => wx.showToast({ title: '保存失败', icon: 'none' }),
            complete: () => wx.hideLoading(),
          });
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({ title: '下载失败', icon: 'none' });
        },
      });
    },

    onShare() {
      const url = this.getCurrentUrl();
      if (!url) return;
      if (wx.showShareImageMenu) {
        if (!/^https?:\/\//.test(url)) {
          wx.showToast({ title: '示例图暂不可分享', icon: 'none' });
          return;
        }
        wx.downloadFile({
          url,
          success: (res) => {
            wx.showShareImageMenu({
              path: res.tempFilePath,
              fail: () => wx.showToast({ title: '分享失败', icon: 'none' }),
            });
          },
          fail: () => wx.showToast({ title: '分享失败', icon: 'none' }),
        });
        return;
      }
      wx.showToast({ title: '请使用右上角菜单分享', icon: 'none' });
    },
  },
});
