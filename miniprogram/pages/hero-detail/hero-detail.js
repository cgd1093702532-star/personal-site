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

function formatYearsExpDisplay(yearsExp) {
  const raw = String(yearsExp ?? '').trim();
  if (!raw) return '';
  let s = raw.replace(/[~～－–—−‐‑﹣]/g, '—').replace(/-/g, '—').replace(/\s*—\s*/g, '—');
  if (/经验/.test(s)) return s.replace(/执教经验/g, '经验');
  if (/年/.test(s)) return `${s}经验`;
  return `${s}年经验`;
}

function buildProfileSubtitle(hero) {
  const types = (hero.project_types || []).join(' · ');
  const years = formatYearsExpDisplay(hero.years_exp);
  if (types && years) return `${types} · ${years}`;
  return types || years || '';
}

Page({
  data: {
    hero: null,
    missing: false,
    heroId: '',
    profileSubtitle: '',
    detailTags: [],
    stars: [],
    recruitments: [],
    recruitmentsAll: [],
    showRecruitExpand: false,
    recruitExpandCount: 0,
    courses: [],
    coursesAll: [],
    showCourseExpand: false,
    courseExpandCount: 0,
    momentUrls: [],
    personalShowcaseItems: [],
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
    // 不存在或已禁用：对齐需求 §2.2，主体不渲染
    if (!hero || hero.enabled === false) {
      this.setData({ missing: true, hero: null, heroId });
      wx.setNavigationBarTitle({ title: '英雄详情' });
      return;
    }
    wx.setNavigationBarTitle({ title: hero.name });
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
    const certUrls = (hero.certificates || []).map((c) => c.image);
    const personalItems = ((hero.personal_showcase && hero.personal_showcase.items) || []).slice(0, 10);
    const personalShowcaseItems = personalItems.map((item) => item.image || item);
    const previewLimit = 2;
    const recruitmentsAll = mock.getRecruitmentsByHeroId(heroId);
    const showRecruitExpand = recruitmentsAll.length > previewLimit;
    const coursesAll = mock.getCoursesByHeroId(heroId);
    const showCourseExpand = coursesAll.length > previewLimit;
    const aboutMe = String(hero.about_me || '').slice(0, 200);
    this.setData({
      hero: { ...hero, about_me: aboutMe },
      heroId,
      profileSubtitle: buildProfileSubtitle(hero),
      detailTags: buildDetailTags(hero),
      stars: buildStars(hero.rating),
      momentUrls: hero.moments || [],
      personalShowcaseItems,
      certUrls,
      recruitmentsAll,
      recruitments: showRecruitExpand
        ? recruitmentsAll.slice(0, previewLimit)
        : recruitmentsAll,
      showRecruitExpand,
      recruitExpandCount: showRecruitExpand
        ? recruitmentsAll.length - previewLimit
        : 0,
      coursesAll,
      courses: showCourseExpand ? coursesAll.slice(0, previewLimit) : coursesAll,
      showCourseExpand,
      courseExpandCount: showCourseExpand ? coursesAll.length - previewLimit : 0,
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

  onPreviewPersonal(e) {
    const { current } = e.currentTarget.dataset;
    this.openViewer(this.data.personalShowcaseItems, current);
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
    wx.navigateTo({ url: `/pages/recruitment-detail/recruitment-detail?id=${id}&from=hero` });
  },

  onExpandRecruitments() {
    this.setData({
      recruitments: this.data.recruitmentsAll,
      showRecruitExpand: false,
    });
  },

  onExpandCourses() {
    this.setData({
      courses: this.data.coursesAll,
      showCourseExpand: false,
    });
  },

  onCourseTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/course-detail/course-detail?id=${id}&from=hero` });
  },

  onApplyHero() {
    data.getHeroApplyStatus().then((res) => {
      const status = res.status;
      if (status === 'approved') {
        wx.showToast({ title: '您已是认证英雄', icon: 'none' });
        return;
      }
      if (status === 'pending') {
        wx.showToast({
          title: '您的申请在审核中，无需重复提交',
          icon: 'none',
        });
        return;
      }
      if (status === 'rejected') {
        this.setData({ showRejectDialog: true });
        return;
      }
      wx.navigateTo({
        url: `/pages/hero-apply/hero-apply?from=hero-detail&hero_id=${this.data.heroId}`,
      });
    });
  },

  onCloseRejectDialog() {
    this.setData({ showRejectDialog: false });
  },

  onHandleRejectedApply() {
    this.setData({ showRejectDialog: false });
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  noop() {},
});
