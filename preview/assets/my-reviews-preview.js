/** 我的评价 · 预览页 · 数据与后台评价列表同源，仅当前账号相关 */
(function () {
  const imgBase = '../assets/images/';
  const CURRENT_USER_ID = 'mock-user-1';

  function buildStars(score) {
    const rating = Number(score) || 0;
    return [1, 2, 3, 4, 5]
      .map((i) => {
        const filled = rating >= i;
        const half = rating >= i - 0.5 && rating < i;
        const cls = filled ? ' my-review__star--filled' : half ? ' my-review__star--half' : '';
        return `<span class="my-review__star${cls}">★</span>`;
      })
      .join('');
  }

  function formatReviewTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function avatarSrc(avatar) {
    if (!avatar) return '';
    if (
      avatar.startsWith('http') ||
      avatar.startsWith('data:') ||
      avatar.startsWith('../') ||
      avatar.startsWith('/')
    ) {
      return avatar;
    }
    return `${imgBase}${avatar}`;
  }

  function isAccountRelated(row, userId, heroId) {
    if (String(row.user_id || '') === String(userId)) return true;
    if (heroId && String(row.hero_id || '') === String(heroId)) return true;
    return false;
  }

  async function loadList() {
    if (!window.HeroPlazaDB || !(await window.HeroPlazaDB.isAvailable())) {
      return [];
    }
    try {
      const [adminRows, hero] = await Promise.all([
        window.HeroPlazaDB.listAdminReviews(),
        window.HeroPlazaDB.resolveCurrentHero(CURRENT_USER_ID),
      ]);
      const heroId = hero && hero.hero_id ? String(hero.hero_id) : '';
      const source = (adminRows || []).filter((row) => {
        const status = row.status || 'visible';
        if (status === 'deleted' || status === 'hidden') return false;
        return isAccountRelated(row, CURRENT_USER_ID, heroId);
      });
      const sorted = window.sortReviewsByTimeDesc ? window.sortReviewsByTimeDesc(source) : source;
      return sorted.map((item) => ({
        ...item,
        id: item.review_id || item.id,
        reviewer_nickname: item.reviewer_nickname || '匿名用户',
        reviewer_avatar: avatarSrc(item.reviewer_avatar),
        score: Number(item.score) || 0,
        timeDisplay: item.timeDisplay || formatReviewTime(item.reviewed_at || item.time),
      }));
    } catch (err) {
      console.warn('[my-reviews] 加载失败', err);
      return [];
    }
  }

  function card(item) {
    const avatar = item.reviewer_avatar
      ? `<img class="my-review__avatar" src="${item.reviewer_avatar}" alt="">`
      : `<span class="my-review__avatar my-review__avatar--placeholder"></span>`;
    const content = item.content ? `<p class="my-review__content">${item.content}</p>` : '';
    const time = item.timeDisplay ? `<span class="my-review__time">${item.timeDisplay}</span>` : '';
    return (
      `<article class="my-review__item">` +
      `<div class="my-review__head">` +
      avatar +
      `<div class="my-review__info">` +
      `<span class="my-review__name">${item.reviewer_nickname}</span>` +
      `<div class="my-review__rating">` +
      `<span class="my-review__stars">${buildStars(item.score)}</span>` +
      `<span class="my-review__score">${item.score}</span>` +
      `</div>` +
      `</div>` +
      `</div>` +
      content +
      time +
      `</article>`
    );
  }

  async function render() {
    const root = document.getElementById('my-reviews-root');
    if (!root) return;
    const list = await loadList();
    root.innerHTML =
      `<div class="my-review">` +
      `<div class="my-review__list">` +
      (list.length ? list.map(card).join('') : `<div class="my-review__empty">暂无评价</div>`) +
      `</div>` +
      `</div>`;
  }

  render();
  window.addEventListener('preview:navigate', () => {
    render();
  });

  window.initMyReviewsPreview = render;
})();
