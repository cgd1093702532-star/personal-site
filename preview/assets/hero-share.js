/** 英雄详情 · 分享海报 / 小程序卡片（预览模拟） */
(function () {
  let heroRef = null;
  let heroIdRef = '1';
  let els = {};

  function ensureDom() {
    if (els.root && els.root.isConnected) return;
    els = {};
    const mount = document.querySelector('.device__frame') || document.body;
    const root = document.createElement('div');
    root.id = 'hero-share-root';
    root.innerHTML = `
      <div class="share-sheet mobile-overlay" hidden>
        <div class="share-sheet__mask"></div>
        <div class="share-sheet__panel">
          <div class="share-sheet__options">
            <button type="button" class="share-sheet__option" data-action="card">
              <span class="share-sheet__label">分享好友</span>
            </button>
            <button type="button" class="share-sheet__option" data-action="poster">
              <span class="share-sheet__label">海报</span>
            </button>
          </div>
          <button type="button" class="share-sheet__cancel">取消</button>
        </div>
      </div>
      <div class="poster-modal mobile-overlay" hidden>
        <div class="poster-modal__mask"></div>
        <div class="poster-modal__body">
          <div class="poster-card" id="poster-card"></div>
          <div class="poster-modal__actions">
            <button type="button" class="poster-modal__btn" data-action="share-img">
              <span class="poster-modal__action-icon poster-modal__action-icon--share"><img src="../assets/icons/chat.png" alt=""></span>
              <span>分享给好友</span>
            </button>
            <button type="button" class="poster-modal__btn" data-action="save">
              <span class="poster-modal__action-icon poster-modal__action-icon--save"><img src="../assets/icons/image.png" alt=""></span>
              <span>保存海报</span>
            </button>
          </div>
        </div>
      </div>`;
    mount.appendChild(root);
    els.root = root;
    els.sheet = root.querySelector('.share-sheet');
    els.posterModal = root.querySelector('.poster-modal');
    els.posterCard = root.querySelector('#poster-card');

    root.querySelector('.share-sheet__mask').addEventListener('click', closeSheet);
    root.querySelector('.share-sheet__cancel').addEventListener('click', closeSheet);
    root.querySelector('[data-action="poster"]').addEventListener('click', openPoster);
    root.querySelector('[data-action="card"]').addEventListener('click', shareCard);
    root.querySelector('.poster-modal__mask').addEventListener('click', closePoster);
    root.querySelector('[data-action="save"]').addEventListener('click', savePoster);
    root.querySelector('[data-action="share-img"]').addEventListener('click', sharePosterImage);
  }

  function setOverlay(on) {
    document.querySelector('.mobile-shell')?.classList.toggle('mobile-shell--overlay', on);
  }

  function openSheet(hero, heroId) {
    ensureDom();
    heroRef = hero;
    heroIdRef = heroId || '1';
    els.sheet.hidden = false;
    setOverlay(true);
  }

  function closeSheet() {
    if (!els.sheet) return;
    els.sheet.hidden = true;
    if (els.posterModal.hidden) setOverlay(false);
  }

  function closePoster() {
    els.posterModal.hidden = true;
    setOverlay(false);
  }

  function buildPosterHtml(hero) {
    const escapeText = (value) =>
      String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const avatar = hero.avatar_img || hero.avatar || hero.cover || 'hero-1.jpg';
    const avatarSrc =
      /^https?:|^\/|^\.\./.test(avatar) ? avatar : `../assets/images/${avatar}`;
    const name = escapeText(hero.name || hero.nickname || hero.title || '英雄广场');
    const bio = escapeText(
      hero.about_me || hero.bio || hero.desc || '欢迎扫码查看详情',
    );
    return `
      <div class="poster-card__photo"><img src="${escapeText(avatarSrc)}" alt="${name}"></div>
      <div class="poster-card__info">
        <div class="poster-card__copy">
          <div class="poster-card__name">${name}</div>
          <div class="poster-card__bio">${bio}</div>
        </div>
        <div class="poster-card__qr">
          <div class="poster-card__qr-code"><span>英</span></div>
          <div class="poster-card__hint">扫码/长按识别</div>
        </div>
      </div>`;
  }

  function openPoster() {
    closeSheet();
    els.posterCard.innerHTML = buildPosterHtml(heroRef);
    els.posterModal.hidden = false;
    setOverlay(true);
  }

  async function shareCard() {
    closeSheet();
    const hero = heroRef || {};
    const url =
      hero.shareUrl ||
      `${location.origin}${location.pathname}${location.search || `?id=${heroIdRef}`}`;
    const projects = (hero.project_types || []).join('/');
    const title =
      hero.shareTitle ||
      `${hero.name || hero.title || '英雄广场'}${projects ? ` · ${projects}教练` : ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: '来自英雄广场', url });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      alert(`小程序卡片链接已复制\n${title}`);
    } catch {
      prompt('复制以下链接分享小程序卡片', url);
    }
  }

  function savePoster() {
    alert('预览环境：海报已生成，正式小程序将保存到相册');
  }

  function sharePosterImage() {
    alert('预览环境：正式小程序将调起微信图片分享');
  }

  let triggersBound = false;

  function bindTriggers() {
    if (triggersBound) return;
    triggersBound = true;
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-hero-share]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      if (window.HeroShare && window.HeroShare._hero) {
        openSheet(window.HeroShare._hero, window.HeroShare._heroId);
      }
    });
  }

  window.HeroShare = {
    init(hero, heroId) {
      window.HeroShare._hero = hero;
      window.HeroShare._heroId = heroId;
      bindTriggers();
    },
    open: openSheet,
  };
})();
