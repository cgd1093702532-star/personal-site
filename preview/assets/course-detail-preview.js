/** 课程详情 · 预览端 */
(function () {
  const root = document.getElementById('course-detail-root');
  if (!root) return;

  const imgBase = '../assets/images/';
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('id') || 'c1';

  const fallback = {
    course_id: 'c1',
    title: 'ASA101-103培训课',
    price: 1280,
    total: 16,
    signed: 10,
    time: '7月26日 09:00 - 16:30',
    location: '滴水湖二号码头',
    hero_name: '小哥',
    banner_images: ['course.jpg'],
    detail_html:
      '<p>ASA 101+103 组合课程，适合<strong>零基础学员</strong>。</p><ul><li>理论讲解与岸上模拟</li><li>水上实操与结业评估</li></ul>',
    description: 'ASA 101+103 组合课程，适合零基础学员，含理论讲解、岸上模拟与水上实操。',
  };

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderBanner(imgs) {
    const list = imgs && imgs.length ? imgs : ['course.jpg'];
    const slides = list
      .map((img) => {
        const src = img.startsWith('http') || img.startsWith('../') ? img : `${imgBase}${img}`;
        return `<div class="cover-carousel__slide"><img src="${src}" alt="课程封面"></div>`;
      })
      .join('');
    const dots =
      list.length > 1
        ? list
            .map((_, i) => `<span class="cover-carousel__dot${i === 0 ? ' is-active' : ''}"></span>`)
            .join('')
        : '';
    return (
      `<div class="cover-carousel cover-carousel--course-detail" data-cover-carousel>` +
      `<div class="cover-carousel__viewport"><div class="cover-carousel__track">${slides}</div></div>` +
      (dots ? `<div class="cover-carousel__dots">${dots}</div>` : '') +
      `</div>`
    );
  }

  function render(item) {
    const price = item.price != null ? item.price : item.fee || 0;
    const detailHtml = item.detail_html || `<p>${escapeHtml(item.description || '')}</p>`;
    root.innerHTML =
      `<div class="course-detail-preview">` +
      renderBanner(item.banner_images || [item.cover_image || 'course.jpg']) +
      `<div class="course-detail-preview__body">` +
      `<span class="tag tag--course">课程</span>` +
      `<h2 class="course-detail-preview__title">${escapeHtml(item.title)}</h2>` +
      (item.time ? `<div class="card__meta"><img class="card__meta-icon" src="../assets/icons/time.png" alt=""> ${escapeHtml(item.time || item.timeDisplay)}</div>` : '') +
      (item.location ? `<div class="card__meta"><img class="card__meta-icon" src="../assets/icons/location.png" alt=""> ${escapeHtml(item.location)}</div>` : '') +
      (item.hero_name ? `<div class="card__meta">授课：${escapeHtml(item.hero_name)}</div>` : '') +
      (item.total ? `<div class="card__meta">名额：${item.signed || 0}/${item.total} 人</div>` : '') +
      `<div class="course-detail-preview__section">` +
      `<div class="course-detail-preview__label">课程详情</div>` +
      `<div class="course-detail-preview__rich">${detailHtml}</div>` +
      `</div>` +
      `</div>` +
      `<div class="course-detail-preview__footer">` +
      `<span class="course-detail-preview__price">¥${price}<span class="course-detail-preview__unit">/人</span></span>` +
      `<button type="button" class="course-detail-preview__btn" id="course-signup-btn">立即报名</button>` +
      `</div>` +
      `</div>`;

    const carousel = root.querySelector('[data-cover-carousel]');
    if (carousel && window.initCoverCarousel) {
      window.initCoverCarousel(carousel);
    }

    root.querySelector('#course-signup-btn')?.addEventListener('click', async () => {
      const db = window.HeroPlazaDB;
      if (!db || !(await db.isAvailable())) {
        window.alert('报名失败，请确认本地数据库服务已启动（:8787）');
        return;
      }
      const name = window.prompt('联系人姓名', '本地用户');
      if (!name || !name.trim()) return;
      const phone = window.prompt('手机号', '13800000000');
      if (!phone || !/^1\d{10}$/.test(phone)) {
        window.alert('请填写有效手机号');
        return;
      }
      try {
        await db.createSignup({
          course_id: item.course_id || courseId,
          title: item.title,
          name: name.trim(),
          phone,
          fee: item.price != null ? item.price : item.fee,
          location: item.location,
          hero_id: item.hero_id || '1',
          type: 'course',
          type_label: '课程',
          status: '已报名',
          pay_status: '待支付',
        });
        if (window.PreviewToast) window.PreviewToast.show('报名成功', 'success');
        else window.alert('报名成功');
        load();
      } catch (err) {
        window.alert('报名失败');
        console.error(err);
      }
    });
  }

  async function load() {
    let item = null;
    if (window.HEROES_DATA) {
      for (const hero of window.HEROES_DATA) {
        const found = (hero.courses || []).find((c) => String(c.course_id) === courseId);
        if (found) {
          item = { ...found, hero_name: hero.name };
          break;
        }
      }
    }
    if (window.HeroPlazaDB) {
      try {
        const ok = await window.HeroPlazaDB.isAvailable();
        if (ok) {
          const fromDb = await window.HeroPlazaDB.getCourse(courseId);
          if (fromDb) item = { ...item, ...fromDb };
        }
      } catch (_) {
        /* 回退静态数据 */
      }
    }
    render(item || { ...fallback, course_id: courseId });
  }

  load();
})();
