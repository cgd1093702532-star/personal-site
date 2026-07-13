const data = require('../../utils/data.js');

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
};

Page({
  data: {
    user: { nickname: '航海用户', avatar: '', member: '普通会员' },
    hero: null,
    isHero: false,
    heroPending: false,
    heroRejected: false,
    rejectReason: '',
    ctaHint: CTA.none.hint,
    ctaBtn: CTA.none.btn,
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
          heroRejected: false,
          rejectReason: '',
          ctaHint: CTA.none.hint,
          ctaBtn: CTA.none.btn,
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
          heroRejected: false,
          rejectReason: '',
          ctaHint: CTA.pending.hint,
          ctaBtn: CTA.pending.btn,
          hero: null,
        });
      } else if (mockRole === 'rejected') {
        this.setData({
          user: base,
          isHero: false,
          heroPending: false,
          heroRejected: true,
          rejectReason: res.reject_reason || '',
          ctaHint: CTA.rejected.hint,
          ctaBtn: CTA.rejected.btn,
          hero: null,
        });
      } else {
        this.setData({
          user: base,
          isHero: false,
          heroPending: false,
          heroRejected: false,
          rejectReason: '',
          ctaHint: CTA.none.hint,
          ctaBtn: CTA.none.btn,
          hero: null,
        });
      }
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
        wx.showModal({
          title: '驳回原因',
          content: (res.reject_reason || '').trim() || '暂无驳回原因',
          cancelText: '取消',
          confirmText: '去修改',
          success(modalRes) {
            if (modalRes.confirm) {
              wx.navigateTo({ url: '/pages/hero-apply/hero-apply' });
            }
          },
        });
        return;
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

  onMyRecruitments() {
    if (!this.data.isHero) return;
    wx.navigateTo({ url: '/pages/my-recruitments/my-recruitments' });
  },

  onMyCourses() {
    if (!this.data.isHero) return;
    wx.navigateTo({ url: '/pages/my-courses/my-courses' });
  },
});
