const data = require('../../utils/data.js');

Page({
  data: {
    user: { nickname: '航海用户', avatar: '', member: '普通会员' },
    hero: null,
    isHero: false,
    heroPending: false,
    showPublishSheet: false,
    activity: {
      signupOngoing: 2,
      signupDone: 1,
      reviewCount: 3,
    },
  },

  onShow() {
    this.loadProfile();
  },

  loadProfile() {
    data.getHeroApplyStatus().then((res) => {
      const mockRole = res.status;
      const base = { nickname: '航海用户', member: '普通会员' };
      if (mockRole === 'approved') {
        this.setData({
          user: base,
          isHero: true,
          heroPending: false,
          hero: {
            name: '小哥',
            certification_level: 'ASA帆船认证教练',
            rating: 4.9,
            student_count: 128,
            course_count: 12,
          },
        });
      } else if (mockRole === 'pending') {
        this.setData({
          user: base,
          isHero: false,
          heroPending: true,
          hero: null,
        });
      } else {
        this.setData({
          user: base,
          isHero: false,
          heroPending: false,
          hero: null,
        });
      }
    });
    data.getMySignupSummary().then((summary) => {
      this.setData({
        'activity.signupOngoing': summary.signupOngoing,
        'activity.signupDone': summary.signupDone,
      });
    });
    data.getMyReviewCount().then((count) => {
      this.setData({ 'activity.reviewCount': count });
    });
  },

  onToggleHeroState() {
    const next = this.data.isHero ? 'none' : 'approved';
    data.setAppState('mock_hero_role', next).then(() => {
      wx.setStorageSync('mock_hero_role', next);
      this.loadProfile();
    });
  },

  onApplyHero() {
    data.getHeroApplyStatus().then((res) => {
      const status = res.status;
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
        wx.showToast({
          title: res.reject_reason || '申请已驳回，可重新提交',
          icon: 'none',
          duration: 1500,
        });
      }
      wx.navigateTo({ url: '/pages/hero-apply/hero-apply' });
    });
  },

  onHeroCertSuccess() {
    if (!this.data.isHero) return;
    wx.navigateTo({ url: '/pages/hero-apply-success/hero-apply-success' });
  },

  onMySignups() {
    wx.navigateTo({ url: '/pages/my-signups/my-signups' });
  },

  onMyReviews() {
    wx.navigateTo({ url: '/pages/my-reviews/my-reviews' });
  },

  onMyStudents() {
    if (!this.data.isHero) return;
    wx.navigateTo({ url: '/pages/my-students/my-students' });
  },

  onMyRatings() {
    if (!this.data.isHero) return;
    wx.navigateTo({ url: '/pages/hero-reviews/hero-reviews' });
  },

  onHeroProfile() {
    if (!this.data.isHero) return;
    wx.navigateTo({ url: '/pages/hero-profile/hero-profile' });
  },

  onCreateRecruitment() {
    if (!this.data.isHero) return;
    this.setData({ showPublishSheet: true });
  },

  onClosePublishSheet() {
    this.setData({ showPublishSheet: false });
  },

  onPublishEvent() {
    this.setData({ showPublishSheet: false });
    wx.navigateTo({ url: '/pages/recruitment-create/recruitment-create?type=event' });
  },

  onPublishCourse() {
    this.setData({ showPublishSheet: false });
    wx.navigateTo({ url: '/pages/course-create/course-create' });
  },

  noop() {},

  onMyRecruitments() {
    if (!this.data.isHero) return;
    wx.navigateTo({ url: '/pages/my-recruitments/my-recruitments' });
  },

  onMyCourses() {
    if (!this.data.isHero) return;
    wx.navigateTo({ url: '/pages/my-courses/my-courses' });
  },
});
