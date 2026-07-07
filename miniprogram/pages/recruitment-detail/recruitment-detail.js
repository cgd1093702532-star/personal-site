const data = require('../../utils/data.js');

const NAV_BAR_HEIGHT = 44;
const COVER_BODY_HEIGHT = 180;

Page({
  data: {
    item: null,
    recruitId: '',
    coverImages: [],
    showForm: false,
    form: { name: '', phone: '', remark: '' },
    canSignup: true,
    disabledReason: '',
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
    data.getRecruitmentById(id).then((item) => {
      if (!item) {
        wx.showToast({ title: '活动不存在', icon: 'none' });
        return;
      }
      const sys = wx.getSystemInfoSync();
      const statusBarHeight = sys.statusBarHeight || 20;
      const chromeHeight = statusBarHeight + NAV_BAR_HEIGHT;
      const coverImages = item.cover_images || ['recruit-cover.jpg'];
      const progress = item.total ? Math.min(100, Math.round((item.signed / item.total) * 100)) : 0;
      const canSignup = item.displayStatus !== 'closed' && item.displayStatus !== 'ended';
      this.setData({
        item,
        recruitId: id,
        coverImages,
        progress,
        canSignup,
        disabledReason: canSignup ? '' : '报名已截止',
        statusBarHeight,
        coverThreshold: COVER_BODY_HEIGHT,
        coverStyle: `height: ${chromeHeight + COVER_BODY_HEIGHT}px`,
        navSolid: false,
      });
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

  onSignupTap() {
    if (!this.data.canSignup) {
      wx.showToast({ title: this.data.disabledReason || '暂不可报名', icon: 'none' });
      return;
    }
    this.setData({ showForm: true });
  },

  onCloseForm() {
    this.setData({ showForm: false });
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
    };
    const nextSigned = (item.signed || 0) + 1;
    Promise.all([
      data.addMySignup(entry),
      data.updateRecruitment(recruitId, { ...item, signed: nextSigned }),
    ])
      .then(() => {
        this.setData({
          showForm: false,
          form: { name: '', phone: '', remark: '' },
          item: { ...item, signed: nextSigned },
          progress: item.total ? Math.min(100, Math.round((nextSigned / item.total) * 100)) : 0,
        });
        wx.showToast({ title: '报名成功', icon: 'success' });
      })
      .catch(() => {
        wx.showToast({ title: '报名失败', icon: 'none' });
      });
  },
});
