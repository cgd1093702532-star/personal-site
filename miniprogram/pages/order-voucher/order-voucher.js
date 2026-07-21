const orders = require('../../utils/orders.js');

Page({
  data: {
    order: null,
    missing: false,
  },

  onLoad(options) {
    const id = (options && options.id) || 'o1';
    const order = orders.getOrderById(id) || orders.ORDERS[0] || null;
    const redeemed = !!(order && (order.status === 'completed' || order.voucherRedeemed));
    this.setData({
      order,
      missing: !order,
      redeemed,
    });
  },

  onOrderDetail() {
    const id = (this.data.order && this.data.order.id) || 'o1';
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` });
  },

  onLocationTap() {
    /* 本期仅外观 */
  },
});
