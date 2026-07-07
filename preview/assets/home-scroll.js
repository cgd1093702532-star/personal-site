/** 首页横向滚动 · 预览端触摸/拖拽滑动 */
(function () {
  document.querySelectorAll('.home-scroll-x').forEach((scroller) => {
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;
    let pointerId = null;

    scroller.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('a[href], button, [data-href]')) return;
      dragging = true;
      moved = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = scroller.scrollLeft;
      scroller.setPointerCapture(pointerId);
      scroller.classList.add('home-scroll-x--dragging');
    });

    scroller.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      scroller.scrollLeft = startScroll - dx;
    });

    const endDrag = (e) => {
      if (!dragging || (e.pointerId != null && e.pointerId !== pointerId)) return;
      dragging = false;
      scroller.classList.remove('home-scroll-x--dragging');
      try {
        scroller.releasePointerCapture(pointerId);
      } catch (err) {
        /* ignore */
      }
      pointerId = null;
    };

    scroller.addEventListener('pointerup', endDrag);
    scroller.addEventListener('pointercancel', endDrag);

    scroller.addEventListener(
      'click',
      (e) => {
        if (!moved) return;
        e.preventDefault();
        e.stopPropagation();
      },
      true,
    );
  });
})();
