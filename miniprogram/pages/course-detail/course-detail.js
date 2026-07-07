const data = require('../../utils/data.js');
const mock = require('../../utils/mock.js');

Page({
  data: {
    item: null,
    courseId: '',
  },

  onLoad(options) {
    const id = options.id;
    const item = mock.getCourseById(id);
    if (!item) {
      wx.showToast({ title: '课程不存在', icon: 'none' });
      return;
    }
    wx.setNavigationBarTitle({ title: item.title });
    this.setData({ item, courseId: id });
  },

  onSignupTap() {
    const { item, courseId } = this.data;
    data
      .addMySignup({
        type: 'course',
        course_id: courseId,
        title: item.title,
        name: '当前用户',
        phone: '13800000000',
      })
      .then(() => {
        wx.showToast({ title: '报名成功', icon: 'success' });
      })
      .catch(() => {
        wx.showToast({ title: '报名失败', icon: 'none' });
      });
  },
});
