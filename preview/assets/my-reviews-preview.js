/** 我的评价 · 预览页 */
(function () {
  const imgBase = '../assets/images/';
  const DEFAULT_MY_REVIEWS = [
    {
      id: 'rv1',
      reviewer_nickname: '学员小李',
      reviewer_avatar: `${imgBase}avatar-user.jpg`,
      score: 5,
      content: '组织很好，体验棒！',
      reviewed_at: '2026-06-15T14:30:00',
    },
    {
      id: 'rv2',
      reviewer_nickname: '航海爱好者',
      reviewer_avatar: `${imgBase}avatar-user.jpg`,
      score: 4.5,
      content: '教练很专业，场地设施也不错。',
      reviewed_at: '2026-06-08T10:00:00',
    },
    {
      id: 'rv3',
      reviewer_nickname: '张女士',
      reviewer_avatar: `${imgBase}avatar-user.jpg`,
      score: 5,
      content: '孩子很喜欢，下次还来。',
      reviewed_at: '2026-05-28T16:20:00',
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
        source = (await window.HeroPlazaDB.getAppState('my_reviews')) || [];
      } catch (err) {
        console.warn('[my-reviews] 数据库加载失败，回退静态数据', err);
      }
    }
    if (!source || !source.length) source = DEFAULT_MY_REVIEWS;
    const sorted = window.sortReviewsByTimeDesc ? window.sortReviewsByTimeDesc(source) : source;
    return sorted.map((item) => ({
      ...item,
      reviewer_nickname: item.reviewer_nickname || '匿名用户',
      reviewer_avatar: item.reviewer_avatar || `${imgBase}avatar-user.jpg`,
      score: Number(item.score) || 0,
      timeDisplay: item.timeDisplay || formatReviewTime(item.reviewed_at || item.time),
    }));
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
