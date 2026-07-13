const mock = require('../../utils/mock.js');

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
    certLevel: '—',
    detailTags: [],
    stars: [],
    recruitments: [],
    courses: [],
    momentUrls: [],
    certUrls: [],
    viewerVisible: false,
    viewerUrls: [],
    viewerCurrent: 0,
    shareVisible: false,
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
    this.setData({
      hero,
      heroId,
      certLevel: hero.certification || hero.certification_level || '—',
      detailTags: buildDetailTags(hero),
      stars: buildStars(hero.rating),
      momentUrls: hero.moments || [],
      certUrls,
      recruitments: mock.getRecruitmentsByHeroId(heroId),
      courses: mock.getCoursesByHeroId(heroId),
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
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/recruitment-detail/recruitment-detail?id=${id}` });
  },

  onCourseTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/course-detail/course-detail?id=${id}` });
  },
});
