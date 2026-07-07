/** 预览页 · 轻量 Toast 提示 */
(function (global) {
  function show(message, type, durationMs) {
    let el = document.getElementById('preview-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'preview-toast';
      el.setAttribute('role', 'status');
      el.style.cssText =
        'position:fixed;left:50%;bottom:72px;transform:translateX(-50%);' +
        'max-width:min(320px,calc(100vw - 32px));padding:10px 16px;border-radius:8px;' +
        'font-size:14px;line-height:1.4;color:#fff;background:rgba(0,0,0,0.82);' +
        'z-index:99999;pointer-events:none;opacity:0;transition:opacity .2s ease;text-align:center;';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.background =
      type === 'error' ? 'rgba(180,40,40,0.92)' : type === 'success' ? 'rgba(27,87,156,0.92)' : 'rgba(0,0,0,0.82)';
    el.style.opacity = '1';
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => {
      el.style.opacity = '0';
    }, durationMs || 2600);
  }

  global.PreviewToast = { show };
})(typeof window !== 'undefined' ? window : globalThis);
