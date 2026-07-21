/** 管理后台 · 供方创建 / 编辑（字段对齐原型图，样式对齐 UI-DESIGN-SPEC） */
(function () {
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id') || '';
  const isEdit = !!editId;

  const form = document.getElementById('supplier-form');
  const cancelBtn = document.getElementById('supplier-cancel');
  const submitBtn = document.getElementById('supplier-submit');
  const avatarInput = document.getElementById('field-avatar');
  const avatarPreview = document.getElementById('avatar-preview');
  const avatarPlus = document.getElementById('avatar-plus');
  const honorInput = document.getElementById('field-honor-input');
  const honorAdd = document.getElementById('honor-add');
  const honorList = document.getElementById('honor-list');
  const certList = document.getElementById('cert-list');
  const certFile = document.getElementById('cert-file');
  const CERT_MAX = 9;
  const mediaFile = document.getElementById('media-file');
  const projectSelect = document.getElementById('field-project-type');
  const projectAddBtn = document.getElementById('project-type-add');
  const projectRefreshBtn = document.getElementById('project-type-refresh');
  const projectModal = document.getElementById('project-type-modal');
  const projectModalList = document.getElementById('project-type-modal-list');
  const projectModalAdd = document.getElementById('project-type-modal-add');
  const projectCreateModal = document.getElementById('project-type-create-modal');
  const projectAddInput = document.getElementById('project-type-add-input');
  const projectAddConfirm = document.getElementById('project-type-add-confirm');
  const projectAddCancel = document.getElementById('project-type-add-cancel');

  const DEFAULT_PROJECT_TYPES = (window.HeroPlazaProjectTypes && window.HeroPlazaProjectTypes.DEFAULT_NAMES) || [
    '帆船',
    '皮划艇',
    '桨板',
    '潜水',
    '冲浪',
    '游艇',
  ];
  const PROJECT_TYPES_STORAGE_KEY =
    (window.HeroPlazaProjectTypes && window.HeroPlazaProjectTypes.STORAGE_KEY) || 'hero_plaza_project_types';

  function nowTs() {
    return Date.now();
  }

  function normalizeProjectTypeItem(item, index, total) {
    const fallbackCreated = nowTs() - (Math.max(total, 1) - index) * 1000;
    if (typeof item === 'string') {
      const name = item.trim();
      return name ? { name, created_at: fallbackCreated } : null;
    }
    const name = String(item?.name || '').trim();
    if (!name) return null;
    const created = Number(item.created_at);
    return {
      name,
      created_at: Number.isFinite(created) ? created : fallbackCreated,
    };
  }

  function defaultProjectTypeItems() {
    if (window.HeroPlazaProjectTypes) {
      return window.HeroPlazaProjectTypes.loadItems();
    }
    const total = DEFAULT_PROJECT_TYPES.length;
    return DEFAULT_PROJECT_TYPES.map((name, index) => ({
      name,
      created_at: nowTs() - (total - index) * 1000,
    }));
  }

  function loadProjectTypeItems() {
    if (window.HeroPlazaProjectTypes) {
      return window.HeroPlazaProjectTypes.loadItems();
    }
    try {
      const raw = localStorage.getItem(PROJECT_TYPES_STORAGE_KEY);
      if (!raw) return defaultProjectTypeItems();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) return defaultProjectTypeItems();
      const total = parsed.length;
      const list = parsed.map((item, index) => normalizeProjectTypeItem(item, index, total)).filter(Boolean);
      return list.length ? list : defaultProjectTypeItems();
    } catch (_) {
      return defaultProjectTypeItems();
    }
  }

  function saveProjectTypeItems() {
    if (window.HeroPlazaProjectTypes) {
      window.HeroPlazaProjectTypes.saveItems(state.projectOptions);
      return;
    }
    try {
      localStorage.setItem(PROJECT_TYPES_STORAGE_KEY, JSON.stringify(state.projectOptions));
    } catch (_) {
      /* ignore */
    }
  }

  function sortedProjectTypeItems() {
    if (window.HeroPlazaProjectTypes) {
      return window.HeroPlazaProjectTypes.sortedItems(state.projectOptions);
    }
    return state.projectOptions
      .slice()
      .sort((a, b) => (Number(b.created_at) || 0) - (Number(a.created_at) || 0) || a.name.localeCompare(b.name, 'zh'));
  }

  function findProjectTypeIndex(name) {
    return state.projectOptions.findIndex((item) => item.name === name);
  }

  const state = {
    avatarFileName: 'hero-1.jpg',
    avatarDataUrl: '',
    projectOptions: loadProjectTypeItems(),
    honors: [],
    certificates: [],
    moments: [],
    customSections: [],
    pendingMediaKey: '',
    sectionSeq: 0,
  };

  const CUSTOM_SECTION_MAX = 10;
  const SECTION_MEDIA_MAX = 10;

  function nextSectionId() {
    state.sectionSeq += 1;
    return `custom-${state.sectionSeq}`;
  }

  function getMediaConf(key) {
    if (key === 'moments') {
      return { list: () => state.moments, el: 'moments-media', max: SECTION_MEDIA_MAX };
    }
    const section = state.customSections.find((item) => item.id === key);
    if (!section) return null;
    return { list: () => section.images, el: `${key}-media`, max: SECTION_MEDIA_MAX };
  }

  function allMediaKeys() {
    return ['moments', ...state.customSections.map((item) => item.id)];
  }

  if (isEdit) {
    document.title = '编辑供方 · 英雄广场管理后台';
    document.body.dataset.adminTitle = '编辑供方';
    document.body.dataset.adminBreadcrumb = '供需管理 / 供方列表 / 编辑供方';
    if (submitBtn) submitBtn.textContent = '保存';
  }

  async function getDb() {
    if (!window.HeroPlazaDB || !(await window.HeroPlazaDB.isAvailable())) return null;
    return window.HeroPlazaDB;
  }

  function clearErrors() {
    form?.querySelectorAll('.admin-form-item.is-error').forEach((el) => {
      el.classList.remove('is-error');
      el.querySelector('.admin-form-item__error')?.remove();
    });
  }

  function setError(field, message) {
    const item = form?.querySelector(`[data-field="${field}"]`);
    if (!item) return;
    item.classList.add('is-error');
    const tip = document.createElement('div');
    tip.className = 'admin-form-item__error';
    tip.textContent = message;
    item.appendChild(tip);
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setAvatarPreview(src) {
    if (!avatarPreview || !avatarPlus) return;
    if (src) {
      avatarPreview.src = src;
      avatarPreview.hidden = false;
      avatarPlus.hidden = true;
    } else {
      avatarPreview.hidden = true;
      avatarPlus.hidden = false;
    }
  }

  function syncProjectSelectPlaceholder() {
    if (!projectSelect) return;
    projectSelect.classList.toggle('admin-select--placeholder', !projectSelect.value);
  }

  function renderProjectOptions(selected) {
    if (!projectSelect) return;
    const current = selected != null ? selected : projectSelect.value;
    const options = sortedProjectTypeItems().map((item) => item.name);
    if (current && !options.includes(current)) options.unshift(current);
    projectSelect.innerHTML =
      `<option value="">请选择</option>` +
      options.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
    projectSelect.value = options.includes(current) ? current : '';
    syncProjectSelectPlaceholder();
  }

  function renderProjectTypeModalList() {
    if (!projectModalList) return;
    const list = sortedProjectTypeItems();
    if (!list.length) {
      projectModalList.innerHTML = '<div class="admin-manage-table__empty">暂无项目类型</div>';
      return;
    }
    projectModalList.innerHTML = list
      .map((item) => {
        const index = findProjectTypeIndex(item.name);
        return (
          `<div class="admin-manage-table__row" data-index="${index}">` +
          `<span class="admin-manage-table__name">${escapeHtml(item.name)}</span>` +
          `<span class="admin-manage-table__row-actions">` +
          `<button type="button" class="admin-link-btn" data-project-edit="${index}">编辑</button>` +
          `<span class="admin-manage-table__sep">|</span>` +
          `<button type="button" class="admin-link-btn admin-link-btn--danger" data-project-delete="${index}">删除</button>` +
          `</span></div>`
        );
      })
      .join('');
  }

  function openProjectTypeModal() {
    if (!projectModal) return;
    state.projectOptions = loadProjectTypeItems();
    closeProjectCreateModal();
    renderProjectTypeModalList();
    projectModal.hidden = false;
  }

  function closeProjectTypeModal() {
    if (!projectModal) return;
    closeProjectCreateModal();
    projectModal.hidden = true;
    renderProjectOptions(projectSelect?.value || '');
  }

  function openProjectCreateModal() {
    if (!projectCreateModal) return;
    if (projectAddInput) projectAddInput.value = '';
    projectCreateModal.hidden = false;
    projectAddInput?.focus();
  }

  function closeProjectCreateModal() {
    if (projectCreateModal) projectCreateModal.hidden = true;
    if (projectAddInput) projectAddInput.value = '';
  }

  function submitProjectAdd() {
    const value = (projectAddInput?.value || '').trim();
    if (!value) {
      window.alert('请输入项目类型名称');
      projectAddInput?.focus();
      return;
    }
    if (findProjectTypeIndex(value) >= 0) {
      window.alert('该项目类型已存在');
      projectAddInput?.focus();
      return;
    }
    state.projectOptions.push({ name: value, created_at: nowTs() });
    saveProjectTypeItems();
    closeProjectCreateModal();
    renderProjectTypeModalList();
  }

  function renderHonors() {
    if (!honorList) return;
    honorList.innerHTML = state.honors
      .map(
        (name, index) =>
          `<span class="admin-chip"><span class="admin-chip__text">${escapeHtml(name)}</span>` +
          `<button type="button" class="admin-chip__remove" data-honor-remove="${index}" aria-label="删除">×</button></span>`,
      )
      .join('');
  }

  function renderCerts() {
    if (!certList) return;
    const cards = state.certificates
      .map((item, index) => {
        const src = item.dataUrl || (item.image ? `../assets/images/${item.image}` : '');
        return (
          `<div class="admin-media-card">` +
          `<button type="button" class="admin-media-card__remove" data-cert-remove="${index}" aria-label="删除">×</button>` +
          `<img class="admin-media-card__img" src="${escapeHtml(src)}" alt="">` +
          `</div>`
        );
      })
      .join('');
    const addBtn =
      state.certificates.length >= CERT_MAX
        ? ''
        : `<button type="button" class="admin-upload" id="cert-add" aria-label="上传资质证书">` +
          `<span class="admin-upload__plus">+</span></button>`;
    certList.innerHTML = cards + addBtn;
  }

  function renderMedia(key) {
    const conf = getMediaConf(key);
    if (!conf) return;
    const wrap = document.getElementById(conf.el);
    if (!wrap) return;
    const list = conf.list();
    wrap.innerHTML = list
      .map((item, index) => {
        const src = item.dataUrl || (item.image ? `../assets/images/${item.image}` : item);
        const url = typeof src === 'string' ? src : '';
        return (
          `<div class="admin-media-card">` +
          `<button type="button" class="admin-media-card__remove" data-media-remove="${key}" data-index="${index}" aria-label="删除">×</button>` +
          `<img class="admin-media-card__img" src="${escapeHtml(url)}" alt="">` +
          `</div>`
        );
      })
      .join('');
  }

  function renderAllMedia() {
    allMediaKeys().forEach(renderMedia);
  }

  function buildCustomSectionEl(section) {
    const el = document.createElement('section');
    el.className = 'admin-form-block';
    el.dataset.showcaseSection = section.id;
    el.innerHTML =
      `<div class="admin-form-block__head admin-form-block__head--inline">` +
      `<input type="text" class="admin-form-block__title-input" data-section-title="${escapeHtml(section.id)}" ` +
      `value="${escapeHtml(section.title)}" maxlength="20" autocomplete="off" />` +
      `<div class="admin-form-block__head-actions">` +
      `<button type="button" class="admin-link-btn" data-media-add="${escapeHtml(section.id)}">+添加图片</button>` +
      `<button type="button" class="admin-link-btn" data-showcase-add>增加栏目</button>` +
      `<button type="button" class="admin-link-btn admin-link-btn--danger" data-showcase-remove="${escapeHtml(section.id)}">删除栏目</button>` +
      `</div></div>` +
      `<div class="admin-form-block__body">` +
      `<div class="admin-form-item" data-field="${escapeHtml(section.id)}_text">` +
      `<label class="admin-form-item__label" for="field-text-${escapeHtml(section.id)}">栏目说明</label>` +
      `<textarea id="field-text-${escapeHtml(section.id)}" class="admin-textarea" rows="4" maxlength="500" ` +
      `placeholder="请输入多行文本" data-section-text="${escapeHtml(section.id)}">${escapeHtml(section.text || '')}</textarea>` +
      `</div>` +
      `<div class="admin-form-item" data-field="${escapeHtml(section.id)}">` +
      `<div class="admin-media-grid" id="${escapeHtml(section.id)}-media"></div>` +
      `</div></div>`;
    return el;
  }

  function focusSectionTitle(sectionId) {
    const input = form?.querySelector(`[data-section-title="${sectionId}"]`);
    if (!input) return;
    input.focus();
    input.select();
  }

  function addCustomSection(afterEl, opts = {}) {
    if (state.customSections.length >= CUSTOM_SECTION_MAX) {
      window.alert(`最多增加${CUSTOM_SECTION_MAX}个自定义栏目`);
      return null;
    }
    const section = {
      id: opts.id || nextSectionId(),
      title: opts.title || '自定义栏目',
      text: opts.text || '',
      images: opts.images || [],
    };
    const num = Number(String(section.id).replace(/^custom-/, ''));
    if (Number.isFinite(num) && num > state.sectionSeq) state.sectionSeq = num;

    const anchor = afterEl || form?.querySelector('[data-showcase-section="moments"]');
    if (!anchor) return null;

    // Insert into state after the anchor section order
    const anchorId = anchor.dataset.showcaseSection;
    if (anchorId === 'moments') {
      state.customSections.unshift(section);
    } else {
      const idx = state.customSections.findIndex((item) => item.id === anchorId);
      if (idx >= 0) state.customSections.splice(idx + 1, 0, section);
      else state.customSections.push(section);
    }

    const el = buildCustomSectionEl(section);
    anchor.after(el);
    renderMedia(section.id);
    if (opts.focus !== false) {
      requestAnimationFrame(() => focusSectionTitle(section.id));
    }
    return section;
  }

  function removeCustomSection(sectionId) {
    if (!sectionId || sectionId === 'moments') return;
    const section = state.customSections.find((item) => item.id === sectionId);
    const title = (section?.title || '自定义栏目').trim() || '自定义栏目';
    if (!window.confirm(`确定删除栏目「${title}」吗？`)) return;
    state.customSections = state.customSections.filter((item) => item.id !== sectionId);
    form?.querySelector(`[data-showcase-section="${sectionId}"]`)?.remove();
  }

  function renderCustomSections() {
    form?.querySelectorAll('[data-showcase-section]:not([data-showcase-section="moments"])').forEach((el) => el.remove());
    const root = form?.querySelector('[data-showcase-section="moments"]');
    let anchor = root;
    state.customSections.forEach((section) => {
      const el = buildCustomSectionEl(section);
      if (anchor) {
        anchor.after(el);
        anchor = el;
      }
      renderMedia(section.id);
    });
  }

  function mapYearsExpValue(raw) {
    if (raw == null || raw === '') return '';
    const str = String(raw).trim();
    const normalized = str.replace(/\s+/g, '');
    const aliases = {
      '1-3年': '1-3 年',
      '3-5年': '3-5 年',
      '5-10年': '5-10 年',
      '10年+': '10 年+',
      '10-15年': '10-15 年',
      '15年+': '15 年+',
      '10+年': '10 年+',
    };
    if (aliases[normalized]) return aliases[normalized];
    if (/^[1-9]\d*年?$/.test(normalized) || /^\d+$/.test(normalized)) {
      const n = parseInt(normalized, 10);
      if (!Number.isFinite(n)) return str;
      if (n < 3) return '1-3 年';
      if (n < 5) return '3-5 年';
      if (n < 10) return '5-10 年';
      return '10 年+';
    }
    return str;
  }

  function ensureSelectValue(selectId, value) {
    const el = document.getElementById(selectId);
    if (!el || value == null || value === '') return;
    const str = selectId === 'field-years' ? mapYearsExpValue(value) : String(value);
    const exists = [...el.options].some((o) => o.value === str);
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = str;
      opt.textContent = str;
      el.appendChild(opt);
    }
    el.value = str;
  }

  function fillForm(hero) {
    const setVal = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value ?? '';
    };
    setVal('field-name', hero.name);
    setVal('field-real-name', hero.real_name || '');
    setVal('field-phone', hero.phone);
    setVal('field-id-card', hero.id_card || hero.supplier_name || '');
    setVal('field-address', hero.address || hero.city || '');
    setVal('field-bank-account', hero.bank_account || '');
    ensureSelectValue('field-certification', hero.certification || hero.certification_level || '');
    ensureSelectValue('field-years', hero.years_exp);

    state.projectOptions = loadProjectTypeItems();
    const selectedType = (hero.project_types || [])[0] || '';
    if (selectedType && findProjectTypeIndex(selectedType) < 0) {
      state.projectOptions.push({ name: selectedType, created_at: nowTs() });
      saveProjectTypeItems();
    }
    renderProjectOptions(selectedType);
    state.honors = (hero.honor_titles || hero.past_honors || [])
      .map((h) => (typeof h === 'string' ? h : h.name))
      .filter(Boolean)
      .slice(0, 10);
    state.certificates = (hero.certificates || []).map((c) =>
      typeof c === 'string'
        ? { name: '资质证书', image: c, dataUrl: '' }
        : { name: c.name || '资质证书', image: c.image || 'cert.jpg', dataUrl: c.dataUrl || '' },
    );
    state.moments = (hero.moments || []).map((img) => ({ image: img, dataUrl: '' }));
    setVal('field-moments-text', hero.about_me || hero.bio || hero.moments_text || '');
    state.customSections = (hero.custom_sections || []).map((item, index) => {
      const id = item.id || `custom-${index + 1}`;
      const num = Number(String(id).replace(/^custom-/, ''));
      if (Number.isFinite(num) && num > state.sectionSeq) state.sectionSeq = num;
      return {
        id,
        title: item.title || '自定义栏目',
        text: item.text || item.content || '',
        images: (item.images || []).map((img) =>
          typeof img === 'string' ? { image: img, dataUrl: '' } : { image: img.image || img, dataUrl: img.dataUrl || '' },
        ),
      };
    });

    state.avatarFileName = hero.avatar_img || 'hero-1.jpg';
    if (hero.avatar_img) setAvatarPreview(`../assets/images/${hero.avatar_img}`);

    renderHonors();
    renderCerts();
    renderCustomSections();
    renderAllMedia();
  }

  async function loadEdit() {
    if (!isEdit) return;
    const db = await getDb();
    if (!db) return;
    try {
      const hero = await db.getHero(editId);
      fillForm(hero || {});
    } catch (err) {
      window.alert(`加载失败：${err.message}`);
    }
  }

  function validate(payload) {
    clearErrors();
    let ok = true;
    if (!payload.name) {
      setError('name', '请填写供方昵称');
      ok = false;
    }
    if (!payload.real_name) {
      setError('real_name', '请填写供方姓名');
      ok = false;
    }
    if (!payload.phone) {
      setError('phone', '请填写手机号码');
      ok = false;
    } else if (!/^1\d{10}$/.test(payload.phone)) {
      setError('phone', '请输入11位手机号');
      ok = false;
    }
    if (!payload.project_types.length) {
      setError('project_types', '请选择项目类型');
      ok = false;
    }
    if (!payload.certification) {
      setError('certification', '请选择资质等级');
      ok = false;
    }
    if (!payload.id_card) {
      setError('id_card', '请填写身份证号');
      ok = false;
    }
    if (!state.avatarFileName && !state.avatarDataUrl) {
      setError('avatar', '请上传供方头像');
      ok = false;
    }
    return ok;
  }

  function mediaToStorage(list) {
    return list.map((item) => item.image || item.dataUrl || item).filter(Boolean);
  }

  function readPayload() {
    const get = (id) => document.getElementById(id)?.value?.trim() || '';
    const honors = state.honors.slice(0, 10);
    const momentsText = get('field-moments-text');
    // 同步自定义栏目文本（避免未触发 input 时丢失）
    state.customSections.forEach((section) => {
      const el = document.querySelector(`[data-section-text="${section.id}"]`);
      if (el) section.text = el.value || '';
    });
    return {
      name: get('field-name'),
      real_name: get('field-real-name'),
      phone: get('field-phone'),
      id_card: get('field-id-card'),
      address: get('field-address'),
      city: get('field-address'),
      bank_account: get('field-bank-account'),
      project_types: get('field-project-type') ? [get('field-project-type')] : [],
      certification: get('field-certification'),
      years_exp: get('field-years'),
      honor_titles: honors,
      past_honors: honors.map((name) => ({ name, summary: '' })),
      honors_count: honors.length,
      certificates: state.certificates.map((c) => ({
        name: c.name || '资质证书',
        image: c.image || 'cert.jpg',
      })),
      about_me: momentsText,
      bio: momentsText,
      moments: mediaToStorage(state.moments),
      custom_sections: state.customSections.map((section) => ({
        id: section.id,
        title: (section.title || '自定义栏目').trim() || '自定义栏目',
        text: (section.text || '').trim(),
        images: mediaToStorage(section.images),
      })),
      avatar_img: state.avatarFileName || 'hero-1.jpg',
      channel: '后台创建',
      audit_status: 'approved',
      enabled: true,
    };
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  projectSelect?.addEventListener('change', syncProjectSelectPlaceholder);

  projectAddBtn?.addEventListener('click', openProjectTypeModal);

  projectRefreshBtn?.addEventListener('click', () => {
    const current = projectSelect?.value || '';
    state.projectOptions = loadProjectTypeItems();
    renderProjectOptions(current);
  });

  projectModal?.addEventListener('click', (e) => {
    if (e.target.closest('[data-project-type-close]')) {
      closeProjectTypeModal();
      return;
    }
    const editBtn = e.target.closest('[data-project-edit]');
    if (editBtn) {
      const index = Number(editBtn.dataset.projectEdit);
      const item = state.projectOptions[index];
      if (!item) return;
      const oldName = item.name;
      const next = window.prompt('编辑项目类型', oldName);
      const value = (next || '').trim();
      if (!value || value === oldName) return;
      if (findProjectTypeIndex(value) >= 0) {
        window.alert('该项目类型已存在');
        return;
      }
      const selected = projectSelect?.value || '';
      state.projectOptions[index] = { ...item, name: value };
      saveProjectTypeItems();
      if (selected === oldName && projectSelect) projectSelect.value = value;
      renderProjectTypeModalList();
      return;
    }
    const deleteBtn = e.target.closest('[data-project-delete]');
    if (deleteBtn) {
      const index = Number(deleteBtn.dataset.projectDelete);
      const item = state.projectOptions[index];
      if (!item) return;
      if (!window.confirm(`确定删除「${item.name}」吗？`)) return;
      const selected = projectSelect?.value || '';
      state.projectOptions.splice(index, 1);
      saveProjectTypeItems();
      if (selected === item.name && projectSelect) {
        projectSelect.value = '';
        syncProjectSelectPlaceholder();
      }
      renderProjectTypeModalList();
    }
  });

  projectModalAdd?.addEventListener('click', openProjectCreateModal);

  projectCreateModal?.addEventListener('click', (e) => {
    if (e.target.closest('[data-project-type-create-close]')) {
      closeProjectCreateModal();
    }
  });

  projectAddConfirm?.addEventListener('click', submitProjectAdd);

  projectAddCancel?.addEventListener('click', closeProjectCreateModal);

  projectAddInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitProjectAdd();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeProjectCreateModal();
    }
  });

  honorAdd?.addEventListener('click', () => {
    const name = (honorInput?.value || '').trim();
    if (!name) return;
    if (name.length > 10) {
      window.alert('荣誉成就标签请控制在 10 字以内');
      return;
    }
    if (state.honors.length >= 10) {
      window.alert('最多添加10个成就');
      return;
    }
    if (state.honors.includes(name)) {
      window.alert('该成就已添加');
      return;
    }
    state.honors.push(name);
    if (honorInput) honorInput.value = '';
    renderHonors();
  });

  honorList?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-honor-remove]');
    if (!btn) return;
    const index = Number(btn.dataset.honorRemove);
    state.honors.splice(index, 1);
    renderHonors();
  });

  certList?.addEventListener('click', (e) => {
    if (e.target.closest('#cert-add')) {
      if (state.certificates.length >= CERT_MAX) {
        window.alert(`最多上传${CERT_MAX}张图片`);
        return;
      }
      certFile?.click();
      return;
    }
    const removeBtn = e.target.closest('[data-cert-remove]');
    if (removeBtn) {
      const index = Number(removeBtn.dataset.certRemove);
      state.certificates.splice(index, 1);
      renderCerts();
    }
  });

  certFile?.addEventListener('change', async () => {
    const files = certFile.files ? [...certFile.files] : [];
    certFile.value = '';
    if (!files.length) return;
    const remain = CERT_MAX - state.certificates.length;
    if (remain <= 0) {
      window.alert(`最多上传${CERT_MAX}张图片`);
      return;
    }
    const selected = files.slice(0, remain);
    for (const file of selected) {
      const dataUrl = await readFileAsDataUrl(file);
      state.certificates.push({
        name: '资质证书',
        image: file.name || 'cert.jpg',
        dataUrl,
      });
    }
    if (files.length > remain) {
      window.alert(`最多上传${CERT_MAX}张图片，已添加${remain}张`);
    }
    renderCerts();
  });

  form?.addEventListener('click', (e) => {
    const showcaseAdd = e.target.closest('[data-showcase-add]');
    if (showcaseAdd) {
      const sectionEl = showcaseAdd.closest('[data-showcase-section]');
      addCustomSection(sectionEl);
      return;
    }
    const showcaseRemove = e.target.closest('[data-showcase-remove]');
    if (showcaseRemove) {
      removeCustomSection(showcaseRemove.dataset.showcaseRemove);
      return;
    }
    const addBtn = e.target.closest('[data-media-add]');
    if (addBtn) {
      const key = addBtn.dataset.mediaAdd;
      const conf = getMediaConf(key);
      if (!conf) return;
      if (conf.list().length >= conf.max) {
        window.alert(`最多添加${conf.max}张图片`);
        return;
      }
      state.pendingMediaKey = key;
      mediaFile?.click();
      return;
    }
    const removeBtn = e.target.closest('[data-media-remove]');
    if (removeBtn) {
      const key = removeBtn.dataset.mediaRemove;
      const index = Number(removeBtn.dataset.index);
      const conf = getMediaConf(key);
      if (!conf) return;
      conf.list().splice(index, 1);
      renderMedia(key);
    }
  });

  form?.addEventListener('input', (e) => {
    const titleInput = e.target.closest('[data-section-title]');
    if (titleInput) {
      const id = titleInput.dataset.sectionTitle;
      const section = state.customSections.find((item) => item.id === id);
      if (section) section.title = titleInput.value;
      return;
    }
    const textArea = e.target.closest('[data-section-text]');
    if (textArea) {
      const id = textArea.dataset.sectionText;
      const section = state.customSections.find((item) => item.id === id);
      if (section) section.text = textArea.value;
    }
  });

  mediaFile?.addEventListener('change', async () => {
    const file = mediaFile.files && mediaFile.files[0];
    const key = state.pendingMediaKey;
    mediaFile.value = '';
    state.pendingMediaKey = '';
    if (!file || !key) return;
    const conf = getMediaConf(key);
    if (!conf || conf.list().length >= conf.max) return;
    const dataUrl = await readFileAsDataUrl(file);
    conf.list().push({ image: file.name || 'image.jpg', dataUrl });
    renderMedia(key);
  });

  avatarInput?.addEventListener('change', async () => {
    const file = avatarInput.files && avatarInput.files[0];
    if (!file) return;
    state.avatarFileName = file.name || 'hero-1.jpg';
    state.avatarDataUrl = await readFileAsDataUrl(file);
    setAvatarPreview(state.avatarDataUrl);
  });

  cancelBtn?.addEventListener('click', () => {
    window.location.href = 'heroes.html';
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = readPayload();
    if (!validate(payload)) {
      form.querySelector('.admin-form-item.is-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const db = await getDb();
    if (!db) {
      window.alert('本地 API 不可用');
      return;
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = isEdit ? '保存中…' : '创建中…';
    }
    try {
      if (isEdit) {
        await db.updateHero(editId, payload);
        window.alert('已保存');
      } else {
        await db.createAdminHero(payload);
        window.alert('创建成功');
      }
      try {
        localStorage.setItem('hero_plaza_heroes_updated', String(Date.now()));
      } catch (_) {
        /* ignore */
      }
      window.location.href = 'heroes.html';
    } catch (err) {
      window.alert(`${isEdit ? '保存' : '创建'}失败：${err.message}`);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? '保存' : '创建';
      }
    }
  });

  renderProjectOptions('');
  renderCerts();
  loadEdit();
})();
