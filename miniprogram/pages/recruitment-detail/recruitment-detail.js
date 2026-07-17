const data = require('../../utils/data.js');
const signupAction = require('../../utils/signup-action.js');

const NAV_BAR_HEIGHT = 44;
const COVER_BODY_HEIGHT = 180;

function formatFeeParts(fee) {
  const n = Number(fee);
  if (!Number.isFinite(n)) {
    return { int: String(fee ?? '0'), dec: '00' };
  }
  const [intPart, decPart] = n.toFixed(2).split('.');
  return { int: intPart, dec: decPart };
}

Page({
  data: {
    item: null,
    recruitId: '',
    signup: null,
    coverImages: [],
    showForm: false,
    showCheckin: false,
    showInitiateConfirm: false,
    form: { name: '', phone: '', remark: '' },
    footerLabel: '立即报名',
    footerDisabled: false,
    footerAction: 'signup',
    isApprovedHero: false,
    feeInt: '0',
    feeDec: '00',
    displayTags: [],
    statusBarHeight: 20,
    navBarHeight: NAV_BAR_HEIGHT,
    coverThreshold: COVER_BODY_HEIGHT,
    coverStyle: '',
    navSolid: false,
    shareVisible: false,
    shareHero: null,
  },

  onLoad(options) {
    const id = options.id;
    if (!id) {
      wx.showToast({ title: '活动不存在', icon: 'none' });
      return;
    }
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
    Promise.all([
      data.getRecruitmentById(id),
      data.getMySignupByRecruitId(id),
      data.getHeroApplyStatus(),
    ]).then(([item, signup, applyStatus]) => {
      if (!item) {
        wx.showToast({ title: '活动不存在', icon: 'none' });
        return;
      }
      const sys = wx.getSystemInfoSync();
      const statusBarHeight = sys.statusBarHeight || 20;
      const chromeHeight = statusBarHeight + NAV_BAR_HEIGHT;
      const coverImages = item.cover_images || ['recruit-cover.jpg'];
      const isApprovedHero = applyStatus && applyStatus.status === 'approved';
      const footer = signupAction.resolveSignupFooter({
        recruitment: item,
        isApprovedHero,
      });
      const feeParts = formatFeeParts(item.fee);
      const displayTags = (Array.isArray(item.tags) ? item.tags : [])
        .map((t) => String(t || '').trim())
        .filter(Boolean)
        .slice(0, 3);
      const desc =
        (item.description || '').trim() ||
        [item.typeLabel, item.location, item.timeDisplay || item.start_at]
          .filter(Boolean)
          .join(' · ') ||
        '欢迎扫码查看活动详情';
      this.setData({
        item,
        recruitId: id,
        signup,
        coverImages,
        isApprovedHero,
        feeInt: feeParts.int,
        feeDec: feeParts.dec,
        displayTags,
        footerLabel: footer.label,
        footerDisabled: footer.disabled,
        footerAction: footer.action,
        shareHero: {
          name: item.title || '赛事/活动',
          nickname: item.title || '赛事/活动',
          about_me: desc,
          bio: desc,
          avatar_img: coverImages[0] || 'recruit-cover.jpg',
          avatar: coverImages[0] || 'recruit-cover.jpg',
        },
        statusBarHeight,
        coverThreshold: COVER_BODY_HEIGHT,
        coverStyle: `height: ${chromeHeight + COVER_BODY_HEIGHT}px`,
        navSolid: false,
      });
    });
  },

  onShareAppMessage() {
    const { item, recruitId } = this.data;
    return {
      title: (item && item.title) || '赛事/活动',
      path: `/pages/recruitment-detail/recruitment-detail?id=${recruitId}`,
    };
  },

  onShareTimeline() {
    const { item, recruitId } = this.data;
    return {
      title: (item && item.title) || '赛事/活动',
      query: `id=${recruitId}`,
    };
  },

  onShareTap() {
    this.setData({ shareVisible: true });
  },

  onShareClose() {
    this.setData({ shareVisible: false });
  },

  applyFooter() {
    const footer = signupAction.resolveSignupFooter({
      recruitment: this.data.item,
      isApprovedHero: this.data.isApprovedHero,
    });
    this.setData({
      footerLabel: footer.label,
      footerDisabled: footer.disabled,
      footerAction: footer.action,
    });
  },

  onPageScroll(e) {
    if (!this.data.item) return;
    const navSolid = e.scrollTop >= this.data.coverThreshold;
    if (navSolid !== this.data.navSolid) {
      this.setData({ navSolid });
    }
  },

  onBack() {
    wx.navigateBack();
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onCustomerService() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  onLocationTap() {
    wx.showToast({ title: '地图功能开发中', icon: 'none' });
  },

  onOrganizerTap() {
    const id = (this.data.item && this.data.item.hero_id) || '1';
    wx.navigateTo({ url: `/pages/hero-detail/hero-detail?id=${id}` });
  },

  onVipTap() {
    wx.showToast({ title: '即将开放', icon: 'none' });
  },

  onFooterTap() {
    if (this.data.footerDisabled) return;
    if (this.data.footerAction === 'initiate') {
      this.setData({ showInitiateConfirm: true });
      return;
    }
    if (this.data.footerAction === 'signup') {
      if (this.data.signup) {
        wx.showToast({ title: '您已报名', icon: 'none' });
        return;
      }
      this.setData({ showForm: true });
    }
  },

  onCloseInitiateConfirm() {
    this.setData({ showInitiateConfirm: false });
  },

  onConfirmInitiate() {
    this.setData({ showInitiateConfirm: false });
    wx.navigateTo({ url: '/pages/my-recruitments/my-recruitments' });
  },

  noop() {},

  onCloseForm() {
    this.setData({ showForm: false });
  },

  onCloseCheckin() {
    this.setData({ showCheckin: false });
  },

  onConfirmCheckin() {
    const { recruitId } = this.data;
    data
      .checkinMySignup(recruitId)
      .then(() => data.getMySignupByRecruitId(recruitId))
      .then((signup) => {
        this.setData({ signup, showCheckin: false });
        this.applyFooter();
        wx.showToast({ title: '核销成功', icon: 'success' });
      })
      .catch(() => {
        wx.showToast({ title: '核销失败', icon: 'none' });
      });
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onSubmit() {
    const { name, phone, remark } = this.data.form;
    const { item, recruitId } = this.data;
    if (!name.trim()) {
      wx.showToast({ title: '请填写联系人', icon: 'none' });
      return;
    }
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    const entry = {
      recruit_id: recruitId,
      title: item.title,
      name: name.trim(),
      phone,
      remark: (remark || '').trim(),
      signed_at: new Date().toISOString(),
      start_at: item.start_at,
      end_at: item.end_at,
      location: item.location,
      fee: item.fee,
      payStatus: '待支付',
      checked_in: false,
    };
    const nextSigned = (item.signed || 0) + 1;
    Promise.all([
      data.addMySignup(entry),
      data.updateRecruitment(recruitId, { ...item, signed: nextSigned }),
    ])
      .then(() => data.getMySignupByRecruitId(recruitId))
      .then((signup) => {
        this.setData({
          showForm: false,
          form: { name: '', phone: '', remark: '' },
          item: { ...item, signed: nextSigned },
          signup,
        });
        this.applyFooter();
        wx.showToast({ title: '报名成功', icon: 'success' });
      })
      .catch(() => {
        wx.showToast({ title: '报名失败', icon: 'none' });
      });
  },
});
