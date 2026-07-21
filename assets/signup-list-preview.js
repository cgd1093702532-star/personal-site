/** 报名人员列表 · 预览（招募确认名单 / 课程已报名成员） */
(function () {
  const root = document.getElementById('signup-list-root');
  if (!root) return;

  const imgBase = '../assets/images/';
  const params = new URLSearchParams(location.search);
  const courseId = params.get('course_id') || '';
  const recruitTitle = params.get('title') ? decodeURIComponent(params.get('title')) : '';
  const signedParam = params.get('signed');
  const signedCount =
    signedParam != null && signedParam !== '' && Number.isFinite(Number(signedParam))
      ? Math.max(0, Math.floor(Number(signedParam)))
      : null;

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
        avatar: 'avatar-user.jpg',
        signed_at: '2026-07-14T18:32:15',
      },
      {
        id: 'cm2',
        nickname: '帆友阿张',
        name: '张伟',
        phone: '13900139002',
        avatar: 'avatar-user.jpg',
        signed_at: '2026-07-13T09:05:42',
      },
      {
        id: 'cm3',
        nickname: '海边的风',
        name: '王芳',
        phone: '13700137003',
        avatar: 'avatar-user.jpg',
        signed_at: '2026-07-12T21:18:07',
      },
      {
        id: 'cm4',
        nickname: '学员小林',
        name: '林静',
        phone: '13600136004',
        avatar: 'avatar-user.jpg',
        signed_at: '2026-07-10T14:01:33',
      },
    ],
    c4: [
      {
        id: 'cm5',
        nickname: '周末体验者',
        name: '陈晨',
        phone: '13500135005',
        avatar: 'avatar-user.jpg',
        signed_at: '2026-07-11T11:20:00',
      },
    ],
  };

  const DEFAULT_RECRUIT_SIGNUPS = [
    {
      id: 'rs1',
      nickname: '张三',
      name: '张三',
      phone: '13800001111',
      avatar: 'avatar-user.jpg',
      signed_at: '2026-07-08T10:20:00',
      status: '待确认',
      title: '企业家杯月赛',
    },
    {
      id: 'rs2',
      nickname: '李四',
      name: '李四',
      phone: '13900002222',
      avatar: 'avatar-user.jpg',
      signed_at: '2026-07-07T16:05:00',
      status: '已确认',
      title: '企业家杯月赛',
    },
  ];

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
        avatar: 'avatar-user.jpg',
        signed_at: new Date(base - i * 3600 * 1000 * 5).toISOString().slice(0, 19),
        title: title || '招募报名',
      };
    });
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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
    if (!avatar) return `${imgBase}avatar-user.jpg`;
    const s = String(avatar);
    if (s.startsWith('http') || s.startsWith('../') || s.startsWith('/') || s.startsWith('data:')) {
      return s.replace(/^\/assets\//, '../assets/');
    }
    return `${imgBase}${s}`;
  }

  function sortBySignedAtDesc(list) {
    return [...list].sort((a, b) => {
      const ta = new Date(a.signed_at || a.created_at || a.time || 0).getTime();
      const tb = new Date(b.signed_at || b.created_at || b.time || 0).getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    });
  }

  const COURSE_TITLES = {
    c1: 'ASA 101+ASA 103 组合课程',
    c4: '皮划艇入门体验课',
    c9: '帆船入门周末班',
  };

  function resolveHeadTitle({ courseId, recruitTitle, list, isCourse }) {
    const fromQuery = String(recruitTitle || '').trim();
    if (fromQuery && fromQuery !== '招募报名' && fromQuery !== '课程报名') return fromQuery;
    if (isCourse) {
      if (COURSE_TITLES[courseId]) return COURSE_TITLES[courseId];
      return '课程报名';
    }
    const fromList = (list || []).map((i) => i.title || i.recruit_title).find(Boolean);
    if (fromList) return fromList;
    return (DEFAULT_RECRUIT_SIGNUPS[0] && DEFAULT_RECRUIT_SIGNUPS[0].title) || '企业家杯月赛';
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

  async function loadCourseMembers(id) {
    let items = [];
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        if (typeof window.HeroPlazaDB.listSignups === 'function') {
          items = (await window.HeroPlazaDB.listSignups({ course_id: id })) || [];
        }
      } catch (err) {
        console.warn('[signup-list] 课程成员加载失败', err);
      }
    }
    if (!items.length) items = DEFAULT_COURSE_MEMBERS[id] || DEFAULT_COURSE_MEMBERS.c1 || [];
    return sortBySignedAtDesc(items.map(normalizeMember));
  }

  async function loadRecruitSignups(title, count) {
    if (count != null) {
      return sortBySignedAtDesc(buildMockRecruitSignups(title, count).map(normalizeMember));
    }
    let items = [];
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        const mine = (await window.HeroPlazaDB.listMySignups()) || [];
        items = mine.filter((s) => s.type !== 'course' && (!title || s.title === title));
      } catch (_) {
        /* fall through */
      }
    }
    if (!items.length) {
      items = DEFAULT_RECRUIT_SIGNUPS.filter((s) => !title || title === '招募报名' || s.title === title);
    }
    return sortBySignedAtDesc(items.map(normalizeMember));
  }

  function renderMemberRows(list) {
    return list
      .map((item) => {
        return (
          `<article class="signup-member__item" data-id="${escapeHtml(item.id)}">` +
          `<img class="signup-member__avatar" src="${escapeHtml(item.avatar)}" alt="">` +
          `<div class="signup-member__body">` +
          `<div class="signup-member__name">${escapeHtml(item.nickname)}</div>` +
          `<div class="signup-member__phone">${escapeHtml(item.phone)}</div>` +
          `</div>` +
          `<div class="signup-member__time">${escapeHtml(item.signedAtText)}</div>` +
          `</article>`
        );
      })
      .join('');
  }

  function renderMemberPage(title, list, { navTitle, emptyText }) {
    const nav = document.getElementById('navbar-signup-title');
    if (nav) nav.textContent = navTitle;
    document.title = `${title || navTitle} · ${navTitle}`;
    if (!list.length) {
      root.innerHTML =
        `<div class="signup-member signup-member--empty-page">` +
        `<div class="signup-member__empty">` +
        `<div class="signup-member__empty-icon"><img src="../assets/icons/empty.png" alt=""></div>` +
        `<div class="signup-member__empty-title">${escapeHtml(emptyText)}</div>` +
        `</div>` +
        `</div>`;
      return;
    }
    root.innerHTML =
      `<div class="signup-member">` +
      `<div class="signup-member__list">${renderMemberRows(list)}</div>` +
      `</div>`;
  }

  async function init() {
    if (courseId) {
      const list = await loadCourseMembers(courseId);
      const headTitle = resolveHeadTitle({
        courseId,
        recruitTitle,
        list,
        isCourse: true,
      });
      renderMemberPage(headTitle, list, {
        navTitle: '已报名成员',
        emptyText: '暂无已报名成员',
      });
      return;
    }
    const list = await loadRecruitSignups(recruitTitle, signedCount);
    const headTitle = resolveHeadTitle({
      courseId: '',
      recruitTitle,
      list,
      isCourse: false,
    });
    renderMemberPage(headTitle, list, {
      navTitle: '报名人员',
      emptyText: '暂无报名人员',
    });
  }

  init();
})();
