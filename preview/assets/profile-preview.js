/** 个人中心预览 */
(function () {
  const root = document.getElementById('profile-root');
  if (!root) return;

  const imgBase = '../assets/images/';
  const REASON_FALLBACK = '您的英雄身份当前不可用，可联系客服处理';

  function showToast(msg, type) {
    if (window.PreviewToast) window.PreviewToast.show(msg, type || 'none', 2000);
    else window.alert(msg);
  }

  function reasonOrFallback(reason) {
    const text = String(reason || '').trim();
    return text || REASON_FALLBACK;
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
            hero_id: res?.hero_id || null,
            profile_change_pending: !!res?.profile_change_pending,
            hero_enabled: res?.hero_enabled !== false,
            disable_reason: res?.disable_reason || '',
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
          return {
            status: role,
            reject_reason: '',
            hero_id: null,
            profile_change_pending: false,
            hero_enabled: true,
            disable_reason: '',
          };
        }
      } catch (_) {
        /* ignore */
      }
    }
    return {
      status: 'none',
      reject_reason: '',
      hero_id: null,
      profile_change_pending: false,
      hero_enabled: true,
      disable_reason: '',
    };
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
    if (isGuestPreview()) {
      return {
        guest: true,
        hero: false,
        heroActive: false,
        disabled: false,
        pending: false,
        rejected: false,
        rejectReason: '',
        disableReason: '',
        apiRole: 'guest',
        profileChangePending: false,
      };
    }
    const res = await getApplyStatus();
    const approved = res.status === 'approved';
    const disabled = approved && res.hero_enabled === false;
    return {
      guest: false,
      hero: approved,
      heroActive: approved && !disabled,
      disabled,
      pending: res.status === 'pending',
      rejected: res.status === 'rejected',
      rejectReason: res.reject_reason || '',
      disableReason: res.disable_reason || '',
      apiRole: res.status,
      profileChangePending: !!res.profile_change_pending,
    };
  }

  function isGuestPreview() {
    try {
      return new URLSearchParams(window.location.search).get('guest') === '1';
    } catch (_) {
      return false;
    }
  }

  function userBlock(state) {
    const msgBtn =
      `<button type="button" class="profile-user__msg" id="profile-messages" aria-label="消息">` +
      `<img class="profile-user__msg-icon" src="../assets/icons/chat.png" alt=""></button>`;
    if (state.guest) {
      return `<div class="profile-user">
        <div class="profile-user__head">
          <div class="avatar profile-user__avatar profile-user__avatar--guest" aria-hidden="true"></div>
          <div class="profile-user__info">
            <button type="button" class="profile-user__name profile-user__name--login" id="profile-login">授权登录</button>
          </div>
          ${msgBtn}
        </div>
      </div>`;
    }
    return `<div class="profile-user">
        <div class="profile-user__head">
          <div class="avatar profile-user__avatar"><img src="${imgBase}avatar-user.jpg" alt="用户"></div>
          <div class="profile-user__info">
            <div class="profile-user__name">航海用户</div>
            <div class="profile-user__meta">
              <span class="profile-user__member">普通会员</span>
              ${state.hero
                ? '<span class="profile-user__cert profile-user__cert--hero"><span class="profile-user__cert-text">已认证英雄</span></span>'
                : '<span class="profile-user__cert profile-user__cert--none">未认证</span>'}
            </div>
          </div>
          ${msgBtn}
        </div>
      </div>`;
  }

  function vipBlock() {
    return `<button type="button" class="profile-vip" data-profile-soon="航海家权益卡">
      <span class="profile-vip__title">航海家<span class="profile-vip__title-gold">权益卡</span></span>
      <span class="profile-vip__cta">立即开通 ›</span>
    </button>`;
  }

  function assetsBlock() {
    return `<div class="profile-assets">
      <button type="button" class="profile-assets__item" data-profile-soon="积分">
        <span class="profile-assets__num">0</span>
        <span class="profile-assets__label">积分</span>
      </button>
      <button type="button" class="profile-assets__item" data-profile-soon="赠品">
        <span class="profile-assets__num">0</span>
        <span class="profile-assets__label">赠品</span>
      </button>
      <button type="button" class="profile-assets__item" data-profile-soon="优惠券/码">
        <span class="profile-assets__num">0</span>
        <span class="profile-assets__label">优惠券/码</span>
      </button>
    </div>`;
  }

  function ordersBlock() {
    return `<div class="profile-orders">
      <div class="profile-orders__head">
        <span class="profile-orders__title">我的订单</span>
        <a class="profile-orders__more" href="#">全部订单 ›</a>
      </div>
      <div class="profile-orders__grid">
        <a class="profile-orders__item" href="#"><img class="profile-orders__icon" src="../assets/icons/order-pay.png" alt=""><span class="profile-orders__label">待付款</span></a>
        <a class="profile-orders__item" href="#"><img class="profile-orders__icon" src="../assets/icons/order-ship.png" alt=""><span class="profile-orders__label">待发货</span></a>
        <a class="profile-orders__item" href="#"><img class="profile-orders__icon" src="../assets/icons/order-receive.png" alt=""><span class="profile-orders__label">待使用/待收货</span></a>
        <a class="profile-orders__item" href="#"><img class="profile-orders__icon" src="../assets/icons/order-refund.png" alt=""><span class="profile-orders__label">退款/售后</span></a>
      </div>
    </div>`;
  }

  function heroBlock(state) {
    const active = state.heroActive;
    const profileBadge =
      active && state.profileChangePending
        ? '<span class="profile-hero-shortcuts__badge">审核中</span>'
        : '';
    const itemClass = 'profile-hero-shortcuts__item';
    const gate = active ? '' : ' data-hero-gate="1"';
    const publish = active
      ? `<button type="button" class="${itemClass}" id="profile-publish-entry"><img class="profile-hero-shortcuts__icon" src="../assets/icons/publish.png" alt=""><span class="profile-hero-shortcuts__label">发布招募/课程</span></button>`
      : `<button type="button" class="${itemClass}"${gate}><img class="profile-hero-shortcuts__icon" src="../assets/icons/publish.png" alt=""><span class="profile-hero-shortcuts__label">发布招募/课程</span></button>`;
    const link = (href, icon, label) =>
      active
        ? `<a class="${itemClass} nav-forward" href="${href}"><img class="profile-hero-shortcuts__icon" src="../assets/icons/${icon}" alt=""><span class="profile-hero-shortcuts__label">${label}</span></a>`
        : `<button type="button" class="${itemClass}"${gate}><img class="profile-hero-shortcuts__icon" src="../assets/icons/${icon}" alt=""><span class="profile-hero-shortcuts__label">${label}</span></button>`;
    const edit = active
      ? `<a class="${itemClass} nav-forward" href="hero-apply.html?mode=edit">${profileBadge}<img class="profile-hero-shortcuts__icon" src="../assets/icons/user.png" alt=""><span class="profile-hero-shortcuts__label">修改资料</span></a>`
      : `<button type="button" class="${itemClass}"${gate}><img class="profile-hero-shortcuts__icon" src="../assets/icons/user.png" alt=""><span class="profile-hero-shortcuts__label">修改资料</span></button>`;
    return `<div class="profile-hero-center">
      <div class="profile-section__title">服务中心</div>
      <div class="profile-hero-shortcuts">
      <div class="profile-hero-shortcuts__row">
      ${publish}
      ${link('my-recruitments.html', 'list.png', '我的招募')}
      ${link('my-courses.html', 'book.png', '我的课程')}
      ${edit}
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
    let hint = '成为英雄，发布赛事招募，开启您的水上教育事业';
    let btn = '申请成为英雄';
    let cls = '';
    if (state.disabled) {
      hint = '您的英雄身份当前不可用，可联系客服处理';
      btn = '查看原因';
      cls = ' profile-hero-cta--rejected';
    } else if (state.pending) {
      hint = '认证申请审核中，请耐心等待';
      btn = '查看审核进度';
      cls = ' profile-hero-cta--pending';
    } else if (state.rejected) {
      hint = '认证申请被驳回，请修改后再次提交申请';
      btn = '查看原因';
      cls = ' profile-hero-cta--rejected';
    }
    return `<div class="profile-hero-cta${cls}">
      <p class="profile-hero-cta__hint">${hint}</p>
      <button type="button" class="profile-hero-cta__btn" id="profile-apply-hero">${btn}</button>
    </div>`;
  }

  function closeDialog(id) {
    document.getElementById(id)?.remove();
  }

  function showRejectReasonDialog(reason) {
    closeDialog('profile-reject-dialog');
    const dialog = document.createElement('div');
    dialog.id = 'profile-reject-dialog';
    dialog.className = 'profile-dialog';
    dialog.innerHTML = `
      <div class="profile-dialog__mask" data-dialog-close></div>
      <div class="profile-dialog__panel" role="dialog" aria-modal="true">
        <div class="profile-dialog__title">申请失败</div>
        <div class="profile-dialog__body">${escapeHtml(reasonOrFallback(reason))}</div>
        <div class="profile-dialog__actions">
          <button type="button" class="profile-dialog__btn profile-dialog__btn--cancel" data-dialog-close>取消</button>
          <button type="button" class="profile-dialog__btn profile-dialog__btn--primary" data-dialog-edit>去修改</button>
        </div>
      </div>`;
    (root.closest('.mobile-shell') || document.body).appendChild(dialog);
    dialog.addEventListener('click', (e) => {
      if (e.target.closest('[data-dialog-edit]')) {
        closeDialog('profile-reject-dialog');
        navigateApplyPage('none');
        return;
      }
      if (e.target.closest('[data-dialog-close]')) closeDialog('profile-reject-dialog');
    });
  }

  function showDisableReasonDialog(reason) {
    closeDialog('profile-disable-dialog');
    const dialog = document.createElement('div');
    dialog.id = 'profile-disable-dialog';
    dialog.className = 'profile-dialog';
    dialog.innerHTML = `
      <div class="profile-dialog__mask" data-dialog-close></div>
      <div class="profile-dialog__panel" role="dialog" aria-modal="true">
        <div class="profile-dialog__title">教练身份禁用</div>
        <div class="profile-dialog__body">${escapeHtml(reasonOrFallback(reason))}</div>
        <div class="profile-dialog__actions">
          <button type="button" class="profile-dialog__btn profile-dialog__btn--primary" data-dialog-close>知道了</button>
        </div>
      </div>`;
    (root.closest('.mobile-shell') || document.body).appendChild(dialog);
    dialog.addEventListener('click', (e) => {
      if (e.target.closest('[data-dialog-close]')) closeDialog('profile-disable-dialog');
    });
  }

  function closePublishSheet() {
    closeDialog('profile-publish-sheet');
  }

  function showPublishSheet() {
    closePublishSheet();
    const sheet = document.createElement('div');
    sheet.id = 'profile-publish-sheet';
    sheet.className = 'profile-action-sheet mobile-overlay';
    sheet.innerHTML = `
      <div class="profile-action-sheet__mask" data-sheet-close></div>
      <div class="profile-action-sheet__panel" role="dialog" aria-modal="true" aria-label="选择发布类型">
        <button type="button" class="profile-action-sheet__item" data-publish="recruitment">发布赛事招募</button>
        <button type="button" class="profile-action-sheet__item" data-publish="course">申请课程</button>
        <button type="button" class="profile-action-sheet__item profile-action-sheet__item--cancel" data-sheet-close>取消</button>
      </div>`;
    (root.closest('.mobile-shell') || document.body).appendChild(sheet);
    sheet.addEventListener('click', (e) => {
      const pub = e.target.closest('[data-publish]');
      if (pub) {
        closePublishSheet();
        const href = pub.dataset.publish === 'course' ? 'course-create.html' : 'recruitment-create.html';
        if (window.PreviewNav?.navigateTo) window.PreviewNav.navigateTo(href, 'forward');
        else window.location.href = href;
        return;
      }
      if (e.target.closest('[data-sheet-close]')) closePublishSheet();
    });
  }

  let applyHeroBound = false;

  function bindApplyHero() {
    if (applyHeroBound) return;
    applyHeroBound = true;
    root.addEventListener('click', async (e) => {
      const gate = e.target.closest('[data-hero-gate]');
      if (gate) {
        e.preventDefault();
        if (isGuestPreview()) {
          showToast('请先授权登录');
          return;
        }
        const status = await getApplyStatus();
        const role = status.status;
        if (role === 'pending') {
          navigateApplyPage('pending');
          return;
        }
        if (role === 'rejected') {
          showRejectReasonDialog(status.reject_reason);
          return;
        }
        if (role === 'approved' && status.hero_enabled === false) {
          showDisableReasonDialog(status.disable_reason);
          return;
        }
        showToast('请先成为认证英雄');
        return;
      }

      const publishBtn = e.target.closest('#profile-publish-entry');
      if (publishBtn) {
        e.preventDefault();
        showPublishSheet();
        return;
      }

      const btn = e.target.closest('#profile-apply-hero');
      if (!btn) return;
      e.preventDefault();
      if (isGuestPreview()) {
        showToast('请先授权登录');
        return;
      }

      const status = await getApplyStatus();
      const role = status.status;
      if (role === 'approved' && status.hero_enabled === false) {
        showDisableReasonDialog(status.disable_reason);
        return;
      }
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

  function serviceBlock() {
    return `<div class="profile-section">
      <div class="profile-section__card">
      <div class="profile-section__title profile-section__title--in-card">我的服务</div>
      <button type="button" class="profile-menu__item" data-profile-placeholder="购物车">
        <span class="profile-menu__icon"><img class="icon icon--md" src="../assets/icons/shopping.png" alt=""></span>
        <span class="profile-menu__body"><span class="profile-menu__title">购物车</span></span>
        <span class="profile-menu__arrow">›</span>
      </button>
      <button type="button" class="profile-menu__item" data-profile-placeholder="收货地址">
        <span class="profile-menu__icon"><img class="icon icon--md" src="../assets/icons/location.png" alt=""></span>
        <span class="profile-menu__body"><span class="profile-menu__title">收货地址</span></span>
        <span class="profile-menu__arrow">›</span>
      </button>
      <button type="button" class="profile-menu__item" data-profile-placeholder="在线客服">
        <span class="profile-menu__icon"><img class="icon icon--md" src="../assets/icons/chat.png" alt=""></span>
        <span class="profile-menu__body"><span class="profile-menu__title">在线客服</span></span>
        <span class="profile-menu__arrow">›</span>
      </button>
      <button type="button" class="profile-menu__item" data-profile-placeholder="账号设置">
        <span class="profile-menu__icon"><img class="icon icon--md" src="../assets/icons/user.png" alt=""></span>
        <span class="profile-menu__body"><span class="profile-menu__title">账号设置</span></span>
        <span class="profile-menu__arrow">›</span>
      </button>
      </div>
    </div>`;
  }

  let placeholderBound = false;

  function bindPlaceholders() {
    if (placeholderBound) return;
    placeholderBound = true;
    root.addEventListener('click', (e) => {
      const msg = e.target.closest('#profile-messages');
      if (msg) {
        e.preventDefault();
        if (isGuestPreview()) {
          showToast('请先授权登录');
          return;
        }
        showToast('功能开发中');
        return;
      }
      const soon = e.target.closest('[data-profile-soon]');
      if (soon) {
        e.preventDefault();
        if (isGuestPreview()) {
          showToast('请先授权登录');
          return;
        }
        showToast('即将开放');
        return;
      }
      const btn = e.target.closest('[data-profile-placeholder]');
      if (!btn) return;
      e.preventDefault();
      if (isGuestPreview()) {
        showToast('请先授权登录');
        return;
      }
      showToast('功能开发中');
    });
  }

  async function render() {
    const state = await resolveDisplayRole();
    const showVip = !!state.hero;
    const showCta = !state.heroActive;
    const showHeroModules = !state.disabled;
    root.innerHTML = `
      <div class="profile-page">
      ${userBlock(state)}
      ${showVip ? vipBlock() : ''}
      ${showCta ? uncertCta(state) : ''}
      ${assetsBlock()}
      ${ordersBlock()}
      ${showHeroModules ? heroBlock(state) : ''}
      ${serviceBlock()}
      </div>`;
    bindApplyHero();
    bindPlaceholders();
    if (state.guest) {
      root.querySelector('#profile-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('请先授权登录');
      });
    }
  }

  window.addEventListener('preview:navigate', () => {
    render();
  });

  window.addEventListener('storage', (e) => {
    if (
      e.key === 'hero_plaza_applications_updated' ||
      e.key === 'hero_plaza_heroes_updated' ||
      e.key === 'hero_plaza_profile_changes_updated'
    ) {
      render();
    }
  });

  window.addEventListener('hero_plaza_applications_updated', () => {
    render();
  });

  window.addEventListener('hero_plaza_profile_changes_updated', () => {
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
