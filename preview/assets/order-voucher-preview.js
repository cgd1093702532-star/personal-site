/** 二维码凭证 · 预览页 */
(function () {
  const root = document.getElementById('order-voucher-root');
  if (!root || !window.OrdersDemo) return;

  function queryId() {
    try {
      return new URL(window.location.href).searchParams.get('id') || 'o1';
    } catch (e) {
      return 'o1';
    }
  }

  function isRedeemed(order) {
    return order.status === 'completed' || !!order.voucherRedeemed;
  }

  function qrHtml(redeemed) {
    const wrapClass = redeemed
      ? 'order-voucher__qr-wrap order-voucher__qr-wrap--used'
      : 'order-voucher__qr-wrap';
    const stamp = redeemed
      ? `<span class="order-voucher__stamp" aria-label="已核销"><span class="order-voucher__stamp-text">已核销</span></span>`
      : '';
    return (
      `<div class="${wrapClass}">` +
      `<img class="order-voucher__qr" src="../assets/images/order-voucher-qr.png" alt="二维码">` +
      stamp +
      `</div>`
    );
  }

  function render() {
    const order = window.OrdersDemo.getOrderById(queryId()) || window.OrdersDemo.ORDERS[0];
    if (!order) {
      root.innerHTML = `<div class="order-voucher__missing">订单不存在</div>`;
      return;
    }
    const redeemed = isRedeemed(order);
    root.innerHTML =
      `<div class="order-voucher">` +
      `<section class="order-voucher__card order-voucher__card--event">` +
      `<h2 class="order-voucher__event-title">${order.title}</h2>` +
      `<div class="order-voucher__meta">` +
      `<img class="order-voucher__meta-icon" src="../assets/icons/time.png" alt="">` +
      `<span>${order.timeRange}</span>` +
      `</div>` +
      `<button type="button" class="order-voucher__meta order-voucher__meta--loc" data-loc>` +
      `<img class="order-voucher__meta-icon" src="../assets/icons/location.png" alt="">` +
      `<span class="order-voucher__loc-text">${order.location}</span>` +
      `<span class="order-voucher__chevron">›</span>` +
      `</button>` +
      `</section>` +
      `<section class="order-voucher__card order-voucher__card--code">` +
      `<p class="order-voucher__hint">使用时请向工作人员出示二维码或券码</p>` +
      qrHtml(redeemed) +
      `<p class="order-voucher__code">券码: ${order.voucherCode}</p>` +
      `<p class="order-voucher__warn">为保障您的权益，未使用前请不要将二维码提供给商家</p>` +
      `</section>` +
      `<a class="order-voucher__card order-voucher__card--detail nav-forward" href="order-detail.html?id=${encodeURIComponent(order.id)}">` +
      `<div class="order-voucher__detail-text">` +
      `<div class="order-voucher__detail-title">订单详情</div>` +
      `<div class="order-voucher__detail-sub">查看订单详情</div>` +
      `</div>` +
      `<span class="order-voucher__chevron">›</span>` +
      `</a>` +
      `</div>`;

    root.querySelector('[data-loc]')?.addEventListener('click', (e) => {
      e.preventDefault();
    });
  }

  render();
  window.addEventListener('preview:navigate', render);
})();
