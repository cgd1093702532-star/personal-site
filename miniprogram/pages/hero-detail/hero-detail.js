const mock = require('../../utils/mock.js');
const data = require('../../utils/data.js');

function buildStars(rating) {
  return [1, 2, 3, 4, 5].map((i) => ({
    index: i,
    filled: rating >= i,
    half: rating >= i - 0.5 && rating < i,
  }));
}

function buildDetailTags(hero) {
  const tags = [...(hero.honor_titles || []), ...(hero.cert_badges || [])];
  return tags.slice(0, 3);
}

Page({
  data: {
    hero: null,
    heroId: '',
    detailTags: [],
    stars: [],
    recruitments: [],
    recruitmentsAll: [],
    showRecruitExpand: false,
    recruitExpandCount: 0,
    courses: [],
    momentUrls: [],
    certUrls: [],
    viewerVisible: false,
    viewerUrls: [],
    viewerCurrent: 0,
    shareVisible: false,
    showApplyBtn: true,
    rejectReason: '',
    showRejectDialog: false,
  },

  onLoad(options) {
    const heroId = options.id || '1';
    const hero = mock.getHeroById(heroId);
    if (!hero) {
      wx.showToast({ title: '教练不存在', icon: 'none' });
      return;
    }
    wx.setNavigationBarTitle({ title: hero.name });
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
    const certUrls = (hero.certificates || []).map((c) => c.image);
    const recruitPreviewLimit = 2;
    const recruitmentsAll = mock.getRecruitmentsByHeroId(heroId);
    const showRecruitExpand = recruitmentsAll.length > recruitPreviewLimit;
    this.setData({
      hero,
      heroId,
      detailTags: buildDetailTags(hero),
      stars: buildStars(hero.rating),
      momentUrls: hero.moments || [],
      certUrls,
      recruitmentsAll,
      recruitments: showRecruitExpand
        ? recruitmentsAll.slice(0, recruitPreviewLimit)
        : recruitmentsAll,
      showRecruitExpand,
      recruitExpandCount: showRecruitExpand
        ? recruitmentsAll.length - recruitPreviewLimit
        : 0,
      courses: mock.getCoursesByHeroId(heroId),
    });
    this.refreshApplyBtn();
  },

  onShow() {
    this.refreshApplyBtn();
  },

  refreshApplyBtn() {
    data.getHeroApplyStatus().then((res) => {
      this.setData({ showApplyBtn: (res?.status || 'none') !== 'approved' });
    });
  },

  onShareAppMessage() {
    const { hero, heroId } = this.data;
    if (!hero) return {};
    const projects = (hero.project_types || []).join('/');
    return {
      title: `${hero.name} · ${projects || '水上运动'}教练`,
      path: `/pages/hero-detail/hero-detail?id=${heroId}`,
    };
  },

  onShareTimeline() {
    const { hero, heroId } = this.data;
    if (!hero) return {};
    return {
      title: `${hero.name} · 英雄广场教练`,
      query: `id=${heroId}`,
    };
  },

  onShareTap() {
    this.setData({ shareVisible: true });
  },

  onShareClose() {
    this.setData({ shareVisible: false });
  },

  openViewer(urls, current) {
    if (!urls || !urls.length) return;
    const index = Math.max(0, urls.indexOf(current));
    this.setData({
      viewerVisible: true,
      viewerUrls: urls,
      viewerCurrent: index,
    });
  },

  onPreviewMoment(e) {
    const { current } = e.currentTarget.dataset;
    this.openViewer(this.data.momentUrls, current);
  },

  onPreviewCert(e) {
    const { current } = e.currentTarget.dataset;
    this.openViewer(this.data.certUrls, current);
  },

  onViewerClose() {
    this.setData({ viewerVisible: false });
  },

  onViewerChange(e) {
    this.setData({ viewerCurrent: e.detail.current });
  },

  onRecruitmentTap(e) {
    const id = e.detail?.recruit_id || e.currentTarget?.dataset?.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/recruitment-detail/recruitment-detail?id=${id}` });
  },

  onExpandRecruitments() {
    this.setData({
      recruitments: this.data.recruitmentsAll,
      showRecruitExpand: false,
    });
  },

  onCourseTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/course-detail/course-detail?id=${id}` });
  },

  onApplyHero() {
    data.getHeroApplyStatus().then((res) => {
      const status = res.status;
      if (status === 'approved') {
        wx.showToast({ title: '您已是认证英雄', icon: 'none' });
        return;
      }
      if (status === 'pending') {
        wx.navigateTo({ url: '/pages/hero-apply-submitted/hero-apply-submitted' });
        return;
      }
      if (status === 'rejected') {
        this.setData({
          rejectReason: (res.reject_reason || '').trim() || '暂无驳回原因',
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

  onEditRejectedApply() {
    this.setData({ showRejectDialog: false });
    wx.navigateTo({ url: '/pages/hero-apply/hero-apply' });
  },

  noop() {},
});
