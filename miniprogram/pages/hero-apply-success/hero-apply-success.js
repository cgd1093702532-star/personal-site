Page({
  data: {
    benefits: [
      '发布课程和赛事招募',
      '接收学员在线报名',
      '获得平台流量扶持',
      '参与英雄排行榜评选',
      '创建专属教练主页',
    ],
    tips: [
      '您的资料将在 1-3 个工作日内完成审核',
      '审核通过后可正式发布招募活动',
      '请保持手机畅通，平台可能联系您核实信息',
    ],
  },

  onGoProfile() {
    wx.navigateTo({ url: '/pages/hero-profile/hero-profile' });
  },

  onGoRecruit() {
    wx.navigateTo({ url: '/pages/recruitment-create/recruitment-create?type=event' });
  },

  onBackProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  },
});
