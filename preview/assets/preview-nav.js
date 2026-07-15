/** 预览页 · 在手机模型内切换页面（不整页刷新） */
(function () {
  const frame = document.querySelector('.device__frame');
  let shell = document.querySelector('.mobile-shell');
  if (!frame || !shell) return;

  const PAGE_SCRIPT_ATTR = 'data-preview-page-script';
  const NAV_SCRIPT = 'preview-nav.js';
  const DOC_ASIDE_SCRIPT = 'preview-doc-aside.js';
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
      // 导航与右侧文档面板常驻，勿在 SPA 切换时重复注入
      if (src.includes(NAV_SCRIPT) || src.includes(DOC_ASIDE_SCRIPT)) return false;
      return true;
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
    const { replace = false, fromPopstate = false, skipStack = false, force = false } = options;
    const url = resolveUrl(href);

    const isBackNav = transition === 'back' || transition === 'tab';
    if (!fromPopstate && !force && !isBackNav && url === window.location.href) return;

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

      const nextDoc =
        doc.body?.getAttribute('data-preview-doc') ||
        doc.querySelector('.device')?.getAttribute('data-preview-doc') ||
        '';
      const nextScope =
        doc.body?.getAttribute('data-preview-doc-scope') ||
        doc.querySelector('.device')?.getAttribute('data-preview-doc-scope') ||
        '';
      if (nextDoc) {
        document.body.setAttribute('data-preview-doc', nextDoc);
        document.querySelector('.device')?.setAttribute('data-preview-doc', nextDoc);
      } else {
        document.body.removeAttribute('data-preview-doc');
        document.querySelector('.device')?.removeAttribute('data-preview-doc');
      }
      if (nextScope) {
        document.body.setAttribute('data-preview-doc-scope', nextScope);
        document.querySelector('.device')?.setAttribute('data-preview-doc-scope', nextScope);
      } else {
        document.body.removeAttribute('data-preview-doc-scope');
        document.querySelector('.device')?.removeAttribute('data-preview-doc-scope');
      }

      if (!fromPopstate) {
        const normalized = normalizeUrl(url);
        if (replace) {
          history.replaceState({ previewUrl: url }, '', url);
          navStack = readStack();
          if (navStack.length) {
            navStack[navStack.length - 1] = normalized;
          } else {
            navStack = [normalized];
          }
          writeStack(navStack);
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
      window.dispatchEvent(
        new CustomEvent('preview:navigate', {
          detail: { url, transition, previewDoc: nextDoc || '', previewDocScope: nextScope || '' },
        }),
      );
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

  function resolveBackFallback(link) {
    const explicit = link.getAttribute('data-back-fallback');
    if (explicit && isInternalHref(explicit)) return explicit;
    const href = link.getAttribute('href');
    if (href && isInternalHref(href)) return href;
    return null;
  }

  function isTabHref(href) {
    const base = (href || '').split('/').pop().split('?')[0];
    return ['index.html', 'heroes.html', 'mall.html', 'profile.html'].includes(base);
  }

  function navigateToBackTarget(link) {
    const target = link.getAttribute('data-back-target');
    if (!target || !isInternalHref(target)) return false;
    const url = normalizeUrl(resolveUrl(target));
    navStack = readStack();
    const idx = navStack.lastIndexOf(url);
    navStack = idx >= 0 ? navStack.slice(0, idx + 1) : [url];
    writeStack(navStack);
    const transition = isTabHref(target) ? 'tab' : 'back';
    navigateTo(target, transition, { replace: true, skipStack: true, force: true });
    return true;
  }

  async function goBack(fallbackHref) {
    const target = resolveBackTarget(fallbackHref);
    if (!target) {
      if (fallbackHref && isInternalHref(fallbackHref)) {
        return navigateTo(fallbackHref, 'back', { replace: true, skipStack: true, force: true });
      }
      return;
    }
    if (target.source === 'stack') {
      navStack = navStack.slice(0, -1);
      writeStack(navStack);
    }
    const transition = isTabHref(target.url) ? 'tab' : 'back';
    return navigateTo(target.url, transition, { replace: true, skipStack: true, force: true });
  }

  /** 返回：data-back-target 固定页 > 导航栈 > fallback */
  function handleBack(link) {
    if (navigating) return;
    if (navigateToBackTarget(link)) return;
    goBack(resolveBackFallback(link));
  }

  function isBackLink(link) {
    return link.classList.contains('nav-back') || link.classList.contains('mp-navbar__back');
  }

  function onBackClick(e) {
    const link = e.target.closest('a.mp-navbar__back, a.nav-back');
    if (!link || !isInDevice(link)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    handleBack(link);
  }

  function onDocumentClick(e) {
    const link = e.target.closest('a[href]');
    if (link && isInDevice(link)) {
      if (e.defaultPrevented || link.hasAttribute('data-spa-ignore')) return;
      if (isBackLink(link)) {
        e.preventDefault();
        handleBack(link);
        return;
      }
      const href = link.getAttribute('href');
      if (!isInternalHref(href)) return;
      e.preventDefault();
      navigateTo(href, detectTransition(link));
      return;
    }

    const action = e.target.closest('[data-href]');
    if (action && isInDevice(action) && action.dataset.href) {
      e.preventDefault();
      navigateTo(action.dataset.href, 'forward');
    }
  }

  document.addEventListener('click', onBackClick, true);
  document.addEventListener('click', onDocumentClick);

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

  // 全局注入 Toast，保证各页提示都在当前手机页内居中
  if (!window.PreviewToast) {
    const toastScript = document.createElement('script');
    toastScript.src = new URL('../assets/preview-toast.js', window.location.href).href;
    document.head.appendChild(toastScript);
  }
})();
