const data = require('../../utils/data.js');
const signupAction = require('../../utils/signup-action.js');

const NAV_BAR_HEIGHT = 44;
const COVER_BODY_HEIGHT = 180;

Page({
  data: {
    item: null,
    recruitId: '',
    signup: null,
    coverImages: [],
    showForm: false,
    showCheckin: false,
    form: { name: '', phone: '', remark: '' },
    footerLabel: '立即报名',
    footerDisabled: false,
    footerAction: 'signup',
    statusBarHeight: 20,
    navBarHeight: NAV_BAR_HEIGHT,
    coverThreshold: COVER_BODY_HEIGHT,
    coverStyle: '',
    navSolid: false,
  },

  onLoad(options) {
    const id = options.id;
    if (!id) {
      wx.showToast({ title: '活动不存在', icon: 'none' });
      return;
    }
    Promise.all([data.getRecruitmentById(id), data.getMySignupByRecruitId(id)]).then(([item, signup]) => {
      if (!item) {
        wx.showToast({ title: '活动不存在', icon: 'none' });
        return;
      }
      const sys = wx.getSystemInfoSync();
      const statusBarHeight = sys.statusBarHeight || 20;
      const chromeHeight = statusBarHeight + NAV_BAR_HEIGHT;
      const coverImages = item.cover_images || ['recruit-cover.jpg'];
      const progress = item.total ? Math.min(100, Math.round((item.signed / item.total) * 100)) : 0;
      const footer = signupAction.resolveSignupFooter({ recruitment: item, signup });
      this.setData({
        item,
        recruitId: id,
        signup,
        coverImages,
        progress,
        footerLabel: footer.label,
        footerDisabled: footer.disabled,
        footerAction: footer.action,
        statusBarHeight,
        coverThreshold: COVER_BODY_HEIGHT,
        coverStyle: `height: ${chromeHeight + COVER_BODY_HEIGHT}px`,
        navSolid: false,
      });
    });
  },

  applyFooter() {
    const footer = signupAction.resolveSignupFooter({
      recruitment: this.data.item,
      signup: this.data.signup,
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

  onFooterTap() {
    if (this.data.footerDisabled) return;
    if (this.data.footerAction === 'checkin') {
      this.setData({ showCheckin: true });
      return;
    }
    if (this.data.footerAction === 'signup') {
      this.setData({ showForm: true });
    }
  },

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
          progress: item.total ? Math.min(100, Math.round((nextSigned / item.total) * 100)) : 0,
        });
        this.applyFooter();
        wx.showToast({ title: '报名成功', icon: 'success' });
      })
      .catch(() => {
        wx.showToast({ title: '报名失败', icon: 'none' });
      });
  },
});
