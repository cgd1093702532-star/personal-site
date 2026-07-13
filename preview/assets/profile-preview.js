/** 个人中心预览 */
(function () {
  const root = document.getElementById('profile-root');
  if (!root) return;

  const imgBase = '../assets/images/';

  function showToast(msg, type) {
    if (window.PreviewToast) window.PreviewToast.show(msg, type || 'none', 2000);
    else window.alert(msg);
  }

  async function getApplyStatus() {
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        const res = await window.HeroPlazaDB.getHeroApplyStatus();
        const status = res?.status || 'none';
        if (status && status !== 'none') {
          return {
            status,
            reject_reason: res?.reject_reason || res?.application?.reject_reason || '',
          };
        }
      } catch (_) {
        /* fallback */
      }
    }
    if (window.HeroPlazaDB) {
      try {
        const role = await window.HeroPlazaDB.getAppState('mock_hero_role');
        if (role === 'pending' || role === 'approved' || role === 'rejected') {
          return { status: role, reject_reason: '' };
        }
      } catch (_) {
        /* ignore */
      }
    }
    return { status: 'none', reject_reason: '' };
  }

  function navigateApplyPage(role) {
    if (role === 'pending') {
      if (window.PreviewNav?.navigateTo) {
        window.PreviewNav.navigateTo('hero-apply-submitted.html', 'forward');
      } else {
        sessionStorage.setItem('page-transition', 'forward');
        window.location.href = 'hero-apply-submitted.html';
      }
      return;
    }
    if (window.PreviewNav?.navigateTo) {
      window.PreviewNav.navigateTo('hero-apply.html', 'forward');
    } else {
      sessionStorage.setItem('page-transition', 'forward');
      window.location.href = 'hero-apply.html';
    }
  }

  async function resolveDisplayRole() {
    const res = await getApplyStatus();
    return {
      hero: res.status === 'approved',
      pending: res.status === 'pending',
      rejected: res.status === 'rejected',
      rejectReason: res.reject_reason || '',
      apiRole: res.status,
    };
  }

  function userBlock(hero) {
    const stats = hero
      ? `<div class="profile-user__stats">
          <a class="profile-user__stat profile-user__stat--tap nav-forward" href="my-students.html"><span class="profile-user__stat-num">128</span><span class="profile-user__stat-label">学员</span></a>
          <a class="profile-user__stat profile-user__stat--tap nav-forward" href="hero-reviews.html"><span class="profile-user__stat-num">4.9</span><span class="profile-user__stat-label">评分</span></a>
          <a class="profile-user__stat profile-user__stat--tap nav-forward" href="my-courses.html"><span class="profile-user__stat-num">12</span><span class="profile-user__stat-label">课程</span></a>
        </div>`
      : '';
    return `<div class="profile-user">
        <div class="profile-user__head">
          <div class="avatar profile-user__avatar"><img src="${imgBase}avatar-user.jpg" alt="用户"></div>
          <div class="profile-user__info">
            <div class="profile-user__name">航海用户</div>
            <div class="profile-user__meta">
              <span class="profile-user__member">普通会员</span>
              ${hero
                ? '<a class="profile-user__cert profile-user__cert--hero profile-user__cert--tap nav-forward" href="hero-apply-success.html"><span class="profile-user__cert-text">已认证英雄</span></a>'
                : '<span class="profile-user__cert profile-user__cert--none">未认证</span>'}
            </div>
          </div>
        </div>
        ${stats}
      </div>`;
  }

  function ordersBlock() {
    return `<div class="profile-orders">
      <div class="profile-orders__head">
        <span class="profile-orders__title">我的订单</span>
        <a class="profile-orders__more" href="#">全部订单 ›</a>
      </div>
      <div class="profile-orders__grid">
        <a class="profile-orders__item" href="#">
          <img class="profile-orders__icon" src="../assets/icons/order-pay.png" alt="">
          <span class="profile-orders__label">待付款</span>
        </a>
        <a class="profile-orders__item" href="#">
          <img class="profile-orders__icon" src="../assets/icons/order-ship.png" alt="">
          <span class="profile-orders__label">待发货</span>
        </a>
        <a class="profile-orders__item" href="#">
          <img class="profile-orders__icon" src="../assets/icons/order-receive.png" alt="">
          <span class="profile-orders__label">待使用/待收货</span>
        </a>
        <a class="profile-orders__item" href="#">
          <img class="profile-orders__icon" src="../assets/icons/order-refund.png" alt="">
          <span class="profile-orders__label">退款/售后</span>
        </a>
      </div>
    </div>`;
  }

  function heroBlock() {
    return `<div class="profile-hero-center">
      <div class="profile-section__title">服务中心</div>
      <div class="profile-hero-shortcuts">
      <div class="profile-hero-shortcuts__row">
      <a class="profile-hero-shortcuts__item nav-forward" href="my-recruitments.html"><img class="profile-hero-shortcuts__icon" src="../assets/icons/list.png" alt=""><span class="profile-hero-shortcuts__label">我的招募</span></a>
      <a class="profile-hero-shortcuts__item nav-forward" href="my-courses.html"><img class="profile-hero-shortcuts__icon" src="../assets/icons/book.png" alt=""><span class="profile-hero-shortcuts__label">我的课程</span></a>
      <a class="profile-hero-shortcuts__item nav-forward" href="hero-profile.html"><img class="profile-hero-shortcuts__icon" src="../assets/icons/user.png" alt=""><span class="profile-hero-shortcuts__label">英雄资料</span></a>
      </div>
    </div>
    </div>`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function uncertCta(state) {
    const { pending, rejected } = state;
    let hint = '成为英雄，发布赛事招募，开启您的水上教育事业';
    let btn = '申请成为英雄';
    let cls = '';
    if (pending) {
      hint = '认证申请审核中，请耐心等待';
      btn = '查看审核进度';
      cls = ' profile-hero-cta--pending';
    } else if (rejected) {
      hint = '认证申请被驳回，请修改后再次提交申请';
      btn = '查看原因';
      cls = ' profile-hero-cta--rejected';
    }
    return `<div class="profile-hero-cta${cls}">
      <p class="profile-hero-cta__hint">${hint}</p>
      <button type="button" class="profile-hero-cta__btn" id="profile-apply-hero">${btn}</button>
    </div>`;
  }

  function closeRejectDialog() {
    document.getElementById('profile-reject-dialog')?.remove();
  }

  function showRejectReasonDialog(reason) {
    closeRejectDialog();
    const text = (reason || '').trim() || '暂无驳回原因';
    const dialog = document.createElement('div');
    dialog.id = 'profile-reject-dialog';
    dialog.className = 'profile-dialog';
    dialog.innerHTML = `
      <div class="profile-dialog__mask" data-dialog-close></div>
      <div class="profile-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="profile-reject-title">
        <div class="profile-dialog__title" id="profile-reject-title">驳回原因</div>
        <div class="profile-dialog__body">${escapeHtml(text)}</div>
        <div class="profile-dialog__actions">
          <button type="button" class="profile-dialog__btn profile-dialog__btn--cancel" data-dialog-close>取消</button>
          <button type="button" class="profile-dialog__btn profile-dialog__btn--primary" data-dialog-edit>去修改</button>
        </div>
      </div>`;
    const shell = root.closest('.mobile-shell') || document.body;
    shell.appendChild(dialog);
    dialog.addEventListener('click', (e) => {
      if (e.target.closest('[data-dialog-edit]')) {
        closeRejectDialog();
        navigateApplyPage('none');
        return;
      }
      if (e.target.closest('[data-dialog-close]')) closeRejectDialog();
    });
  }

  let applyHeroBound = false;

  function bindApplyHero() {
    if (applyHeroBound) return;
    applyHeroBound = true;
    root.addEventListener('click', async (e) => {
      const btn = e.target.closest('#profile-apply-hero');
      if (!btn) return;
      e.preventDefault();

      const status = await getApplyStatus();
      const role = status.status;
      if (role === 'approved') {
        showToast('您已是认证英雄');
        render();
        return;
      }
      if (role === 'pending') {
        navigateApplyPage('pending');
        return;
      }
      if (role === 'rejected') {
        showRejectReasonDialog(status.reject_reason);
        return;
      }
      navigateApplyPage('none');
    });
  }

  function activityBlock() {
    return `<div class="profile-section">
      <div class="profile-section__title">我的活动</div>
      <a class="profile-menu__item nav-forward" href="my-signups.html">
        <span class="profile-menu__icon"><img class="icon icon--md" src="../assets/icons/list.png" alt=""></span>
        <span class="profile-menu__body">
          <span class="profile-menu__title">我的报名</span>
        </span>
        <span class="profile-menu__arrow">›</span>
      </a>
      <a class="profile-menu__item nav-forward" href="my-reviews.html">
        <span class="profile-menu__icon"><img class="icon icon--md" src="../assets/icons/star.png" alt=""></span>
        <span class="profile-menu__body">
          <span class="profile-menu__title">我的评价</span>
        </span>
        <span class="profile-menu__arrow">›</span>
      </a>
    </div>`;
  }

  async function render() {
    const state = await resolveDisplayRole();
    root.innerHTML = `
      ${userBlock(state.hero)}
      ${state.hero ? '' : uncertCta(state)}
      ${ordersBlock()}
      ${state.hero ? heroBlock() : ''}
      ${activityBlock()}`;
    bindApplyHero();
  }

  window.addEventListener('preview:navigate', () => {
    render();
  });

  function init() {
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
