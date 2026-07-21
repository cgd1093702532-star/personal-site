const data = require('../../utils/data.js');

const MOCK_SIGNUP_POOL = [
  { nickname: '张三', name: '张三', phone: '13800001111' },
  { nickname: '李四', name: '李四', phone: '13900002222' },
  { nickname: '王芳', name: '王芳', phone: '13700137003' },
  { nickname: '陈晨', name: '陈晨', phone: '13500135005' },
  { nickname: '林静', name: '林静', phone: '13600136004' },
  { nickname: '赵强', name: '赵强', phone: '13300133006' },
  { nickname: '周杰', name: '周杰', phone: '13200132007' },
  { nickname: '吴敏', name: '吴敏', phone: '13100131008' },
  { nickname: '郑浩', name: '郑浩', phone: '15800158009' },
  { nickname: '孙悦', name: '孙悦', phone: '15900159010' },
  { nickname: '马超', name: '马超', phone: '18600186011' },
  { nickname: '黄蕾', name: '黄蕾', phone: '18700187012' },
  { nickname: '徐宁', name: '徐宁', phone: '18800188013' },
  { nickname: '何欣', name: '何欣', phone: '18900189014' },
  { nickname: '高翔', name: '高翔', phone: '15000150015' },
  { nickname: '罗倩', name: '罗倩', phone: '15100151016' },
];

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

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 7) return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
  const raw = String(phone || '').trim();
  return raw || '—';
}

function normalizeMember(raw) {
  return {
    id: raw.id || raw.signup_id || '',
    nickname: raw.nickname || raw.name || '学员',
    phone: maskPhone(raw.phone),
    avatar: avatarSrc(raw.avatar || raw.avatar_img || ''),
    signedAtText: formatSignedAt(raw.signed_at || raw.created_at || raw.time),
    signed_at: raw.signed_at || raw.created_at || raw.time || '',
    status: raw.status || '',
    title: raw.title || raw.recruit_title || '',
  };
}

function resolveHeadTitle(options) {
  const title = String((options && options.title) || '').trim();
  if (title && title !== '招募报名' && title !== '课程报名') return title;
  if (options && options.isCourseMode) {
    const map = {
      c1: 'ASA 101+ASA 103 组合课程',
      c4: '皮划艇入门体验课',
      c9: '帆船入门周末班',
    };
    return map[options.courseId] || '课程报名';
  }
  const fromList = ((options && options.list) || []).map((i) => i.title).find(Boolean);
  return fromList || '企业家杯月赛';
}

function sortBySignedAtDesc(list) {
  return [...list].sort((a, b) => {
    const ta = new Date(a.signed_at || a.time || 0).getTime();
    const tb = new Date(b.signed_at || b.time || 0).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}

function buildMockRecruitSignups(title, count) {
  const n = Math.max(0, Number(count) || 0);
  const base = Date.parse('2026-07-14T18:00:00') || Date.now();
  return Array.from({ length: n }, (_, i) => {
    const pool = MOCK_SIGNUP_POOL[i % MOCK_SIGNUP_POOL.length];
    const round = Math.floor(i / MOCK_SIGNUP_POOL.length);
    const phoneBase = String(pool.phone || '13800000000').replace(/\D/g, '').slice(0, 11);
    const phone =
      round === 0
        ? phoneBase
        : `${phoneBase.slice(0, 7)}${String((Number(phoneBase.slice(-4)) + round) % 10000).padStart(4, '0')}`;
    return {
      id: `rs-mock-${i + 1}`,
      nickname: round === 0 ? pool.nickname : `${pool.nickname}${round + 1}`,
      name: round === 0 ? pool.name : `${pool.name}${round + 1}`,
      phone,
      avatar: '/assets/images/avatar-user.jpg',
      signed_at: new Date(base - i * 3600 * 1000 * 5).toISOString().slice(0, 19),
      title: title || '招募报名',
    };
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
    const signedRaw = options.signed;
    const signedCount =
      signedRaw != null && signedRaw !== '' && Number.isFinite(Number(signedRaw))
        ? Math.max(0, Math.floor(Number(signedRaw)))
        : null;
    this._queryTitle = title;
    this._signedCount = signedCount;
    if (courseId) {
      this.setData({
        isCourseMode: true,
        courseId,
        pageTitle: resolveHeadTitle({ title, isCourseMode: true, courseId, list: [] }),
      });
      wx.setNavigationBarTitle({ title: '已报名成员' });
      this.loadCourseMembers(courseId);
      return;
    }
    this.setData({
      isCourseMode: false,
      pageTitle: resolveHeadTitle({ title, isCourseMode: false, list: [] }),
    });
    this.loadRecruitList(title, signedCount);
  },

  onShow() {
    if (this.data.isCourseMode && this.data.courseId) {
      this.loadCourseMembers(this.data.courseId);
      return;
    }
    this.loadRecruitList(this._queryTitle || '', this._signedCount);
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
        const list = sortBySignedAtDesc(source.map(normalizeMember));
        this.setData({
          list,
          pageTitle: resolveHeadTitle({
            title: this._queryTitle,
            isCourseMode: true,
            courseId,
            list,
          }),
        });
      })
      .catch(() => {
        const list = sortBySignedAtDesc(fallback.map(normalizeMember));
        this.setData({
          list,
          pageTitle: resolveHeadTitle({
            title: this._queryTitle,
            isCourseMode: true,
            courseId,
            list,
          }),
        });
      });
  },

  loadRecruitList(title, signedCount) {
    if (signedCount != null) {
      const members = sortBySignedAtDesc(
        buildMockRecruitSignups(title, signedCount).map(normalizeMember),
      );
      this.setData({
        list: members,
        pageTitle: resolveHeadTitle({
          title: this._queryTitle || title,
          isCourseMode: false,
          list: members,
        }),
      });
      return;
    }
    const fallback = [
      {
        id: 'rs1',
        nickname: '张三',
        name: '张三',
        phone: '13800001111',
        avatar: '/assets/images/avatar-user.jpg',
        signed_at: '2026-07-08T10:20:00',
        status: '待确认',
        title: '企业家杯月赛',
      },
      {
        id: 'rs2',
        nickname: '李四',
        name: '李四',
        phone: '13900002222',
        avatar: '/assets/images/avatar-user.jpg',
        signed_at: '2026-07-07T16:05:00',
        status: '已确认',
        title: '企业家杯月赛',
      },
    ];
    data.getAppState('my_signups', []).then((list) => {
      const filtered = (list || []).filter(
        (item) => item.type !== 'course' && (!title || title === '招募报名' || item.title === title),
      );
      const source = filtered.length
        ? filtered
        : fallback.filter((s) => !title || title === '招募报名' || s.title === title);
      const members = sortBySignedAtDesc(source.map(normalizeMember));
      this.setData({
        list: members,
        pageTitle: resolveHeadTitle({
          title: this._queryTitle || title,
          isCourseMode: false,
          list: members,
        }),
      });
    });
  },
});
