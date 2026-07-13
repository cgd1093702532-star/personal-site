/** 课程表单 · 预览端（发布课程） */
(function (global) {
  const imgBase = '../assets/images/';

  const defaultMock = {
    title: '',
    price: '',
    headcount: '',
    banners: [`${imgBase}course.jpg`],
  };

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderBannerCarousel(banners) {
    const imgs = (banners && banners.length ? banners : [defaultMock.banners[0]]).slice();
    const slides = imgs
      .map((src) => `<div class="cover-carousel__slide"><img src="${escapeHtml(src)}" alt="课程 Banner"></div>`)
      .join('');
    const dots =
      imgs.length > 1
        ? imgs
            .map((_, i) => `<span class="cover-carousel__dot${i === 0 ? ' is-active' : ''}"></span>`)
            .join('')
        : '';
    return (
      `<div class="course-create-banner">` +
      `<div class="cover-carousel cover-carousel--course" data-cover-carousel>` +
      `<div class="cover-carousel__viewport"><div class="cover-carousel__track">${slides}</div></div>` +
      (dots ? `<div class="cover-carousel__dots">${dots}</div>` : '') +
      `</div>` +
      `<button type="button" class="course-create-banner__add" id="cc-add-banner">+ 添加 Banner 图片</button>` +
      `</div>`
    );
  }

  function collectForm(root) {
    const val = (field) => {
      const el = root.querySelector(`[data-field="${field}"]`);
      return el ? el.value : '';
    };
    const imgs = [...root.querySelectorAll('.cover-carousel__slide img')].map((img) => img.src);
    return {
      title: val('title'),
      price: val('price'),
      headcount: val('headcount'),
      banners: imgs.length ? imgs : defaultMock.banners,
    };
  }

  function validateForm(form) {
    if (!form.title.trim() || form.title.length < 2) {
      return { ok: false, message: '请填写课程名称（至少 2 字）' };
    }
    if (form.price === '' || Number(form.price) < 0) {
      return { ok: false, message: '请填写有效课程价格' };
    }
    if (!form.headcount || Number(form.headcount) < 1) {
      return { ok: false, message: '请填写课程人数' };
    }
    return { ok: true };
  }

  function bannerFileName(src) {
    if (!src) return 'course.jpg';
    const parts = src.split('/');
    return parts[parts.length - 1] || 'course.jpg';
  }

  function formToCourse(form) {
    return {
      course_id: `c${Date.now()}`,
      title: form.title.trim(),
      price: Number(form.price) || 0,
      fee: Number(form.price) || 0,
      total: Number(form.headcount) || 0,
      headcount: Number(form.headcount) || 0,
      banner_images: form.banners.map(bannerFileName),
      cover_image: bannerFileName(form.banners[0]),
      listTab: 'active',
      signed: 0,
      hero_id: '1',
      hero_name: '小哥',
      location: '',
      timeDisplay: '',
      description: '',
      detail_html: '',
    };
  }

  function notify(message, type) {
    if (global.PreviewToast && global.PreviewToast.show) {
      global.PreviewToast.show(message, type);
    } else {
      window.alert(message);
    }
  }

  async function persistCourse(form) {
    const db = global.HeroPlazaDB;
    if (!db) throw new Error('db_unavailable');
    const ok = await db.isAvailable();
    if (!ok) throw new Error('db_offline');
    const item = formToCourse(form);
    const saved = await db.createCourse({ ...item, hero_id: item.hero_id || '1', listTab: 'active' });
    return saved;
  }

  function pinFooterToShell(root) {
    const footer = root.querySelector('.create-footer');
    const shell = root.closest('.mobile-shell');
    if (!footer || !shell) return;
    footer.classList.add('create-footer--pinned');
    shell.appendChild(footer);
  }

  function initBannerCarousel(root) {
    const carousel = root.querySelector('[data-cover-carousel]');
    if (carousel && global.initCoverCarousel) {
      global.initCoverCarousel(carousel);
    }
  }

  function renderForm(root, options) {
    if (!root) return;
    const mock = (options && options.mock) || defaultMock;
    const publishHref = (options && options.publishHref) || 'my-courses.html';

    root.innerHTML =
      `<div class="create-form create-form--course">` +
      renderBannerCarousel(mock.banners) +
      `<section class="create-section">` +
      `<div class="create-section__title">基本信息</div>` +
      `<div class="create-field">` +
      `<label class="create-label create-label--required">课程名称</label>` +
      `<input class="create-input" placeholder="2-50 字" data-field="title" value="${escapeHtml(mock.title)}" />` +
      `</div>` +
      `<div class="create-row">` +
      `<div class="create-field create-field--half">` +
      `<label class="create-label create-label--required">课程价格</label>` +
      `<input class="create-input" type="number" placeholder="元/人" data-field="price" value="${escapeHtml(mock.price)}" />` +
      `</div>` +
      `<div class="create-field create-field--half">` +
      `<label class="create-label create-label--required">课程人数</label>` +
      `<input class="create-input" type="number" placeholder="1-100" data-field="headcount" value="${escapeHtml(mock.headcount)}" />` +
      `</div>` +
      `</div>` +
      `</section>` +
      `<section class="create-section">` +
      `<div class="create-section__title">课程详情</div>` +
      `<div class="create-field">` +
      `<p class="course-detail-admin-hint">课程详情请在管理后台使用富文本编辑器维护，发布后可前往「课程管理」编辑图文介绍。</p>` +
      `<div class="course-detail-admin-preview">` +
      `<div class="course-detail-admin-preview__placeholder">发布后可在后台编辑课程详情</div>` +
      `</div>` +
      `</div>` +
      `</section>` +
      `<div class="create-footer create-footer--single">` +
      `<button type="button" class="create-footer__publish" id="cc-publish" data-publish-href="${publishHref}">发布课程</button>` +
      `</div>` +
      `</div>`;

    initBannerCarousel(root);
    pinFooterToShell(root);

    const demoBanners = [`${imgBase}course.jpg`, `${imgBase}event.jpg`, `${imgBase}recruit-cover.jpg`];
    root.querySelector('#cc-add-banner')?.addEventListener('click', () => {
      const track = root.querySelector('.cover-carousel__track');
      const carousel = root.querySelector('[data-cover-carousel]');
      if (!track || !carousel) return;
      const count = track.querySelectorAll('.cover-carousel__slide').length;
      const src = demoBanners[count % demoBanners.length];
      track.insertAdjacentHTML(
        'beforeend',
        `<div class="cover-carousel__slide"><img src="${src}" alt="课程 Banner"></div>`,
      );
      const slides = track.querySelectorAll('.cover-carousel__slide');
      let dotsWrap = carousel.querySelector('.cover-carousel__dots');
      if (slides.length > 1) {
        if (!dotsWrap) {
          carousel.insertAdjacentHTML('beforeend', '<div class="cover-carousel__dots"></div>');
          dotsWrap = carousel.querySelector('.cover-carousel__dots');
        }
        dotsWrap.innerHTML = [...slides]
          .map((_, i) => `<span class="cover-carousel__dot${i === 0 ? ' is-active' : ''}"></span>`)
          .join('');
      } else if (dotsWrap) {
        dotsWrap.remove();
      }
      if (global.initCoverCarousel) global.initCoverCarousel(carousel);
    });

    root.querySelector('#cc-publish')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const form = collectForm(root);
      const check = validateForm(form);
      if (!check.ok) {
        notify(check.message, 'error');
        return;
      }
      btn.disabled = true;
      btn.textContent = '发布中…';
      try {
        await persistCourse(form);
        notify('发布成功', 'success');
        const href = btn.dataset.publishHref || publishHref;
        if (global.PreviewNav && global.PreviewNav.navigateTo) {
          await global.PreviewNav.navigateTo(href, 'forward');
        } else {
          window.location.href = href;
        }
      } catch (err) {
        console.warn('[course-form]', err);
        notify(err.message === 'db_offline' ? '请先启动本地数据库' : '发布失败', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '发布课程';
      }
    });
  }

  global.CourseFormPreview = {
    defaultMock,
    renderForm,
    collectForm,
    validateForm,
    formToCourse,
  };
})(typeof window !== 'undefined' ? window : globalThis);
