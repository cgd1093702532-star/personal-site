/** 我的订单 · 预览页 */
(function () {
  const root = document.getElementById('my-orders-root');
  if (!root || !window.OrdersDemo) return;

  const { TABS, STATUS_LABEL, formatMoney, listOrders, normalizeTab } = window.OrdersDemo;

  function queryTab() {
    try {
      const u = new URL(window.location.href);
      return normalizeTab(u.searchParams.get('tab'));
    } catch (e) {
      return 'all';
    }
  }

  function go(href) {
    if (window.PreviewNav && typeof window.PreviewNav.navigateTo === 'function') {
      window.PreviewNav.navigateTo(href, 'forward');
      return;
    }
    window.location.href = href;
  }

  let activeTab = queryTab();

  function emptyHtml() {
    return (
      `<div class="my-orders__empty">` +
      `<div class="my-orders__empty-icon"><img src="../assets/icons/list.png" alt=""></div>` +
      `<div class="my-orders__empty-title">暂无相关订单</div>` +
      `</div>`
    );
  }

  function card(order) {
    const statusLabel = STATUS_LABEL[order.status] || order.status;
    let actions = '';
    if (order.showVoucher) {
      actions =
        `<div class="my-orders__actions">` +
        `<button type="button" class="my-orders__btn" data-voucher="${order.id}">券码凭证</button>` +
        `</div>`;
    } else if (order.showRate) {
      actions =
        `<div class="my-orders__actions">` +
        `<button type="button" class="my-orders__btn" data-rate="${order.id}">去评分</button>` +
        `</div>`;
    }
    return (
      `<article class="my-orders__card" data-detail="${order.id}" role="link" tabindex="0">` +
      `<div class="my-orders__card-head">` +
      `<div class="my-orders__shop">` +
      `<img class="my-orders__shop-icon" src="../assets/icons/landmark.png" alt="">` +
      `<span class="my-orders__shop-name">${order.shop}</span>` +
      `</div>` +
      `<span class="my-orders__status">${statusLabel}</span>` +
      `</div>` +
      `<div class="my-orders__body">` +
      `<div class="my-orders__cover"><img src="${order.cover}" alt=""></div>` +
      `<div class="my-orders__info">` +
      `<h3 class="my-orders__title">${order.title}</h3>` +
      `<div class="my-orders__price-row">` +
      `<span class="my-orders__price">¥ ${formatMoney(order.price)}</span>` +
      `<span class="my-orders__qty">x${order.qty}</span>` +
      `</div>` +
      `</div></div>` +
      `<div class="my-orders__paid">实付款 ¥ ${formatMoney(order.paid)}</div>` +
      actions +
      `</article>`
    );
  }

  function render() {
    const list = listOrders(activeTab);
    root.innerHTML =
      `<div class="my-orders">` +
      `<div class="my-orders__tabs">` +
      TABS.map(
        (t) =>
          `<button type="button" class="my-orders__tab${activeTab === t.key ? ' my-orders__tab--active' : ''}" data-tab="${t.key}">${t.label}</button>`,
      ).join('') +
      `</div>` +
      `<div class="my-orders__list">${list.length ? list.map(card).join('') : emptyHtml()}</div>` +
      `</div>`;

    root.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        try {
          const u = new URL(window.location.href);
          u.searchParams.set('tab', activeTab);
          history.replaceState(null, '', u.pathname + u.search + u.hash);
        } catch (e) {
          /* ignore */
        }
        render();
      });
    });
    root.querySelectorAll('[data-detail]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-voucher], [data-rate]')) return;
        go(`order-detail.html?id=${encodeURIComponent(el.dataset.detail)}`);
      });
    });
    root.querySelectorAll('[data-voucher]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        go(`order-voucher.html?id=${encodeURIComponent(btn.dataset.voucher)}`);
      });
    });
    root.querySelectorAll('[data-rate]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.rate;
        try {
          sessionStorage.setItem('order-detail-open-rate', String(id));
        } catch (err) {
          /* ignore */
        }
        go(`order-detail.html?id=${encodeURIComponent(id)}&rate=1`);
      });
    });
  }

  render();
  window.addEventListener('preview:navigate', () => {
    activeTab = queryTab();
    render();
  });
})();
