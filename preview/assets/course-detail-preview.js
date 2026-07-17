/** 课程详情 · 预览端（布局对齐招募详情） */
(function () {
  const root = document.getElementById('course-detail-root');
  if (!root) return;

  const imgBase = '../assets/images/';
  const DEFAULT_TAGS = ['零基础友好', '含装备', '小班教学'];

  const fallback = {
    course_id: 'c1',
    title: 'ASA101-103培训课',
    price: 1280,
    total: 16,
    signed: 10,
    time: '7月26日 09:00 - 16:30',
    location: '滴水湖二号码头',
    hero_id: '1',
    hero_name: '小哥',
    remark: '',
    tags: DEFAULT_TAGS,
    banner_images: ['course.jpg'],
    description: 'ASA 101+103 组合课程，适合零基础学员，含理论讲解、岸上模拟与水上实操。',
  };

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatFeeDisplay(fee) {
    const n = Number(fee);
    if (!Number.isFinite(n)) {
      return `<span class="recruit-detail-preview__price-symbol">¥</span><span class="recruit-detail-preview__price-num">${fee ?? ''}</span>`;
    }
    const [intPart, decPart] = n.toFixed(2).split('.');
    return (
      `<span class="recruit-detail-preview__price-symbol">¥</span>` +
      `<span class="recruit-detail-preview__price-num">${intPart}</span>` +
      `<span class="recruit-detail-preview__price-dec">.${decPart}</span>`
    );
  }

  function renderSummaryTags(tags) {
    const list = (Array.isArray(tags) && tags.length ? tags : DEFAULT_TAGS)
      .map((t) => String(t || '').trim())
      .filter(Boolean)
      .slice(0, 3);
    if (!list.length) return '';
    return (
      `<div class="recruit-detail-preview__tags">` +
      list.map((t) => `<span class="recruit-detail-preview__tag">${escapeHtml(t)}</span>`).join('') +
      `</div>`
    );
  }

  function bannerSrc(img) {
    if (!img) return `${imgBase}course.jpg`;
    if (String(img).startsWith('http') || String(img).startsWith('../') || String(img).startsWith('/')) {
      return String(img).replace(/^\/assets\//, '../assets/');
    }
    return `${imgBase}${img}`;
  }

  function normalizeItem(raw) {
    if (!raw) return null;
    const banners = raw.banner_images || raw.cover_images || [];
    const imgs = (banners.length ? banners : [raw.cover_image || 'course.jpg']).map((img) => {
      const s = String(img || '');
      if (s.includes('/')) {
        const name = s.split('/').pop() || 'course.jpg';
        return name.replace(/\.jpg$/i, '') + (name.includes('.') ? '' : '.jpg');
      }
      return s.endsWith('.jpg') || s.endsWith('.png') ? s : `${s}.jpg`;
    });
    return {
      ...fallback,
      ...raw,
      course_id: raw.course_id || raw.id || 'c1',
      price: raw.price != null ? raw.price : raw.fee,
      banner_images: imgs.map((img) => String(img).replace(/^.*\//, '')),
      tags: Array.isArray(raw.tags) && raw.tags.length ? raw.tags : DEFAULT_TAGS,
      remark: raw.remark || '',
    };
  }

  async function loadCourse(id) {
    if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
      try {
        if (typeof window.HeroPlazaDB.getCourse === 'function') {
          const row = await window.HeroPlazaDB.getCourse(id);
          if (row) return normalizeItem(row);
        }
      } catch (_) {
        /* fall through */
      }
    }
    if (window.getCourseById) {
      const row = window.getCourseById(id);
      if (row) return normalizeItem(row);
    }
    if (id === 'c1' || !id) return normalizeItem(fallback);
    return null;
  }

  function showToast(msg, type) {
    if (window.PreviewToast) window.PreviewToast.show(msg, type || 'info');
    else window.alert(msg);
  }

  async function init() {
    const id = new URLSearchParams(location.search).get('id') || 'c1';
    const item = await loadCourse(id);
    if (!item) {
      root.innerHTML =
        '<div class="heroes-empty-state" style="display:flex;padding:40px 16px"><div>课程不存在</div></div>';
      return;
    }

    const titleEl = document.getElementById('navbar-course-title');
    if (titleEl) titleEl.textContent = item.title;
    document.title = `${item.title} · 英雄广场`;

    const imgs = item.banner_images || ['course.jpg'];
    const coverHtml =
      imgs.length > 1
        ? `<div class="cover-carousel cover-carousel--immersive" data-cover-carousel>` +
          `<div class="cover-carousel__viewport"><div class="cover-carousel__track">` +
          imgs
            .map(
              (img) =>
                `<div class="cover-carousel__slide"><img src="${bannerSrc(img)}" alt="课程封面"></div>`,
            )
            .join('') +
          `</div></div>` +
          `<div class="cover-carousel__dots">` +
          imgs
            .map((_, i) => `<span class="cover-carousel__dot${i === 0 ? ' is-active' : ''}"></span>`)
            .join('') +
          `</div></div>`
        : `<div class="cover-carousel cover-carousel--immersive cover-carousel--single">` +
          `<img class="cover-carousel__single-img" src="${bannerSrc(imgs[0])}" alt="课程封面">` +
          `</div>`;

    root.innerHTML =
      `<div class="recruit-detail-preview recruit-detail-preview--immersive">` +
      coverHtml +
      `<div class="recruit-detail-preview__body">` +
      `<div class="recruit-detail-preview__card recruit-detail-preview__card--summary">` +
      `<span class="tag tag--course">课程</span>` +
      `<h2 class="recruit-detail-preview__title">${escapeHtml(item.title)}</h2>` +
      renderSummaryTags(item.tags) +
      `<div class="recruit-detail-preview__price-row">` +
      `<div class="recruit-detail-preview__price">${formatFeeDisplay(item.price)}</div>` +
      `<button type="button" class="recruit-detail-preview__share" data-share aria-label="分享">` +
      `<img src="../assets/icons/share.svg" alt="" width="20" height="20">` +
      `</button>` +
      `</div></div>` +
      `<button type="button" class="recruit-detail-preview__vip" data-vip>` +
      `<span class="recruit-detail-preview__vip-left">` +
      `<img class="recruit-detail-preview__vip-icon" src="../assets/icons/vip-v.svg" alt="" width="22" height="22">` +
      `<span class="recruit-detail-preview__vip-text">VIP会员卡 · 可享5大权益</span>` +
      `</span>` +
      `<span class="recruit-detail-preview__vip-cta">立即尊享 <span aria-hidden="true">›</span></span>` +
      `</button>` +
      `<div class="recruit-detail-preview__card recruit-detail-preview__meta-card">` +
      `<div class="recruit-detail-preview__meta-row">` +
      `<img class="recruit-detail-preview__meta-icon" src="../assets/icons/time.png" alt="">` +
      `<span class="recruit-detail-preview__meta-text">${escapeHtml(item.time || '')}</span>` +
      `</div>` +
      `<button type="button" class="recruit-detail-preview__meta-row recruit-detail-preview__meta-row--loc" data-meta-location>` +
      `<img class="recruit-detail-preview__meta-icon" src="../assets/icons/location.png" alt="">` +
      `<span class="recruit-detail-preview__meta-text">${escapeHtml(item.location || '')}</span>` +
      `<span class="recruit-detail-preview__meta-arrow" aria-hidden="true">›</span>` +
      `</button>` +
      `<button type="button" class="recruit-detail-preview__meta-row" data-organizer>` +
      `<img class="recruit-detail-preview__meta-icon" src="../assets/icons/landmark.svg" alt="">` +
      `<span class="recruit-detail-preview__meta-text">${escapeHtml(item.hero_name || '')}主办</span>` +
      `</button>` +
      `<div class="recruit-detail-preview__field">` +
      `<span class="recruit-detail-preview__field-label">备注</span>` +
      `<span class="recruit-detail-preview__field-value">${escapeHtml(item.remark || '—')}</span>` +
      `</div>` +
      `</div>` +
      `<div class="recruit-detail-preview__card recruit-detail-preview__card--detail">` +
      `<div class="recruit-detail-preview__label">课程详情</div>` +
      `<p class="recruit-detail-preview__desc">${escapeHtml(item.description || '')}</p>` +
      `</div></div>` +
      `<div class="recruit-detail-preview__footer">` +
      `<div class="recruit-detail-preview__footer-nav">` +
      `<a class="recruit-detail-preview__footer-link" href="index.html">` +
      `<img class="recruit-detail-preview__footer-icon" src="../assets/icons/tab-home.png" alt="" width="22" height="22">` +
      `<span>首页</span></a>` +
      `<button type="button" class="recruit-detail-preview__footer-link" data-footer-cs>` +
      `<img class="recruit-detail-preview__footer-icon" src="../assets/icons/customer-service.svg" alt="" width="22" height="22">` +
      `<span>客服</span></button>` +
      `</div>` +
      `<button type="button" class="recruit-detail-preview__btn" id="course-signup-btn">立即报名</button>` +
      `</div></div>`;

    const shell = document.querySelector('.mobile-shell');
    const footer = root.querySelector('.recruit-detail-preview__footer');
    if (shell && footer) shell.appendChild(footer);

    const carousel = root.querySelector('[data-cover-carousel]');
    if (carousel && window.initCoverCarousel) window.initCoverCarousel(carousel);

    footer?.querySelector('[data-footer-cs]')?.addEventListener('click', () => {
      showToast('功能开发中', 'info');
    });

    root.querySelector('[data-meta-location]')?.addEventListener('click', () => {
      showToast('地图功能开发中', 'info');
    });

    root.querySelector('[data-organizer]')?.addEventListener('click', () => {
      const hid = item.hero_id || '1';
      if (window.PreviewNav?.navigateTo) window.PreviewNav.navigateTo(`hero-detail.html?id=${hid}`, 'forward');
      else window.location.href = `hero-detail.html?id=${hid}`;
    });

    root.querySelector('[data-share]')?.addEventListener('click', () => {
      const cover = (item.banner_images && item.banner_images[0]) || 'course.jpg';
      const coverSrc = bannerSrc(cover);
      const desc =
        (item.description || '').trim() ||
        ['课程', item.location, item.time].filter(Boolean).join(' · ') ||
        '欢迎扫码查看课程详情';
      const payload = {
        name: item.title || '课程',
        title: item.title || '课程',
        about_me: desc,
        bio: desc,
        avatar_img: coverSrc,
        shareTitle: `${item.title || '课程'} · 英雄广场`,
        shareUrl: `${location.origin}${location.pathname}?id=${encodeURIComponent(id)}`,
      };
      if (window.HeroShare?.open) {
        window.HeroShare.open(payload, id);
      } else {
        showToast('分享组件未加载', 'info');
      }
    });

    root.querySelector('[data-vip]')?.addEventListener('click', () => {
      showToast('即将开放', 'info');
    });

    document.getElementById('course-signup-btn')?.addEventListener('click', async () => {
      const name = window.prompt('联系人姓名');
      if (!name || !name.trim()) return;
      const phone = window.prompt('手机号');
      if (!phone || !/^1\d{10}$/.test(phone)) {
        showToast('请填写有效手机号', 'error');
        return;
      }
      const db = window.HeroPlazaDB;
      if (!db || !(await db.isAvailable())) {
        showToast('报名失败，请确认本地数据库服务已启动（:8787）', 'error');
        return;
      }
      try {
        await db.createSignup({
          course_id: item.course_id || id,
          title: item.title,
          name: name.trim(),
          phone,
          fee: item.price,
          location: item.location,
          hero_id: item.hero_id || '1',
          type: 'course',
          type_label: '课程',
          status: '已报名',
          pay_status: '待支付',
        });
        showToast('报名成功', 'success');
      } catch (err) {
        showToast('报名失败', 'error');
        console.error(err);
      }
    });
  }

  init();
})();
