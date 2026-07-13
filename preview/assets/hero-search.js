/** 英雄广场预览页 · 模糊搜索 + 筛选面板 + 虚拟键盘 */
(function () {
  const SYNONYMS = { 桨板: ['浆板'], 浆板: ['桨板'] };

  const YEARS_RANGES = {
    全部: null,
    '1-3': { min: 1, max: 3 },
    '3-5': { min: 3, max: 5 },
    '5-10': { min: 5, max: 10 },
    '10+': { min: 10, max: Infinity },
  };

  function norm(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, '');
  }

  function expandKeyword(keyword) {
    const k = norm(keyword);
    if (!k) return [];
    const set = new Set([k]);
    Object.keys(SYNONYMS).forEach((key) => {
      const nk = norm(key);
      if (k.includes(nk) || nk.includes(k)) {
        set.add(nk);
        SYNONYMS[key].forEach((v) => set.add(norm(v)));
      }
    });
    return [...set];
  }

  function fuzzyMatch(text, variants) {
    const t = norm(text);
    return variants.some((v) => t.includes(v) || v.includes(t));
  }

  function matchYears(years, rangeId) {
    const range = YEARS_RANGES[rangeId];
    if (!range) return true;
    const y = Number(years);
    return y >= range.min && y <= range.max;
  }

  const input = document.getElementById('hero-search');
  const clearBtn = document.getElementById('hero-search-clear');
  const list = document.getElementById('hero-list');
  const empty = document.getElementById('hero-empty');
  const status = document.getElementById('hero-search-status');
  const filters = document.getElementById('hero-filters');
  const sortBar = document.getElementById('hero-sort');
  const yearsBar = document.getElementById('hero-years');
  const filterBtn = document.getElementById('hero-filter-btn');
  const filterSheet = document.getElementById('hero-filter-sheet');
  const filterDone = document.getElementById('hero-filter-done');
  const filterReset = document.getElementById('hero-filter-reset');
  const keyboard = document.getElementById('hero-keyboard');
  const shell = document.querySelector('.mobile-shell');
  if (!input || !list) return;

  let activeType = '全部';
  let activeSort = 'default';
  let activeYears = '全部';
  let timer = null;

  function countActiveFilters() {
    let count = 0;
    if (activeType !== '全部') count += 1;
    if (activeSort !== 'default') count += 1;
    if (activeYears !== '全部') count += 1;
    return count;
  }

  function updateFilterBtn() {
    if (!filterBtn) return;
    const count = countActiveFilters();
    filterBtn.classList.toggle('heroes-filter-btn--active', count > 0);

    let badge = filterBtn.querySelector('.heroes-filter-btn__badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'heroes-filter-btn__badge';
        filterBtn.appendChild(badge);
      }
      badge.textContent = String(count);
    } else if (badge) {
      badge.remove();
    }

    filterBtn.setAttribute('aria-label', count > 0 ? `筛选，已选 ${count} 项` : '筛选');
  }

  function openFilterSheet() {
    if (!filterSheet) return;
    hideKeyboard();
    document.querySelector('.mobile-shell')?.classList.add('mobile-shell--overlay');
    filterSheet.hidden = false;
  }

  function closeFilterSheet() {
    if (!filterSheet) return;
    filterSheet.hidden = true;
    document.querySelector('.mobile-shell')?.classList.remove('mobile-shell--overlay');
  }

  function resetFilters() {
    activeType = '全部';
    activeSort = 'default';
    activeYears = '全部';
    if (filters) {
      filters.querySelectorAll('.filter-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.type === '全部');
      });
    }
    if (sortBar) {
      sortBar.querySelectorAll('.filter-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.sort === 'default');
      });
    }
    if (yearsBar) {
      yearsBar.querySelectorAll('.filter-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.years === '全部');
      });
    }
    render();
  }

  function getVisibleRows() {
    const keyword = input.value.trim();
    const variants = expandKeyword(keyword);
    const rows = [...list.querySelectorAll('.hero-card')];

    return rows.filter((row) => {
      const types = (row.dataset.types || '').split(',');
      const typeOk =
        activeType === '全部' ||
        types.some((t) => t.includes(activeType) || activeType.includes(t));

      const yearsOk = matchYears(row.dataset.years, activeYears);

      const fields = [
        row.dataset.name,
        row.dataset.honors,
        row.dataset.bio,
        row.dataset.types,
        row.dataset.years,
        row.dataset.years + '年',
        row.dataset.rating,
        ...[...row.querySelectorAll('.hero-card__row-text')].map((el) => el.textContent),
      ];
      const searchOk =
        variants.length === 0 || fields.some((f) => fuzzyMatch(f, variants));

      return typeOk && yearsOk && searchOk;
    });
  }

  function sortRows(rows) {
    if (activeSort === 'rating_desc') {
      return rows.sort((a, b) => Number(b.dataset.rating) - Number(a.dataset.rating));
    }
    if (activeSort === 'rating_asc') {
      return rows.sort((a, b) => Number(a.dataset.rating) - Number(b.dataset.rating));
    }
    return rows;
  }

  function updateClearButton() {
    if (!clearBtn) return;
    const hasValue = input.value.trim().length > 0;
    clearBtn.hidden = !hasValue;
  }

  function updateSearchStatus(keyword, count) {
    if (!status) return;
    if (!keyword) {
      status.style.display = 'none';
      status.textContent = '';
      return;
    }
    status.style.display = 'block';
    status.textContent = count > 0 ? `找到 ${count} 位教练` : '';
  }

  function render() {
    const keyword = input.value.trim();
    const all = [...list.querySelectorAll('.hero-card')];
    all.forEach((r) => { r.style.display = 'none'; });

    const visible = sortRows(getVisibleRows());
    visible.forEach((row) => {
      row.style.display = '';
      list.appendChild(row);
    });

    const hasKeyword = keyword.length > 0;
    const hasFilters = countActiveFilters() > 0;
    list.style.display = visible.length === 0 ? 'none' : '';
    if (empty) {
      empty.style.display = visible.length === 0 ? 'flex' : 'none';
      if (hasKeyword && visible.length === 0) {
        const title = empty.querySelector('.heroes-empty-state__title');
        const hint = empty.querySelector('.heroes-empty-state__hint');
        if (title) title.textContent = '未找到相关教练和项目';
        if (hint) hint.textContent = '试试调整关键词或筛选条件';
      } else if ((hasFilters || !all.length) && visible.length === 0) {
        const title = empty.querySelector('.heroes-empty-state__title');
        const hint = empty.querySelector('.heroes-empty-state__hint');
        if (title) title.textContent = all.length ? '未找到相关教练和项目' : '暂无认证教练';
        if (hint) {
          hint.textContent = all.length
            ? '试试调整关键词或筛选条件'
            : '后台「英雄管理」开启后将显示在此';
        }
      }
    }

    updateClearButton();
    updateSearchStatus(keyword, visible.length);
    updateFilterBtn();
  }

  function showKeyboard() {
    if (!keyboard) return;
    closeFilterSheet();
    keyboard.classList.add('virtual-keyboard--visible');
    keyboard.setAttribute('aria-hidden', 'false');
    if (shell) shell.classList.add('mobile-shell--keyboard');
  }

  function hideKeyboard() {
    if (!keyboard) return;
    keyboard.classList.remove('virtual-keyboard--visible');
    keyboard.setAttribute('aria-hidden', 'true');
    if (shell) shell.classList.remove('mobile-shell--keyboard');
    input.blur();
  }

  function insertKey(key) {
    const start = input.value.length;
    if (key === 'del') {
      input.value = input.value.slice(0, -1);
    } else {
      input.value += key;
    }
    input.setSelectionRange(input.value.length, input.value.length);
    clearTimeout(timer);
    timer = setTimeout(render, 150);
    updateClearButton();
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      input.value = '';
      updateClearButton();
      render();
    });
  }

  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openFilterSheet();
    });
  }

  if (filterSheet) {
    filterSheet.querySelector('.heroes-filter-sheet__mask').addEventListener('click', closeFilterSheet);
  }

  if (filterDone) {
    filterDone.addEventListener('click', closeFilterSheet);
  }

  if (filterReset) {
    filterReset.addEventListener('click', resetFilters);
  }

  input.addEventListener('focus', showKeyboard);
  input.addEventListener('click', showKeyboard);

  if (keyboard) {
    keyboard.addEventListener('click', (e) => {
      const keyBtn = e.target.closest('.vk-key');
      if (keyBtn) {
        insertKey(keyBtn.dataset.key);
        return;
      }
      if (e.target.closest('#vk-dismiss')) hideKeyboard();
    });
  }

  document.addEventListener('click', (e) => {
    if (!keyboard || !keyboard.classList.contains('virtual-keyboard--visible')) return;
    if (e.target.closest('#hero-keyboard') || e.target === input) return;
    hideKeyboard();
  });

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(render, 300);
  });

  if (filters) {
    filters.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      activeType = chip.dataset.type || '全部';
      filters.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      render();
    });
  }

  if (sortBar) {
    sortBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      activeSort = chip.dataset.sort || 'default';
      sortBar.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      render();
    });
  }

  if (yearsBar) {
    yearsBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      activeYears = chip.dataset.years || '全部';
      yearsBar.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      render();
    });
  }

  render();
  document.addEventListener('heroes-list-updated', () => {
    render();
  });
})();
