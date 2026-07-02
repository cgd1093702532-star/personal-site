/**
 * 个人站交互脚本
 * - 移动端导航
 * - 案例 Tab 筛选
 * - 返回顶部
 */

const navToggle = document.querySelector('.site-header__toggle');
const mobileNav = document.querySelector('.site-header__mobile-nav');
const tabButtons = document.querySelectorAll('.tabs__btn');
const caseCards = document.querySelectorAll('.case-card');
const backToTop = document.querySelector('.back-to-top');

/* 移动端导航 */
if (navToggle && mobileNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* 案例 Tab 筛选 */
if (tabButtons.length && caseCards.length) {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      tabButtons.forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });

      caseCards.forEach((card) => {
        const category = card.dataset.category;
        const show = filter === 'all' || category === filter;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });
}

/* 返回顶部 */
if (backToTop) {
  const toggleBackToTop = () => {
    const visible = window.scrollY > window.innerHeight;
    backToTop.classList.toggle('is-visible', visible);
  };

  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* 滚动时关闭移动菜单 */
window.addEventListener('scroll', () => {
  if (mobileNav?.classList.contains('is-open')) {
    mobileNav.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
  }
}, { passive: true });
