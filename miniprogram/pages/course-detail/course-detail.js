const data = require('../../utils/data.js');
const mock = require('../../utils/mock.js');

const NAV_BAR_HEIGHT = 44;
const COVER_BODY_HEIGHT = 180;
const DEFAULT_TAGS = ['零基础友好', '含装备', '小班教学'];

function formatFeeParts(fee) {
  const n = Number(fee);
  if (!Number.isFinite(n)) {
    return { int: String(fee ?? '0'), dec: '00' };
  }
  const [intPart, decPart] = n.toFixed(2).split('.');
  return { int: intPart, dec: decPart };
}

function normalizeCoverImages(item) {
  const list =
    (item.banner_images && item.banner_images.length && item.banner_images) ||
    (item.cover_image ? [`/assets/images/${item.cover_image}.jpg`] : ['/assets/images/course.jpg']);
  return list.map((src) => {
    const s = String(src || '');
    if (s.startsWith('/')) return s;
    if (s.startsWith('http')) return s;
    return `/assets/images/${s.replace(/\.(jpg|png)$/i, '')}.jpg`;
  });
}

Page({
  data: {
    item: null,
    courseId: '',
    coverImages: [],
    showForm: false,
    form: { name: '', phone: '', remark: '' },
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
    signupNoop: false,
  },

  onLoad(options) {
    const id = options.id;
    const signupNoop = options.from === 'home' || options.from === 'hero';
    const item = mock.getCourseById(id);
    if (!item) {
      wx.showToast({ title: '课程不存在', icon: 'none' });
      return;
    }
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
    const sys = wx.getSystemInfoSync();
    const statusBarHeight = sys.statusBarHeight || 20;
    const chromeHeight = statusBarHeight + NAV_BAR_HEIGHT;
    const coverImages = normalizeCoverImages(item);
    const feeParts = formatFeeParts(item.price);
    const displayTags = (Array.isArray(item.tags) && item.tags.length ? item.tags : DEFAULT_TAGS)
      .map((t) => String(t || '').trim())
      .filter(Boolean)
      .slice(0, 3);
    const desc =
      (item.description || '').trim() ||
      ['课程', item.location, item.time].filter(Boolean).join(' · ') ||
      '欢迎扫码查看课程详情';
    this.setData({
      item: { ...item, remark: item.remark || '' },
      courseId: id,
      coverImages,
      feeInt: feeParts.int,
      feeDec: feeParts.dec,
      displayTags,
      signupNoop,
      statusBarHeight,
      coverThreshold: COVER_BODY_HEIGHT,
      coverStyle: `height: ${chromeHeight + COVER_BODY_HEIGHT}px`,
      navSolid: false,
      shareHero: {
        name: item.title || '课程',
        nickname: item.title || '课程',
        about_me: desc,
        bio: desc,
        avatar_img: coverImages[0] || '/assets/images/course.jpg',
        avatar: coverImages[0] || '/assets/images/course.jpg',
      },
    });
  },

  onShareAppMessage() {
    const { item, courseId } = this.data;
    return {
      title: (item && item.title) || '课程详情',
      path: `/pages/course-detail/course-detail?id=${courseId}`,
    };
  },

  onShareTimeline() {
    const { item, courseId } = this.data;
    return {
      title: (item && item.title) || '课程详情',
      query: `id=${courseId}`,
    };
  },

  onShareTap() {
    this.setData({ shareVisible: true });
  },

  onShareClose() {
    this.setData({ shareVisible: false });
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

  onSignupTap() {
    if (this.data.signupNoop) return;
    this.setData({ showForm: true });
  },

  onCloseForm() {
    this.setData({ showForm: false });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onSubmit() {
    const { form, item, courseId } = this.data;
    const name = (form.name || '').trim();
    const phone = (form.phone || '').trim();
    if (!name) {
      wx.showToast({ title: '请填写联系人', icon: 'none' });
      return;
    }
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    data
      .addMySignup({
        type: 'course',
        course_id: courseId,
        title: item.title,
        name,
        phone,
        remark: (form.remark || '').trim(),
        fee: item.price,
        location: item.location,
        hero_id: item.hero_id || '1',
      })
      .then(() => {
        this.setData({ showForm: false, form: { name: '', phone: '', remark: '' } });
        wx.showToast({ title: '报名成功', icon: 'success' });
      })
      .catch(() => {
        wx.showToast({ title: '报名失败', icon: 'none' });
      });
  },
});
