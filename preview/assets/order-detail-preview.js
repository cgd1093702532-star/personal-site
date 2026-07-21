/** 订单详情 · 预览页 */
(function () {
  const root = document.getElementById('order-detail-root');
  if (!root || !window.OrdersDemo) return;

  const { STATUS_LABEL, formatMoney, getOrderById } = window.OrdersDemo;

  let rateScore = 0;
  let rateSheetOpen = false;
  /** 本页本次访问内提交的评分（演示「始终未评」单不落库，仅当场展示） */
  const liveSubmitted = Object.create(null);
  const RATE_FLAG_KEY = 'order-detail-open-rate';
  const RATE_STORE_PREFIX = 'order-rate-score:';

  /** 演示用：带 showRate、无 ratedScore 的订单始终按未评价进入 */
  function isAlwaysUnratedDemo(order) {
    return !!(order && order.showRate && !(Number(order.ratedScore) > 0));
  }

  function readSubmitted(orderId) {
    const id = String(orderId || '');
    if (liveSubmitted[id]) return liveSubmitted[id];
    const order = getOrderById(id);
    if (isAlwaysUnratedDemo(order)) {
      try {
        sessionStorage.removeItem(RATE_STORE_PREFIX + id);
      } catch (e) {
        /* ignore */
      }
      return 0;
    }
    try {
      const stored = Number(sessionStorage.getItem(RATE_STORE_PREFIX + id) || 0) || 0;
      if (stored) return stored;
    } catch (e) {
      /* ignore */
    }
    return Number((order && order.ratedScore) || 0) || 0;
  }

  function writeSubmitted(orderId, score) {
    const id = String(orderId || '');
    const order = getOrderById(id);
    liveSubmitted[id] = Number(score) || 0;
    if (isAlwaysUnratedDemo(order)) {
      try {
        sessionStorage.removeItem(RATE_STORE_PREFIX + id);
      } catch (e) {
        /* ignore */
      }
      return;
    }
    try {
      sessionStorage.setItem(RATE_STORE_PREFIX + id, String(score));
    } catch (e) {
      /* ignore */
    }
  }

  function shouldOpenRate(orderId) {
    try {
      if (new URL(window.location.href).searchParams.get('rate') === '1') return true;
    } catch (e) {
      /* ignore */
    }
    try {
      return sessionStorage.getItem(RATE_FLAG_KEY) === String(orderId);
    } catch (e) {
      return false;
    }
  }

  function clearOpenRateFlag() {
    try {
      sessionStorage.removeItem(RATE_FLAG_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  const STAR_SVG =
    '<svg class="order-rate-sheet__icon" viewBox="0 0 48 48" aria-hidden="true">' +
    '<path fill="currentColor" d="M24 7.2c.55 0 1.05.32 1.28.83l4.05 9.05c.14.32.42.53.76.58l9.85 1.2c1.16.14 1.63 1.57.75 2.35l-7.3 6.55c-.27.24-.39.62-.31.98l2.05 9.7c.24 1.15-1 2.05-2.02 1.45l-8.55-4.95a1.1 1.1 0 0 0-1.12 0l-8.55 4.95c-1.02.6-2.26-.3-2.02-1.45l2.05-9.7c.08-.36-.04-.74-.31-.98l-7.3-6.55c-.88-.78-.41-2.21.75-2.35l9.85-1.2c.34-.05.62-.26.76-.58l4.05-9.05c.23-.51.73-.83 1.28-.83z"/>' +
    '</svg>';

  const STAR_VIEW_SVG =
    '<svg class="order-detail__rating-icon" viewBox="0 0 48 48" aria-hidden="true">' +
    '<path fill="currentColor" d="M24 7.2c.55 0 1.05.32 1.28.83l4.05 9.05c.14.32.42.53.76.58l9.85 1.2c1.16.14 1.63 1.57.75 2.35l-7.3 6.55c-.27.24-.39.62-.31.98l2.05 9.7c.24 1.15-1 2.05-2.02 1.45l-8.55-4.95a1.1 1.1 0 0 0-1.12 0l-8.55 4.95c-1.02.6-2.26-.3-2.02-1.45l2.05-9.7c.08-.36-.04-.74-.31-.98l-7.3-6.55c-.88-.78-.41-2.21.75-2.35l9.85-1.2c.34-.05.62-.26.76-.58l4.05-9.05c.23-.51.73-.83 1.28-.83z"/>' +
    '</svg>';

  function queryId() {
    try {
      return new URL(window.location.href).searchParams.get('id') || 'o1';
    } catch (e) {
      return 'o1';
    }
  }

  function queryOpenRate(orderId) {
    return shouldOpenRate(orderId || queryId());
  }

  function showToast(msg) {
    if (window.PreviewToast && typeof window.PreviewToast.show === 'function') {
      window.PreviewToast.show(msg);
      return;
    }
    window.alert(msg);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showToast('已复制');
        return;
      }
    } catch (e) {
      /* fallthrough */
    }
    showToast('复制失败');
  }

  function scoreLabel(score) {
    if (score <= 0) return '轻点星星评分';
    return `${score}.0 分`;
  }

  function starsHtml(score) {
    return [1, 2, 3, 4, 5]
      .map(
        (n) =>
          `<button type="button" class="order-rate-sheet__star${n <= score ? ' order-rate-sheet__star--on' : ''}" data-star="${n}" aria-label="${n}星">${STAR_SVG}</button>`,
      )
      .join('');
  }

  function ratingViewHtml(score) {
    if (!score) return '';
    const stars = [1, 2, 3, 4, 5]
      .map(
        (n) =>
          `<span class="order-detail__rating-star${n <= score ? ' order-detail__rating-star--on' : ''}">${STAR_VIEW_SVG}</span>`,
      )
      .join('');
    return (
      `<section class="order-detail__rating">` +
      `<span class="order-detail__rating-label">综合评分</span>` +
      `<div class="order-detail__rating-stars">${stars}</div>` +
      `<span class="order-detail__rating-score">${score}.0 分</span>` +
      `</section>`
    );
  }

  function rateSheetHtml() {
    const canSubmit = rateScore > 0;
    return (
      `<div class="order-rate-sheet${rateSheetOpen ? ' is-open' : ' is-hidden'}" data-rate-sheet>` +
      `<div class="order-rate-sheet__mask" data-rate-close></div>` +
      `<div class="order-rate-sheet__panel" role="dialog" aria-modal="true" aria-label="综合评分">` +
      `<div class="order-rate-sheet__handle" aria-hidden="true"></div>` +
      `<div class="order-rate-sheet__title">综合评分</div>` +
      `<div class="order-rate-sheet__score${rateScore > 0 ? ' order-rate-sheet__score--on' : ''}" data-rate-score>${scoreLabel(rateScore)}</div>` +
      `<div class="order-rate-sheet__stars">${starsHtml(rateScore)}</div>` +
      `<button type="button" class="order-rate-sheet__submit${canSubmit ? '' : ' order-rate-sheet__submit--disabled'}" data-rate-submit ${canSubmit ? '' : 'disabled'}>提交评分</button>` +
      `</div></div>`
    );
  }

  function syncRateSheetUi() {
    const sheet = root.querySelector('[data-rate-sheet]');
    if (!sheet) return;
    const scoreEl = sheet.querySelector('[data-rate-score]');
    if (scoreEl) {
      scoreEl.textContent = scoreLabel(rateScore);
      scoreEl.classList.toggle('order-rate-sheet__score--on', rateScore > 0);
    }
    sheet.querySelectorAll('[data-star]').forEach((btn) => {
      const n = Number(btn.getAttribute('data-star')) || 0;
      btn.classList.toggle('order-rate-sheet__star--on', n <= rateScore);
    });
    const submit = sheet.querySelector('[data-rate-submit]');
    if (submit) {
      const can = rateScore > 0;
      submit.disabled = !can;
      submit.classList.toggle('order-rate-sheet__submit--disabled', !can);
    }
  }

  function bindRateSheet(orderId) {
    root.querySelector('[data-rate-close]')?.addEventListener('click', () => {
      closeRateSheet();
    });
    root.querySelectorAll('[data-star]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        rateScore = Number(btn.getAttribute('data-star')) || 0;
        syncRateSheetUi();
      });
    });
    root.querySelector('[data-rate-submit]')?.addEventListener('click', () => {
      if (rateScore <= 0) return;
      writeSubmitted(orderId, rateScore);
      rateSheetOpen = false;
      document.querySelector('.mobile-shell')?.classList.remove('mobile-shell--overlay');
      showToast('评分成功');
      render();
    });
  }

  function openRateSheet() {
    rateSheetOpen = true;
    rateScore = 0;
    const sheet = root.querySelector('[data-rate-sheet]');
    if (sheet) {
      sheet.classList.remove('is-hidden');
      sheet.classList.add('is-open', 'is-entering');
      syncRateSheetUi();
      window.setTimeout(() => sheet.classList.remove('is-entering'), 320);
    } else {
      render();
    }
    document.querySelector('.mobile-shell')?.classList.add('mobile-shell--overlay');
  }

  function closeRateSheet() {
    rateSheetOpen = false;
    rateScore = 0;
    const sheet = root.querySelector('[data-rate-sheet]');
    if (sheet) {
      sheet.classList.add('is-hidden');
      sheet.classList.remove('is-open', 'is-entering');
      syncRateSheetUi();
    }
    document.querySelector('.mobile-shell')?.classList.remove('mobile-shell--overlay');
  }

  function render() {
    const order = getOrderById(queryId()) || window.OrdersDemo.ORDERS[0];
    if (!order) {
      root.innerHTML = `<div class="order-detail__missing">订单不存在</div>`;
      return;
    }
    const submittedScore = readSubmitted(order.id);
    const statusLabel = STATUS_LABEL[order.status] || order.status;
    const isCompleted = order.status === 'completed' || order.showRate;
    const canRate = isCompleted && !submittedScore;
    let footerHtml = '';
    if (canRate) {
      footerHtml =
        `<div class="order-detail__footer">` +
        `<button type="button" class="order-detail__cancel" data-rate>去评分</button>` +
        `</div>`;
    } else if (!isCompleted) {
      footerHtml =
        `<div class="order-detail__footer">` +
        `<button type="button" class="order-detail__cancel" data-cancel>取消报名</button>` +
        `</div>`;
    }

    root.innerHTML =
      `<div class="order-detail">` +
      `<div class="order-detail__banner"><span class="order-detail__status">${statusLabel}</span></div>` +
      `<section class="order-detail__voucher">` +
      `<div class="order-detail__voucher-main">` +
      `<div class="order-detail__time">${order.timeRange}</div>` +
      `<div class="order-detail__code-row">` +
      `<span>券码：${order.voucherCode}</span>` +
      `<button type="button" class="order-detail__copy" data-copy="${order.voucherCode}">复制</button>` +
      `</div></div>` +
      `<button type="button" class="order-detail__qr-link" data-voucher="${order.id}" aria-label="二维码凭证">` +
      `<img class="order-detail__qr-thumb" src="../assets/images/order-voucher-qr.png" alt="">` +
      `</button>` +
      `</section>` +
      `<section class="order-detail__goods">` +
      `<div class="order-detail__shop">` +
      `<img class="order-detail__shop-icon" src="../assets/icons/landmark.png" alt="">` +
      `<span>${order.shop}</span>` +
      `</div>` +
      `<div class="order-detail__body">` +
      `<div class="order-detail__cover"><img src="${order.cover}" alt=""></div>` +
      `<div class="order-detail__info">` +
      `<h3 class="order-detail__title">${order.title}</h3>` +
      `<div class="order-detail__price-row">` +
      `<span>¥ ${formatMoney(order.price)}</span>` +
      `<span class="order-detail__qty">x${order.qty}</span>` +
      `</div></div></div>` +
      `<div class="order-detail__paid">实付款 ¥ ${formatMoney(order.paid)}</div>` +
      `</section>` +
      `<section class="order-detail__meta">` +
      `<div class="order-detail__meta-row">` +
      `<span>订单编号：${order.orderNo}</span>` +
      `<button type="button" class="order-detail__copy order-detail__copy--link" data-copy="${order.orderNo}">复制</button>` +
      `</div>` +
      `<div class="order-detail__meta-row">支付方式：${order.payMethod}</div>` +
      `<div class="order-detail__meta-row">创建时间：${order.createdAt}</div>` +
      `<div class="order-detail__meta-row">付款时间：${order.paidAt}</div>` +
      `</section>` +
      ratingViewHtml(submittedScore) +
      footerHtml +
      `</div>` +
      (canRate || rateSheetOpen ? rateSheetHtml() : '');

    root.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        copyText(btn.getAttribute('data-copy') || '');
      });
    });
    root.querySelector('[data-voucher]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = e.currentTarget.getAttribute('data-voucher') || order.id;
      const href = `order-voucher.html?id=${encodeURIComponent(id)}`;
      if (window.PreviewNav && typeof window.PreviewNav.navigateTo === 'function') {
        window.PreviewNav.navigateTo(href, 'forward');
        return;
      }
      window.location.href = href;
    });
    root.querySelector('[data-cancel]')?.addEventListener('click', () => {
      showToast('敬请期待');
    });
    root.querySelector('[data-rate]')?.addEventListener('click', () => {
      openRateSheet();
    });
    if (canRate || rateSheetOpen) bindRateSheet(order.id);
    if (rateSheetOpen) {
      document.querySelector('.mobile-shell')?.classList.add('mobile-shell--overlay');
      requestAnimationFrame(() => {
        const sheet = root.querySelector('[data-rate-sheet]');
        if (!sheet) return;
        sheet.classList.add('is-entering');
        window.setTimeout(() => sheet.classList.remove('is-entering'), 320);
      });
    }
  }

  const bootId = queryId();
  if (shouldOpenRate(bootId)) {
    rateSheetOpen = true;
    rateScore = 0;
    clearOpenRateFlag();
  }
  render();
  window.addEventListener('preview:navigate', () => {
    const id = queryId();
    const order = getOrderById(id);
    if (isAlwaysUnratedDemo(order)) {
      delete liveSubmitted[String(id)];
    }
    const open = shouldOpenRate(id);
    rateSheetOpen = open;
    rateScore = 0;
    if (open) clearOpenRateFlag();
    document.querySelector('.mobile-shell')?.classList.toggle('mobile-shell--overlay', rateSheetOpen);
    render();
  });
})();
