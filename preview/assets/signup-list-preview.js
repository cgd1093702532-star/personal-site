/** 报名人员列表 · 预览（招募确认名单 / 课程已报名成员） */
(function () {
  const root = document.getElementById('signup-list-root');
  if (!root) return;

  const imgBase = '../assets/images/';
  const params = new URLSearchParams(location.search);
  const courseId = params.get('course_id') || '';
  const recruitTitle = params.get('title') ? decodeURIComponent(params.get('title')) : '';

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

  function normalizeMember(raw) {
    return {
      id: raw.id || raw.signup_id || '',
      nickname: raw.nickname || raw.name || '学员',
      phone: raw.phone || '—',
      avatar: avatarSrc(raw.avatar || raw.avatar_img || ''),
      signedAtText: formatSignedAt(raw.signed_at || raw.created_at || raw.time),
      signed_at: raw.signed_at || raw.created_at || raw.time || '',
      status: raw.status || '',
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

  async function loadRecruitSignups(title) {
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

  function renderMemberRows(list, { showConfirm }) {
    if (!list.length) {
      return `<div class="signup-member__empty">${showConfirm ? '暂无报名人员' : '暂无已报名成员'}</div>`;
    }
    return list
      .map((item) => {
        const status =
          showConfirm && item.status
            ? `<div class="signup-member__status">${escapeHtml(item.status)}</div>`
            : '';
        const action =
          showConfirm && item.status === '待确认'
            ? `<button type="button" class="signup-member__confirm" data-confirm="${escapeHtml(item.id)}">确认</button>`
            : '';
        return (
          `<article class="signup-member__item" data-id="${escapeHtml(item.id)}">` +
          `<img class="signup-member__avatar" src="${escapeHtml(item.avatar)}" alt="">` +
          `<div class="signup-member__body">` +
          `<div class="signup-member__name">${escapeHtml(item.nickname)}</div>` +
          `<div class="signup-member__phone">${escapeHtml(item.phone)}</div>` +
          `<div class="signup-member__time">${escapeHtml(item.signedAtText)}</div>` +
          status +
          `</div>` +
          action +
          `</article>`
        );
      })
      .join('');
  }

  function bindConfirmActions() {
    root.querySelectorAll('[data-confirm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (window.PreviewToast) window.PreviewToast.show('已确认', 'success');
        else window.alert('已确认');
        const item = btn.closest('.signup-member__item');
        const statusEl = item?.querySelector('.signup-member__status');
        if (statusEl) statusEl.textContent = '已确认';
        btn.remove();
      });
    });
  }

  function renderMemberPage(title, list, { navTitle, showConfirm }) {
    const head = escapeHtml(title || (showConfirm ? '招募报名' : '课程报名'));
    const nav = document.getElementById('navbar-signup-title');
    if (nav) nav.textContent = navTitle;
    document.title = `${title || navTitle} · ${navTitle}`;
    root.innerHTML =
      `<div class="signup-member">` +
      `<div class="signup-member__head">${head}</div>` +
      `<div class="signup-member__list">${renderMemberRows(list, { showConfirm })}</div>` +
      `</div>`;
    if (showConfirm) bindConfirmActions();
  }

  async function init() {
    if (courseId) {
      const list = await loadCourseMembers(courseId);
      renderMemberPage(recruitTitle || '课程报名', list, {
        navTitle: '已报名成员',
        showConfirm: false,
      });
      return;
    }
    const list = await loadRecruitSignups(recruitTitle);
    renderMemberPage(recruitTitle || '招募报名', list, {
      navTitle: '报名人员',
      showConfirm: true,
    });
  }

  init();
})();
