const orders = require('../../utils/orders.js');

function scoreLabel(score) {
  if (!score) return '轻点星星评分';
  return `${score}.0 分`;
}

Page({
  data: {
    order: null,
    missing: false,
    showRateSheet: false,
    rateScore: 0,
    rateScoreLabel: '轻点星星评分',
    submittedScore: 0,
    canRate: false,
    showCancel: false,
    starList: [1, 2, 3, 4, 5],
  },

  onLoad(options) {
    const id = (options && options.id) || 'o1';
    const raw = orders.getOrderById(id) || orders.ORDERS[0] || null;
    const openRate = String((options && options.rate) || '') === '1';
    const isCompleted = !!(raw && (raw.showRate || raw.status === 'completed'));
    const alwaysUnrated = !!(raw && raw.showRate && !(Number(raw.ratedScore) > 0));
    let submittedScore = 0;
    if (alwaysUnrated) {
      try {
        wx.removeStorageSync(`order-rate-score:${id}`);
      } catch (e) {
        /* ignore */
      }
      submittedScore = 0;
    } else {
      try {
        submittedScore = Number(wx.getStorageSync(`order-rate-score:${id}`) || 0) || 0;
      } catch (e) {
        submittedScore = 0;
      }
      if (!submittedScore && raw && raw.ratedScore) {
        submittedScore = Number(raw.ratedScore) || 0;
      }
    }
    this.setData({
      order: raw ? orders.enrichOrder(raw) : null,
      missing: !raw,
      showRateSheet: !!(openRate && isCompleted && !submittedScore),
      rateScore: 0,
      rateScoreLabel: scoreLabel(0),
      submittedScore,
      canRate: !!(isCompleted && !submittedScore),
      showCancel: !!(raw && !isCompleted),
      alwaysUnrated,
    });
  },

  noop() {},

  onCopy(e) {
    const text = e.currentTarget.dataset.text;
    if (!text) return;
    wx.setClipboardData({
      data: String(text),
      success: () => {
        wx.showToast({ title: '已复制', icon: 'none' });
      },
    });
  },

  onOpenVoucher(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/order-voucher/order-voucher?id=${id}` });
  },

  onCancel() {
    wx.showToast({ title: '敬请期待', icon: 'none' });
  },

  onRate() {
    this.setData({
      showRateSheet: true,
      rateScore: 0,
      rateScoreLabel: scoreLabel(0),
    });
  },

  onCloseRateSheet() {
    this.setData({
      showRateSheet: false,
      rateScore: 0,
      rateScoreLabel: scoreLabel(0),
    });
  },

  onPickStar(e) {
    const score = Number(e.currentTarget.dataset.score) || 0;
    this.setData({
      rateScore: score,
      rateScoreLabel: scoreLabel(score),
    });
  },

  onSubmitRate() {
    const score = this.data.rateScore;
    if (score <= 0) return;
    const id = this.data.order && this.data.order.id;
    if (id && !this.data.alwaysUnrated) {
      try {
        wx.setStorageSync(`order-rate-score:${id}`, score);
      } catch (e) {
        /* ignore */
      }
    } else if (id && this.data.alwaysUnrated) {
      try {
        wx.removeStorageSync(`order-rate-score:${id}`);
      } catch (e) {
        /* ignore */
      }
    }
    this.setData({
      showRateSheet: false,
      rateScore: 0,
      rateScoreLabel: scoreLabel(0),
      submittedScore: score,
      canRate: false,
    });
    wx.showToast({ title: '评分成功', icon: 'none' });
  },
});
