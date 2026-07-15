Page({
  data: { bio: '', field: 'bio', from: '' },

  onLoad(options) {
    const field = options.field || 'bio';
    const from = options.from || '';
    let bio = 'ASA帆船认证教练，15年水上运动教学经验。';
    if (from === 'hero-profile' && field === 'about') {
      const stored = wx.getStorageSync('hero-profile-edit-bio');
      if (stored) bio = stored;
      wx.setNavigationBarTitle({ title: '编辑关于我' });
    }
    this.setData({ bio, field, from });
  },

  onInput(e) {
    this.setData({ bio: e.detail.value });
  },

  onSave() {
    if (this.data.bio.trim().length < 10) {
      wx.showToast({ title: '内容至少10字', icon: 'none' });
      return;
    }
    const bio = this.data.bio.trim();
    if (this.data.from === 'hero-profile' && this.data.field === 'about') {
      wx.setStorageSync('hero-profile-edit-bio-result', bio);
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    wx.showToast({ title: '保存成功（Mock）', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 800);
  },
});
