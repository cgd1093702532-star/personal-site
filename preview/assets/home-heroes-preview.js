/** 首页英雄横滑 · 与后台「英雄管理」同源（/api/heroes） */
(function () {
  const track = document.getElementById('home-hero-track');
  if (!track || !window.HeroPlazaDB) return;

  const imgBase = '../assets/images/';

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function avatarSrc(hero) {
    const img = hero.avatar_img || hero.avatar || 'hero-1.jpg';
    if (String(img).startsWith('http') || String(img).startsWith('../') || String(img).startsWith('/')) {
      return img;
    }
    return `${imgBase}${img}`;
  }

  function honorHtml(hero) {
    let titles = hero.honor_titles || [];
    if (!titles.length) {
      const cert = hero.certification || hero.certification_level || '';
      if (cert) titles = [cert];
    }
    if (!titles.length) {
      const years = hero.years_exp != null && hero.years_exp !== '' ? String(hero.years_exp).trim() : '';
      if (years) {
        titles = [/年/.test(years) ? `${years}执教经验` : `${years}年执教经验`];
      }
    }
    if (!titles.length) return '';
    return titles
      .slice(0, 2)
      .map(
        (t, i) =>
          `<span class="hero-card__honor hero-card__honor--${i === 0 ? 'primary' : 'secondary'}">${
            i === 0
              ? '<span class="hero-card__honor-icon"><img class="hero-card__honor-icon-img" src="../assets/icons/crown.png" alt=""></span>'
              : ''
          }<span class="hero-card__honor-text">${escapeHtml(t)}</span></span>`,
      )
      .join('');
  }

  function typeTags(hero) {
    return (hero.project_types || [])
      .slice(0, 3)
      .map((t) => `<span class="tag tag--skill">${escapeHtml(t)}</span>`)
      .join('');
  }

  function cardHtml(hero) {
    const id = hero.hero_id || hero.id;
    const name = hero.name || '英雄';
    return (
      `<div class="hero-card" data-hero-id="${escapeHtml(id)}">` +
      `<a class="hero-card__head nav-forward" href="hero-detail.html?id=${escapeHtml(id)}">` +
      `<div class="hero-card__avatar"><img src="${avatarSrc(hero)}" alt="${escapeHtml(name)}"></div>` +
      `<div class="hero-card__meta"><div class="hero-card__name-row"><span class="hero-card__name">${escapeHtml(name)}</span>${typeTags(hero)}</div>` +
      `<div class="hero-card__honors">${honorHtml(hero)}</div></div></a></div>`
    );
  }

  async function load() {
    if (!(await window.HeroPlazaDB.isAvailable())) return;
    try {
      const heroes = await window.HeroPlazaDB.listHeroes();
      if (!heroes.length) {
        track.innerHTML = '<p style="padding:12px 16px;color:#999;font-size:13px">暂无认证教练</p>';
        return;
      }
      track.innerHTML = heroes.slice(0, 8).map(cardHtml).join('');
    } catch (err) {
      console.warn('[home-heroes] 加载失败', err);
    }
  }

  load();
  window.addEventListener('focus', load);
  window.addEventListener('storage', (e) => {
    if (e.key === 'hero_plaza_heroes_updated') load();
  });
})();
