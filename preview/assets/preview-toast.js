/** 预览页 · 轻量 Toast 提示（当前页面居中） */
(function (global) {
  function getHost() {
    return (
      document.querySelector('.mobile-shell') ||
      document.querySelector('.device__frame') ||
      document.getElementById('admin-page-root') ||
      document.querySelector('.admin-main') ||
      document.body
    );
  }

  function ensureHostPosition(host) {
    if (host === document.body) return;
    const style = global.getComputedStyle(host);
    if (style.position === 'static') {
      host.style.position = 'relative';
    }
  }

  function show(message, type, durationMs) {
    const host = getHost();
    ensureHostPosition(host);

    let el = host.querySelector(':scope > #preview-toast') || document.getElementById('preview-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'preview-toast';
      el.setAttribute('role', 'status');
    }
    if (el.parentNode !== host) {
      host.appendChild(el);
    }

    const isFixed = host === document.body;
    el.style.cssText =
      `position:${isFixed ? 'fixed' : 'absolute'};` +
      'left:50%;top:50%;transform:translate(-50%,-50%);' +
      'max-width:min(280px,calc(100% - 48px));padding:12px 18px;border-radius:10px;' +
      'font-size:14px;line-height:1.45;color:#fff;background:rgba(0,0,0,0.82);' +
      'z-index:99999;pointer-events:none;opacity:0;transition:opacity .2s ease;text-align:center;' +
      'box-sizing:border-box;word-break:break-word;';
    el.textContent = message;
    el.style.background =
      type === 'error'
        ? 'rgba(180,40,40,0.92)'
        : type === 'success'
          ? 'rgba(27,87,156,0.92)'
          : 'rgba(0,0,0,0.82)';
    // force reflow then show
    void el.offsetWidth;
    el.style.opacity = '1';
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => {
      el.style.opacity = '0';
    }, durationMs || 2600);
  }

  global.PreviewToast = { show };
})(typeof window !== 'undefined' ? window : globalThis);
