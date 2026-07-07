const data = require('../../utils/data.js');

Page({
  data: { certCount: 0, certUrls: [] },

  onChoose() {
    wx.chooseMedia({
      count: 5 - this.data.certCount,
      mediaType: ['image'],
      success: (res) => {
        const added = (res.tempFiles || []).map((f) => f.tempFilePath);
        const certUrls = [...this.data.certUrls, ...added].slice(0, 5);
        this.setData({
          certCount: certUrls.length,
          certUrls,
        });
      },
    });
  },

  onSave() {
    if (this.data.certCount === 0) {
      wx.showToast({ title: '请上传证书', icon: 'none' });
      return;
    }
    data
      .setAppState('hero_apply_certs', this.data.certUrls)
      .then(() => {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 800);
      })
      .catch(() => {
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
  },
});
