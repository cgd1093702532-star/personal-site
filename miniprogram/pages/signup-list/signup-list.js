const data = require('../../utils/data.js');

Page({
  data: {
    recruitTitle: '',
    list: [],
  },

  onLoad(options) {
    const title = options.title ? decodeURIComponent(options.title) : '招募报名';
    this.setData({ recruitTitle: title });
    this.loadList(title);
  },

  onShow() {
    this.loadList(this.data.recruitTitle);
  },

  loadList(title) {
    data.getAppState('my_signups', []).then((list) => {
      const filtered = (list || []).filter(
        (item) => item.type !== 'course' && (!title || item.title === title)
      );
      this.setData({ list: filtered });
    });
  },

  onConfirm(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;
    data
      .updateSignupStatus(id, '已确认')
      .then(() => {
        wx.showToast({ title: '已确认', icon: 'success' });
        this.loadList(this.data.recruitTitle);
      })
      .catch(() => {
        wx.showToast({ title: '操作失败', icon: 'none' });
      });
  },
});
