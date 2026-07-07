/** 小程序本地存储层 · API 不可用时的 SQLite 镜像 */

const mock = require('./mock.js');
const { sortMyRecruitmentLists } = require('./recruitment-sort.js');

const DB_KEY = 'hero-plaza-local-db';

function emptyDb() {
  return { heroes: {}, recruitments: {}, courses: {}, app_state: {} };
}

function loadDb() {
  try {
    const raw = wx.getStorageSync(DB_KEY);
    if (raw && typeof raw === 'object') return raw;
  } catch (e) {
    /* ignore */
  }
  return null;
}

function saveDb(db) {
  wx.setStorageSync(DB_KEY, db);
}

function ensureDb() {
  let db = loadDb();
  if (db && db.heroes && Object.keys(db.heroes).length) return db;

  db = emptyDb();
  (mock.heroes || []).forEach((h) => {
    const full = mock.getHeroById(h.hero_id);
    db.heroes[h.hero_id] = full ? { ...full } : { ...h };
  });

  (mock.events || []).forEach((item) => {
    db.recruitments[item.recruit_id] = {
      scope: 'public',
      payload: { ...item },
    };
  });

  const mine = mock.getMyRecruitmentLists();
  ['active', 'ended', 'draft'].forEach((tab) => {
    (mine[tab] || []).forEach((item) => {
      db.recruitments[item.recruit_id] = {
        scope: `mine_${tab}`,
        payload: { ...item, listTab: tab },
      };
    });
  });

  (mock.courses || []).forEach((c) => {
    const id = c.id || c.course_id;
    db.courses[id] = { ...c, course_id: id };
  });

  db.app_state.mock_hero_role = '';
  saveDb(db);
  return db;
}

function getHero(id) {
  const db = ensureDb();
  return db.heroes[id] || null;
}

function updateHero(id, patch) {
  const db = ensureDb();
  const hero = db.heroes[id];
  if (!hero) return null;
  db.heroes[id] = { ...hero, ...patch };
  saveDb(db);
  return db.heroes[id];
}

function getRecruitment(id) {
  const db = ensureDb();
  const row = db.recruitments[id];
  return row ? row.payload : null;
}

function upsertRecruitment(item, scope) {
  const db = ensureDb();
  const tab = scope && scope.startsWith('mine_') ? scope.replace('mine_', '') : item.listTab;
  const payload = { ...item, listTab: tab || item.listTab || 'active' };
  db.recruitments[item.recruit_id] = { scope: scope || 'public', payload };
  saveDb(db);
  return payload;
}

function deleteRecruitment(id) {
  const db = ensureDb();
  if (!db.recruitments[id]) return false;
  delete db.recruitments[id];
  saveDb(db);
  return true;
}

function listRecruitments(scope, heroId) {
  const db = ensureDb();
  return Object.values(db.recruitments)
    .filter((row) => {
      if (scope && row.scope !== scope) return false;
      if (heroId && row.payload.hero_id !== heroId) return false;
      return true;
    })
    .map((row) => row.payload);
}

function getMyRecruitmentLists() {
  return sortMyRecruitmentLists({
    active: listRecruitments('mine_active'),
    ended: listRecruitments('mine_ended'),
    draft: listRecruitments('mine_draft'),
  });
}

function getAppState(key, fallback) {
  const db = ensureDb();
  const val = db.app_state[key];
  return val === undefined ? fallback : val;
}

function setAppState(key, value) {
  const db = ensureDb();
  db.app_state[key] = value;
  saveDb(db);
  return value;
}

module.exports = {
  ensureDb,
  getHero,
  updateHero,
  getRecruitment,
  upsertRecruitment,
  deleteRecruitment,
  listRecruitments,
  getMyRecruitmentLists,
  getAppState,
  setAppState,
};
