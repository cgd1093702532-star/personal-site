/** 预览页 · 在手机模型内切换页面（不整页刷新） */
(function () {
  const frame = document.querySelector('.device__frame');
  let shell = document.querySelector('.mobile-shell');
  if (!frame || !shell) return;

  const PAGE_SCRIPT_ATTR = 'data-preview-page-script';
  const NAV_SCRIPT = 'preview-nav.js';
  const STACK_KEY = 'preview-nav-stack';
  let navigating = false;
  let navStack = [];

  function normalizeUrl(url) {
    try {
      return new URL(url, window.location.href).href;
    } catch (_) {
      return url;
    }
  }

  function readStack() {
    try {
      const raw = sessionStorage.getItem(STACK_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(normalizeUrl) : [];
    } catch (_) {
      return [];
    }
  }

  function writeStack(stack) {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.map(normalizeUrl)));
  }

  function isInternalPreviewUrl(url) {
    try {
      const u = new URL(url, window.location.href);
      return u.origin === window.location.origin && u.pathname.includes('/miniprogram/');
    } catch (_) {
      return false;
    }
  }

  function syncStackOnLoad() {
    const current = normalizeUrl(window.location.href);
    let stack = readStack();
    const top = stack[stack.length - 1];

    if (!stack.length) {
      stack = [current];
    } else if (top !== current) {
      const idx = stack.lastIndexOf(current);
      if (idx >= 0) {
        stack = stack.slice(0, idx + 1);
      } else if (document.referrer && isInternalPreviewUrl(document.referrer)) {
        const ref = normalizeUrl(document.referrer);
        if (stack[stack.length - 1] !== ref) stack.push(ref);
        if (stack[stack.length - 1] !== current) stack.push(current);
      } else {
        stack = [current];
      }
    }

    writeStack(stack);
    return stack;
  }

  /** 前进前：先把当前页压栈，再压目标页（同步执行，避免异步间隙丢栈） */
  function prepareForwardStack(destHref) {
    const current = normalizeUrl(window.location.href);
    const dest = normalizeUrl(resolveUrl(destHref));

    if (!navStack.length) navStack = [current];

    const top = normalizeUrl(navStack[navStack.length - 1]);
    if (top !== current) navStack.push(current);

    const newTop = normalizeUrl(navStack[navStack.length - 1]);
    if (newTop !== dest) navStack.push(dest);

    writeStack(navStack);
  }

  navStack = syncStackOnLoad();
  history.replaceState({ previewUrl: window.location.href }, '', window.location.href);

  const dir = sessionStorage.getItem('page-transition');
  sessionStorage.removeItem('page-transition');
  if (dir === 'forward') shell.classList.add('page-enter-forward');
  if (dir === 'back') shell.classList.add('page-enter-back');

  function resolveUrl(href) {
    return new URL(href, window.location.href).href;
  }

  function isInternalHref(href) {
    if (!href || href === '#' || href.startsWith('#')) return false;
    if (/^https?:/i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href)) return false;
    return true;
  }

  function isInDevice(el) {
    return !!(el && el.closest('.device'));
  }

  function detectTransition(link) {
    if (link.classList.contains('nav-back') || link.classList.contains('mp-navbar__back')) {
      return 'back';
    }
    if (link.closest('.tabbar')) return 'tab';
    return 'forward';
  }

  function removePageScripts() {
    document.querySelectorAll(`script[${PAGE_SCRIPT_ATTR}]`).forEach((node) => node.remove());
  }

  function collectScripts(doc) {
    return [...doc.querySelectorAll('script')].filter((node) => {
      const src = node.getAttribute('src') || '';
      return !src.includes(NAV_SCRIPT);
    });
  }

  function loadScript(node, baseUrl) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.setAttribute(PAGE_SCRIPT_ATTR, '');
      if (node.src) {
        const url = new URL(node.getAttribute('src'), baseUrl);
        url.searchParams.set('_pv', String(Date.now()));
        script.src = url.href;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`script failed: ${script.src}`));
      } else {
        script.textContent = node.textContent;
        resolve();
      }
      document.body.appendChild(script);
    });
  }

  async function runPageScripts(doc) {
    removePageScripts();
    const scripts = collectScripts(doc);
    for (const node of scripts) {
      await loadScript(node, doc.baseURI || window.location.href);
    }
  }

  function applyTransition(nextShell, transition) {
    nextShell.classList.remove('page-enter-forward', 'page-enter-back');
    if (transition === 'forward') nextShell.classList.add('page-enter-forward');
    if (transition === 'back') nextShell.classList.add('page-enter-back');
  }

  async function navigateTo(href, transition = 'forward', options = {}) {
    const { replace = false, fromPopstate = false, skipStack = false } = options;
    const url = resolveUrl(href);

    if (!fromPopstate && url === window.location.href) return;

    if (!fromPopstate && !replace && !skipStack && transition !== 'back') {
      prepareForwardStack(href);
    }

    navigating = true;
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newShell = doc.querySelector('.mobile-shell');
      if (!newShell) throw new Error('missing .mobile-shell');

      const currentShell = frame.querySelector('.mobile-shell');
      const nextShell = document.importNode(newShell, true);
      currentShell.replaceWith(nextShell);
      shell = nextShell;

      applyTransition(nextShell, transition);
      document.title = doc.title;

      if (!fromPopstate) {
        const normalized = normalizeUrl(url);
        if (replace) {
          history.replaceState({ previewUrl: url }, '', url);
          if (navStack.length) {
            navStack[navStack.length - 1] = normalized;
            writeStack(navStack);
          }
        } else {
          history.pushState({ previewUrl: url }, '', url);
          navStack = readStack();
          if (!navStack.length || normalizeUrl(navStack[navStack.length - 1]) !== normalized) {
            navStack.push(normalized);
            writeStack(navStack);
          }
        }
      }

      await runPageScripts(doc);
      window.dispatchEvent(new CustomEvent('preview:navigate', { detail: { url, transition } }));
    } catch (err) {
      console.warn('[PreviewNav] fallback to full navigation:', err);
      window.location.href = url;
    } finally {
      navigating = false;
    }
  }

  function resolveBackTarget(fallbackHref) {
    navStack = readStack();
    if (navStack.length > 1) {
      return { url: navStack[navStack.length - 2], source: 'stack' };
    }
    if (document.referrer && isInternalPreviewUrl(document.referrer)) {
      return { url: document.referrer, source: 'referrer' };
    }
    if (fallbackHref && isInternalHref(fallbackHref)) {
      return { url: resolveUrl(fallbackHref), source: 'fallback' };
    }
    return null;
  }

  async function goBack(fallbackHref) {
    const target = resolveBackTarget(fallbackHref);
    if (!target) {
      if (fallbackHref && isInternalHref(fallbackHref)) {
        return navigateTo(resolveUrl(fallbackHref), 'back', { replace: true, skipStack: true });
      }
      return;
    }
    if (target.source === 'stack') {
      navStack = navStack.slice(0, -1);
      writeStack(navStack);
    }
    return navigateTo(target.url, 'back', { replace: true, skipStack: true });
  }

  function handleBack(link) {
    const href = link.getAttribute('href');
    if (!href || !isInternalHref(href)) return;

    const dest = resolveUrl(href);
    const destNorm = normalizeUrl(dest);
    const current = normalizeUrl(window.location.href);
    navStack = readStack();

    const stackPrev = navStack.length > 1 ? normalizeUrl(navStack[navStack.length - 2]) : null;

    // 声明的父页与栈上一页一致：标准出栈返回
    if (stackPrev && stackPrev === destNorm) {
      goBack(href);
      return;
    }

    // 声明的父页在栈中（如 我的招募 → 个人中心，栈被编辑页污染时）
    const parentIdx = navStack.lastIndexOf(destNorm);
    if (parentIdx >= 0) {
      navStack = navStack.slice(0, parentIdx + 1);
      writeStack(navStack);
      navigateTo(dest, 'back', { replace: true, skipStack: true });
      return;
    }

    // 栈有上一页但与 href 不同（如 首页 → 英雄详情，应回首页而非 heroes.html）
    if (stackPrev) {
      goBack(href);
      return;
    }

    // 无历史：走 href 兜底
    navStack = [destNorm];
    writeStack(navStack);
    navigateTo(dest, 'back', { replace: true, skipStack: true });
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (link && isInDevice(link)) {
      if (e.defaultPrevented || link.hasAttribute('data-spa-ignore')) return;
      const href = link.getAttribute('href');
      if (!isInternalHref(href)) return;
      e.preventDefault();
      if (link.classList.contains('nav-back') || link.classList.contains('mp-navbar__back')) {
        handleBack(link);
        return;
      }
      navigateTo(href, detectTransition(link));
      return;
    }

    const action = e.target.closest('[data-href]');
    if (action && isInDevice(action) && action.dataset.href) {
      e.preventDefault();
      navigateTo(action.dataset.href, 'forward');
    }
  });

  window.addEventListener('popstate', () => {
    if (navigating) return;
    const current = normalizeUrl(window.location.href);
    navStack = readStack();
    const top = navStack[navStack.length - 1];
    if (top !== current) {
      const idx = navStack.lastIndexOf(current);
      navStack = idx >= 0 ? navStack.slice(0, idx + 1) : [current];
      writeStack(navStack);
    }
    navigateTo(current, 'back', { replace: true, fromPopstate: true, skipStack: true });
  });

  window.PreviewNav = { navigateTo, goBack, getStack: () => readStack() };
})();
