/** 项目类型字典（与供方「管理项目类型」共用 localStorage） */
(function (global) {
  const STORAGE_KEY = 'hero_plaza_project_types';
  const DEFAULT_NAMES = ['帆船', '皮划艇', '桨板', '潜水', '冲浪', '游艇'];

  function nowTs() {
    return Date.now();
  }

  function normalizeItem(item, index, total) {
    const fallbackCreated = nowTs() - (Math.max(total, 1) - index) * 1000;
    if (typeof item === 'string') {
      const name = item.trim();
      return name ? { name, created_at: fallbackCreated } : null;
    }
    const name = String(item?.name || '').trim();
    if (!name) return null;
    const created = Number(item.created_at);
    return {
      name,
      created_at: Number.isFinite(created) ? created : fallbackCreated,
    };
  }

  function defaultItems() {
    const total = DEFAULT_NAMES.length;
    return DEFAULT_NAMES.map((name, index) => ({
      name,
      created_at: nowTs() - (total - index) * 1000,
    }));
  }

  function loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultItems();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) return defaultItems();
      const total = parsed.length;
      const list = parsed.map((item, index) => normalizeItem(item, index, total)).filter(Boolean);
      return list.length ? list : defaultItems();
    } catch (_) {
      return defaultItems();
    }
  }

  function saveItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items || []));
    } catch (_) {
      /* ignore */
    }
  }

  /** 按创建时间倒序；同时间再按名称 */
  function sortedItems(items) {
    const list = Array.isArray(items) ? items : loadItems();
    return list
      .slice()
      .sort((a, b) => (Number(b.created_at) || 0) - (Number(a.created_at) || 0) || a.name.localeCompare(b.name, 'zh'));
  }

  function sortedNames(items) {
    return sortedItems(items).map((item) => item.name);
  }

  global.HeroPlazaProjectTypes = {
    STORAGE_KEY,
    DEFAULT_NAMES,
    loadItems,
    saveItems,
    sortedItems,
    sortedNames,
  };
})(window);
