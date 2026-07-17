Page({
  data: {
    categories: [
      {
        id: 'system',
        title: '系统消息提醒',
        icon: '/assets/icons/msg-system.png',
        href: '/pages/message-detail/message-detail',
      },
      { id: 'order', title: '订单提醒', icon: '/assets/icons/msg-order.png' },
      { id: 'refund', title: '退款提醒', icon: '/assets/icons/msg-refund.png' },
      { id: 'promoter', title: '推广员提醒', icon: '/assets/icons/msg-promoter.png' },
    ],
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id;
    const item = (this.data.categories || []).find((c) => c.id === id);
    if (item && item.href) {
      wx.navigateTo({ url: item.href });
      return;
    }
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },
});
