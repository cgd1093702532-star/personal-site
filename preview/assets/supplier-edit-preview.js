/** 管理后台 · 供方创建 / 编辑（对齐 docs/admin/UI-DESIGN-SPEC.md） */
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

  let avatarFileName = 'hero-1.jpg';
  let avatarDataUrl = '';

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

  function splitTypes(raw) {
    return String(raw || '')
      .split(/[、,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
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

  function fillForm(hero) {
    const setVal = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value ?? '';
    };
    setVal('field-name', hero.name);
    setVal('field-phone', hero.phone);
    setVal('field-project-types', (hero.project_types || []).join('、'));
    setVal('field-city', hero.city);
    setVal('field-certification', hero.certification || hero.certification_level || '');
    setVal('field-years', hero.years_exp);
    setVal('field-bio', hero.bio || hero.about_me || '');
    avatarFileName = hero.avatar_img || 'hero-1.jpg';
    if (hero.avatar_img) setAvatarPreview(`../assets/images/${hero.avatar_img}`);
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
    if (!payload.phone) {
      setError('phone', '请填写手机号码');
      ok = false;
    } else if (!/^1\d{10}$/.test(payload.phone)) {
      setError('phone', '请输入11位手机号');
      ok = false;
    }
    if (!payload.project_types.length) {
      setError('project_types', '请填写项目类型');
      ok = false;
    }
    if (!payload.certification) {
      setError('certification', '请填写资质等级');
      ok = false;
    }
    if (!avatarFileName && !avatarDataUrl) {
      setError('avatar', '请上传供方头像');
      ok = false;
    }
    return ok;
  }

  function readPayload() {
    const get = (id) => document.getElementById(id)?.value?.trim() || '';
    return {
      name: get('field-name'),
      phone: get('field-phone'),
      project_types: splitTypes(get('field-project-types')),
      city: get('field-city'),
      certification: get('field-certification'),
      years_exp: get('field-years'),
      bio: get('field-bio'),
      avatar_img: avatarFileName || 'hero-1.jpg',
      channel: '后台创建',
      audit_status: 'approved',
      enabled: true,
    };
  }

  avatarInput?.addEventListener('change', () => {
    const file = avatarInput.files && avatarInput.files[0];
    if (!file) return;
    avatarFileName = file.name || 'hero-1.jpg';
    const reader = new FileReader();
    reader.onload = () => {
      avatarDataUrl = String(reader.result || '');
      setAvatarPreview(avatarDataUrl);
    };
    reader.readAsDataURL(file);
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

  loadEdit();
})();
