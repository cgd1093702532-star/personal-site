const data = require('../../utils/data.js');

const REASON_FALLBACK = '您的英雄身份当前不可用，可联系客服处理';
const DISABLE_REASON_FALLBACK = '您的英雄身份不可用，具体原因可联系客服处理';

const CTA = {
  none: {
    hint: '成为英雄，发布赛事招募，开启您的水上教育事业',
    btn: '申请成为英雄',
  },
  pending: {
    hint: '认证申请审核中，请耐心等待',
    btn: '查看审核进度',
  },
  rejected: {
    hint: '认证申请被驳回，请修改后再次提交申请',
    btn: '查看原因',
  },
  disabled: {
    hint: '您的英雄身份不可用，可联系客服处理',
    btn: '查看原因',
  },
};

Page({
  data: {
    user: { nickname: '航海用户', avatar: '', member: '普通会员' },
    hero: null,
    isHero: false,
    heroActive: false,
    heroDisabled: false,
    heroPending: false,
    heroRejected: false,
    profileChangePending: false,
    rejectReason: '',
    disableReason: '',
    showRejectDialog: false,
    showDisableDialog: false,
    showPublishSheet: false,
    ctaHint: CTA.none.hint,
    ctaBtn: CTA.none.btn,
    mall: { points: 0, gifts: 0, coupons: 0 },
  },

  onShow() {
    this.loadProfile();
  },

  reasonOrFallback(reason) {
    const text = String(reason || '').trim();
    return text || REASON_FALLBACK;
  },

  disableReasonOrFallback(reason) {
    const text = String(reason || '').trim();
    return text || DISABLE_REASON_FALLBACK;
  },

  loadProfile() {
    data.getHeroApplyStatus().then((res) => {
      const mockRole = res.status;
      const base = { nickname: '航海用户', member: '普通会员' };
      if (mockRole === 'approved') {
        const disabled = res.hero_enabled === false;
        const hero = disabled
          ? null
          : {
              name: '小哥',
              certification_level: 'ASA帆船认证教练',
              rating: 4.9,
              student_count: 128,
              course_count: 12,
            };
        this.setData({
          user: base,
          isHero: true,
          heroActive: !disabled,
          heroDisabled: disabled,
          heroPending: false,
          heroRejected: false,
          profileChangePending: !disabled && !!res.profile_change_pending,
          rejectReason: '',
          disableReason: this.disableReasonOrFallback(res.disable_reason),
          ctaHint: disabled ? CTA.disabled.hint : CTA.none.hint,
          ctaBtn: disabled ? CTA.disabled.btn : CTA.none.btn,
          hero,
        });
      } else if (mockRole === 'pending') {
        this.setData({
          user: base,
          isHero: false,
          heroActive: false,
          heroDisabled: false,
          heroPending: true,
          heroRejected: false,
          profileChangePending: false,
          rejectReason: '',
          disableReason: '',
          ctaHint: CTA.pending.hint,
          ctaBtn: CTA.pending.btn,
          hero: null,
        });
      } else if (mockRole === 'rejected') {
        this.setData({
          user: base,
          isHero: false,
          heroActive: false,
          heroDisabled: false,
          heroPending: false,
          heroRejected: true,
          profileChangePending: false,
          rejectReason: this.reasonOrFallback(res.reject_reason),
          disableReason: '',
          ctaHint: CTA.rejected.hint,
          ctaBtn: CTA.rejected.btn,
          hero: null,
        });
      } else {
        this.setData({
          user: base,
          isHero: false,
          heroActive: false,
          heroDisabled: false,
          heroPending: false,
          heroRejected: false,
          profileChangePending: false,
          rejectReason: '',
          disableReason: '',
          ctaHint: CTA.none.hint,
          ctaBtn: CTA.none.btn,
          hero: null,
        });
      }
    });
  },

  requireHeroActive() {
    if (this.data.heroActive) return true;
    if (this.data.heroDisabled) {
      this.setData({ showDisableDialog: true });
      return false;
    }
    if (this.data.heroPending) {
      wx.navigateTo({ url: '/pages/hero-apply-submitted/hero-apply-submitted' });
      return false;
    }
    if (this.data.heroRejected) {
      this.setData({ showRejectDialog: true });
      return false;
    }
    wx.showToast({ title: '请先成为认证英雄', icon: 'none' });
    return false;
  },

  onApplyHero() {
    data.getHeroApplyStatus().then((res) => {
      const status = res.status;
      if (status === 'approved' && res.hero_enabled === false) {
        this.setData({
          disableReason: this.disableReasonOrFallback(res.disable_reason),
          showDisableDialog: true,
        });
        return;
      }
      if (status === 'approved') {
        wx.showToast({ title: '您已是认证英雄', icon: 'none' });
        this.loadProfile();
        return;
      }
      if (status === 'pending') {
        wx.navigateTo({ url: '/pages/hero-apply-submitted/hero-apply-submitted' });
        return;
      }
      if (status === 'rejected') {
        this.setData({
          rejectReason: this.reasonOrFallback(res.reject_reason),
          showRejectDialog: true,
        });
        return;
      }
      wx.navigateTo({ url: '/pages/hero-apply/hero-apply' });
    });
  },

  onCloseRejectDialog() {
    this.setData({ showRejectDialog: false });
  },

  onCloseDisableDialog() {
    this.setData({ showDisableDialog: false });
  },

  onEditRejectedApply() {
    this.setData({ showRejectDialog: false });
    wx.navigateTo({ url: '/pages/hero-apply/hero-apply' });
  },

  noop() {},

  onVipCard() {
    // 航海家权益卡：不跳转、无提示
  },

  onMallAsset() {
    // 商城资产：不跳转、无提示
  },

  onShoppingCart() {
    // 我的服务：不跳转、无提示
  },

  onShippingAddress() {
    // 我的服务：不跳转、无提示
  },

  onCustomerService() {
    // 我的服务：不跳转、无提示
  },

  onAccountSettings() {
    // 我的服务：不跳转、无提示
  },

  onMessages() {
    wx.navigateTo({ url: '/pages/messages/messages' });
  },

  onHeroProfile() {
    if (!this.requireHeroActive()) return;
    wx.navigateTo({ url: '/pages/hero-apply/hero-apply?mode=edit' });
  },

  onMyRecruitments() {
    if (!this.requireHeroActive()) return;
    wx.navigateTo({ url: '/pages/my-recruitments/my-recruitments' });
  },

  onMyCourses() {
    if (!this.requireHeroActive()) return;
    wx.navigateTo({ url: '/pages/my-courses/my-courses' });
  },

  /** 未认证：我的活动赛事 → 我的报名列表 */
  onMyActivityEvents() {
    wx.navigateTo({ url: '/pages/my-signups/my-signups' });
  },

  /** 未认证：我的课程（用户侧，不设英雄门禁） */
  onMyCoursesUser() {
    wx.navigateTo({ url: '/pages/my-courses/my-courses' });
  },

  onOpenOrders(e) {
    const tab = (e.currentTarget.dataset && e.currentTarget.dataset.tab) || 'all';
    wx.navigateTo({ url: `/pages/my-orders/my-orders?tab=${tab}` });
  },

  onPublishEntry() {
    if (!this.requireHeroActive()) return;
    this.setData({ showPublishSheet: true });
  },

  onClosePublishSheet() {
    this.setData({ showPublishSheet: false });
  },

  onPublishRecruitment() {
    this.setData({ showPublishSheet: false });
    wx.navigateTo({ url: '/pages/recruitment-create/recruitment-create' });
  },

  onPublishCourse() {
    this.setData({ showPublishSheet: false });
    // 跳转后台投票调研表单（地址待配置）
    const surveyUrl = '';
    if (surveyUrl) {
      // 正式：web-view 或复制链接打开；地址由后台投票调研配置
      wx.setClipboardData({
        data: surveyUrl,
        success: () => wx.showToast({ title: '表单链接已复制', icon: 'none' }),
      });
      return;
    }
    wx.showToast({ title: '投票调研表单地址待配置', icon: 'none' });
  },
});
