/** 预览页左侧页面导航：父子级树 + 拖动排序（本机记住） */
(function () {
  const DATA_URL = new URL('../assets/preview-page-nav.json', window.location.href).href;
  const TREE_KEY = 'preview-page-nav-tree-v2';
  const ORDER_KEY_LEGACY = 'preview-page-nav-order-v1';

  let navEl = null;
  let catalog = null;
  /** @type {{ groups: Array<{ id: string, title: string, collapsed: boolean, pages: string[] }> }} */
  let tree = { groups: [] };
  /** @type {Map<string, object>} */
  let pageMap = new Map();

  let drag = null; // { kind: 'group'|'page', groupId, html? }
  let suppressClick = false;

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function currentHtmlName(url) {
    try {
      const u = new URL(url || window.location.href, window.location.href);
      const name = u.pathname.split('/').pop() || '';
      return name.split('?')[0] || '';
    } catch (_) {
      return '';
    }
  }

  function isDesktopPreview() {
    return window.matchMedia('(min-width: 960px)').matches;
  }

  function buildPageMap(data) {
    const map = new Map();
    for (const group of Array.isArray(data?.groups) ? data.groups : []) {
      for (const page of Array.isArray(group.pages) ? group.pages : []) {
        if (page?.html) {
          map.set(page.html, {
            html: page.html,
            doc: page.doc || '',
            label: page.label || page.html,
            docUrl: page.docUrl || '',
            scope: page.scope || '',
            defaultGroup: group.title || '',
          });
        }
      }
    }
    return map;
  }

  function catalogToTree(data) {
    return {
      groups: (Array.isArray(data?.groups) ? data.groups : []).map((group, index) => ({
        id: `g-${index}-${group.title || 'group'}`,
        title: group.title || '未分组',
        collapsed: false,
        pages: (Array.isArray(group.pages) ? group.pages : []).map((p) => p.html).filter(Boolean),
      })),
    };
  }

  function readTree() {
    try {
      const raw = JSON.parse(localStorage.getItem(TREE_KEY) || 'null');
      if (raw && Array.isArray(raw.groups)) return raw;
    } catch (_) {
      /* ignore */
    }
    return null;
  }

  function writeTree(next) {
    localStorage.setItem(TREE_KEY, JSON.stringify(next));
  }

  function migrateLegacyFlatOrder(baseTree) {
    try {
      const flat = JSON.parse(localStorage.getItem(ORDER_KEY_LEGACY) || '[]');
      if (!Array.isArray(flat) || !flat.length) return baseTree;
      const byHtml = new Map();
      baseTree.groups.forEach((g) => g.pages.forEach((html) => byHtml.set(html, g.id)));
      const used = new Set();
      const buckets = new Map(baseTree.groups.map((g) => [g.id, []]));
      flat.forEach((html) => {
        const gid = byHtml.get(html);
        if (!gid || used.has(html)) return;
        buckets.get(gid).push(html);
        used.add(html);
      });
      baseTree.groups.forEach((g) => {
        g.pages.forEach((html) => {
          if (!used.has(html)) buckets.get(g.id).push(html);
        });
        g.pages = buckets.get(g.id) || [];
      });
      localStorage.removeItem(ORDER_KEY_LEGACY);
      return baseTree;
    } catch (_) {
      return baseTree;
    }
  }

  /** 以目录真源为准合并：删页剔除、新页进默认分组、保留本机父子顺序 */
  function mergeTreeWithCatalog(saved, data) {
    const base = catalogToTree(data);
    const liveHtml = new Set([...pageMap.keys()]);
    if (!saved?.groups?.length) return migrateLegacyFlatOrder(base);

    const defaultGroupByHtml = new Map();
    base.groups.forEach((g) => g.pages.forEach((html) => defaultGroupByHtml.set(html, g.title)));

    const collapsedMap = new Map(saved.groups.map((g) => [g.id, !!g.collapsed]));
    const titleById = new Map(saved.groups.map((g) => [g.id, g.title]));

    const mergedGroups = [];
    const placed = new Set();

    saved.groups.forEach((sg) => {
      const pages = (sg.pages || []).filter((html) => liveHtml.has(html) && !placed.has(html));
      pages.forEach((html) => placed.add(html));
      mergedGroups.push({
        id: sg.id || `g-${mergedGroups.length}-${sg.title || 'group'}`,
        title: sg.title || titleById.get(sg.id) || '未分组',
        collapsed: collapsedMap.has(sg.id) ? collapsedMap.get(sg.id) : false,
        pages,
      });
    });

    // 目录里新出现的分组
    base.groups.forEach((bg) => {
      if (mergedGroups.some((g) => g.title === bg.title)) return;
      mergedGroups.push({
        id: bg.id,
        title: bg.title,
        collapsed: false,
        pages: [],
      });
    });

    // 未放入的新页面 → 回到目录默认分组
    liveHtml.forEach((html) => {
      if (placed.has(html)) return;
      const title = defaultGroupByHtml.get(html) || '未分组';
      let group = mergedGroups.find((g) => g.title === title);
      if (!group) {
        group = {
          id: `g-new-${title}`,
          title,
          collapsed: false,
          pages: [],
        };
        mergedGroups.push(group);
      }
      group.pages.push(html);
      placed.add(html);
    });

    return { groups: mergedGroups.filter((g) => g.pages.length || base.groups.some((b) => b.title === g.title)) };
  }

  function ensurePanel() {
    const device = document.querySelector('.device');
    if (!device) return null;
    document.body.classList.add('has-preview-page-nav');
    device.classList.add('device--with-page-nav');

    let nav = device.querySelector('.preview-page-nav');
    if (nav) {
      nav.hidden = false;
      navEl = nav;
      return nav;
    }

    nav = document.createElement('nav');
    nav.className = 'preview-page-nav';
    nav.setAttribute('aria-label', '页面导航');
    nav.innerHTML = `
      <div class="preview-page-nav__head">
        <div class="preview-page-nav__title">页面导航</div>
        <div class="preview-page-nav__meta">父子级可拖动 · 顺序保存在本机</div>
      </div>
      <div class="preview-page-nav__body">
        <p class="preview-page-nav__loading">加载目录中…</p>
      </div>`;
    const frame = device.querySelector('.device__frame');
    if (frame) device.insertBefore(nav, frame);
    else device.prepend(nav);
    navEl = nav;
    return nav;
  }

  function setActive(htmlName) {
    if (!navEl) return;
    navEl.querySelectorAll('.preview-page-nav__link').forEach((btn) => {
      const active = btn.dataset.html === htmlName;
      btn.classList.toggle('is-active', active);
      if (active) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    // 自动展开含当前页的父级
    const child = navEl.querySelector(`.preview-page-nav__row--page[data-html="${CSS.escape(htmlName || '')}"]`);
    const groupEl = child?.closest('.preview-page-nav__group');
    if (groupEl) {
      const gid = groupEl.dataset.groupId;
      const group = tree.groups.find((g) => g.id === gid);
      if (group?.collapsed) {
        group.collapsed = false;
        writeTree(tree);
        renderTree();
        setActive(htmlName);
        return;
      }
    }
    const activeBtn = navEl.querySelector('.preview-page-nav__link.is-active');
    if (activeBtn?.scrollIntoView) activeBtn.scrollIntoView({ block: 'nearest' });
  }

  function renderTree() {
    const nav = ensurePanel();
    if (!nav) return;
    const body = nav.querySelector('.preview-page-nav__body');
    if (!body) return;
    if (!tree.groups.length) {
      body.innerHTML = '<p class="preview-page-nav__empty">暂无页面目录</p>';
      return;
    }

    body.innerHTML = tree.groups
      .map((group) => {
        const pagesHtml = group.collapsed
          ? ''
          : `<div class="preview-page-nav__children" data-group-id="${escapeHtml(group.id)}">` +
            group.pages
              .map((html) => {
                const page = pageMap.get(html);
                if (!page) return '';
                return (
                  `<div class="preview-page-nav__row preview-page-nav__row--page" draggable="true" data-kind="page" data-html="${escapeHtml(
                    html,
                  )}" data-group-id="${escapeHtml(group.id)}">` +
                  `<span class="preview-page-nav__handle" title="拖动排序" aria-hidden="true">⋮⋮</span>` +
                  `<button type="button" class="preview-page-nav__link" data-html="${escapeHtml(html)}" data-doc="${escapeHtml(
                    page.docUrl,
                  )}" data-scope="${escapeHtml(page.scope)}">${escapeHtml(page.label)}</button>` +
                  `</div>`
                );
              })
              .join('') +
            `</div>`;

        return (
          `<div class="preview-page-nav__group" data-group-id="${escapeHtml(group.id)}" data-kind="group">` +
          `<div class="preview-page-nav__row preview-page-nav__row--group" draggable="true" data-kind="group" data-group-id="${escapeHtml(
            group.id,
          )}">` +
          `<span class="preview-page-nav__handle" title="拖动父级" aria-hidden="true">⋮⋮</span>` +
          `<button type="button" class="preview-page-nav__toggle" data-group-toggle="${escapeHtml(group.id)}" aria-expanded="${
            group.collapsed ? 'false' : 'true'
          }" title="${group.collapsed ? '展开' : '收起'}">${group.collapsed ? '▶' : '▼'}</button>` +
          `<span class="preview-page-nav__group-title">${escapeHtml(group.title)}` +
          `<span class="preview-page-nav__count">${group.pages.length}</span></span>` +
          `</div>` +
          pagesHtml +
          `</div>`
        );
      })
      .join('');
  }

  function navigateFromNav(html) {
    if (!html) return;
    if (currentHtmlName() === html) return;
    if (window.PreviewNav?.navigateTo) {
      const tabPages = new Set(['index.html', 'heroes.html', 'profile.html']);
      window.PreviewNav.navigateTo(html, tabPages.has(html) ? 'tab' : 'forward');
      return;
    }
    window.location.href = html;
  }

  function findGroup(groupId) {
    return tree.groups.find((g) => g.id === groupId);
  }

  function removePageFromTree(html) {
    tree.groups.forEach((g) => {
      g.pages = g.pages.filter((x) => x !== html);
    });
  }

  function clearDropIndicators() {
    navEl?.querySelectorAll('.preview-page-nav__row, .preview-page-nav__children, .preview-page-nav__group').forEach((el) => {
      el.classList.remove(
        'is-dragging',
        'is-drag-over-before',
        'is-drag-over-after',
        'is-drag-over-into',
      );
    });
  }

  function onDragStart(e) {
    const row = e.target.closest('.preview-page-nav__row');
    if (!row || !navEl?.contains(row)) return;
    const kind = row.dataset.kind;
    if (kind === 'group') {
      drag = { kind: 'group', groupId: row.dataset.groupId || '' };
    } else if (kind === 'page') {
      drag = {
        kind: 'page',
        html: row.dataset.html || '',
        groupId: row.dataset.groupId || '',
      };
    } else {
      return;
    }
    row.classList.add('is-dragging');
    if (kind === 'group') {
      row.closest('.preview-page-nav__group')?.classList.add('is-dragging');
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', kind === 'group' ? drag.groupId : drag.html);
  }

  function onDragEnd() {
    clearDropIndicators();
    drag = null;
  }

  function dropZoneFromEvent(e) {
    const children = e.target.closest('.preview-page-nav__children');
    const pageRow = e.target.closest('.preview-page-nav__row--page');
    const groupRow = e.target.closest('.preview-page-nav__row--group');
    const groupBox = e.target.closest('.preview-page-nav__group');

    if (pageRow && drag?.kind === 'page') {
      const rect = pageRow.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const ratio = y / rect.height;
      // 中右区域：放入该页所在父级（同组内定位用 before/after）
      if (ratio < 0.3) return { type: 'page-before', el: pageRow };
      if (ratio > 0.7) return { type: 'page-after', el: pageRow };
      return { type: 'page-after', el: pageRow };
    }

    if (groupRow && drag) {
      const rect = groupRow.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const ratio = y / rect.height;
      if (drag.kind === 'group') {
        return ratio < 0.5
          ? { type: 'group-before', el: groupRow }
          : { type: 'group-after', el: groupRow };
      }
      // 拖页面到父级标题：中部=收为子级，上下=在父级之间插入（不常用，优先 into）
      if (ratio > 0.25 && ratio < 0.85) return { type: 'group-into', el: groupRow };
      return ratio < 0.5
        ? { type: 'group-before', el: groupRow }
        : { type: 'group-after', el: groupRow };
    }

    if (children && drag?.kind === 'page') {
      return { type: 'group-into-end', el: children };
    }

    if (groupBox && drag?.kind === 'page' && !pageRow) {
      return { type: 'group-into', el: groupBox.querySelector('.preview-page-nav__row--group') || groupBox };
    }

    return null;
  }

  function onDragOver(e) {
    if (!drag) return;
    const zone = dropZoneFromEvent(e);
    if (!zone) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    clearDropIndicators();
    if (drag.kind === 'group') {
      const dragging = navEl.querySelector(
        `.preview-page-nav__row--group[data-group-id="${CSS.escape(drag.groupId)}"]`,
      );
      dragging?.classList.add('is-dragging');
      dragging?.closest('.preview-page-nav__group')?.classList.add('is-dragging');
    } else {
      navEl
        .querySelector(`.preview-page-nav__row--page[data-html="${CSS.escape(drag.html)}"]`)
        ?.classList.add('is-dragging');
    }

    if (zone.type === 'page-before') zone.el.classList.add('is-drag-over-before');
    else if (zone.type === 'page-after') zone.el.classList.add('is-drag-over-after');
    else if (zone.type === 'group-before') zone.el.classList.add('is-drag-over-before');
    else if (zone.type === 'group-after') zone.el.classList.add('is-drag-over-after');
    else if (zone.type === 'group-into' || zone.type === 'group-into-end') {
      zone.el.classList.add('is-drag-over-into');
      const gid = zone.el.dataset.groupId || zone.el.closest('[data-group-id]')?.dataset.groupId;
      navEl.querySelector(`.preview-page-nav__group[data-group-id="${CSS.escape(gid || '')}"]`)?.classList.add(
        'is-drag-over-into',
      );
    }
  }

  function applyDrop(zone) {
    if (!drag || !zone) return false;

    if (drag.kind === 'group') {
      const from = tree.groups.findIndex((g) => g.id === drag.groupId);
      if (from < 0) return false;
      const targetId = zone.el.dataset.groupId || zone.el.closest('[data-group-id]')?.dataset.groupId;
      if (!targetId || targetId === drag.groupId) return false;
      const [item] = tree.groups.splice(from, 1);
      let to = tree.groups.findIndex((g) => g.id === targetId);
      if (to < 0) return false;
      if (zone.type === 'group-after') to += 1;
      tree.groups.splice(to, 0, item);
      return true;
    }

    if (drag.kind === 'page') {
      const html = drag.html;
      if (zone.type === 'group-into' || zone.type === 'group-into-end') {
        const gid = zone.el.dataset.groupId || zone.el.closest('[data-group-id]')?.dataset.groupId;
        const group = findGroup(gid);
        if (!group) return false;
        removePageFromTree(html);
        if (!group.pages.includes(html)) group.pages.push(html);
        group.collapsed = false;
        return true;
      }
      if (zone.type === 'page-before' || zone.type === 'page-after') {
        const targetHtml = zone.el.dataset.html;
        const targetGid = zone.el.dataset.groupId;
        const group = findGroup(targetGid);
        if (!group || !targetHtml || targetHtml === html) return false;
        removePageFromTree(html);
        let idx = group.pages.indexOf(targetHtml);
        if (idx < 0) {
          group.pages.push(html);
        } else {
          if (zone.type === 'page-after') idx += 1;
          group.pages.splice(idx, 0, html);
        }
        group.collapsed = false;
        return true;
      }
      if (zone.type === 'group-before' || zone.type === 'group-after') {
        // 页面拖到父级缝隙：放入该父级首/尾
        const gid = zone.el.dataset.groupId;
        const group = findGroup(gid);
        if (!group) return false;
        removePageFromTree(html);
        if (zone.type === 'group-before') group.pages.unshift(html);
        else group.pages.push(html);
        group.collapsed = false;
        return true;
      }
    }
    return false;
  }

  function onDrop(e) {
    if (!drag) return;
    const zone = dropZoneFromEvent(e);
    if (!zone) {
      clearDropIndicators();
      return;
    }
    e.preventDefault();
    const ok = applyDrop(zone);
    clearDropIndicators();
    if (ok) {
      writeTree(tree);
      renderTree();
      setActive(currentHtmlName());
      suppressClick = true;
    }
    drag = null;
  }

  function onNavClick(e) {
    if (suppressClick) {
      suppressClick = false;
      e.preventDefault();
      return;
    }
    const toggle = e.target.closest('[data-group-toggle]');
    if (toggle && navEl?.contains(toggle)) {
      e.preventDefault();
      const gid = toggle.dataset.groupToggle;
      const group = findGroup(gid);
      if (!group) return;
      group.collapsed = !group.collapsed;
      writeTree(tree);
      renderTree();
      setActive(currentHtmlName());
      return;
    }
    const btn = e.target.closest('.preview-page-nav__link');
    if (!btn || !navEl?.contains(btn)) return;
    e.preventDefault();
    navigateFromNav(btn.dataset.html || '');
  }

  function bindInteractions() {
    if (!navEl || navEl.dataset.treeBound === '1') return;
    navEl.dataset.treeBound = '1';
    navEl.addEventListener('click', onNavClick);
    navEl.addEventListener('dragstart', onDragStart);
    navEl.addEventListener('dragend', onDragEnd);
    navEl.addEventListener('dragover', onDragOver);
    navEl.addEventListener('drop', onDrop);
  }

  async function pageDocExists(docUrl) {
    if (!docUrl) return false;
    try {
      const url = new URL(docUrl, window.location.href).href;
      const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (res.ok) return true;
      if (res.status === 405 || res.status === 501) {
        const getRes = await fetch(url, { method: 'GET', cache: 'no-store' });
        return getRes.ok;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  async function filterExistingDocs(data) {
    const groups = [];
    for (const group of Array.isArray(data?.groups) ? data.groups : []) {
      const pages = [];
      for (const page of Array.isArray(group.pages) ? group.pages : []) {
        if (await pageDocExists(page.docUrl)) pages.push(page);
      }
      if (pages.length) groups.push({ title: group.title || '', pages });
    }
    return { groups };
  }

  async function loadCatalog() {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return filterExistingDocs(await res.json());
  }

  async function init() {
    if (!document.querySelector('.device')) return;
    if (!isDesktopPreview()) return;
    try {
      catalog = await loadCatalog();
      pageMap = buildPageMap(catalog);
      tree = mergeTreeWithCatalog(readTree(), catalog);
      writeTree(tree);
      renderTree();
      setActive(currentHtmlName());
      bindInteractions();
    } catch (err) {
      const nav = ensurePanel();
      const body = nav?.querySelector('.preview-page-nav__body');
      if (body) {
        body.innerHTML = `<p class="preview-page-nav__error">无法加载页面导航<br/><small>${escapeHtml(
          String(err.message || err),
        )}</small></p>`;
      }
      console.warn('[preview-page-nav]', err);
    }
  }

  window.addEventListener('preview:navigate', (e) => {
    setActive(currentHtmlName(e?.detail?.url || window.location.href));
  });

  window.PreviewPageNav = {
    sync: () => setActive(currentHtmlName()),
    reload: init,
    resetOrder: () => {
      localStorage.removeItem(TREE_KEY);
      localStorage.removeItem(ORDER_KEY_LEGACY);
      if (catalog) {
        tree = catalogToTree(catalog);
        writeTree(tree);
        renderTree();
        setActive(currentHtmlName());
      }
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
