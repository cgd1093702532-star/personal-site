const data = require('../../utils/data.js');

Page({
  data: {
    form: {
      title: '',
      price: '',
      headcount: '',
    },
    banners: [],
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onAddBanner() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const path = res.tempFiles[0]?.tempFilePath;
        if (!path) return;
        this.setData({ banners: [...this.data.banners, path] });
      },
    });
  },

  onSubmit() {
    const { title, price, headcount } = this.data.form;
    const { banners } = this.data;
    if (!title.trim() || title.length < 2) {
      wx.showToast({ title: '请填写课程名称', icon: 'none' });
      return;
    }
    if (price === '' || Number(price) < 0) {
      wx.showToast({ title: '请填写课程价格', icon: 'none' });
      return;
    }
    if (!headcount || Number(headcount) < 1) {
      wx.showToast({ title: '请填写课程人数', icon: 'none' });
      return;
    }
    data
      .addMyCourse({
        title: title.trim(),
        price: Number(price),
        total: Number(headcount),
        headcount: Number(headcount),
        banner_images: banners,
        location: '待完善',
        timeDisplay: '待排期',
      })
      .then(() => {
        wx.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => wx.redirectTo({ url: '/pages/my-courses/my-courses' }), 800);
      })
      .catch(() => {
        wx.showToast({ title: '发布失败', icon: 'none' });
      });
  },
});
