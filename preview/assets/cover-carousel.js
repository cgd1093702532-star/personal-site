/** 封面轮播 · 全局每 2 秒自动切换 */
(function () {
  const INTERVAL_MS = 2000;

  function initCoverCarousel(root) {
    if (root._carouselTimer) {
      clearInterval(root._carouselTimer);
      root._carouselTimer = null;
    }

    const viewport = root.querySelector('.cover-carousel__viewport');
    const dots = [...root.querySelectorAll('.cover-carousel__dot')];
    const slides = [...root.querySelectorAll('.cover-carousel__slide')];
    const slideCount = Math.max(dots.length, slides.length);
    if (!viewport || slideCount <= 1) return;

    let current = 0;

    function setActive(index) {
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    }

    function goTo(index) {
      current = index;
      const width = viewport.clientWidth || 1;
      viewport.scrollTo({ left: width * index, behavior: 'smooth' });
      setActive(index);
    }

    viewport.addEventListener(
      'scroll',
      () => {
        const width = viewport.clientWidth || 1;
        current = Math.round(viewport.scrollLeft / width);
        setActive(Math.max(0, Math.min(current, slideCount - 1)));
      },
      { passive: true },
    );

    function startAutoplay() {
      root._carouselTimer = setInterval(() => {
        goTo((current + 1) % slideCount);
      }, INTERVAL_MS);
    }

    function stopAutoplay() {
      if (root._carouselTimer) {
        clearInterval(root._carouselTimer);
        root._carouselTimer = null;
      }
    }

    viewport.addEventListener('touchstart', stopAutoplay, { passive: true });
    viewport.addEventListener('touchend', () => setTimeout(startAutoplay, 3000), { passive: true });
    startAutoplay();
  }

  function initAllCarousels() {
    document.querySelectorAll('[data-cover-carousel]').forEach(initCoverCarousel);
  }

  window.initCoverCarousel = initCoverCarousel;
  initAllCarousels();
  window.addEventListener('preview:navigate', initAllCarousels);
})();
