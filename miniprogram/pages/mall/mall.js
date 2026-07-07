const mock = require('../../utils/mock.js');

Page({
  data: {
    products: [],
  },

  onLoad() {
    this.setData({ products: mock.products });
  },

  onProductTap() {
    wx.showToast({ title: '商城详情（M2）', icon: 'none' });
  },
});
