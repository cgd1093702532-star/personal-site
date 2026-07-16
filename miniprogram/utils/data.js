/** 统一数据层：业务走 store/mock；仅认证相关走本地 API */

const mock = require('./mock.js');
const api = require('./api.js');
const store = require('./store.js');
const { sortMySignupLists } = require('./signup-sort.js');
const { sortReviewsByTimeDesc } = require('./review-sort.js');
const { sortMyCourseLists } = require('./course-sort.js');

const MOCK_USER_ID = 'mock-user-1';

/** 可与服务端同步的认证相关 app_state 键 */
const AUTH_APP_STATE_KEYS = new Set(['mock_hero_role']);

let apiReady = null;

function ensureApi() {
  if (apiReady === null) {
    apiReady = api.checkAvailable();
  }
  return apiReady;
}

function mirrorRecruitment(item, scope) {
  store.upsertRecruitment(item, scope);
}

function getHeroById(id) {
  return Promise.resolve(store.getHero(id) || mock.getHeroById(id));
}

function updateHero(id, patch) {
  const hero = store.updateHero(id, patch);
  if (!hero) return Promise.reject(new Error('hero_not_found'));
  return Promise.resolve(hero);
}

function getHeroes(filter, options = {}) {
  // 业务数据已全部走 mock；emptyOnFail 仅历史兼容，不再短路为空
  void options;
  let publicRecs = [];
  try {
    publicRecs = store.listRecruitments('public') || [];
  } catch (_) {
    publicRecs = [];
  }
  const recruitments = publicRecs.length ? publicRecs : mock.events || [];
  const courses = mock.courses || [];
  const base = (mock.heroes || []).map((h) => mock.getHeroById(h.hero_id) || h);
  const list = base.map((h) => normalizeHeroForList(h, recruitments, courses));
  return Promise.resolve(applyHeroFilters(list, filter));
}

function parseYearsExp(value) {
  const n = parseInt(String(value ?? '').replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function normalizeHeroForList(hero, recruitments, courses) {
  const hid = String(hero.hero_id || hero.id || '');
  const nested = Array.isArray(hero.recruitments) ? hero.recruitments : [];
  const apiEvent = (recruitments || []).find(
    (r) => String(r.hero_id || '') === hid && (r.type === 'event' || (!r.type && r.typeLabel === '赛事')),
  );
  const apiActivity = (recruitments || []).find(
    (r) => String(r.hero_id || '') === hid && (r.type === 'activity' || r.typeLabel === '活动'),
  );
  const apiCourse = (courses || []).find((c) => String(c.hero_id || '') === hid);
  const nestedEvent = nested.find((r) => r.type === 'event');
  const nestedActivity = nested.find((r) => r.type === 'activity');
  const nestedCourse = nested.find((r) => r.type === 'course');

  const rows = [];
  const eventRow = apiEvent
    ? {
        type: 'event',
        status: apiEvent.status_label || apiEvent.status || '招募中',
        title: apiEvent.title || '',
        target_id: apiEvent.recruit_id || apiEvent.id,
        quota_text: apiEvent.quota_text || '',
      }
    : nestedEvent
      ? {
          type: 'event',
          status: nestedEvent.status || '招募中',
          title: nestedEvent.title || '',
          target_id: nestedEvent.target_id || nestedEvent.recruit_id,
          quota_text: nestedEvent.quota_text || '',
        }
      : null;
  const activityRow = apiActivity
    ? {
        type: 'activity',
        status: apiActivity.status_label || apiActivity.status || '报名中',
        title: apiActivity.title || '',
        target_id: apiActivity.recruit_id || apiActivity.id,
      }
    : nestedActivity
      ? {
          type: 'activity',
          status: nestedActivity.status || '报名中',
          title: nestedActivity.title || '',
          target_id: nestedActivity.target_id || nestedActivity.recruit_id,
        }
      : null;
  const courseRow = apiCourse
    ? {
        type: 'course',
        status: '报名中',
        title: apiCourse.title || '',
        target_id: apiCourse.course_id || apiCourse.id,
      }
    : nestedCourse
      ? {
          type: 'course',
          status: nestedCourse.status || '报名中',
          title: nestedCourse.title || '',
          target_id: nestedCourse.target_id || nestedCourse.course_id,
        }
      : null;

  if (eventRow) rows.push(eventRow);
  if (activityRow) rows.push(activityRow);
  if (courseRow) rows.push(courseRow);

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

function heroPlazaContentScore(hero) {
  const h = hero || {};
  const rows = Array.isArray(h.recruitments) ? h.recruitments : [];
  const events = Array.isArray(h.events) ? h.events : [];
  const courses = Array.isArray(h.courses) ? h.courses : [];
  const hasEvent =
    events.some((e) => (e.type || 'event') !== 'course') ||
    rows.some((r) => r.type === 'event' || r.type === 'activity');
  const hasCourse =
    courses.length > 0 || rows.some((r) => r.type === 'course');
  return (hasEvent ? 1 : 0) + (hasCourse ? 1 : 0);
}

/** 无赛事且无课程的英雄沉底；其余保持相对顺序 / 既有评分排序 */
function sortHeroesByPlazaContent(list, sortBy) {
  const result = Array.isArray(list) ? [...list] : [];
  result.sort((a, b) => {
    const contentDiff = heroPlazaContentScore(b) - heroPlazaContentScore(a);
    if (contentDiff !== 0) return contentDiff;
    if (sortBy === 'rating_desc') {
      return (
        (Number(b.rating) || 0) - (Number(a.rating) || 0) ||
        parseYearsExp(b.years_exp) - parseYearsExp(a.years_exp)
      );
    }
    if (sortBy === 'rating_asc') {
      return (
        (Number(a.rating) || 0) - (Number(b.rating) || 0) ||
        parseYearsExp(a.years_exp) - parseYearsExp(b.years_exp)
      );
    }
    return 0;
  });
  return result;
}

function applyHeroFilters(list, filter) {
  let result = Array.isArray(list) ? [...list] : [];
  // 广场仅展示已认证且启用的教练；stale_list_demo 用于演示详情「教练不存在」
  result = result.filter((h) => h && (h.enabled !== false || h.stale_list_demo));
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
      h.nickname,
      h.name,
      ...(h.project_types || []),
      (h.project_types || []).join(''),
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

  return sortHeroesByPlazaContent(result, sortBy);
}

function getRecruitmentById(id) {
  return Promise.resolve(store.getRecruitment(id) || mock.getRecruitmentById(id));
}

function getMyRecruitmentLists() {
  return Promise.resolve(store.getMyRecruitmentLists());
}

function normalizeScope(tab) {
  if (!tab) return 'mine_active';
  if (tab.startsWith('mine_')) return tab;
  return `mine_${tab}`;
}

function createRecruitment(item, tab) {
  const scope = normalizeScope(tab || 'active');
  const withUser = { ...item, user_id: item.user_id || MOCK_USER_ID };
  return getHeroApplyStatus()
    .then((res) => {
      if ((!withUser.hero_id || withUser.hero_id === '1') && res?.status === 'approved') {
        const app = res.application || {};
        withUser.hero_id = res.hero_id || app.hero_id || withUser.hero_id || '1';
        if (app.name) withUser.hero_name = app.name;
      }
      mirrorRecruitment(withUser, scope);
      return withUser;
    })
    .catch(() => {
      mirrorRecruitment(withUser, scope);
      return withUser;
    });
}

function updateRecruitment(id, item) {
  const scope = normalizeScope(item.listTab || 'active');
  const saved = { ...item, recruit_id: id };
  mirrorRecruitment(saved, scope);
  return Promise.resolve(saved);
}

function deleteRecruitment(id) {
  return Promise.resolve(store.deleteRecruitment(id));
}

function getRecruitmentsByHeroId(heroId) {
  return Promise.resolve(mock.getRecruitmentsByHeroId(heroId));
}

function getAppState(key, fallback) {
  if (!AUTH_APP_STATE_KEYS.has(key)) {
    return Promise.resolve(store.getAppState(key, fallback));
  }
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
  store.setAppState(key, value);
  if (!AUTH_APP_STATE_KEYS.has(key)) return Promise.resolve(value);
  return ensureApi().then((ok) => {
    if (!ok) return value;
    return api
      .request(`/api/app-state/${key}`, 'PUT', { value })
      .then((res) => res.value)
      .catch(() => value);
  });
}

function normalizeApplyStatus(res) {
  const status = (res && res.status) || 'none';
  return {
    status: status === '' ? 'none' : status,
    application_id: res?.application_id || null,
    reject_reason: res?.reject_reason || null,
    application: res?.application || null,
    hero_id: res?.hero_id || null,
    profile_change_pending: !!res?.profile_change_pending,
    pending_profile_change: res?.pending_profile_change || null,
    hero_enabled: res?.hero_enabled !== false,
    disable_reason: res?.disable_reason || '',
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
  return getAppState('my_signups', []).then((list) => {
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
    return setAppState('my_signups', next).then(() => enrichSignup(next[0]));
  });
}

function getMySignupByRecruitId(recruitId) {
  return getAppState('my_signups', null).then((list) => {
    const source = list && list.length ? list : DEFAULT_MY_SIGNUPS;
    const raw = source.find((s) => s.recruit_id === recruitId);
    return raw ? enrichSignup(raw) : null;
  });
}

function checkinMySignup(recruitId) {
  return getMySignupByRecruitId(recruitId).then((signup) => {
    if (!signup) return null;
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
          : item,
      );
      return setAppState('my_signups', next).then(() =>
        enrichSignup(next.find((i) => i.recruit_id === recruitId)),
      );
    });
  });
}

function updateSignupStatus(signupId, status) {
  return getAppState('my_signups', []).then((list) => {
    const next = (list || []).map((item) =>
      item.id === signupId || item.signup_id === signupId ? { ...item, status } : item,
    );
    return setAppState('my_signups', next);
  });
}

function listCourseSignups(courseId) {
  return ensureApi().then((ok) => {
    if (ok) {
      return api
        .request(`/api/signups?course_id=${encodeURIComponent(courseId)}`)
        .then((res) => res.items || [])
        .catch(() => []);
    }
    return getAppState('my_signups', []).then((list) =>
      (list || []).filter((item) => item.type === 'course' && String(item.course_id) === String(courseId)),
    );
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
  return getAppState('my_signups', null).then((list) => {
    const source = list && list.length ? list : DEFAULT_MY_SIGNUPS;
    return splitSignupLists(source);
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
  return getAppState('my_reviews', null).then((list) => {
    const source = list && list.length ? list : DEFAULT_MY_REVIEWS;
    return sortReviewsByTimeDesc(source.map(enrichReview));
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
  return getAppState('hero_ratings', null).then((list) => {
    const source = list && list.length ? list : DEFAULT_HERO_RATINGS;
    return sortReviewsByTimeDesc(source.map(enrichReview));
  });
}

function getMyStudents(heroId) {
  return getAppState('my_students', null).then((list) => {
    const source = list && list.length ? list : DEFAULT_MY_STUDENTS;
    return [...source].sort((a, b) => {
      const ta = new Date(a.last_active || 0).getTime();
      const tb = new Date(b.last_active || 0).getTime();
      return (Number.isNaN(tb) ? -Infinity : tb) - (Number.isNaN(ta) ? -Infinity : ta);
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
  return getAppState('my_courses', []).then((list) =>
    setAppState('my_courses', [item, ...(list || [])]).then(() => enrichCourse(item)),
  );
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
  return getAppState('my_courses', null).then((stored) => {
    const defaults = [...DEFAULT_MY_COURSE_LISTS.active, ...DEFAULT_MY_COURSE_LISTS.ended];
    const map = new Map();
    defaults.forEach((item) => map.set(item.course_id, item));
    (stored || []).forEach((item) => {
      const id = item.course_id || item.id;
      if (id) map.set(id, { ...map.get(id), ...item });
      else map.set(`stored-${map.size}`, item);
    });
    return splitCourseLists([...map.values()]);
  });
}

function listActivitySuppliers() {
  return Promise.resolve(mock.listActivitySuppliersFromMock('/assets/images/'));
}

function submitProfileChange(heroId, patch, changeType) {
  return ensureApi().then((ok) => {
    if (!ok) return Promise.reject(new Error('api_unavailable'));
    return api.request(`/api/heroes/${heroId}/profile-changes`, 'POST', {
      patch,
      change_type: changeType || 'profile',
    });
  });
}

function withdrawProfileChange(heroId) {
  return ensureApi().then((ok) => {
    if (!ok) return Promise.reject(new Error('api_unavailable'));
    return api.request(`/api/heroes/${heroId}/profile-changes/withdraw`, 'POST', {});
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
  listCourseSignups,
  listActivitySuppliers,
  submitProfileChange,
  withdrawProfileChange,
  ensureApi,
};
