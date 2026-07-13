/** 统一数据层：本地 API 优先，wx.storage 镜像兜底 */

const mock = require('./mock.js');
const api = require('./api.js');
const store = require('./store.js');
const { sortMyRecruitmentLists } = require('./recruitment-sort.js');
const { sortMySignupLists } = require('./signup-sort.js');
const { sortReviewsByTimeDesc } = require('./review-sort.js');
const { sortMyCourseLists } = require('./course-sort.js');

let apiReady = null;

function ensureApi() {
  if (apiReady === null) {
    apiReady = api.checkAvailable();
  }
  return apiReady;
}

function mirrorHero(id, patch) {
  store.updateHero(id, patch);
}

function mirrorRecruitment(item, scope) {
  store.upsertRecruitment(item, scope);
}

function getHeroById(id) {
  return ensureApi().then((ok) => {
    if (ok) {
      return api
        .request(`/api/heroes/${id}`)
        .then((hero) => {
          store.updateHero(id, hero);
          return hero;
        })
        .catch(() => store.getHero(id) || mock.getHeroById(id));
    }
    return store.getHero(id) || mock.getHeroById(id);
  });
}

function updateHero(id, patch) {
  return ensureApi().then((ok) => {
    const local = () => {
      const hero = store.updateHero(id, patch);
      if (!hero) return Promise.reject(new Error('hero_not_found'));
      return hero;
    };
    if (!ok) return local();
    return api
      .request(`/api/heroes/${id}`, 'PUT', patch)
      .then((hero) => {
        store.updateHero(id, hero);
        return hero;
      })
      .catch(local);
  });
}

function getHeroes(filter) {
  return ensureApi().then((ok) => {
    if (!ok) return mock.getHeroes(filter);
    return Promise.all([
      api.request('/api/heroes'),
      api.request('/api/recruitments?scope=public').catch(() => ({ items: [] })),
      api.request('/api/courses').catch(() => ({ items: [] })),
    ])
      .then(([heroesRes, recRes, courseRes]) => {
        const recruitments = recRes.items || [];
        const courses = courseRes.items || [];
        const list = (heroesRes.items || []).map((h) => {
          const card = normalizeHeroForList(h, recruitments, courses);
          store.updateHero(card.hero_id, card);
          return card;
        });
        return applyHeroFilters(list, filter);
      })
      .catch(() => mock.getHeroes(filter));
  });
}

function parseYearsExp(value) {
  const n = parseInt(String(value ?? '').replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function normalizeHeroForList(hero, recruitments, courses) {
  const hid = String(hero.hero_id || hero.id || '');
  const events = (recruitments || []).filter((r) => String(r.hero_id || '') === hid).slice(0, 1);
  const heroCourses = (courses || []).filter((c) => String(c.hero_id || '') === hid).slice(0, 1);
  const rows = [];
  events.forEach((e) => {
    rows.push({
      type: 'event',
      status: e.status_label || e.status || '招募中',
      title: e.title || '',
      target_id: e.recruit_id || e.id,
    });
  });
  heroCourses.forEach((c) => {
    rows.push({
      type: 'course',
      status: '报名中',
      title: c.title || '',
      target_id: c.course_id || c.id,
    });
  });
  let honor_titles = Array.isArray(hero.honor_titles) ? [...hero.honor_titles] : [];
  if (!honor_titles.length) {
    const cert = hero.certification || hero.certification_level || '';
    if (cert) honor_titles = [cert];
  }
  if (!honor_titles.length && hero.years_exp != null && hero.years_exp !== '') {
    const y = String(hero.years_exp).trim();
    honor_titles = [/年/.test(y) ? `${y}执教经验` : `${y}年执教经验`];
  }
  return {
    ...hero,
    hero_id: hid,
    honor_titles,
    recruitments: rows,
  };
}

function applyHeroFilters(list, filter) {
  let result = Array.isArray(list) ? [...list] : [];
  const f = filter || {};
  const keyword = f.keyword || '';
  const projectType = f.project_type || '全部';
  const sortBy = f.sort_by || 'default';
  const yearsRange = f.years_range || '全部';

  if (projectType && projectType !== '全部') {
    result = result.filter((h) =>
      (h.project_types || []).some((p) => p.includes(projectType) || projectType.includes(p)),
    );
  }

  if (yearsRange && yearsRange !== '全部') {
    const opt = (mock.YEARS_OPTIONS || []).find((o) => o.id === yearsRange);
    if (opt && opt.min != null) {
      const max = opt.max >= 999 ? Infinity : opt.max;
      result = result.filter((h) => {
        const y = parseYearsExp(h.years_exp);
        return y >= opt.min && y <= max;
      });
    }
  }

  if (keyword) {
    const { fuzzyFilter } = require('./fuzzy.js');
    result = fuzzyFilter(result, keyword, (h) => [
      h.name,
      h.certification_level,
      h.certification,
      h.bio,
      h.about_me,
      String(h.years_exp),
      `${h.years_exp}年`,
      String(h.rating),
      ...(h.cert_badges || []),
      ...(h.honor_titles || []),
      ...(h.project_types || []),
      ...(h.recruitments || []).map((r) => `${r.status || ''} ${r.title || ''}`),
    ]);
  }

  if (sortBy === 'rating_desc') {
    result.sort(
      (a, b) =>
        (Number(b.rating) || 0) - (Number(a.rating) || 0) ||
        parseYearsExp(b.years_exp) - parseYearsExp(a.years_exp),
    );
  } else if (sortBy === 'rating_asc') {
    result.sort(
      (a, b) =>
        (Number(a.rating) || 0) - (Number(b.rating) || 0) ||
        parseYearsExp(a.years_exp) - parseYearsExp(b.years_exp),
    );
  }

  return result;
}

function getRecruitmentById(id) {
  return ensureApi().then((ok) => {
    if (ok) {
      return api
        .request(`/api/recruitments/${id}`)
        .then((item) => {
          const scope = item.listTab ? `mine_${item.listTab}` : 'public';
          mirrorRecruitment(item, scope);
          return mock.getRecruitmentById(id) || item;
        })
        .catch(() => store.getRecruitment(id) || mock.getRecruitmentById(id));
    }
    return store.getRecruitment(id) || mock.getRecruitmentById(id);
  });
}

function getMyRecruitmentLists() {
  return ensureApi().then((ok) => {
    if (ok) {
      const qs = `?user_id=${encodeURIComponent(MOCK_USER_ID)}`;
      return Promise.all([
        api.request(`/api/recruitments/mine/active${qs}`),
        api.request(`/api/recruitments/mine/ended${qs}`),
        api.request(`/api/recruitments/mine/draft${qs}`),
      ])
        .then(([active, ended, draft]) => {
          const lists = sortMyRecruitmentLists({
            active: active.items || [],
            ended: ended.items || [],
            draft: draft.items || [],
          });
          ['active', 'ended', 'draft'].forEach((tab) => {
            (lists[tab] || []).forEach((item) => mirrorRecruitment(item, `mine_${tab}`));
          });
          return lists;
        })
        .catch(() => store.getMyRecruitmentLists());
    }
    return store.getMyRecruitmentLists();
  });
}

function normalizeScope(tab) {
  if (!tab) return 'mine_active';
  if (tab.startsWith('mine_')) return tab;
  return `mine_${tab}`;
}

function createRecruitment(item, tab) {
  const scope = normalizeScope(tab || 'active');
  return ensureApi().then((ok) => {
    const withUser = { ...item, user_id: item.user_id || MOCK_USER_ID };
    const local = () => {
      mirrorRecruitment(withUser, scope);
      return withUser;
    };
    if (!ok) return Promise.resolve(local());
    const attachHero = () => {
      if (withUser.hero_id && withUser.hero_id !== '1') {
        return Promise.resolve(withUser);
      }
      return api
        .request(`/api/heroes/apply/status?user_id=${encodeURIComponent(MOCK_USER_ID)}`)
        .then((res) => {
          if (res?.status === 'approved') {
            const app = res.application || {};
            withUser.hero_id = res.hero_id || app.hero_id || withUser.hero_id || '1';
            if (app.name) withUser.hero_name = app.name;
          }
          return withUser;
        })
        .catch(() => withUser);
    };
    return attachHero()
      .then((payload) => api.request('/api/recruitments', 'POST', { ...payload, scope }))
      .then((saved) => {
        mirrorRecruitment(saved, scope);
        return saved;
      })
      .catch(local);
  });
}

function updateRecruitment(id, item) {
  const scope = normalizeScope(item.listTab || 'active');
  return ensureApi().then((ok) => {
    const local = () => {
      mirrorRecruitment({ ...item, recruit_id: id }, scope);
      return { ...item, recruit_id: id };
    };
    if (!ok) return Promise.resolve(local());
    return api
      .request(`/api/recruitments/${id}`, 'PUT', { ...item, scope })
      .then((saved) => {
        mirrorRecruitment(saved, scope);
        return saved;
      })
      .catch(local);
  });
}

function deleteRecruitment(id) {
  return ensureApi().then((ok) => {
    const local = () => store.deleteRecruitment(id);
    if (!ok) return Promise.resolve(local());
    return api
      .request(`/api/recruitments/${id}`, 'DELETE')
      .then(() => {
        store.deleteRecruitment(id);
        return true;
      })
      .catch(local);
  });
}

function getRecruitmentsByHeroId(heroId) {
  return ensureApi().then((ok) => {
    if (!ok) return mock.getRecruitmentsByHeroId(heroId);
    return api
      .request('/api/recruitments', 'GET', { hero_id: heroId, scope: 'public' })
      .then((res) => {
        const items = res.items || [];
        if (!items.length) return mock.getRecruitmentsByHeroId(heroId);
        return items.map((e) => ({
          ...e,
          timeDisplay: mock.formatRecruitmentTimeRange(e.start_at, e.end_at),
          signupDisplay: mock.formatRecruitmentSignup(e.signed, e.total),
          cover_image:
            e.cover_image ||
            (e.cover_images && e.cover_images.length ? e.cover_images[0] : 'recruit-cover.jpg'),
        }));
      })
      .catch(() => mock.getRecruitmentsByHeroId(heroId));
  });
}

function getAppState(key, fallback) {
  return ensureApi().then((ok) => {
    if (ok) {
      return api
        .request(`/api/app-state/${key}`)
        .then((res) => {
          const val = res.value === undefined ? fallback : res.value;
          store.setAppState(key, val);
          return val;
        })
        .catch(() => store.getAppState(key, fallback));
    }
    return store.getAppState(key, fallback);
  });
}

function setAppState(key, value) {
  return ensureApi().then((ok) => {
    store.setAppState(key, value);
    if (!ok) return value;
    return api
      .request(`/api/app-state/${key}`, 'PUT', { value })
      .then((res) => res.value)
      .catch(() => value);
  });
}

const MOCK_USER_ID = 'mock-user-1';

function normalizeApplyStatus(res) {
  const status = (res && res.status) || 'none';
  return {
    status: status === '' ? 'none' : status,
    application_id: res?.application_id || null,
    reject_reason: res?.reject_reason || null,
    application: res?.application || null,
  };
}

function getHeroApplyStatus() {
  return ensureApi().then((ok) => {
    if (ok) {
      return api
        .request('/api/heroes/apply/status')
        .then((res) => {
          const normalized = normalizeApplyStatus(res);
          const role = normalized.status === 'none' ? '' : normalized.status;
          store.setAppState('mock_hero_role', role);
          return normalized;
        })
        .catch(() =>
          getAppState('mock_hero_role', 'none').then((role) =>
            normalizeApplyStatus({ status: role || 'none' })
          )
        );
    }
    return getAppState('mock_hero_role', 'none').then((role) =>
      normalizeApplyStatus({ status: role || 'none' })
    );
  });
}

function submitHeroApply(application) {
  return ensureApi().then((ok) => {
    if (!ok) {
      return Promise.reject(new Error('api_unavailable'));
    }
    return api
      .request('/api/heroes/apply', 'POST', { ...application, user_id: MOCK_USER_ID })
      .then((app) => {
        store.setAppState('mock_hero_role', 'pending');
        store.setAppState('hero_apply_form', application);
        return normalizeApplyStatus({
          status: 'pending',
          application_id: app.application_id,
          application: app,
        });
      });
  });
}

function withdrawHeroApply() {
  return ensureApi().then((ok) => {
    const local = () => {
      store.setAppState('mock_hero_role', '');
      store.setAppState('hero_apply_form', null);
      return true;
    };
    if (!ok) return Promise.resolve(local());
    return api
      .request('/api/heroes/apply/withdraw', 'POST', { user_id: MOCK_USER_ID })
      .then((res) => {
        if (res.ok) local();
        return !!res.ok;
      })
      .catch(local);
  });
}

function addMySignup(entry) {
  return ensureApi().then((ok) => {
    const local = () =>
      getAppState('my_signups', []).then((list) => {
        const next = [
          {
            id: `s${Date.now()}`,
            status: '已报名',
            checked_in: false,
            time: new Date().toLocaleString('zh-CN'),
            ...entry,
          },
          ...(list || []),
        ];
        return setAppState('my_signups', next).then(() => next[0]);
      });
    if (!ok) return local();
    return api
      .request('/api/signups', 'POST', {
        ...entry,
        user_id: MOCK_USER_ID,
        status: entry.status || '已报名',
        pay_status: entry.payStatus || entry.pay_status || '待支付',
      })
      .then((item) => enrichSignup(item))
      .catch(local);
  });
}

function getMySignupByRecruitId(recruitId) {
  return ensureApi().then((ok) => {
    if (ok) {
      return api
        .request('/api/signups/mine')
        .then((res) => {
          const raw = (res.items || []).find((s) => s.recruit_id === recruitId);
          return raw ? enrichSignup(raw) : null;
        })
        .catch(() =>
          getAppState('my_signups', null).then((list) => {
            const source = list && list.length ? list : DEFAULT_MY_SIGNUPS;
            const raw = source.find((s) => s.recruit_id === recruitId);
            return raw ? enrichSignup(raw) : null;
          })
        );
    }
    return getAppState('my_signups', null).then((list) => {
      const source = list && list.length ? list : DEFAULT_MY_SIGNUPS;
      const raw = source.find((s) => s.recruit_id === recruitId);
      return raw ? enrichSignup(raw) : null;
    });
  });
}

function checkinMySignup(recruitId) {
  return getMySignupByRecruitId(recruitId).then((signup) => {
    if (!signup) return null;
    const sid = signup.signup_id || signup.id;
    return ensureApi().then((ok) => {
      if (ok && sid) {
        return api
          .request(`/api/signups/${sid}/checkin`, 'POST', {})
          .then((item) => enrichSignup(item))
          .catch(() =>
            getAppState('my_signups', null).then((list) => {
              const source = list && list.length ? list : [...DEFAULT_MY_SIGNUPS];
              const next = source.map((item) =>
                item.recruit_id === recruitId
                  ? {
                      ...item,
                      checked_in: true,
                      checkin_at: new Date().toISOString(),
                      status: '已签到',
                    }
                  : item
              );
              return setAppState('my_signups', next).then(() =>
                enrichSignup(next.find((i) => i.recruit_id === recruitId))
              );
            })
          );
      }
      return getAppState('my_signups', null).then((list) => {
        const source = list && list.length ? list : [...DEFAULT_MY_SIGNUPS];
        const next = source.map((item) =>
          item.recruit_id === recruitId
            ? {
                ...item,
                checked_in: true,
                checkin_at: new Date().toISOString(),
                status: '已签到',
              }
            : item
        );
        return setAppState('my_signups', next);
      });
    });
  });
}

function updateSignupStatus(signupId, status) {
  return ensureApi().then((ok) => {
    if (ok) {
      return api
        .request(`/api/signups/${signupId}`, 'PUT', { status })
        .then((item) => enrichSignup(item))
        .catch(() =>
          getAppState('my_signups', []).then((list) => {
            const next = (list || []).map((item) =>
              item.id === signupId || item.signup_id === signupId ? { ...item, status } : item
            );
            return setAppState('my_signups', next);
          })
        );
    }
    return getAppState('my_signups', []).then((list) => {
      const next = (list || []).map((item) =>
        item.id === signupId || item.signup_id === signupId ? { ...item, status } : item
      );
      return setAppState('my_signups', next);
    });
  });
}

const DEFAULT_MY_SIGNUPS = [
  { id: 'mock-s1', recruit_id: 'r1', title: '企业家杯月赛', status: '已报名', payStatus: '待支付', checked_in: false },
  {
    id: 'mock-s2',
    recruit_id: 'r2',
    title: '周末帆船体验营',
    status: '已报名',
    payStatus: '已支付',
    checked_in: true,
    checkin_at: '2026-07-07T10:00:00',
  },
  {
    id: 'mock-s3',
    recruit_id: 'r11',
    title: '春季企业团建帆船赛',
    status: '已完成',
    payStatus: '已支付',
    start_at: '2026-04-18T08:30:00',
    end_at: '2026-04-18T16:30:00',
  },
];

function enrichSignup(signup) {
  const rec = mock.getRecruitmentById(signup.recruit_id) || {};
  const start_at = signup.start_at || rec.start_at;
  const end_at = signup.end_at || rec.end_at;
  const statusLabel = signup.signup_status || signup.status_label || signup.status || '已报名';
  return {
    ...signup,
    id: signup.signup_id || signup.id || `s-${signup.recruit_id || signup.course_id}`,
    signup_id: signup.signup_id || signup.id,
    title: signup.title || rec.title || '',
    location: signup.location || rec.location || '',
    fee: signup.fee != null ? signup.fee : rec.fee,
    start_at,
    end_at,
    status: statusLabel,
    payStatus: signup.payStatus || signup.pay_status_label || signup.pay_status || '待支付',
    timeDisplay:
      signup.timeDisplay ||
      (start_at ? mock.formatRecruitmentTimeRange(start_at, end_at) : signup.time || ''),
  };
}

function splitSignupLists(source) {
  const now = Date.now();
  const active = [];
  const ended = [];
  (source || []).forEach((raw) => {
    const item = enrichSignup(raw);
    const endMs = item.end_at ? new Date(item.end_at).getTime() : null;
    if (endMs != null && !Number.isNaN(endMs) && endMs < now) {
      ended.push({ ...item, listTab: 'ended' });
    } else {
      active.push({ ...item, listTab: 'active' });
    }
  });
  return sortMySignupLists({ active, ended });
}

function getMySignupLists() {
  return ensureApi().then((ok) => {
    if (ok) {
      return api
        .request('/api/signups/mine')
        .then((res) => {
          const items = res.items || [];
          return splitSignupLists(items.length ? items : DEFAULT_MY_SIGNUPS);
        })
        .catch(() =>
          getAppState('my_signups', null).then((list) => {
            const source = list && list.length ? list : DEFAULT_MY_SIGNUPS;
            return splitSignupLists(source);
          })
        );
    }
    return getAppState('my_signups', null).then((list) => {
      const source = list && list.length ? list : DEFAULT_MY_SIGNUPS;
      return splitSignupLists(source);
    });
  });
}

function getMySignupSummary() {
  return getMySignupLists().then((lists) => ({
    signupOngoing: lists.active.length,
    signupDone: lists.ended.length,
  }));
}

const DEFAULT_MY_REVIEWS = [
  {
    id: 'rv1',
    reviewer_nickname: '学员小李',
    reviewer_avatar: '',
    score: 5,
    content: '组织很好，体验棒！',
    reviewed_at: '2026-06-15T14:30:00',
    title: '企业家杯月赛',
  },
  {
    id: 'rv2',
    reviewer_nickname: '航海爱好者',
    reviewer_avatar: '',
    score: 4.5,
    content: '教练很专业，场地设施也不错。',
    reviewed_at: '2026-06-08T10:00:00',
    title: '周末帆船体验营',
  },
  {
    id: 'rv3',
    reviewer_nickname: '张女士',
    reviewer_avatar: '',
    score: 5,
    content: '孩子很喜欢，下次还来。',
    reviewed_at: '2026-05-28T16:20:00',
    title: '亲子帆船体验日',
  },
];

function buildReviewStars(score) {
  const rating = Number(score) || 0;
  return [1, 2, 3, 4, 5].map((i) => ({
    index: i,
    filled: rating >= i,
    half: rating >= i - 0.5 && rating < i,
  }));
}

function formatReviewTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function enrichReview(review) {
  const score = Number(review.score) || 0;
  return {
    ...review,
    reviewer_nickname: review.reviewer_nickname || review.reviewer?.nickname || '匿名用户',
    reviewer_avatar: review.reviewer_avatar || review.reviewer?.avatar || '',
    score,
    stars: buildReviewStars(score),
    timeDisplay: review.timeDisplay || formatReviewTime(review.reviewed_at || review.time),
  };
}

function getMyReviews() {
  return ensureApi().then((ok) => {
    if (ok) {
      return api
        .request('/api/reviews/mine')
        .then((res) => {
          const items = res.items || [];
          const source = items.length ? items : DEFAULT_MY_REVIEWS;
          return sortReviewsByTimeDesc(source.map(enrichReview));
        })
        .catch(() =>
          getAppState('my_reviews', null).then((list) => {
            const source = list && list.length ? list : DEFAULT_MY_REVIEWS;
            return sortReviewsByTimeDesc(source.map(enrichReview));
          })
        );
    }
    return getAppState('my_reviews', null).then((list) => {
      const source = list && list.length ? list : DEFAULT_MY_REVIEWS;
      return sortReviewsByTimeDesc(source.map(enrichReview));
    });
  });
}

function getMyReviewCount() {
  return getMyReviews().then((list) => list.length);
}

const DEFAULT_HERO_RATINGS = [
  {
    id: 'hr1',
    reviewer_nickname: '学员A',
    reviewer_avatar: '',
    score: 5,
    content: '讲解清晰，体验很好！',
    reviewed_at: '2026-06-08T11:00:00',
  },
  {
    id: 'hr2',
    reviewer_nickname: '学员B',
    reviewer_avatar: '',
    score: 5,
    content: '非常专业，推荐。',
    reviewed_at: '2026-06-01T09:30:00',
  },
  {
    id: 'hr3',
    reviewer_nickname: '学员C',
    reviewer_avatar: '',
    score: 4,
    content: '活动组织有序，期待下次。',
    reviewed_at: '2026-05-20T16:00:00',
  },
];

const DEFAULT_MY_STUDENTS = [
  { id: 'st1', nickname: '学员小李', avatar: '', course_count: 3, last_active: '2026-06-10' },
  { id: 'st2', nickname: '航海爱好者', avatar: '', course_count: 2, last_active: '2026-06-05' },
  { id: 'st3', nickname: '张女士', avatar: '', course_count: 1, last_active: '2026-05-28' },
  { id: 'st4', nickname: '王先生', avatar: '', course_count: 4, last_active: '2026-05-15' },
];

function getMyRatings(heroId) {
  const hid = heroId || '1';
  return ensureApi().then((ok) => {
    if (ok) {
      return api
        .request('/api/reviews', 'GET', { hero_id: hid })
        .then((res) => {
          const items = res.items || [];
          const source = items.length ? items : DEFAULT_HERO_RATINGS;
          return sortReviewsByTimeDesc(source.map(enrichReview));
        })
        .catch(() =>
          getAppState('hero_ratings', null).then((list) => {
            const source = list && list.length ? list : DEFAULT_HERO_RATINGS;
            return sortReviewsByTimeDesc(source.map(enrichReview));
          })
        );
    }
    return getAppState('hero_ratings', null).then((list) => {
      const source = list && list.length ? list : DEFAULT_HERO_RATINGS;
      return sortReviewsByTimeDesc(source.map(enrichReview));
    });
  });
}

function getMyStudents(heroId) {
  const hid = heroId || '1';
  return ensureApi().then((ok) => {
    if (ok) {
      return api
        .request(`/api/heroes/${hid}/students`)
        .then((res) => {
          const items = res.items || [];
          return items.length
            ? items
            : [...DEFAULT_MY_STUDENTS].sort((a, b) => {
                const ta = new Date(a.last_active || 0).getTime();
                const tb = new Date(b.last_active || 0).getTime();
                return (Number.isNaN(tb) ? -Infinity : tb) - (Number.isNaN(ta) ? -Infinity : ta);
              });
        })
        .catch(() =>
          getAppState('my_students', null).then((list) => {
            const source = list && list.length ? list : DEFAULT_MY_STUDENTS;
            return [...source].sort((a, b) => {
              const ta = new Date(a.last_active || 0).getTime();
              const tb = new Date(b.last_active || 0).getTime();
              return (Number.isNaN(tb) ? -Infinity : tb) - (Number.isNaN(ta) ? -Infinity : ta);
            });
          })
        );
    }
    return getAppState('my_students', null).then((list) => {
      const source = list && list.length ? list : DEFAULT_MY_STUDENTS;
      return [...source].sort((a, b) => {
        const ta = new Date(a.last_active || 0).getTime();
        const tb = new Date(b.last_active || 0).getTime();
        return (Number.isNaN(tb) ? -Infinity : tb) - (Number.isNaN(ta) ? -Infinity : ta);
      });
    });
  });
}

function addMyCourse(course) {
  const item = {
    course_id: course.course_id || `c${Date.now()}`,
    hero_id: course.hero_id || '1',
    listTab: 'active',
    signed: 0,
    ...course,
    created_at: new Date().toISOString(),
  };
  return ensureApi().then((ok) => {
    const local = () =>
      getAppState('my_courses', []).then((list) =>
        setAppState('my_courses', [item, ...(list || [])]).then(() => item)
      );
    if (!ok) return local();
    return api
      .request('/api/courses', 'POST', item)
      .then((saved) => enrichCourse(saved))
      .catch(local);
  });
}

const DEFAULT_MY_COURSE_LISTS = {
  active: [
    {
      course_id: 'c1',
      title: 'ASA101-103培训课',
      timeDisplay: '7月26日 09:00 - 16:30',
      location: '滴水湖二号码头',
      price: 1280,
      signed: 10,
      total: 16,
      start_at: '2026-07-26T09:00:00',
      end_at: '2026-07-26T16:30:00',
      listTab: 'active',
    },
    {
      course_id: 'c4',
      title: '周末帆船体验课',
      timeDisplay: '8月3日 14:00 - 17:00',
      location: '滴水湖帆船基地',
      price: 680,
      signed: 6,
      total: 12,
      start_at: '2026-08-03T14:00:00',
      end_at: '2026-08-03T17:00:00',
      listTab: 'active',
    },
  ],
  ended: [
    {
      course_id: 'c9',
      title: '冬季帆船入门课',
      timeDisplay: '2025/12/01',
      location: '滴水湖',
      price: 880,
      signed: 12,
      total: 12,
      start_at: '2025-12-01T09:00:00',
      end_at: '2025-12-01T17:00:00',
      listTab: 'ended',
    },
  ],
};

function enrichCourse(course) {
  const total = course.total ?? course.headcount ?? 0;
  const signed = course.signed ?? 0;
  const price = course.price ?? course.fee ?? 0;
  const startAt = course.start_at || (course.start_date ? `${course.start_date}T09:00:00` : '');
  const endAt = course.end_at || (course.deadline ? `${course.deadline}T23:59:59` : '');
  return {
    ...course,
    id: course.course_id || course.id,
    course_id: course.course_id || course.id,
    title: course.title || '',
    location: course.location || '',
    price,
    signed,
    total,
    progress: total ? Math.min(100, Math.round((signed / total) * 100)) : 0,
    timeDisplay: course.timeDisplay || course.time || startAt.slice(0, 10) || '',
    start_at: startAt,
    end_at: endAt,
  };
}

function splitCourseLists(source) {
  const now = Date.now();
  const active = [];
  const ended = [];
  (source || []).forEach((raw) => {
    const item = enrichCourse(raw);
    if (item.listTab === 'ended') {
      ended.push({ ...item, listTab: 'ended' });
      return;
    }
    if (item.listTab === 'active') {
      active.push({ ...item, listTab: 'active' });
      return;
    }
    const endMs = item.end_at ? new Date(item.end_at).getTime() : null;
    if (endMs != null && !Number.isNaN(endMs) && endMs < now) {
      ended.push({ ...item, listTab: 'ended' });
    } else {
      active.push({ ...item, listTab: 'active' });
    }
  });
  return sortMyCourseLists({ active, ended });
}

function getMyCourseLists(heroId) {
  const hid = heroId || '1';
  return ensureApi().then((ok) => {
    if (ok) {
      return api
        .request('/api/courses', 'GET', { hero_id: hid })
        .then((res) => {
          const items = res.items || [];
          if (!items.length) {
            return splitCourseLists([
              ...DEFAULT_MY_COURSE_LISTS.active,
              ...DEFAULT_MY_COURSE_LISTS.ended,
            ]);
          }
          return splitCourseLists(items);
        })
        .catch(() =>
          getAppState('my_courses', null).then((stored) => {
            const defaults = [
              ...DEFAULT_MY_COURSE_LISTS.active,
              ...DEFAULT_MY_COURSE_LISTS.ended,
            ];
            const map = new Map();
            defaults.forEach((item) => map.set(item.course_id, item));
            (stored || []).forEach((item) => {
              const id = item.course_id || item.id;
              if (id) map.set(id, { ...map.get(id), ...item });
              else map.set(`stored-${map.size}`, item);
            });
            return splitCourseLists([...map.values()]);
          })
        );
    }
    return getAppState('my_courses', null).then((stored) => {
      const defaults = [
        ...DEFAULT_MY_COURSE_LISTS.active,
        ...DEFAULT_MY_COURSE_LISTS.ended,
      ];
      const map = new Map();
      defaults.forEach((item) => map.set(item.course_id, item));
      (stored || []).forEach((item) => {
        const id = item.course_id || item.id;
        if (id) map.set(id, { ...map.get(id), ...item });
        else map.set(`stored-${map.size}`, item);
      });
      return splitCourseLists([...map.values()]);
    });
  });
}

module.exports = {
  ...mock,
  getHeroById,
  getHeroes,
  updateHero,
  getRecruitmentById,
  getMyRecruitmentLists,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
  getRecruitmentsByHeroId,
  getAppState,
  setAppState,
  getHeroApplyStatus,
  submitHeroApply,
  withdrawHeroApply,
  addMySignup,
  updateSignupStatus,
  getMySignupByRecruitId,
  checkinMySignup,
  getMySignupLists,
  getMySignupSummary,
  getMyReviews,
  getMyReviewCount,
  getMyRatings,
  getMyStudents,
  getMyCourseLists,
  addMyCourse,
  ensureApi,
};
