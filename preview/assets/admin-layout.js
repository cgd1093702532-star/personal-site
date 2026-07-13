/** 管理后台 · 统一布局壳（顶栏 + 侧栏 + 主内容） */
(function () {
  const page = document.body.dataset.adminPage || '';
  const title = document.body.dataset.adminTitle || document.title.split('·')[0].trim();
  const breadcrumb = (document.body.dataset.adminBreadcrumb || title).split('/').map((s) => s.trim());

  /** 场地模块页面（顶栏「场地」+ 侧栏标题「场地」） */
  const VENUE_PAGES = [
    'dashboard',
    'heroes',
    'recruitments',
    'courses',
    'signups',
    'reviews',
    'profile-changes',
    'settings',
  ];

  const TOP_NAV = [
    { key: 'dashboard', label: '管理中心', href: 'dashboard.html' },
    { key: 'decorate', label: '装修', href: '#' },
    { key: 'venue', label: '场地', href: 'dashboard.html' },
    { key: 'ticket', label: '票务', href: '#' },
    { key: 'sales', label: '产品销售', href: '#' },
    { key: 'orders', label: '订单', href: '#' },
    { key: 'users', label: '用户', href: 'users.html' },
    { key: 'content', label: '内容', href: '#' },
    { key: 'promo', label: '促销', href: '#' },
    { key: 'property', label: '物业管理', href: '#' },
  ];

  const ICONS = {
    dashboard:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="4.5" rx="1.2"/><rect x="13.5" y="10.5" width="7" height="10" rx="1.2"/><rect x="3.5" y="13" width="7" height="7.5" rx="1.2"/></svg>',
    heroes:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19.5c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8"/><path d="M16.2 6.8l1.1-1.9 2 .4-1 1.9"/></svg>',
    recruitments:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15.5h16l-1.5 3.5H5.5L4 15.5z"/><path d="M7 15.5V9.5L12 5l5 4.5v6"/><path d="M12 5v10.5"/></svg>',
    courses:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5.5A2.5 2.5 0 017.5 3H19v16H7.5A2.5 2.5 0 005 16.5v-11z"/><path d="M5 16.5A2.5 2.5 0 017.5 19H19"/></svg>',
    signups:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 9h8M8 12.5h8M8 16h5"/></svg>',
    reviews:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.8 7.2 18.4l.9-5.4L4.2 9.2l5.4-.8L12 3.5z"/></svg>',
    users:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="2.8"/><path d="M3.5 19c1-2.8 2.9-4.2 5.5-4.2S13 16.2 14 19"/><circle cx="16.5" cy="8.5" r="2.2"/><path d="M15 14.8c2 .3 3.5 1.5 4.5 4.2"/></svg>',
    'profile-changes':
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19h4l10-10-4-4L5 15v4z"/><path d="M13 7l4 4"/></svg>',
    settings:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6"/></svg>',
    fold:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h12M4 12h16M4 17h12"/><path d="M18 8l-3 4 3 4"/></svg>',
    caret:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 14l4-4 4 4"/></svg>',
  };

  /** 一级菜单（参考侧栏样式：图标 + 文案 + 右侧箭头；可含子菜单） */
  const SIDE_MENU = [
    {
      key: 'supply-demand',
      label: '供需管理',
      icon: ICONS.dashboard,
      href: 'dashboard.html',
      match: ['dashboard', 'heroes', 'recruitments', 'reviews', 'suppliers'],
      children: [
        { key: 'suppliers', label: '供方列表', href: 'heroes.html' },
        { key: 'recruitments', label: '招募列表', href: 'recruitments.html' },
        { key: 'reviews', label: '评价列表', href: 'reviews.html' },
      ],
    },
  ];

  function migrateLegacyClasses(root) {
    root.querySelectorAll('.admin-tabs__item.active').forEach((el) => {
      el.classList.remove('active');
      el.classList.add('is-active');
    });
    root.querySelectorAll('.admin-panel').forEach((panel) => {
      if (panel.classList.contains('admin-detail-panel')) {
        panel.classList.add('admin-card');
        if (!panel.querySelector('.admin-card__body')) {
          const body = document.createElement('div');
          body.className = 'admin-card__body';
          while (panel.firstChild) body.appendChild(panel.firstChild);
          panel.appendChild(body);
        }
      } else if (panel.querySelector('.admin-table')) {
        const wrap = document.createElement('div');
        wrap.className = 'admin-card';
        const inner = document.createElement('div');
        inner.className = 'admin-card__body admin-card__body--compact';
        const tableWrap = document.createElement('div');
        tableWrap.className = 'admin-table-wrap';
        while (panel.firstChild) tableWrap.appendChild(panel.firstChild);
        inner.appendChild(tableWrap);
        wrap.appendChild(inner);
        panel.replaceWith(wrap);
      } else {
        panel.classList.add('admin-card');
        if (!panel.querySelector('.admin-card__body')) {
          const body = document.createElement('div');
          body.className = 'admin-card__body';
          while (panel.firstChild) body.appendChild(panel.firstChild);
          panel.appendChild(body);
        }
      }
    });
    root.querySelectorAll('.admin-toolbar').forEach((bar) => {
      if (bar.closest('.admin-filter')) return;
      const card = document.createElement('div');
      card.className = 'admin-card';
      const body = document.createElement('div');
      body.className = 'admin-card__body admin-card__body--compact';
      const filter = document.createElement('div');
      filter.className = 'admin-filter';
      const item = document.createElement('div');
      item.className = 'admin-form-item';
      const input = bar.querySelector('.admin-search, .admin-input, input[type="search"]');
      if (input) {
        input.classList.add('admin-input');
        const label = document.createElement('label');
        label.className = 'admin-form-item__label';
        label.textContent = input.getAttribute('placeholder') || '搜索';
        item.appendChild(label);
        item.appendChild(input);
      }
      const actions = document.createElement('div');
      actions.className = 'admin-filter__actions';
      bar.querySelectorAll('.admin-btn').forEach((btn) => {
        if (!btn.classList.contains('admin-btn--primary')) btn.classList.add('admin-btn--primary');
        actions.appendChild(btn);
      });
      filter.appendChild(item);
      filter.appendChild(actions);
      body.appendChild(filter);
      card.appendChild(body);
      bar.replaceWith(card);
    });
    root.querySelectorAll('.admin-page__hint, #heroes-admin-hint, #signups-admin-hint, #recruitments-admin-hint, #courses-admin-hint').forEach((el) => {
      el.classList.add('admin-page-tip');
    });
    root.querySelectorAll('.stat-cards').forEach((el) => el.classList.add('admin-stat-row'));
    root.querySelectorAll('.stat-card').forEach((el) => {
      el.classList.add('admin-stat-card');
      const strong = el.querySelector('strong');
      if (strong) {
        const val = strong.textContent;
        const label = el.textContent.replace(val, '').trim();
        el.innerHTML = `<div class="admin-stat-card__label">${label}</div><div class="admin-stat-card__value">${val}</div>`;
      }
    });
  }

  function buildShell(contentRoot) {
    document.documentElement.classList.add('admin-html');
    document.body.classList.add('admin-app');

    const shell = document.createElement('div');
    shell.className = 'admin-app__shell';

    const header = document.createElement('header');
    header.className = 'admin-header';
    const activeNav = VENUE_PAGES.includes(page) ? 'venue' : page === 'users' ? 'users' : page;
    const siderTitle = VENUE_PAGES.includes(page) ? '场地' : title;

    header.innerHTML =
      `<a class="admin-header__brand" href="dashboard.html">` +
      `<span class="admin-header__logo" aria-hidden="true"></span>` +
      `<span class="admin-header__brand-text">水上项目</span></a>` +
      `<nav class="admin-header__nav">${TOP_NAV.map(
        (item) =>
          `<a href="${item.href}" class="${activeNav === item.key ? ' is-active' : ''}">${item.label}</a>`,
      ).join('')}</nav>` +
      `<div class="admin-header__right">` +
      `<span class="admin-header__icon admin-header__icon--chat" title="消息" aria-label="消息">` +
      `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7a2.5 2.5 0 01-2.5 2.5H10l-4 3v-3H6.5A2.5 2.5 0 014 13.5v-7z"/></svg>` +
      `</span>` +
      `<span class="admin-header__icon admin-header__icon--bell" title="通知" aria-label="通知">` +
      `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9a6 6 0 0112 0c0 7 3 7 3 7H3s3 0 3-7"/><path d="M10 19a2 2 0 004 0"/></svg>` +
      `<span class="admin-header__badge">36</span></span>` +
      `<span class="admin-header__avatar" title="管理员" aria-label="管理员"></span></div>`;

    const body = document.createElement('div');
    body.className = 'admin-body';

    const sider = document.createElement('aside');
    sider.className = 'admin-sider';
    const activeChildKey = page === 'heroes' ? 'suppliers' : page;
    const activeParent =
      SIDE_MENU.find((item) => (item.match || [item.key]).includes(page) || (item.match || []).includes(activeChildKey)) ||
      SIDE_MENU[0];
    const activeKey = activeParent.key;
    sider.innerHTML =
      `<div class="admin-sider__head">` +
      `<div class="admin-sider__title">${siderTitle}</div>` +
      `<button type="button" class="admin-sider__fold" aria-label="折叠侧栏">${ICONS.fold}</button>` +
      `</div>` +
      `<nav class="admin-sider__nav">` +
      `<ul class="admin-menu admin-menu--root">` +
      SIDE_MENU.map((item) => {
        const hasChildren = Array.isArray(item.children) && item.children.length > 0;
        const isOpen =
          hasChildren &&
          ((item.match || []).includes(page) || item.children.some((c) => c.key === activeChildKey));
        const childHtml = hasChildren
          ? `<ul class="admin-menu admin-menu--sub">` +
            item.children
              .map(
                (child) =>
                  `<li class="admin-menu__item admin-menu__item--sub${activeChildKey === child.key ? ' is-active' : ''}">` +
                  `<a href="${child.href}"><span class="admin-menu__label">${child.label}</span></a></li>`,
              )
              .join('') +
            `</ul>`
          : '';
        return (
          `<li class="admin-menu__item${activeKey === item.key ? ' is-active' : ''}${isOpen ? ' is-open' : ''}${hasChildren ? ' has-children' : ''}" data-menu-key="${item.key}">` +
          `<a href="${item.href}"${hasChildren ? ' data-menu-toggle="1"' : ''}>` +
          `<span class="admin-menu__icon">${item.icon}</span>` +
          `<span class="admin-menu__label">${item.label}</span>` +
          `<span class="admin-menu__caret">${ICONS.caret}</span>` +
          `</a>${childHtml}</li>`
        );
      }).join('') +
      `</ul></nav>` +
      `<div class="admin-sider__footer"><span>水上项目</span></div>`;

    sider.addEventListener('click', (e) => {
      const foldBtn = e.target.closest('.admin-sider__fold');
      if (foldBtn) {
        e.preventDefault();
        document.body.classList.toggle('admin-sider-collapsed');
        return;
      }
      const toggleLink = e.target.closest('a[data-menu-toggle]');
      if (!toggleLink) return;
      const item = toggleLink.closest('.admin-menu__item.has-children');
      if (!item) return;
      // 有子菜单时：点击一级仅展开/收起；已展开则允许跳转
      if (!item.classList.contains('is-open')) {
        e.preventDefault();
        sider.querySelectorAll('.admin-menu__item.has-children.is-open').forEach((el) => {
          if (el !== item) el.classList.remove('is-open');
        });
        item.classList.add('is-open');
      }
    });

    const main = document.createElement('main');
    main.className = 'admin-main';

    const head = document.createElement('div');
    head.className = 'admin-main__head';
    const bcHtml = breadcrumb
      .map((part, i) =>
        i < breadcrumb.length - 1
          ? `<a href="#">${part}</a><span>/</span>`
          : `<span class="admin-breadcrumb__current">${part}</span>`,
      )
      .join('');
    head.innerHTML = `<div class="admin-breadcrumb"><span class="admin-breadcrumb__bar"></span>${bcHtml}</div>`;

    const inner = document.createElement('div');
    inner.className = 'admin-main__inner';
    // 保留原内容根节点 id，供页面脚本在 layout 迁移后继续定位
    if (contentRoot.id) inner.id = contentRoot.id;

    migrateLegacyClasses(contentRoot);
    while (contentRoot.firstChild) inner.appendChild(contentRoot.firstChild);
    contentRoot.remove();

    main.appendChild(head);
    main.appendChild(inner);
    body.appendChild(sider);
    body.appendChild(main);
    shell.appendChild(header);
    shell.appendChild(body);
    document.body.insertBefore(shell, document.body.firstChild);
  }

  const root =
    document.getElementById('admin-page-root') ||
    document.getElementById('heroes-admin-root') ||
    document.querySelector('.admin-layout');
  // #region agent log
  fetch('http://127.0.0.1:7447/ingest/69cf0779-133f-40c0-9884-95fcd1c2d840',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'628f41'},body:JSON.stringify({sessionId:'628f41',runId:'pre-fix',hypothesisId:'A',location:'admin-layout.js:buildShell',message:'layout init before remove root',data:{page,hasRoot:!!root,rootId:root&&root.id},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (root) buildShell(root);
  // #region agent log
  fetch('http://127.0.0.1:7447/ingest/69cf0779-133f-40c0-9884-95fcd1c2d840',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'628f41'},body:JSON.stringify({sessionId:'628f41',runId:'post-fix',hypothesisId:'A',location:'admin-layout.js:afterBuild',message:'layout after buildShell',data:{page,rootStillExists:!!document.getElementById('admin-page-root'),rootClass:(document.getElementById('admin-page-root')||{}).className||null,btnCount:document.querySelectorAll('.admin-link,.admin-btn').length},timestamp:Date.now()})}).catch(()=>{});
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-link, .admin-btn, button');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const topEl = document.elementFromPoint(e.clientX, e.clientY);
    fetch('http://127.0.0.1:7447/ingest/69cf0779-133f-40c0-9884-95fcd1c2d840',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'628f41'},body:JSON.stringify({sessionId:'628f41',runId:'pre-fix',hypothesisId:'D',location:'admin-layout.js:globalClick',message:'admin button click captured',data:{page,tag:btn.tagName,text:(btn.textContent||'').trim().slice(0,40),id:btn.id||null,dataset:Object.assign({},btn.dataset),topTag:topEl&&topEl.tagName,topClass:topEl&&topEl.className,sameTarget:topEl===btn||(btn.contains&&btn.contains(topEl)),x:e.clientX,y:e.clientY,rect:{w:rect.width,h:rect.height}},timestamp:Date.now()})}).catch(()=>{});
  }, true);
  // #endregion
})();
