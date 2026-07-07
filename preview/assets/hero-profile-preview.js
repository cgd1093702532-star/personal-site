/** 修改英雄资料 · 可编辑（关于我 / 荣誉 / 精彩瞬间 / 资质证书） */
(async function () {
  const root = document.getElementById('hero-profile-root');
  if (!root) return;

  const HERO_ID = '1';
  const imgBase = '../assets/images/';
  const MAX_PHOTOS = 9;
  let albumInput = null;
  let heroBase = null;
  let dbEnabled = false;

  if (window.HeroPlazaDB && (await window.HeroPlazaDB.isAvailable())) {
    try {
      heroBase = await window.HeroPlazaDB.getHero(HERO_ID);
      dbEnabled = true;
    } catch (_) {
      /* fallback */
    }
  }
  if (!heroBase && window.HEROES_DATA) {
    heroBase = JSON.parse(JSON.stringify(window.HEROES_DATA[HERO_ID]));
  }
  if (!heroBase) {
    root.innerHTML = '<div class="heroes-empty-state" style="display:flex;padding:40px 16px"><div>资料加载失败</div></div>';
    return;
  }

  function mediaFromStorage(value) {
    if (!value) return '';
    if (value.startsWith('blob:') || value.startsWith('http')) return value;
    return `${imgBase}${value}`;
  }

  function mediaUrlToStorage(url) {
    if (!url) return '';
    if (url.startsWith('blob:')) return url;
    if (url.startsWith(imgBase)) return url.slice(imgBase.length);
    return url;
  }

  const state = {
    aboutMe: heroBase.about_me || '',
    honors: (heroBase.past_honors || []).map((h, i) => ({ ...h, id: h.id || `h-${i}` })),
    moments: (heroBase.moments || []).map((img, i) => {
      const value = typeof img === 'string' ? img : img.url || img.image;
      return { id: `m-${i}`, url: mediaFromStorage(value) };
    }),
    certificates: (heroBase.certificates || []).map((c, i) => {
      const item = typeof c === 'string' ? { name: '资质证书', image: c } : c;
      return { id: `c-${i}`, name: item.name, url: mediaFromStorage(item.image || item.url) };
    }),
    honorForm: null,
    dragType: null,
    dragIndex: -1,
  };

  async function persistHeroProfile() {
    if (!dbEnabled || !window.HeroPlazaDB) return;
    const patch = {
      about_me: state.aboutMe,
      past_honors: state.honors.map(({ id, ...h }) => h),
      honors_count: state.honors.length,
      moments: state.moments.map((m) => mediaUrlToStorage(m.url)),
      certificates: state.certificates.map((c) => ({
        name: c.name,
        image: mediaUrlToStorage(c.url),
      })),
    };
    try {
      await window.HeroPlazaDB.updateHero(HERO_ID, patch);
    } catch (err) {
      console.warn('[hero-profile] 保存到本地数据库失败', err);
    }
  }

  function afterChange() {
    render();
    persistHeroProfile();
  }

  function starsHtml(rating) {
    return [1, 2, 3, 4, 5]
      .map((i) => {
        let cls = 'hero-profile__star';
        if (rating >= i) cls += ' hero-profile__star--filled';
        else if (rating >= i - 0.5) cls += ' hero-profile__star--half';
        return `<span class="${cls}">★</span>`;
      })
      .join('');
  }

  function revokeIfBlob(url) {
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  function getAlbumInput() {
    if (!albumInput) {
      albumInput = document.createElement('input');
      albumInput.type = 'file';
      albumInput.accept = 'image/*';
      albumInput.multiple = true;
      albumInput.hidden = true;
      document.body.appendChild(albumInput);
    }
    return albumInput;
  }

  function pickFromAlbum(listKey) {
    const list = state[listKey];
    const remain = MAX_PHOTOS - list.length;
    if (remain <= 0) return;
    const input = getAlbumInput();
    input.value = '';
    input.onchange = () => {
      const files = Array.from(input.files || []).slice(0, remain);
      const startLen = list.length;
      files.forEach((file, i) => {
        const url = URL.createObjectURL(file);
        if (listKey === 'moments') {
          state.moments.push({ id: `m-${Date.now()}-${i}`, url });
        } else {
          state.certificates.push({
            id: `c-${Date.now()}-${i}`,
            name: `证书${startLen + i + 1}`,
            url,
          });
        }
      });
      afterChange();
    };
    input.click();
  }

  function honorRow(item, index) {
    return (
      `<div class="honor-row" data-honor-wrap="${index}">` +
      `<div class="hero-detail__honor honor-row__body">` +
      `<div class="hero-detail__honor-icon">${item.icon}</div>` +
      `<div class="hero-detail__honor-body"><div class="hero-detail__honor-name">${item.name}</div>` +
      `<div class="hero-detail__honor-summary">${item.summary}</div></div></div>` +
      `<div class="honor-row__actions">` +
      `<button type="button" class="honor-row__icon honor-row__icon--edit" data-honor-edit="${index}" aria-label="编辑"></button>` +
      `<button type="button" class="honor-row__icon honor-row__icon--delete" data-honor-del="${index}" aria-label="删除"></button>` +
      `</div></div>`
    );
  }

  function addMediaBtn(id, label) {
    return `<button type="button" class="hero-profile-edit__add" id="${id}"><span class="hero-profile-edit__add-icon">+</span><span>${label}</span></button>`;
  }

  function mediaItem(item, index, type) {
    const certCls = type === 'cert' ? ' hero-profile-edit__media--cert' : '';
    const name = type === 'cert' ? `<span class="hero-profile-edit__media-name">${item.name}</span>` : '';
    return (
      `<div class="hero-profile-edit__media${certCls}" draggable="true" data-media-type="${type}" data-media-index="${index}">` +
      `<img class="hero-profile-edit__media-img" src="${item.url}" alt="">` +
      name +
      `<button type="button" class="hero-profile-edit__media-del" data-media-del="${type}" data-media-index="${index}">×</button>` +
      `<span class="hero-profile-edit__media-handle">⋮⋮</span></div>`
    );
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function focusTextareaAtEnd(el) {
    if (!el) return;
    el.focus({ preventScroll: true });
    const len = el.value.length;
    if (typeof el.setSelectionRange === 'function') {
      el.setSelectionRange(len, len);
    }
  }

  function scheduleAboutTextFocus() {
    if (!state.aboutSheet) return;
    const el = root.querySelector('#about-text');
    if (!el) return;
    [0, 50, 150, 320].forEach((delay) => {
      setTimeout(() => focusTextareaAtEnd(el), delay);
    });
  }

  function honorSheet() {
    if (!state.honorForm) return '';
    const f = state.honorForm;
    return (
      `<div class="hero-profile-sheet" id="hero-honor-sheet">` +
      `<div class="hero-profile-sheet__mask" data-honor-close></div>` +
      `<div class="hero-profile-sheet__panel">` +
      `<div class="hero-profile-sheet__title">${f.mode === 'add' ? '新增荣誉' : '编辑荣誉'}</div>` +
      `<label class="hero-profile-sheet__field"><span class="hero-profile-sheet__label">图标（emoji）</span>` +
      `<input class="hero-profile-sheet__input" id="honor-icon" value="${f.icon || ''}"></label>` +
      `<label class="hero-profile-sheet__field"><span class="hero-profile-sheet__label">荣誉名称</span>` +
      `<input class="hero-profile-sheet__input" id="honor-name" value="${f.name || ''}"></label>` +
      `<label class="hero-profile-sheet__field"><span class="hero-profile-sheet__label">简介</span>` +
      `<textarea class="hero-profile-sheet__textarea" id="honor-summary">${f.summary || ''}</textarea></label>` +
      `<div class="hero-profile-sheet__actions">` +
      `<button type="button" class="hero-profile-sheet__btn hero-profile-sheet__btn--cancel" data-honor-close>取消</button>` +
      `<button type="button" class="hero-profile-sheet__btn hero-profile-sheet__btn--save" id="honor-save">保存</button>` +
      `</div></div></div>`
    );
  }

  function aboutSheet() {
    if (!state.aboutSheet) return '';
    return (
      `<div class="hero-profile-sheet" id="hero-about-sheet">` +
      `<div class="hero-profile-sheet__mask" data-about-close></div>` +
      `<div class="hero-profile-sheet__panel hero-profile-sheet__panel--about">` +
      `<div class="hero-profile-sheet__title">编辑关于我</div>` +
      `<textarea class="hero-profile-sheet__textarea hero-profile-sheet__textarea--lg" id="about-text" inputmode="text" autocomplete="off" autocapitalize="sentences" autofocus>${escapeHtml(state.aboutMe)}</textarea>` +
      `<div class="hero-profile-sheet__actions">` +
      `<button type="button" class="hero-profile-sheet__btn hero-profile-sheet__btn--cancel" data-about-close>取消</button>` +
      `<button type="button" class="hero-profile-sheet__btn hero-profile-sheet__btn--save" id="about-save">保存</button>` +
      `</div></div></div>`
    );
  }

  function render() {
    const hero = heroBase;
    const tags = [...(hero.honor_titles || []), ...(hero.cert_badges || [])].slice(0, 3);
    const subtitle = `${(hero.project_types || []).join(' · ')} · ${hero.years_exp || ''}年经验`;

    root.innerHTML =
      `<div class="hero-detail hero-detail--edit">` +
      `<div class="hero-profile"><div class="hero-profile__cover"></div><div class="hero-profile__main">` +
      `<div class="hero-profile__avatar"><img src="${imgBase}${hero.avatar_img}" alt="${hero.name}"></div>` +
      `<div class="hero-profile__name">${hero.name}</div>` +
      `<div class="hero-profile__subtitle">${subtitle}</div>` +
      `<div class="hero-profile__rating"><div class="hero-profile__stars">${starsHtml(hero.rating)}</div><span class="hero-profile__score">${hero.rating}</span></div>` +
      `<div class="hero-profile__tags">${tags.map((t) => `<span class="hero-profile__tag">${t}</span>`).join('')}</div>` +
      `<div class="hero-profile__stats">` +
      `<div class="hero-profile__stat"><span class="hero-profile__stat-num">${hero.student_count || 0}</span><span class="hero-profile__stat-label">学员</span></div>` +
      `<div class="hero-profile__stat"><span class="hero-profile__stat-num">${hero.rating}</span><span class="hero-profile__stat-label">评分</span></div>` +
      `<div class="hero-profile__stat"><span class="hero-profile__stat-num">${state.honors.length}</span><span class="hero-profile__stat-label">荣誉</span></div>` +
      `</div></div></div>` +
      `<div class="hero-detail__block"><div class="hero-detail__label-row"><div class="hero-detail__label">关于我</div><button type="button" class="hero-profile-edit__link" id="edit-about">编辑</button></div>` +
      `<div class="hero-detail__bio hero-profile-edit__bio">${escapeHtml(state.aboutMe)}</div></div>` +
      `<div class="hero-detail__block"><div class="hero-detail__label-row"><div class="hero-detail__label">过往荣誉</div><button type="button" class="hero-profile-edit__link" id="add-honor">新增</button></div>` +
      `${state.honors.map(honorRow).join('') || '<div class="hero-profile-edit__empty">暂无荣誉，点击新增添加</div>'}</div>` +
      `<div class="hero-detail__block"><div class="hero-detail__label-row"><div class="hero-detail__label">精彩瞬间</div><span class="hero-profile-edit__hint">拖动排序</span></div>` +
      `<div class="hero-profile-edit__gallery" id="moments-gallery">` +
      state.moments.map((m, i) => mediaItem(m, i, 'moment')).join('') +
      (state.moments.length < MAX_PHOTOS ? addMediaBtn('add-moment', '添加图片') : '') +
      `</div></div>` +
      `<div class="hero-detail__block"><div class="hero-detail__label-row"><div class="hero-detail__label">资质证书</div><span class="hero-profile-edit__hint">拖动排序</span></div>` +
      `<div class="hero-profile-edit__cert-grid" id="certs-gallery">` +
      state.certificates.map((c, i) => mediaItem(c, i, 'cert')).join('') +
      (state.certificates.length < MAX_PHOTOS ? addMediaBtn('add-cert', '添加证书') : '') +
      `</div></div>` +
      `<div class="hero-detail__bottom-spacer"></div></div>` +
      honorSheet() +
      aboutSheet();

    bind();
  }

  function bindDragSort(containerId, listKey) {
    const gallery = root.querySelector(`#${containerId}`);
    if (!gallery) return;
    let dragIndex = -1;
    gallery.querySelectorAll('[draggable="true"]').forEach((el) => {
      el.addEventListener('dragstart', () => {
        dragIndex = Number(el.dataset.mediaIndex);
        el.classList.add('hero-profile-edit__media--dragging');
      });
      el.addEventListener('dragend', () => {
        dragIndex = -1;
        el.classList.remove('hero-profile-edit__media--dragging');
      });
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        const toIndex = Number(el.dataset.mediaIndex);
        if (dragIndex < 0 || toIndex < 0 || dragIndex === toIndex) return;
        const list = state[listKey];
        const [item] = list.splice(dragIndex, 1);
        list.splice(toIndex, 0, item);
        afterChange();
      });
      el.addEventListener('click', (e) => {
        if (e.target.closest('.hero-profile-edit__media-del')) return;
        const url = state[listKey][Number(el.dataset.mediaIndex)]?.url;
        if (url && window.ImageViewer) {
          const urls = state[listKey].map((x) => x.url);
          window.ImageViewer.open(urls, url);
        }
      });
    });
  }

  function bind() {
    root.querySelector('#edit-about')?.addEventListener('click', () => {
      state.aboutSheet = true;
      render();
      focusTextareaAtEnd(root.querySelector('#about-text'));
      scheduleAboutTextFocus();
    });

    root.querySelector('#about-save')?.addEventListener('click', () => {
      state.aboutMe = root.querySelector('#about-text')?.value || state.aboutMe;
      state.aboutSheet = false;
      afterChange();
    });
    root.querySelectorAll('[data-about-close]').forEach((el) => {
      el.addEventListener('click', () => {
        state.aboutSheet = false;
        render();
      });
    });

    root.querySelector('#add-honor')?.addEventListener('click', () => {
      state.honorForm = { mode: 'add', index: -1, icon: '🏆', name: '', summary: '' };
      render();
    });

    root.querySelectorAll('[data-honor-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.honorEdit);
        const item = state.honors[i];
        state.honorForm = { mode: 'edit', index: i, icon: item.icon, name: item.name, summary: item.summary };
        render();
      });
    });

    root.querySelectorAll('[data-honor-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.honorDel);
        if (window.confirm(`确定删除「${state.honors[i].name}」？`)) {
          state.honors.splice(i, 1);
          afterChange();
        }
      });
    });

    root.querySelector('#honor-save')?.addEventListener('click', () => {
      const icon = root.querySelector('#honor-icon')?.value || '🏆';
      const name = root.querySelector('#honor-name')?.value?.trim();
      const summary = root.querySelector('#honor-summary')?.value?.trim() || '';
      if (!name) {
        window.alert('请填写荣誉名称');
        return;
      }
      const item = { id: `h-${Date.now()}`, icon, name, summary };
      if (state.honorForm.mode === 'edit' && state.honorForm.index >= 0) {
        state.honors[state.honorForm.index] = { ...item, id: state.honors[state.honorForm.index].id };
      } else {
        state.honors.push(item);
      }
      state.honorForm = null;
      afterChange();
    });
    root.querySelectorAll('[data-honor-close]').forEach((el) => {
      el.addEventListener('click', () => {
        state.honorForm = null;
        render();
      });
    });

    root.querySelector('#add-moment')?.addEventListener('click', () => {
      pickFromAlbum('moments');
    });
    root.querySelector('#add-cert')?.addEventListener('click', () => {
      pickFromAlbum('certificates');
    });

    root.querySelectorAll('[data-media-del]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.mediaDel;
        const index = Number(btn.dataset.mediaIndex);
        const key = type === 'moment' ? 'moments' : 'certificates';
        revokeIfBlob(state[key][index]?.url);
        state[key].splice(index, 1);
        afterChange();
      });
    });

    bindDragSort('moments-gallery', 'moments');
    bindDragSort('certs-gallery', 'certificates');

    scheduleAboutTextFocus();
  }

  render();
})();
