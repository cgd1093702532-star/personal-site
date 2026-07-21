/** 管理后台 · 统一布局壳（仅认证治理：供方/申请、主页变更、用户） */
(function () {
  const page = document.body.dataset.adminPage || '';
  const title = document.body.dataset.adminTitle || document.title.split('·')[0].trim();
  const breadcrumb = (document.body.dataset.adminBreadcrumb || title).split('/').map((s) => s.trim());

  const AUTH_PAGES = ['heroes', 'profile-changes', 'users', 'supplier-edit'];

  const TOP_NAV = [
    { key: 'venue', label: '认证治理', href: 'heroes.html' },
    { key: 'users', label: '用户', href: 'users.html' },
  ];

  const ICONS = {
    heroes:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19.5c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8"/><path d="M16.2 6.8l1.1-1.9 2 .4-1 1.9"/></svg>',
    users:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="2.8"/><path d="M3.5 19c1-2.8 2.9-4.2 5.5-4.2S13 16.2 14 19"/><circle cx="16.5" cy="8.5" r="2.2"/><path d="M15 14.8c2 .3 3.5 1.5 4.5 4.2"/></svg>',
    'profile-changes':
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19h4l10-10-4-4L5 15v4z"/><path d="M13 7l4 4"/></svg>',
    fold:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h12M4 12h16M4 17h12"/><path d="M18 8l-3 4 3 4"/></svg>',
    caret:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 14l4-4 4 4"/></svg>',
  };

  const SIDE_MENU = [
    {
      key: 'auth-gov',
      label: '认证治理',
      icon: ICONS.heroes,
      href: 'heroes.html',
      match: ['heroes', 'profile-changes', 'suppliers', 'supplier-edit'],
      children: [
        { key: 'suppliers', label: '供方列表', href: 'heroes.html' },
        { key: 'profile-changes', label: '主页变更审核', href: 'profile-changes.html' },
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
    root.querySelectorAll('.admin-page__hint, #heroes-admin-hint').forEach((el) => {
      el.classList.add('admin-page-tip');
    });
  }

  function buildShell(contentRoot) {
    document.documentElement.classList.add('admin-html');
    document.body.classList.add('admin-app');

    const shell = document.createElement('div');
    shell.className = 'admin-app__shell';

    const header = document.createElement('header');
    header.className = 'admin-header';
    const activeNav = AUTH_PAGES.includes(page) && page !== 'users' ? 'venue' : page === 'users' ? 'users' : 'venue';
    const siderTitle = '认证治理';

    header.innerHTML =
      `<a class="admin-header__brand" href="heroes.html">` +
      `<span class="admin-header__logo" aria-hidden="true"></span>` +
      `<span class="admin-header__brand-text">水上项目</span></a>` +
      `<nav class="admin-header__nav">${TOP_NAV.map(
        (item) =>
          `<a href="${item.href}" class="${activeNav === item.key ? ' is-active' : ''}">${item.label}</a>`,
      ).join('')}</nav>` +
      `<div class="admin-header__right">` +
      `<span class="admin-header__avatar" title="管理员" aria-label="管理员"></span></div>`;

    const body = document.createElement('div');
    body.className = 'admin-body';

    const sider = document.createElement('aside');
    sider.className = 'admin-sider';
    const activeChildKey =
      page === 'heroes' || page === 'supplier-edit' ? 'suppliers' : page;
    const activeParent =
      SIDE_MENU.find(
        (item) =>
          (item.match || [item.key]).includes(page) || (item.match || []).includes(activeChildKey),
      ) || SIDE_MENU[0];
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
      `<div class="admin-sider__footer"><span>水上项目 · 认证治理</span></div>`;

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
          ? `<a href="heroes.html">${part}</a><span>/</span>`
          : `<span class="admin-breadcrumb__current">${part}</span>`,
      )
      .join('');
    head.innerHTML = `<div class="admin-breadcrumb"><span class="admin-breadcrumb__bar"></span>${bcHtml}</div>`;

    const inner = document.createElement('div');
    inner.className = 'admin-main__inner';
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
  if (root) buildShell(root);
})();
