/** 预览页 · 大图查看器：计数、双指缩放、保存、分享 */
(function () {
  let state = {
    urls: [],
    index: 0,
    scale: 1,
    lastScale: 1,
    startDist: 0,
    translateX: 0,
    translateY: 0,
    lastX: 0,
    lastY: 0,
    dragging: false,
    pinching: false,
  };

  let els = {};

  function ensureDom() {
    if (els.root && els.root.isConnected) return;
    els = {};
    const mount = document.querySelector('.device__frame') || document.body;
    const root = document.createElement('div');
    root.id = 'image-viewer';
    root.className = 'image-viewer';
    root.innerHTML = `
      <div class="image-viewer__mask"></div>
      <div class="image-viewer__panel">
        <div class="image-viewer__top">
          <span class="image-viewer__index">1 / 1</span>
          <button type="button" class="image-viewer__close" aria-label="关闭">×</button>
        </div>
        <div class="image-viewer__stage">
          <button type="button" class="image-viewer__nav image-viewer__nav--prev" aria-label="上一张">‹</button>
          <div class="image-viewer__viewport">
            <img class="image-viewer__img" alt="预览图" draggable="false" />
          </div>
          <button type="button" class="image-viewer__nav image-viewer__nav--next" aria-label="下一张">›</button>
        </div>
        <div class="image-viewer__actions">
          <button type="button" class="image-viewer__btn" data-action="save"><span class="image-viewer__btn-icon">↓</span><span>保存</span></button>
          <button type="button" class="image-viewer__btn" data-action="share"><span class="image-viewer__btn-icon">↗</span><span>分享</span></button>
        </div>
      </div>`;
    mount.appendChild(root);
    els.root = root;
    els.index = root.querySelector('.image-viewer__index');
    els.img = root.querySelector('.image-viewer__img');
    els.viewport = root.querySelector('.image-viewer__viewport');
    els.prev = root.querySelector('.image-viewer__nav--prev');
    els.next = root.querySelector('.image-viewer__nav--next');

    root.querySelector('.image-viewer__close').addEventListener('click', close);
    root.querySelector('.image-viewer__mask').addEventListener('click', close);
    els.prev.addEventListener('click', () => step(-1));
    els.next.addEventListener('click', () => step(1));
    root.querySelector('[data-action="save"]').addEventListener('click', onSave);
    root.querySelector('[data-action="share"]').addEventListener('click', onShare);

    els.viewport.addEventListener('wheel', onWheel, { passive: false });
    els.img.addEventListener('dblclick', onDblClick);

    els.viewport.addEventListener('touchstart', onTouchStart, { passive: false });
    els.viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    els.viewport.addEventListener('touchend', onTouchEnd);

    let mouseDown = false;
    els.viewport.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      mouseDown = true;
      state.dragging = true;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
    });
    window.addEventListener('mousemove', (e) => {
      if (!mouseDown || !state.dragging) return;
      state.translateX += e.clientX - state.lastX;
      state.translateY += e.clientY - state.lastY;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      applyTransform();
    });
    window.addEventListener('mouseup', () => {
      mouseDown = false;
      state.dragging = false;
    });
  }

  function resetTransform() {
    state.scale = 1;
    state.lastScale = 1;
    state.translateX = 0;
    state.translateY = 0;
    applyTransform();
  }

  function applyTransform() {
    els.img.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
  }

  function updateView() {
    const url = state.urls[state.index];
    els.img.src = url;
    els.index.textContent = `${state.index + 1} / ${state.urls.length}`;
    els.prev.style.display = state.urls.length > 1 ? '' : 'none';
    els.next.style.display = state.urls.length > 1 ? '' : 'none';
    resetTransform();
  }

  function step(delta) {
    if (state.urls.length <= 1) return;
    state.index = (state.index + delta + state.urls.length) % state.urls.length;
    updateView();
  }

  function dist(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  }

  function onTouchStart(e) {
    if (e.touches.length === 2) {
      state.pinching = true;
      state.startDist = dist(e.touches[0], e.touches[1]);
      state.lastScale = state.scale;
      e.preventDefault();
      return;
    }
    if (e.touches.length === 1 && state.scale > 1) {
      state.dragging = true;
      state.lastX = e.touches[0].clientX;
      state.lastY = e.touches[0].clientY;
    }
  }

  function onTouchMove(e) {
    if (state.pinching && e.touches.length === 2) {
      const d = dist(e.touches[0], e.touches[1]);
      state.scale = Math.min(4, Math.max(1, state.lastScale * (d / state.startDist)));
      applyTransform();
      e.preventDefault();
      return;
    }
    if (state.dragging && e.touches.length === 1) {
      state.translateX += e.touches[0].clientX - state.lastX;
      state.translateY += e.touches[0].clientY - state.lastY;
      state.lastX = e.touches[0].clientX;
      state.lastY = e.touches[0].clientY;
      applyTransform();
      e.preventDefault();
    }
  }

  function onTouchEnd() {
    state.pinching = false;
    state.dragging = false;
    if (state.scale < 1) resetTransform();
  }

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.12 : 0.12;
    state.scale = Math.min(4, Math.max(1, state.scale + delta));
    applyTransform();
  }

  function onDblClick() {
    state.scale = state.scale > 1 ? 1 : 2;
    if (state.scale === 1) {
      state.translateX = 0;
      state.translateY = 0;
    }
    applyTransform();
  }

  function onSave() {
    const url = state.urls[state.index];
    const a = document.createElement('a');
    a.href = url;
    a.download = `hero-image-${state.index + 1}.jpg`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function onShare() {
    const url = state.urls[state.index];
    if (navigator.share) {
      try {
        await navigator.share({ title: '精彩瞬间', url });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('图片链接已复制，可粘贴分享');
    } catch {
      prompt('复制以下链接分享', url);
    }
  }

  function open(urls, startUrl) {
    ensureDom();
    state.urls = urls;
    state.index = Math.max(0, urls.indexOf(startUrl));
    updateView();
    els.root.classList.add('image-viewer--visible');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!els.root) return;
    els.root.classList.remove('image-viewer--visible');
    document.body.style.overflow = '';
    resetTransform();
  }

  window.ImageViewer = { open, close };

  document.addEventListener('keydown', (e) => {
    if (!els.root || !els.root.classList.contains('image-viewer--visible')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
})();
