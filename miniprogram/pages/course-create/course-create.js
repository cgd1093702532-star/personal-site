const data = require('../../utils/data.js');

Page({
  data: {
    form: {
      title: '',
      location: '',
      start_date: '',
      headcount: '',
      fee: '',
      deadline: '',
      desc: '',
    },
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onDateChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onSubmit() {
    const { title, location, start_date, headcount, fee, deadline, desc } = this.data.form;
    if (!title.trim() || title.length < 2) {
      wx.showToast({ title: '请填写课程标题', icon: 'none' });
      return;
    }
    if (!location.trim()) {
      wx.showToast({ title: '请填写上课地点', icon: 'none' });
      return;
    }
    if (!start_date) {
      wx.showToast({ title: '请选择开课日期', icon: 'none' });
      return;
    }
    if (!headcount || Number(headcount) < 1) {
      wx.showToast({ title: '请填写招生人数', icon: 'none' });
      return;
    }
    if (fee === '') {
      wx.showToast({ title: '请填写费用', icon: 'none' });
      return;
    }
    if (!deadline) {
      wx.showToast({ title: '请选择报名截止', icon: 'none' });
      return;
    }
    if (!desc.trim() || desc.length < 10) {
      wx.showToast({ title: '课程介绍至少10字', icon: 'none' });
      return;
    }
    data
      .addMyCourse({
        title: title.trim(),
        location: location.trim(),
        start_date,
        headcount: Number(headcount),
        fee: Number(fee),
        deadline,
        description: desc.trim(),
      })
      .then(() => {
        wx.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => wx.redirectTo({ url: '/pages/my-recruitments/my-recruitments' }), 800);
      })
      .catch(() => {
        wx.showToast({ title: '发布失败', icon: 'none' });
      });
  },
});
