/** 个人中心预览 · 切换未认证/已认证状态 + 发布选项弹层 */
(function () {
  const root = document.getElementById('profile-root');
  const toggle = document.getElementById('profile-dev-toggle');
  if (!root || !toggle) return;

  const OVERRIDE_KEY = 'profile-preview-override';
  const imgBase = '../assets/images/';
  let publishSheetBound = false;

  function showToast(msg, type) {
    if (window.PreviewToast) window.PreviewToast.show(msg, type || 'none', 2000);
    else window.alert(msg);
  }

  function getPreviewOverride() {
    return sessionStorage.getItem(OVERRIDE_KEY);
  }

  function setPreviewOverride(value) {
    if (value) sessionStorage.setItem(OVERRIDE_KEY, value);
    else sessionStorage.removeItem(OVERRIDE_KEY);
  }

  function getPublishSheet() {
    return document.getElementById('profile-publish-sheet');
  }

  async function getApiRole() {
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        const res = await window.HeroPlazaDB.getHeroApplyStatus();
        const status = res?.status || 'none';
        if (status && status !== 'none') return status;
      } catch (_) {
        /* fallback */
      }
    }
    if (window.HeroPlazaDB) {
      try {
        const role = await window.HeroPlazaDB.getAppState('mock_hero_role');
        if (role === 'pending' || role === 'approved' || role === 'rejected') return role;
      } catch (_) {
        /* ignore */
      }
    }
    return 'none';
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

  /** 预览展示：override 优先，否则跟 API */
  async function resolveDisplayRole() {
    const override = getPreviewOverride();
    const apiRole = await getApiRole();
    if (override === 'approved') {
      return { hero: true, pending: false, apiRole };
    }
    if (override === 'none') {
      return { hero: false, pending: apiRole === 'pending', apiRole };
    }
    return {
      hero: apiRole === 'approved',
      pending: apiRole === 'pending',
      apiRole,
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
                ? '<a class="profile-user__cert profile-user__cert--hero profile-user__cert--tap nav-forward" href="hero-apply-success.html"><span class="profile-user__cert-text">已认证英雄</span><span class="profile-user__cert-arrow" aria-hidden="true">›</span></a>'
                : '<span class="profile-user__cert profile-user__cert--none">未认证</span>'}
            </div>
          </div>
        </div>
        ${stats}
      </div>`;
  }

  function heroBlock() {
    return `<div class="profile-hero-center">
      <div class="profile-section__title">英雄中心</div>
      <div class="profile-hero-shortcuts">
      <div class="profile-hero-shortcuts__row">
      <button type="button" class="profile-hero-shortcuts__item" id="profile-open-publish"><span class="profile-hero-shortcuts__icon">📢</span><span class="profile-hero-shortcuts__label">发布招募/课程</span></button>
      <a class="profile-hero-shortcuts__item nav-forward" href="my-recruitments.html"><span class="profile-hero-shortcuts__icon">📋</span><span class="profile-hero-shortcuts__label">我的招募</span></a>
      <a class="profile-hero-shortcuts__item nav-forward" href="my-courses.html"><span class="profile-hero-shortcuts__icon">📚</span><span class="profile-hero-shortcuts__label">我的课程</span></a>
      </div>
      <div class="profile-hero-shortcuts__row profile-hero-shortcuts__row--secondary">
      <a class="profile-hero-shortcuts__item nav-forward" href="hero-profile.html"><span class="profile-hero-shortcuts__icon">👤</span><span class="profile-hero-shortcuts__label">英雄资料</span></a>
      </div>
    </div>
    </div>`;
  }

  function uncertCta(pending) {
    return `<div class="profile-hero-cta${pending ? ' profile-hero-cta--pending' : ''}">
      <p class="profile-hero-cta__hint">${pending ? '认证申请审核中，请耐心等待' : '成为英雄，发布赛事招募，开启您的水上教育事业'}</p>
      <button type="button" class="profile-hero-cta__btn" id="profile-apply-hero">${pending ? '查看审核进度' : '申请成为英雄'}</button>
    </div>`;
  }

  let applyHeroBound = false;

  function bindApplyHero() {
    if (applyHeroBound) return;
    applyHeroBound = true;
    root.addEventListener('click', async (e) => {
      const btn = e.target.closest('#profile-apply-hero');
      if (!btn) return;
      e.preventDefault();

      const role = await getApiRole();
      if (role === 'approved') {
        setPreviewOverride('approved');
        showToast('您已是认证英雄');
        render();
        return;
      }
      if (role === 'pending') {
        navigateApplyPage('pending');
        return;
      }
      if (role === 'rejected') {
        showToast('申请已驳回，可重新提交');
      }
      navigateApplyPage('none');
    });
  }

  function activityBlock(ongoing, done) {
    const signupDesc = `进行中 ${ongoing ?? 2}，已完成 ${done ?? 1}`;
    return `<div class="profile-section">
      <div class="profile-section__title">我的活动</div>
      <a class="profile-menu__item nav-forward" href="my-signups.html">
        <span class="profile-menu__icon">📋</span>
        <span class="profile-menu__body">
          <span class="profile-menu__title">我的报名</span>
          <span class="profile-menu__desc" id="profile-signup-desc">${signupDesc}</span>
        </span>
        <span class="profile-menu__arrow">›</span>
      </a>
      <a class="profile-menu__item nav-forward" href="my-reviews.html">
        <span class="profile-menu__icon">⭐</span>
        <span class="profile-menu__body">
          <span class="profile-menu__title">我的评价</span>
          <span class="profile-menu__desc" id="profile-review-desc">已评价 3</span>
        </span>
        <span class="profile-menu__arrow">›</span>
      </a>
    </div>`;
  }

  function openPublishSheet() {
    const publishSheet = getPublishSheet();
    if (!publishSheet) return;
    document.querySelector('.mobile-shell')?.classList.add('mobile-shell--overlay');
    publishSheet.hidden = false;
  }

  function closePublishSheet() {
    const publishSheet = getPublishSheet();
    if (!publishSheet) return;
    publishSheet.hidden = true;
    document.querySelector('.mobile-shell')?.classList.remove('mobile-shell--overlay');
  }

  function bindPublishSheet() {
    if (publishSheetBound) return;
    const publishSheet = getPublishSheet();
    if (!publishSheet) return;
    publishSheetBound = true;
    publishSheet.querySelector('.profile-action-sheet__mask').addEventListener('click', closePublishSheet);
    publishSheet.querySelector('[data-action="cancel"]').addEventListener('click', closePublishSheet);
    publishSheet.querySelectorAll('[data-href]').forEach((el) => {
      el.addEventListener('click', () => {
        closePublishSheet();
        if (window.PreviewNav) {
          window.PreviewNav.navigateTo(el.dataset.href, 'forward');
        } else {
          sessionStorage.setItem('page-transition', 'forward');
          window.location.href = el.dataset.href;
        }
      });
    });
  }

  async function loadSignupSummary() {
    const DEFAULT = [
      { recruit_id: 'r1' },
      { recruit_id: 'r2' },
      { recruit_id: 'r11', end_at: '2026-04-18T16:30:00' },
    ];
    let source = null;
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        source = (await window.HeroPlazaDB.getAppState('my_signups')) || [];
      } catch (_) {
        source = null;
      }
    }
    if (!source || !source.length) source = DEFAULT;
    const now = Date.now();
    let ongoing = 0;
    let done = 0;
    for (const item of source) {
      const rec = window.getRecruitmentById ? window.getRecruitmentById(item.recruit_id) : null;
      const endAt = item.end_at || (rec && rec.end_at);
      const endMs = endAt ? new Date(endAt).getTime() : null;
      if (endMs != null && !Number.isNaN(endMs) && endMs < now) done += 1;
      else ongoing += 1;
    }
    return { ongoing, done };
  }

  async function updateSignupDesc() {
    const el = document.getElementById('profile-signup-desc');
    if (!el) return;
    const summary = await loadSignupSummary();
    el.textContent = `进行中 ${summary.ongoing}，已完成 ${summary.done}`;
  }

  async function updateReviewDesc() {
    const el = document.getElementById('profile-review-desc');
    if (!el) return;
    let count = 3;
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        const list = (await window.HeroPlazaDB.getAppState('my_reviews')) || [];
        if (list.length) count = list.length;
      } catch (_) {
        /* keep default */
      }
    }
    el.textContent = `已评价 ${count}`;
  }

  async function render() {
    const { hero, pending } = await resolveDisplayRole();
    renderContent(hero, pending);
  }

  function renderContent(hero, pending) {
    root.innerHTML = `
      ${userBlock(hero)}
      ${hero ? heroBlock() : uncertCta(pending)}
      ${activityBlock()}`;
    toggle.textContent = hero ? '预览：切换为未认证状态' : '预览：切换为已认证状态';
    const openBtn = document.getElementById('profile-open-publish');
    if (openBtn) openBtn.addEventListener('click', openPublishSheet);
    bindApplyHero();
    updateSignupDesc();
    updateReviewDesc();
  }

  function renderInitial() {
    renderContent(false, false);
  }

  toggle.addEventListener('click', async () => {
    const { hero } = await resolveDisplayRole();
    setPreviewOverride(hero ? 'none' : 'approved');
    render();
  });

  window.addEventListener('preview:navigate', () => {
    render();
  });

  function init() {
    sessionStorage.removeItem(OVERRIDE_KEY);
    bindPublishSheet();
    renderInitial();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
