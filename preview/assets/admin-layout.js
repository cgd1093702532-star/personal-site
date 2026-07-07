/** 管理后台 · 统一布局壳（顶栏 + 侧栏 + 主内容） */
(function () {
  const page = document.body.dataset.adminPage || '';
  const title = document.body.dataset.adminTitle || document.title.split('·')[0].trim();
  const breadcrumb = (document.body.dataset.adminBreadcrumb || title).split('/').map((s) => s.trim());

  const TOP_NAV = [
    { key: 'dashboard', label: '管理中心', href: 'dashboard.html' },
    { key: 'heroes', label: '英雄管理', href: 'heroes.html' },
    { key: 'recruitments', label: '赛事管理', href: 'recruitments.html' },
    { key: 'signups', label: '报名管理', href: 'signups.html' },
  ];

  const SIDE_MENU = [
    {
      title: '概览',
      items: [{ key: 'dashboard', label: '仪表盘', icon: '📊', href: 'dashboard.html' }],
    },
    {
      title: '业务管理',
      items: [
        { key: 'heroes', label: '英雄管理', icon: '🦸', href: 'heroes.html' },
        { key: 'recruitments', label: '赛事管理', icon: '⛵', href: 'recruitments.html' },
        { key: 'courses', label: '课程管理', icon: '📚', href: 'courses.html' },
        { key: 'signups', label: '报名管理', icon: '📋', href: 'signups.html' },
      ],
    },
    {
      title: '运营',
      items: [
        { key: 'reviews', label: '评价管理', icon: '⭐', href: 'reviews.html' },
        { key: 'users', label: '用户管理', icon: '👤', href: 'users.html' },
        { key: 'profile-changes', label: '主页变更审核', icon: '✏️', href: 'profile-changes.html' },
      ],
    },
    {
      title: '系统',
      items: [{ key: 'settings', label: '系统配置', icon: '⚙️', href: 'settings.html' }],
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
    header.innerHTML =
      `<a class="admin-header__brand" href="dashboard.html">` +
      `<span class="admin-header__logo">⛵</span><span>英雄广场</span></a>` +
      `<nav class="admin-header__nav">${TOP_NAV.map(
        (item) =>
          `<a href="${item.href}" class="${page === item.key || (page === 'courses' && item.key === 'recruitments') ? '' : ''}${page === item.key ? ' is-active' : ''}">${item.label}</a>`,
      ).join('')}</nav>` +
      `<div class="admin-header__right">` +
      `<a class="admin-header__icon" href="../index.html" title="预览目录">⌂</a>` +
      `<span class="admin-header__icon">🔔<span class="admin-header__badge">3</span></span>` +
      `<span class="admin-header__avatar">管</span></div>`;

    const body = document.createElement('div');
    body.className = 'admin-body';

    const sider = document.createElement('aside');
    sider.className = 'admin-sider';
    sider.innerHTML =
      `<div class="admin-sider__title">${title}</div>` +
      SIDE_MENU.map(
        (group) =>
          `<ul class="admin-menu">` +
          `<li class="admin-menu__group-title">${group.title}</li>` +
          group.items
            .map(
              (item) =>
                `<li class="admin-menu__item${page === item.key ? ' is-active' : ''}">` +
                `<a href="${item.href}"><span class="admin-menu__icon">${item.icon}</span>${item.label}</a></li>`,
            )
            .join('') +
          `</ul>`,
      ).join('');

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
