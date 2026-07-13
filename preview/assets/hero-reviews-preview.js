/** 我的评分 · 预览页 */
(function () {
  const root = document.getElementById('hero-reviews-root');
  if (!root) return;

  const imgBase = '../assets/images/';
  const DEFAULT_HERO_RATINGS = [
    {
      id: 'hr1',
      reviewer_nickname: '学员A',
      reviewer_avatar: `${imgBase}avatar-user.jpg`,
      score: 5,
      content: '讲解清晰，体验很好！',
      reviewed_at: '2026-06-08T11:00:00',
    },
    {
      id: 'hr2',
      reviewer_nickname: '学员B',
      reviewer_avatar: `${imgBase}avatar-user.jpg`,
      score: 5,
      content: '非常专业，推荐。',
      reviewed_at: '2026-06-01T09:30:00',
    },
    {
      id: 'hr3',
      reviewer_nickname: '学员C',
      reviewer_avatar: `${imgBase}avatar-user.jpg`,
      score: 4,
      content: '活动组织有序，期待下次。',
      reviewed_at: '2026-05-20T16:00:00',
    },
  ];

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

  async function loadList() {
    let source = null;
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        const params = new URLSearchParams(window.location.search);
        const heroId = params.get('id') || params.get('hero_id') || '1';
        source = (await window.HeroPlazaDB.listReviews({ hero_id: heroId })) || [];
      } catch (err) {
        console.warn('[hero-reviews] 数据库加载失败，回退静态数据', err);
      }
    }
    if (!source || !source.length) source = DEFAULT_HERO_RATINGS;
    const sorted = window.sortReviewsByTimeDesc ? window.sortReviewsByTimeDesc(source) : source;
    return sorted.map((item) => ({
      ...item,
      reviewer_nickname: item.reviewer_nickname || item.user || '匿名用户',
      reviewer_avatar: item.reviewer_avatar || `${imgBase}avatar-user.jpg`,
      score: Number(item.score) || 0,
      timeDisplay: item.timeDisplay || formatReviewTime(item.reviewed_at || item.time),
    }));
  }

  function card(item) {
    const avatar = item.reviewer_avatar
      ? `<img class="my-review__avatar" src="${item.reviewer_avatar}" alt="">`
      : `<span class="my-review__avatar my-review__avatar--placeholder"></span>`;
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
      time +
      `</article>`
    );
  }

  async function render() {
    const list = await loadList();
    root.innerHTML =
      `<div class="my-review">` +
      `<div class="my-review__list">` +
      (list.length ? list.map(card).join('') : `<div class="my-review__empty">暂无评分</div>`) +
      `</div>` +
      `</div>`;
  }

  render();
  window.addEventListener('preview:navigate', () => {
    render();
  });
})();
