/** 消息中心 · 分类入口（预览） */
(function () {
  const CATEGORIES = [
    {
      id: 'system',
      title: '系统消息提醒',
      icon: '../assets/icons/msg-system.png',
      href: 'message-detail.html',
    },
    { id: 'order', title: '订单提醒', icon: '../assets/icons/msg-order.png' },
    { id: 'refund', title: '退款提醒', icon: '../assets/icons/msg-refund.png' },
    { id: 'promoter', title: '推广员提醒', icon: '../assets/icons/msg-promoter.png' },
  ];

  function showToast(msg) {
    if (window.PreviewToast) window.PreviewToast.show(msg, 'none', 2000);
    else window.alert(msg);
  }

  function go(href) {
    if (window.PreviewNav?.navigateTo) {
      window.PreviewNav.navigateTo(href, 'forward');
    } else {
      window.location.href = href;
    }
  }

  function render() {
    const root = document.getElementById('messages-root');
    if (!root) return;

    root.innerHTML =
      `<div class="msg-center">` +
      CATEGORIES.map(
        (item) =>
          `<button type="button" class="msg-center__card" data-msg-cat="${item.id}">` +
          `<img class="msg-center__icon" src="${item.icon}" alt="">` +
          `<span class="msg-center__title">${item.title}</span>` +
          `<span class="msg-center__arrow" aria-hidden="true">›</span>` +
          `</button>`
      ).join('') +
      `</div>`;

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-msg-cat]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-msg-cat');
      const item = CATEGORIES.find((c) => c.id === id);
      if (item?.href) {
        go(item.href);
        return;
      }
      showToast('功能开发中');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
