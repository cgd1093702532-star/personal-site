const data = require('../../utils/data.js');

const DEFAULT_COURSE_MEMBERS = {
  c1: [
    {
      id: 'cm1',
      nickname: '航海小李',
      name: '李明',
      phone: '13800138001',
      avatar: '/assets/images/avatar-user.jpg',
      signed_at: '2026-07-14T18:32:15',
    },
    {
      id: 'cm2',
      nickname: '帆友阿张',
      name: '张伟',
      phone: '13900139002',
      avatar: '/assets/images/avatar-user.jpg',
      signed_at: '2026-07-13T09:05:42',
    },
    {
      id: 'cm3',
      nickname: '海边的风',
      name: '王芳',
      phone: '13700137003',
      avatar: '/assets/images/avatar-user.jpg',
      signed_at: '2026-07-12T21:18:07',
    },
    {
      id: 'cm4',
      nickname: '学员小林',
      name: '林静',
      phone: '13600136004',
      avatar: '/assets/images/avatar-user.jpg',
      signed_at: '2026-07-10T14:01:33',
    },
  ],
  c4: [
    {
      id: 'cm5',
      nickname: '周末体验者',
      name: '陈晨',
      phone: '13500135005',
      avatar: '/assets/images/avatar-user.jpg',
      signed_at: '2026-07-11T11:20:00',
    },
  ],
};

function formatSignedAt(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return value || '—';
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const pad = (n) => String(n).padStart(2, '0');
  return `${y}年${m}月${day}日 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function avatarSrc(avatar) {
  if (!avatar) return '/assets/images/avatar-user.jpg';
  const s = String(avatar);
  if (s.startsWith('http') || s.startsWith('/') || s.startsWith('data:')) return s;
  return `/assets/images/${s}`;
}

function normalizeMember(raw) {
  return {
    id: raw.id || raw.signup_id || '',
    nickname: raw.nickname || raw.name || '学员',
    phone: raw.phone || '—',
    avatar: avatarSrc(raw.avatar || raw.avatar_img || ''),
    signedAtText: formatSignedAt(raw.signed_at || raw.created_at || raw.time),
    signed_at: raw.signed_at || raw.created_at || raw.time || '',
  };
}

function sortBySignedAtDesc(list) {
  return [...list].sort((a, b) => {
    const ta = new Date(a.signed_at || 0).getTime();
    const tb = new Date(b.signed_at || 0).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}

Page({
  data: {
    isCourseMode: false,
    courseId: '',
    pageTitle: '招募报名',
    list: [],
  },

  onLoad(options) {
    const courseId = options.course_id || '';
    const title = options.title ? decodeURIComponent(options.title) : '';
    if (courseId) {
      this.setData({
        isCourseMode: true,
        courseId,
        pageTitle: title || '课程报名',
      });
      wx.setNavigationBarTitle({ title: '已报名成员' });
      this.loadCourseMembers(courseId);
      return;
    }
    this.setData({
      isCourseMode: false,
      pageTitle: title || '招募报名',
    });
    this.loadRecruitList(title || '招募报名');
  },

  onShow() {
    if (this.data.isCourseMode && this.data.courseId) {
      this.loadCourseMembers(this.data.courseId);
      return;
    }
    if (this.data.pageTitle) this.loadRecruitList(this.data.pageTitle);
  },

  loadCourseMembers(courseId) {
    const fallback = DEFAULT_COURSE_MEMBERS[courseId] || DEFAULT_COURSE_MEMBERS.c1 || [];
    const loader =
      typeof data.listCourseSignups === 'function'
        ? data.listCourseSignups(courseId)
        : Promise.resolve([]);
    loader
      .then((items) => {
        const source = items && items.length ? items : fallback;
        this.setData({ list: sortBySignedAtDesc(source.map(normalizeMember)) });
      })
      .catch(() => {
        this.setData({ list: sortBySignedAtDesc(fallback.map(normalizeMember)) });
      });
  },

  loadRecruitList(title) {
    data.getAppState('my_signups', []).then((list) => {
      const filtered = (list || []).filter(
        (item) => item.type !== 'course' && (!title || title === '招募报名' || item.title === title),
      );
      this.setData({ list: filtered });
    });
  },

  onConfirm(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;
    data
      .updateSignupStatus(id, '已确认')
      .then(() => {
        wx.showToast({ title: '已确认', icon: 'success' });
        this.loadRecruitList(this.data.pageTitle);
      })
      .catch(() => {
        wx.showToast({ title: '操作失败', icon: 'none' });
      });
  },
});
