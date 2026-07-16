/** 申请成为英雄 · 预览页 */
(function () {
  const PREVIEW_SMS_CODE = '666666';
  const imgBase = '../assets/images/';
  const pageParams = new URLSearchParams(window.location.search);
  const returnFrom = pageParams.get('from') || '';
  const returnHeroId = pageParams.get('hero_id') || '';
  const yearsOptions = ['1-3年', '3-5年', '5-10年', '10年+'];
  const certOptions = ['国家级教练', '省级教练', 'ACA认证', 'ISA认证', '其他'];
  const PRESET_CERT_LIST = certOptions.filter((item) => item !== '其他');
  const ID_DOC_TYPES = [
    '身份证',
    '护照',
    '港澳居民居住证',
    '港澳居民来往内地通行证',
    '台湾居民来往大陆通行证',
    '台湾居民居住证',
    '外国人永久居留身份证',
    '外国人居留许可证',
  ];
  const DEFAULT_ID_DOC_TYPE = '身份证';
  const FALLBACK_PROJECT_TYPES = ['帆船', '皮划艇', '桨板', '潜水', '冲浪', '游艇'];
  const PROJECT_TYPE_MAX = 3;
  const SHOWCASE_IMAGE_MAX = 9;
  const SHOWCASE_INTRO_MAX = 300;
  const CERT_MAX = 10;
  const CERT_NAME_MAX = 15;

  function validateIdCard(idCard) {
    const id = String(idCard || '').trim().toUpperCase();
    if (!/^\d{17}[\dX]$/.test(id)) return false;
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    let sum = 0;
    for (let i = 0; i < 17; i += 1) sum += parseInt(id[i], 10) * weights[i];
    return id[17] === checkCodes[sum % 11];
  }

  function isCertificationValid(cert, options) {
    if (!cert) return false;
    if (options.includes(cert)) return true;
    if (PRESET_CERT_LIST.includes(cert)) return false;
    return true;
  }

  function createDefaultShowcaseSections() {
    return [
      {
        id: 'showcase-1',
        title: '个人展示',
        isDefault: true,
        intro: '',
        mode: 'image',
        images: [],
        video: '',
        videoDuration: 0,
      },
    ];
  }

  function formatVideoDuration(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function readVideoDuration(url) {
    return new Promise((resolve) => {
      if (!url) {
        resolve(0);
        return;
      }
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const done = (value) => {
        video.removeAttribute('src');
        video.load();
        resolve(value);
      };
      video.onloadedmetadata = () => {
        const d = video.duration;
        done(Number.isFinite(d) ? d : 0);
      };
      video.onerror = () => done(0);
      video.src = url;
    });
  }

  function showcaseSectionsToPayload(sections) {
    const list = Array.isArray(sections) ? sections : [];
    const first = list[0];
    const custom = list.slice(1).map((section) => ({
      title: section.title || '自定义栏目',
      text: section.intro || '',
      images: section.mode === 'image' ? (section.images || []).slice() : [],
      video: section.mode === 'video' ? section.video || '' : '',
    }));
    return {
      moments_text: first?.intro || '',
      moments: first?.mode === 'image' ? (first.images || []).slice() : [],
      moments_video: first?.mode === 'video' ? first.video || '' : '',
      custom_sections: custom,
      showcase_sections: list.map((section) => ({
        title: section.title || '个人展示',
        intro: section.intro || '',
        mediaType: section.mode || 'image',
        images: section.mode === 'image' ? (section.images || []).slice() : [],
        video: section.mode === 'video' ? section.video || '' : '',
      })),
    };
  }

  function showcaseSectionsFromDraft(draft) {
    if (Array.isArray(draft?.showcase_sections) && draft.showcase_sections.length) {
      return draft.showcase_sections.map((section, index) => ({
        id: `showcase-${index + 1}`,
        title: section.title || (index === 0 ? '个人展示' : '自定义栏目'),
        isDefault: index === 0,
        intro: String(section.intro || section.text || '').slice(0, SHOWCASE_INTRO_MAX),
        mode: section.mediaType || (section.video ? 'video' : 'image'),
        images: Array.isArray(section.images) ? section.images.slice(0, SHOWCASE_IMAGE_MAX) : [],
        video: section.video || '',
        videoDuration: Number(section.videoDuration) || 0,
      }));
    }
    const images = Array.isArray(draft?.moments) ? draft.moments.slice() : [];
    const video = draft?.moments_video || draft?.videoPath || '';
    const intro = String(draft?.moments_text || '').slice(0, SHOWCASE_INTRO_MAX);
    const sections = createDefaultShowcaseSections();
    if (video) {
      sections[0].mode = 'video';
      sections[0].video = video;
      sections[0].videoDuration = Number(draft?.moments_video_duration) || 0;
    } else if (images.length) {
      sections[0].mode = 'image';
      sections[0].images = images;
    }
    sections[0].intro = intro;
    (draft?.custom_sections || []).forEach((section, index) => {
      const imgs = Array.isArray(section.images) ? section.images.slice() : [];
      sections.push({
        id: `showcase-${index + 2}`,
        title: section.title || '自定义栏目',
        isDefault: false,
        intro: section.text || section.intro || '',
        mode: section.video ? 'video' : 'image',
        images: section.video ? [] : imgs,
        video: section.video || '',
        videoDuration: Number(section.videoDuration) || 0,
      });
    });
    return sections;
  }

  function validateShowcaseSections(sections) {
    const list = Array.isArray(sections) ? sections : [];
    if (!list.length) return '请完善个人展示栏目';
    for (const section of list) {
      if (!(section.intro || '').length) return '请完善个人展示栏目';
      if (section.mode === 'video') {
        if (!section.video) return '请完善个人展示栏目';
      } else if (!(section.images || []).length) {
        return '请完善个人展示栏目';
      }
    }
    return '';
  }

  function loadProjectTypeOptions() {
    if (window.HeroPlazaProjectTypes?.sortedNames) {
      const names = window.HeroPlazaProjectTypes.sortedNames();
      if (names.length) return names;
    }
    return FALLBACK_PROJECT_TYPES.slice();
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseProjectTypes(raw) {
    try {
      const list = JSON.parse(raw || '[]');
      return Array.isArray(list) ? list.map((x) => String(x || '').trim()).filter(Boolean) : [];
    } catch (_) {
      return [];
    }
  }

  function getSelectedProjects(root) {
    return parseProjectTypes(root.querySelector('#apply-project-types')?.value || '[]');
  }

  function projectTypeSheetHtml(selected) {
    const active = Array.isArray(selected) ? selected : [];
    const options = loadProjectTypeOptions().slice();
    active.forEach((name) => {
      if (name && !options.includes(name)) options.unshift(name);
    });
    return options
      .map((item) => {
        const on = active.includes(item) ? ' apply-cert-sheet__item--active' : '';
        return `<button type="button" class="profile-action-sheet__item${on}" data-project="${escapeHtml(item)}">${escapeHtml(item)}</button>`;
      })
      .join('');
  }

  function setProjectTypes(root, selected) {
    const list = (Array.isArray(selected) ? selected : [])
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .slice(0, PROJECT_TYPE_MAX);
    const input = root.querySelector('#apply-project-types');
    const label = root.querySelector('#apply-project-label');
    const trigger = root.querySelector('#apply-project-trigger');
    if (input) input.value = JSON.stringify(list);
    if (label) label.textContent = list.length ? list.join('、') : '请选择';
    if (trigger) trigger.classList.toggle('apply-picker--placeholder', !list.length);
    const listEl = document.querySelector('#apply-project-list');
    if (listEl) listEl.innerHTML = projectTypeSheetHtml(list);
  }

  function openProjectSheet(sheet) {
    if (!sheet) return;
    sheet.hidden = false;
    document.getElementById('apply-project-trigger')?.setAttribute('aria-expanded', 'true');
  }

  function closeProjectSheet(sheet) {
    if (!sheet) return;
    sheet.hidden = true;
    document.getElementById('apply-project-trigger')?.setAttribute('aria-expanded', 'false');
  }

  let cleanup = null;
  let sentSmsCode = null;
  let countdownTimer = null;
  let countdownLeft = 0;
  let smsSentOnce = false;
  let certCount = 0;
  /** @type {{ active: boolean, heroId: string|null }} */
  let editContext = { active: false, heroId: null };
  let showcaseSections = createDefaultShowcaseSections();
  let showcaseSectionSeq = 1;

  function isEditMode() {
    try {
      return new URLSearchParams(window.location.search).get('mode') === 'edit';
    } catch (_) {
      return false;
    }
  }

  function setPageChrome(isEdit) {
    const title = isEdit ? '修改资料' : '申请成为英雄';
    document.title = `${title} · 英雄广场`;
    const navTitle = document.querySelector('.mp-navbar__title');
    if (navTitle) navTitle.textContent = title;
  }

  function heroToDraft(hero) {
    if (!hero) return null;
    const certs = Array.isArray(hero.certificates) ? hero.certificates : [];
    return {
      nickname: hero.nickname || hero.name || '',
      name: hero.name || '',
      phone: hero.phone || '',
      id_doc_type: hero.id_doc_type || DEFAULT_ID_DOC_TYPE,
      id_card: hero.id_card || '',
      bank_account: hero.bank_account || '',
      address: hero.address || hero.city || '',
      bio: hero.about_me || hero.bio || '',
      project_types: hero.project_types || [],
      certification: hero.certification || (hero.cert_badges || [])[0] || '',
      years_exp: hero.years_exp || '',
      cert_count: certs.length || Number(hero.cert_count) || 0,
      certificates: certs,
    };
  }

  /** 待审 after 覆盖正式资料，供修改资料表单回填（对外仍用 heroes） */
  function mergePendingAfter(draft, after) {
    if (!draft || !after || typeof after !== 'object') return draft;
    const certification =
      after.certification ||
      (Array.isArray(after.cert_badges) && after.cert_badges[0]) ||
      draft.certification ||
      '';
    return {
      ...draft,
      nickname: after.nickname != null ? after.nickname : draft.nickname,
      name: after.name != null ? after.name : draft.name,
      phone: after.phone != null ? after.phone : draft.phone,
      id_doc_type: after.id_doc_type != null ? after.id_doc_type : draft.id_doc_type,
      id_card: after.id_card != null ? after.id_card : draft.id_card,
      bank_account: after.bank_account != null ? after.bank_account : draft.bank_account,
      address: after.address || after.city || draft.address,
      bio: after.bio || after.about_me || draft.bio,
      project_types: Array.isArray(after.project_types)
        ? after.project_types
        : draft.project_types,
      certification,
      years_exp: after.years_exp != null ? after.years_exp : draft.years_exp,
      cert_count:
        after.cert_count != null ? Number(after.cert_count) || 0 : draft.cert_count,
    };
  }

  function buildProfilePatch(form, showcasePayload) {
    const certification = form.certification || '';
    return {
      nickname: form.nickname,
      name: form.name,
      phone: form.phone,
      id_doc_type: form.id_doc_type || DEFAULT_ID_DOC_TYPE,
      id_card: form.id_card,
      bank_account: form.bank_account,
      project_types: form.project_types,
      city: form.address || '',
      address: form.address || '',
      certification,
      years_exp: form.years_exp,
      bio: form.bio,
      about_me: form.bio,
      cert_count: form.cert_count || 0,
      certificates: Array.isArray(form.certificates) ? form.certificates : [],
      cert_badges: certification ? [certification] : [],
      ...showcasePayload,
    };
  }

  function showToast(msg, type) {
    if (window.PreviewToast) {
      window.PreviewToast.show(msg, type || 'error', 2000);
      return;
    }
    window.alert(msg);
  }

  function getRoot() {
    return document.getElementById('hero-apply-root');
  }

  function getShell(root) {
    return root?.closest('.mobile-shell') || null;
  }

  function removeStaleFooters(shell) {
    shell?.querySelectorAll(':scope > .apply-footer--pinned').forEach((node) => node.remove());
    shell?.querySelectorAll(
      ':scope > #apply-cert-sheet, :scope > #apply-project-sheet, :scope > #apply-id-doc-type-sheet, :scope > #apply-showcase-media-sheet',
    ).forEach((node) => node.remove());
  }

  function pinFooterToShell(root, shell) {
    const footer = root.querySelector('#apply-footer');
    if (!footer || !shell) return;
    footer.classList.add('apply-footer--pinned');
    shell.appendChild(footer);
  }

  function pinSheetToShell(root, shell, sheetId) {
    const sheet = root.querySelector(`#${sheetId}`);
    if (!sheet || !shell) return sheet;
    shell.appendChild(sheet);
    return sheet;
  }

  function setCertValue(root, value) {
    const input = root.querySelector('#apply-cert');
    const label = root.querySelector('#apply-cert-label');
    const trigger = root.querySelector('#apply-cert-trigger');
    if (!input || !label || !trigger) return;
    const text = (value || '').trim();
    input.value = text;
    label.textContent = text || '请选择';
    trigger.classList.toggle('apply-picker--placeholder', !text);
    document.querySelectorAll('#apply-cert-list [data-cert]').forEach((btn) => {
      btn.classList.toggle('apply-cert-sheet__item--active', btn.dataset.cert === text);
    });
  }

  function openCertSheet(sheet) {
    if (!sheet) return;
    sheet.hidden = false;
  }

  function closeCertSheet(sheet) {
    if (!sheet) return;
    sheet.hidden = true;
  }

  function setIdDocType(root, value) {
    const input = root.querySelector('#apply-id-doc-type');
    const label = root.querySelector('#apply-id-doc-type-label');
    const trigger = root.querySelector('#apply-id-doc-type-trigger');
    if (!input || !label || !trigger) return;
    const text = ID_DOC_TYPES.includes(value) ? value : DEFAULT_ID_DOC_TYPE;
    input.value = text;
    label.textContent = text;
    trigger.classList.remove('apply-picker--placeholder');
    document.querySelectorAll('#apply-id-doc-type-list [data-id-doc-type]').forEach((btn) => {
      btn.classList.toggle('apply-cert-sheet__item--active', btn.dataset.idDocType === text);
    });
  }

  function openIdDocTypeSheet(sheet) {
    if (!sheet) return;
    sheet.hidden = false;
  }

  function closeIdDocTypeSheet(sheet) {
    if (!sheet) return;
    sheet.hidden = true;
  }

  function hasCertUploaded(root) {
    return !!root.querySelector('#apply-cert-grid .apply-cert-row[data-cert-url]');
  }

  function collectCertPayload(root) {
    return [...root.querySelectorAll('#apply-cert-grid .apply-cert-row[data-cert-url]')].map((row) => {
      const name = row.querySelector('.apply-cert-row__name')?.value?.trim() || '';
      return { name, image: row.dataset.certUrl || '' };
    });
  }

  async function loadEditDraft() {
    const db = window.HeroPlazaDB;
    if (!db || !(await db.isAvailable())) return { ok: false, reason: 'api' };
    try {
      const status = await db.getHeroApplyStatus();
      if (status?.status !== 'approved') {
        return { ok: false, reason: 'not_approved' };
      }
      const heroId = status.hero_id || status.application?.hero_id || null;
      if (!heroId) return { ok: false, reason: 'no_hero' };
      let draft = status.application || null;
      if (!draft) {
        const hero = await db.getHero(heroId);
        draft = heroToDraft(hero);
      } else {
        // 申请单可能缺最新字段，用英雄资料补齐
        try {
          const hero = await db.getHero(heroId);
          if (hero) {
            draft = {
              ...heroToDraft(hero),
              ...draft,
              bio: draft.bio || hero.about_me || hero.bio || '',
              nickname: draft.nickname || hero.nickname || '',
              project_types: draft.project_types?.length ? draft.project_types : hero.project_types,
              cert_count:
                draft.cert_count ||
                (Array.isArray(hero.certificates) ? hero.certificates.length : 0) ||
                0,
            };
          }
        } catch (_) {
          /* ignore */
        }
      }
      // 有待审资料变更时，表单回填最新提交（二次提交覆盖后的 after）
      const pendingAfter = status.pending_profile_change?.after;
      if (pendingAfter) {
        draft = mergePendingAfter(draft || {}, pendingAfter);
      }
      return {
        ok: true,
        heroId: String(heroId),
        draft,
        profilePending: !!status.profile_change_pending || !!status.pending_profile_change,
      };
    } catch (_) {
      return { ok: false, reason: 'error' };
    }
  }

  async function loadDraftApplication() {
    const db = window.HeroPlazaDB;
    if (!db || !(await db.isAvailable())) return null;
    try {
      const status = await db.getHeroApplyStatus();
      if (status?.status === 'rejected' && status.application) {
        return status.application;
      }
      if (status?.status === 'rejected') {
        const saved = await db.getAppState('hero_apply_form');
        if (saved && typeof saved === 'object') return saved;
      }
    } catch (_) {
      /* ignore */
    }
    return null;
  }

  function fillDraft(root, draft, helpers) {
    if (!root || !draft) return;
    const setVal = (field, value) => {
      const el = root.querySelector(`[data-field="${field}"]`);
      if (el && value != null) el.value = String(value);
    };
    setVal('nickname', draft.nickname || '');
    setVal('name', draft.name || '');
    setVal('phone', draft.phone || '');
    setVal('id_card', draft.id_card || '');
    setVal('bank_account', draft.bank_account || '');
    setVal('address', draft.address || '');
    setVal('bio', draft.bio || '');
    helpers?.updateBioCount?.();
    setIdDocType(root, draft.id_doc_type || DEFAULT_ID_DOC_TYPE);

    const projects = Array.isArray(draft.project_types)
      ? draft.project_types
      : draft.project_type
        ? [draft.project_type]
        : [];
    setProjectTypes(root, projects);

    const certSelect = root.querySelector('#apply-cert');
    if (certSelect && draft.certification) {
      setCertValue(root, draft.certification);
    }

    const years = draft.years_exp || '';
    root.querySelectorAll('#apply-years-tags .apply-tag').forEach((btn) => {
      btn.classList.toggle('apply-tag--active', btn.dataset.years === years);
    });

    const count = Math.min(
      CERT_MAX,
      Number(draft.cert_count) ||
        (Array.isArray(draft.certFiles) ? draft.certFiles.filter((f) => f?.url).length : 0) ||
        (Array.isArray(draft.certificates) ? draft.certificates.length : 0) ||
        0,
    );
    const fromFiles = Array.isArray(draft.certFiles)
      ? draft.certFiles
          .filter((f) => f?.url)
          .slice(0, CERT_MAX)
          .map((f, i) => ({
            url: f.url,
            name: f.label || f.name || `证书${i + 1}`,
          }))
      : [];
    const fromHero = Array.isArray(draft.certificates)
      ? draft.certificates
          .map((c, i) => {
            const item = typeof c === 'string' ? { name: `证书${i + 1}`, image: c } : c;
            return {
              url: item.image || item.url || '',
              name: item.name || item.label || `证书${i + 1}`,
            };
          })
          .filter((f) => f.url)
          .slice(0, CERT_MAX)
      : [];
    const list = fromFiles.length ? fromFiles : fromHero;
    if (list.length) {
      list.forEach((item) => helpers?.appendCertItem?.(item.url, item.name));
    } else {
      for (let i = 0; i < count; i += 1) {
        helpers?.appendCertItem?.(`${imgBase}cert.jpg`, `证书${i + 1}`);
      }
    }

    showcaseSections = showcaseSectionsFromDraft(draft);
    showcaseSectionSeq = Math.max(
      showcaseSectionSeq,
      ...showcaseSections.map((section) => {
        const num = Number(String(section.id || '').replace(/^showcase-/, ''));
        return Number.isFinite(num) ? num : 1;
      }),
    );
    helpers?.renderShowcaseSections?.();

    helpers?.updateSendBtn?.();
  }

  async function handleSubmit(root, agree) {
    if (handleSubmit.busy) return;
    const nickname = root.querySelector('[data-field="nickname"]')?.value ?? '';
    const name = root.querySelector('[data-field="name"]')?.value ?? '';
    const phone = root.querySelector('[data-field="phone"]')?.value?.trim();
    const smsCode = root.querySelector('[data-field="sms_code"]')?.value?.trim();
    const idCard = root.querySelector('[data-field="id_card"]')?.value?.trim();
    const idDocType =
      root.querySelector('#apply-id-doc-type')?.value?.trim() || DEFAULT_ID_DOC_TYPE;
    const bankAccount = root.querySelector('[data-field="bank_account"]')?.value?.trim();
    const address = root.querySelector('[data-field="address"]')?.value ?? '';
    const bio = root.querySelector('[data-field="bio"]')?.value?.trim();
    const certification = root.querySelector('#apply-cert')?.value?.trim();
    const projects = getSelectedProjects(root);
    const currentProjectOptions = loadProjectTypeOptions();

    if (!nickname) {
      showToast('请填写昵称');
      return;
    }
    if (!phone || !/^1\d{10}$/.test(phone)) {
      showToast('请填写正确的手机号');
      return;
    }
    if (!smsCode || !sentSmsCode || smsCode !== sentSmsCode) {
      showToast('请填写正确的验证码');
      return;
    }
    if (!name) {
      showToast('请填写姓名');
      return;
    }
    if (!ID_DOC_TYPES.includes(idDocType)) {
      showToast('请选择证件类型');
      return;
    }
    if (!idCard) {
      showToast('请填写证件号码');
      return;
    }
    if (idDocType === '身份证') {
      if (!validateIdCard(idCard)) {
        showToast('实名校验未通过，请核对姓名与身份证号');
        return;
      }
    } else if (!name || !idCard) {
      showToast('实名校验未通过，请核对姓名与证件号码');
      return;
    }
    if (projects.length === 0) {
      showToast('请选择项目类型');
      return;
    }
    if (projects.length > PROJECT_TYPE_MAX) {
      showToast(`项目类型最多选择${PROJECT_TYPE_MAX}个`);
      return;
    }
    if (projects.some((item) => !currentProjectOptions.includes(item))) {
      showToast('当前所选项目类型不存在，请重新选择');
      return;
    }
    if (!certification) {
      showToast('请选择教练资质等级');
      return;
    }
    if (!isCertificationValid(certification, certOptions)) {
      showToast('当前所选资质等级不存在，请重新选择');
      return;
    }

    const yearsBtn = root.querySelector('#apply-years-tags .apply-tag--active');
    const yearsExp = yearsBtn?.dataset.years || '';
    if (!yearsExp) {
      showToast('请选择经验年限');
      return;
    }
    if (!yearsOptions.includes(yearsExp)) {
      showToast('当前所选经验年限不存在，请重新选择');
      return;
    }
    if (!hasCertUploaded(root)) {
      showToast('请上传资证证书');
      return;
    }
    const certificates = collectCertPayload(root);
    if (certificates.some((c) => !c.name)) {
      showToast('请填写证书名称');
      return;
    }
    if (!bio) {
      showToast('请填写详细介绍');
      return;
    }
    const showcaseError = validateShowcaseSections(showcaseSections);
    if (showcaseError) {
      showToast(showcaseError);
      return;
    }
    if (!agree?.checked) {
      showToast('请阅读并同意相关协议');
      return;
    }

    const showcasePayload = showcaseSectionsToPayload(showcaseSections);

    const db = window.HeroPlazaDB;
    if (!db || !(await db.isAvailable())) {
      showToast('提交失败，请确认本地数据库服务已启动（:8787）');
      return;
    }

    const application = {
      nickname,
      name,
      phone,
      sms_code: smsCode,
      id_doc_type: idDocType,
      id_card: idCard,
      bank_account: bankAccount,
      project_types: projects,
      city: address,
      address,
      certification,
      years_exp: yearsExp,
      honors: '',
      bio,
      cert_count: certificates.length,
      certificates,
      channel: '自主申请',
      submitted_at: new Date().toISOString(),
      ...showcasePayload,
    };

    const submitBtn = document.getElementById('apply-submit');
    const submitLabel = editContext.active ? '提交修改' : '提交申请';
    handleSubmit.busy = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '提交中…';
    }

    try {
      if (editContext.active) {
        if (!editContext.heroId) {
          showToast('资料加载失败，请返回重试');
          return;
        }
        const patch = buildProfilePatch(
          {
            nickname,
            name,
            phone,
            id_doc_type: idDocType,
            id_card: idCard,
            bank_account: bankAccount,
            project_types: projects,
            address,
            certification,
            years_exp: yearsExp,
            bio,
            cert_count: certificates.length,
            certificates,
          },
          showcasePayload,
        );
        await db.submitProfileChange(editContext.heroId, patch, 'profile');
        try {
          localStorage.setItem('hero_plaza_profile_changes_updated', String(Date.now()));
          window.dispatchEvent(new CustomEvent('hero_plaza_profile_changes_updated'));
        } catch (_) {
          /* ignore */
        }
        showToast('已提交审核', 'success');
        setTimeout(() => {
          if (window.PreviewNav?.navigateTo) {
            window.PreviewNav.navigateTo('profile.html', 'back', { replace: true });
          } else {
            window.location.href = 'profile.html';
          }
        }, 600);
        return;
      }

      await db.submitHeroApply(application);
      try {
        localStorage.setItem('hero_plaza_applications_updated', String(Date.now()));
        window.dispatchEvent(new CustomEvent('hero_plaza_applications_updated'));
      } catch (_) {
        /* ignore */
      }
      const submittedParams = new URLSearchParams();
      if (returnFrom === 'hero-detail') {
        submittedParams.set('from', 'hero-detail');
        if (returnHeroId) submittedParams.set('hero_id', returnHeroId);
      }
      const submittedQuery = submittedParams.toString();
      const submittedTarget = `hero-apply-submitted.html${submittedQuery ? `?${submittedQuery}` : ''}`;
      if (window.PreviewNav?.navigateTo) {
        window.PreviewNav.navigateTo(submittedTarget, 'forward', { replace: true });
      } else {
        window.location.href = submittedTarget;
      }
    } catch (err) {
      const code = err?.payload?.error || err?.message || '';
      if (code === 'already_approved') {
        showToast('您已是认证英雄，无需重复申请');
        return;
      }
      if (code === 'application_pending') {
        showToast('申请审核中，请勿重复提交');
        return;
      }
      if (code === 'not_found' || err?.status === 404) {
        showToast('API 接口未找到，请重启本地数据库服务（:8787）');
        return;
      }
      showToast(`提交失败：${code || '请稍后重试'}`);
      console.error(err);
    } finally {
      handleSubmit.busy = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }
    }
  }

  async function initHeroApplyPage() {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }

    const root = getRoot();
    if (!root) return;

    const isEdit = isEditMode();
    editContext = { active: false, heroId: null };
    setPageChrome(isEdit);

    let pendingDraft = null;
    if (isEdit) {
      const loaded = await loadEditDraft();
      if (!loaded.ok) {
        showToast(loaded.reason === 'api' ? '请先启动本地 API' : '仅认证英雄可修改资料');
        setTimeout(() => {
          if (window.PreviewNav?.navigateTo) {
            window.PreviewNav.navigateTo('profile.html', 'back', { replace: true });
          } else {
            window.location.href = 'profile.html';
          }
        }, 1200);
        return;
      }
      editContext = {
        active: true,
        heroId: loaded.heroId,
        profilePending: !!loaded.profilePending,
      };
      pendingDraft = loaded.draft;
    }

    const shell = getShell(root);
    removeStaleFooters(shell);
    sentSmsCode = null;
    countdownLeft = 0;
    smsSentOnce = false;
    certCount = 0;
    showcaseSections = createDefaultShowcaseSections();
    showcaseSectionSeq = 1;
    clearInterval(countdownTimer);
    countdownTimer = null;

    const submitLabel = isEdit ? '提交修改' : '提交申请';

    root.innerHTML = `
    <div class="apply">
      <section class="apply-section">
        <div class="apply-section__title">基本信息</div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">昵称</label>
          <input class="apply-input" value="" placeholder="请输入" data-field="nickname" maxlength="10" />
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">手机号</label>
          <div class="apply-phone-wrap">
            <input class="apply-input apply-input--phone" type="tel" maxlength="11" placeholder="请输入" data-field="phone" value="" inputmode="numeric" />
            <button type="button" class="apply-sms-code" id="apply-sms-send" disabled>获取验证码</button>
          </div>
          <div class="apply-sms-field" id="apply-sms-field">
            <input class="apply-input" type="tel" maxlength="6" placeholder="请输入" data-field="sms_code" inputmode="numeric" />
          </div>
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">姓名</label>
          <input class="apply-input" value="" placeholder="请输入" data-field="name" maxlength="10" />
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">证件类型</label>
          <button type="button" class="apply-picker" id="apply-id-doc-type-trigger">
            <span id="apply-id-doc-type-label">${DEFAULT_ID_DOC_TYPE}</span>
            <span class="apply-picker__arrow">›</span>
          </button>
          <input type="hidden" id="apply-id-doc-type" value="${DEFAULT_ID_DOC_TYPE}" />
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">证件号码</label>
          <input class="apply-input" value="" placeholder="请输入" data-field="id_card" maxlength="32" />
        </div>
        <div class="apply-field">
          <label class="apply-label">银行账户</label>
          <input class="apply-input" value="" placeholder="请输入" data-field="bank_account" />
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">项目类型</label>
          <button type="button" class="apply-picker apply-picker--placeholder" id="apply-project-trigger" aria-haspopup="listbox" aria-expanded="false">
            <span id="apply-project-label">请选择</span>
            <span class="apply-picker__arrow">›</span>
          </button>
          <input type="hidden" id="apply-project-types" value="[]" />
        </div>
        <div class="apply-field">
          <label class="apply-label">收货地址（选填）</label>
          <textarea class="apply-textarea" placeholder="请输入" data-field="address" rows="2" maxlength="100"></textarea>
        </div>
      </section>

      <section class="apply-section">
        <div class="apply-section__title">资质认证</div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">教练资质等级</label>
          <button type="button" class="apply-picker apply-picker--placeholder" id="apply-cert-trigger">
            <span id="apply-cert-label">请选择</span>
            <span class="apply-picker__arrow">›</span>
          </button>
          <input type="hidden" id="apply-cert" value="" />
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">经验年限</label>
          <div class="apply-tags" id="apply-years-tags">${yearsOptions
            .map((item) => `<button type="button" class="apply-tag" data-years="${item}">${item}</button>`)
            .join('')}</div>
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">资质证书上传</label>
          <div class="apply-cert-list" id="apply-cert-grid">
            <button type="button" class="apply-cert-add apply-cert-add--row" id="apply-cert-add"><span class="apply-cert-add__icon">+</span><span class="apply-cert-add__text">上传证书</span></button>
          </div>
          <input type="file" id="apply-cert-file" accept="image/*" hidden />
        </div>
      </section>

      <section class="apply-section">
        <div class="apply-section__title">个人简介</div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">详细介绍</label>
          <div class="apply-textarea-wrap">
            <textarea class="apply-textarea apply-textarea--lg apply-textarea--autosize" data-field="bio" placeholder="请输入个人详细介绍，如教学风格，擅长方向" maxlength="500"></textarea>
            <span class="apply-textarea-count" id="apply-bio-count">0/500</span>
          </div>
        </div>
        <div class="apply-field">
          <label class="apply-label apply-label--required">个人展示</label>
          <div class="apply-showcase-list" id="apply-showcase-list"></div>
          <input type="file" id="apply-showcase-media-file" accept="image/*" multiple hidden />
        </div>
      </section>

      <div class="apply-footer" id="apply-footer">
        <label class="apply-agreement">
          <input type="checkbox" class="apply-agreement__input" id="apply-agree" />
          <span class="apply-agreement__check"></span>
          <span class="apply-agreement__text">我已阅读并同意<span class="apply-agreement__link">《英雄认证协议》</span><span class="apply-agreement__link">《平台服务条款》</span>和<span class="apply-agreement__link">《安全保障须知》</span>，承诺以上信息真实有效。</span>
        </label>
        ${
          isEdit && editContext.profilePending
            ? '<button type="button" class="apply-submit apply-submit--ghost" id="apply-withdraw">撤回审核</button>'
            : ''
        }
        <button type="button" class="apply-submit" id="apply-submit">${submitLabel}</button>
      </div>

      <div class="profile-action-sheet mobile-overlay apply-cert-sheet" id="apply-id-doc-type-sheet" hidden>
        <div class="profile-action-sheet__mask" data-close-id-doc-type></div>
        <div class="profile-action-sheet__panel" role="dialog" aria-modal="true" aria-label="选择证件类型">
          <div class="apply-cert-sheet__title">选择证件类型</div>
          <div class="apply-cert-sheet__list" id="apply-id-doc-type-list">
            ${ID_DOC_TYPES.map(
              (o) =>
                `<button type="button" class="profile-action-sheet__item${
                  o === DEFAULT_ID_DOC_TYPE ? ' apply-cert-sheet__item--active' : ''
                }" data-id-doc-type="${o}">${o}</button>`,
            ).join('')}
          </div>
          <button type="button" class="profile-action-sheet__item profile-action-sheet__item--cancel" data-close-id-doc-type>取消</button>
        </div>
      </div>

      <div class="profile-action-sheet mobile-overlay apply-cert-sheet" id="apply-cert-sheet" hidden>
        <div class="profile-action-sheet__mask" data-close-cert></div>
        <div class="profile-action-sheet__panel">
          <div class="apply-cert-sheet__title">选择资质等级</div>
          <div class="apply-cert-sheet__list" id="apply-cert-list">
            ${certOptions
              .map(
                (o) =>
                  `<button type="button" class="profile-action-sheet__item" data-cert="${o}">${o}</button>`,
              )
              .join('')}
          </div>
          <button type="button" class="profile-action-sheet__item profile-action-sheet__item--cancel" data-close-cert>取消</button>
        </div>
      </div>

      <div class="profile-action-sheet mobile-overlay apply-cert-sheet" id="apply-project-sheet" hidden>
        <div class="profile-action-sheet__mask" data-close-project></div>
        <div class="profile-action-sheet__panel" role="dialog" aria-modal="true" aria-label="选择项目类型">
          <div class="apply-cert-sheet__header">
            <div class="apply-cert-sheet__title">选择项目类型（最多${PROJECT_TYPE_MAX}个）</div>
            <button type="button" class="apply-cert-sheet__done" data-close-project>完成</button>
          </div>
          <div class="apply-cert-sheet__list" id="apply-project-list">${projectTypeSheetHtml([])}</div>
        </div>
      </div>

      <div class="profile-action-sheet mobile-overlay apply-cert-sheet" id="apply-showcase-media-sheet" hidden>
        <div class="profile-action-sheet__mask" data-close-showcase-media></div>
        <div class="profile-action-sheet__panel" role="dialog" aria-modal="true" aria-label="选择上传类型">
          <button type="button" class="profile-action-sheet__item" data-showcase-media-pick="image">上传图片</button>
          <button type="button" class="profile-action-sheet__item" data-showcase-media-pick="video">上传视频</button>
          <button type="button" class="profile-action-sheet__item profile-action-sheet__item--cancel" data-close-showcase-media>取消</button>
        </div>
      </div>
    </div>`;

    pinFooterToShell(root, shell);
    const certSheet = pinSheetToShell(root, shell, 'apply-cert-sheet');
    const projectSheet = pinSheetToShell(root, shell, 'apply-project-sheet');
    const showcaseMediaSheet = pinSheetToShell(root, shell, 'apply-showcase-media-sheet');
    const idDocTypeSheet = pinSheetToShell(root, shell, 'apply-id-doc-type-sheet');
    setIdDocType(root, DEFAULT_ID_DOC_TYPE);

    const agree = document.getElementById('apply-agree');
    const agreeVisual = document.querySelector('#apply-footer .apply-agreement__check');
    const phoneInput = root.querySelector('[data-field="phone"]');
    const sendBtn = root.querySelector('#apply-sms-send');
    const smsField = root.querySelector('#apply-sms-field');
    const certGrid = root.querySelector('#apply-cert-grid');
    const certAddBtn = root.querySelector('#apply-cert-add');
    const certFileInput = root.querySelector('#apply-cert-file');
    const certTrigger = root.querySelector('#apply-cert-trigger');
    const idDocTypeTrigger = root.querySelector('#apply-id-doc-type-trigger');
    const showcaseList = root.querySelector('#apply-showcase-list');
    const showcaseMediaInput = root.querySelector('#apply-showcase-media-file');
    let activeShowcaseSectionId = null;
    // certCount 使用外层变量，提交时写入 cert_count

    function updateBioCount() {
      const bioEl = root.querySelector('[data-field="bio"]');
      const countEl = root.querySelector('#apply-bio-count');
      if (!bioEl || !countEl) return;
      const len = (bioEl.value || '').length;
      countEl.textContent = `${len}/500`;
    }

    function getShowcaseSection(sectionId) {
      return showcaseSections.find((section) => section.id === sectionId) || null;
    }

    function revokeBlobUrl(url) {
      if (url && String(url).startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {
          /* ignore */
        }
      }
    }

    function clearShowcaseImages(section) {
      (section.images || []).forEach((url) => revokeBlobUrl(url));
      section.images = [];
    }

    function renderShowcaseSectionMedia(section) {
      const images = section.images || [];
      const hasVideo = section.mode === 'video' && !!section.video;
      if (hasVideo) {
        const durationText = formatVideoDuration(section.videoDuration);
        return (
          `<div class="apply-showcase-video-fill" data-showcase-video-fill="${escapeHtml(section.id)}">` +
          `<video class="apply-showcase-video-fill__media" src="${escapeHtml(section.video)}" muted playsinline preload="metadata"></video>` +
          `<span class="apply-showcase-video-fill__duration">${escapeHtml(durationText)}</span>` +
          `<button type="button" class="apply-cert-item__remove apply-showcase-video-fill__remove" data-showcase-video-remove="${escapeHtml(section.id)}" aria-label="删除视频">×</button>` +
          `</div>`
        );
      }
      const items = images
        .map(
          (url, index) =>
            `<div class="apply-cert-item apply-showcase-item" data-showcase-image="${escapeHtml(section.id)}" data-image-index="${index}">` +
            `<img src="${escapeHtml(url)}" alt="">` +
            `<button type="button" class="apply-cert-item__remove" data-showcase-image-remove="${escapeHtml(section.id)}" data-image-index="${index}" aria-label="删除图片">×</button>` +
            `</div>`,
        )
        .join('');
      const canAdd = images.length < SHOWCASE_IMAGE_MAX;
      const addBtn = canAdd
        ? `<button type="button" class="apply-cert-add apply-showcase-add-media" data-showcase-media-add="${escapeHtml(section.id)}"><span class="apply-cert-add__icon">+</span><span class="apply-cert-add__text">${images.length ? '上传图片' : '上传图片/视频'}</span></button>`
        : '';
      return `<div class="apply-cert-grid apply-showcase-grid">${items}${addBtn}</div>`;
    }

    function renderShowcaseSections() {
      if (!showcaseList) return;
      showcaseList.innerHTML = showcaseSections
        .map((section) => {
          const introLen = Math.min(SHOWCASE_INTRO_MAX, (section.intro || '').length);
          const removeBtn = section.isDefault
            ? ''
            : `<button type="button" class="apply-showcase-section__remove" data-showcase-remove="${escapeHtml(section.id)}">删除栏目</button>`;
          const headHtml = section.isDefault
            ? ''
            : `<div class="apply-showcase-section__head">` +
              `<input type="text" class="apply-showcase-section__title-input" data-showcase-title="${escapeHtml(section.id)}" maxlength="20" value="${escapeHtml(section.title || '自定义栏目')}" />` +
              `${removeBtn}</div>`;
          const hasVideo = section.mode === 'video' && !!section.video;
          return (
            `<div class="apply-showcase-section" data-showcase-section="${escapeHtml(section.id)}">` +
            headHtml +
            `<div class="apply-textarea-wrap">` +
            `<textarea class="apply-textarea apply-textarea--autosize" data-showcase-intro="${escapeHtml(section.id)}" maxlength="${SHOWCASE_INTRO_MAX}" placeholder="请输入展示介绍">${escapeHtml(section.intro || '')}</textarea>` +
            `<span class="apply-textarea-count" data-showcase-intro-count="${escapeHtml(section.id)}">${introLen}/${SHOWCASE_INTRO_MAX}</span>` +
            `</div>` +
            `<div class="apply-showcase-media${hasVideo ? ' apply-showcase-media--video' : ''}">${renderShowcaseSectionMedia(section)}</div>` +
            `<p class="apply-showcase-media-hint">若上传视频，建议使用5分钟以内的视频</p>` +
            `</div>`
          );
        })
        .join('');
    }

    function removeShowcaseSection(sectionId) {
      const section = getShowcaseSection(sectionId);
      if (!section || section.isDefault) return;
      showcaseSections = showcaseSections.filter((item) => item.id !== sectionId);
      renderShowcaseSections();
    }

    function syncCertAddButton() {
      if (!certAddBtn) return;
      certAddBtn.style.display = certCount >= CERT_MAX ? 'none' : '';
      const text = certAddBtn.querySelector('.apply-cert-add__text');
      if (text) text.textContent = certCount ? '添加更多' : '上传证书';
    }

    function closeCertNameDialog() {
      document.getElementById('apply-cert-name-dialog')?.remove();
    }

    function openCertNameDialog(url) {
      closeCertNameDialog();
      const dialog = document.createElement('div');
      dialog.id = 'apply-cert-name-dialog';
      dialog.className = 'profile-dialog';
      dialog.innerHTML =
        `<div class="profile-dialog__mask" data-cert-name-cancel></div>` +
        `<div class="profile-dialog__panel" role="dialog" aria-modal="true">` +
        `<div class="profile-dialog__title">命名证书</div>` +
        `<div class="profile-dialog__body">` +
        `<img class="apply-cert-name-dialog__preview" src="${url}" alt="证书预览">` +
        `<input type="text" class="profile-dialog__input" id="apply-cert-name-input" maxlength="${CERT_NAME_MAX}" placeholder="请输入证书名称" />` +
        `</div>` +
        `<div class="profile-dialog__actions">` +
        `<button type="button" class="profile-dialog__btn" data-cert-name-cancel>取消</button>` +
        `<button type="button" class="profile-dialog__btn profile-dialog__btn--primary" data-cert-name-confirm>确认添加</button>` +
        `</div></div>`;
      (root.closest('.mobile-shell') || document.body).appendChild(dialog);
      const input = dialog.querySelector('#apply-cert-name-input');
      input?.focus();
      const discard = () => {
        if (url && url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(url);
          } catch (_) {
            /* ignore */
          }
        }
        closeCertNameDialog();
      };
      dialog.addEventListener('click', (e) => {
        if (e.target.closest('[data-cert-name-confirm]')) {
          const name = input?.value?.trim() || '';
          if (!name) {
            showToast('请填写证书名称');
            return;
          }
          closeCertNameDialog();
          appendCertItem(url, name);
          return;
        }
        if (e.target.closest('[data-cert-name-cancel]')) discard();
      });
    }

    function appendCertItem(url, name) {
      if (!certGrid || !certAddBtn || certCount >= CERT_MAX || !url) return;
      const label = String(name || '').trim().slice(0, CERT_NAME_MAX);
      if (!label) return;
      certCount += 1;
      const item = document.createElement('div');
      item.className = 'apply-cert-row';
      item.dataset.certUrl = url;
      item.innerHTML =
        `<img class="apply-cert-row__thumb" src="${url}" alt="${escapeHtml(label)}">` +
        `<input type="text" class="apply-cert-row__name" maxlength="${CERT_NAME_MAX}" value="${escapeHtml(label)}" placeholder="请输入证书名称" aria-label="证书名称">` +
        `<button type="button" class="apply-cert-row__remove" aria-label="删除证书">×</button>`;
      certGrid.insertBefore(item, certAddBtn);
      syncCertAddButton();
    }

    function onCertAddClick() {
      if (certCount >= CERT_MAX) {
        showToast(`最多上传${CERT_MAX}张证书`);
        return;
      }
      certFileInput?.click();
    }

    function onCertFileChange(e) {
      const file = (e.target.files || [])[0];
      e.target.value = '';
      if (!file) return;
      if (certCount >= CERT_MAX) {
        showToast(`最多上传${CERT_MAX}张证书`);
        return;
      }
      if (!String(file.type || '').startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      openCertNameDialog(url);
    }

    function onCertGridClick(e) {
      const removeBtn = e.target.closest('.apply-cert-row__remove');
      if (!removeBtn || !certGrid?.contains(removeBtn)) return;
      e.preventDefault();
      e.stopPropagation();
      const item = removeBtn.closest('.apply-cert-row');
      if (!item) return;
      const url = item.dataset.certUrl;
      if (url && url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {
          /* ignore */
        }
      }
      item.remove();
      certCount = Math.max(0, certCount - 1);
      syncCertAddButton();
    }
    const projectTrigger = root.querySelector('#apply-project-trigger');

    function syncAgreeVisual() {
      if (!agreeVisual || !agree) return;
      agreeVisual.classList.toggle('apply-agreement__check--on', agree.checked);
      agreeVisual.textContent = agree.checked ? '✓' : '';
    }

    function updateSendBtn() {
      const hasChars = !!(phoneInput && phoneInput.value.trim());
      if (!sendBtn || countdownLeft > 0) return;
      sendBtn.disabled = !hasChars;
      sendBtn.textContent = smsSentOnce ? '重新获取验证码' : '获取验证码';
      sendBtn.classList.toggle('apply-sms-code--active', hasChars);
      sendBtn.classList.remove('apply-sms-code--countdown');
    }

    function startCountdown() {
      if (!sendBtn) return;
      smsSentOnce = true;
      smsField?.classList.add('apply-sms-field--visible');
      countdownLeft = 60;
      sendBtn.disabled = true;
      sendBtn.classList.remove('apply-sms-code--active');
      sendBtn.classList.add('apply-sms-code--countdown');
      sendBtn.textContent = '60s';
      clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        countdownLeft -= 1;
        if (countdownLeft <= 0) {
          clearInterval(countdownTimer);
          countdownTimer = null;
          updateSendBtn();
          return;
        }
        sendBtn.textContent = `${countdownLeft}s`;
      }, 1000);
    }

    const onYearsTagsClick = (e) => {
      const btn = e.target.closest('[data-years]');
      if (!btn) return;
      root.querySelectorAll('#apply-years-tags .apply-tag').forEach((el) => el.classList.remove('apply-tag--active'));
      btn.classList.add('apply-tag--active');
    };

    const onAgreeChange = () => syncAgreeVisual();
    const onBioInput = () => updateBioCount();
    const onShowcaseListInput = (e) => {
      const introEl = e.target.closest('[data-showcase-intro]');
      if (introEl) {
        const section = getShowcaseSection(introEl.dataset.showcaseIntro || '');
        if (section) {
          section.intro = String(introEl.value || '').slice(0, SHOWCASE_INTRO_MAX);
          if (introEl.value !== section.intro) introEl.value = section.intro;
          const countEl = showcaseList?.querySelector(
            `[data-showcase-intro-count="${section.id}"]`,
          );
          if (countEl) countEl.textContent = `${section.intro.length}/${SHOWCASE_INTRO_MAX}`;
        }
      }
      const titleEl = e.target.closest('[data-showcase-title]');
      if (titleEl) {
        const section = getShowcaseSection(titleEl.dataset.showcaseTitle || '');
        if (section) section.title = titleEl.value || '自定义栏目';
      }
    };
    const onShowcaseListClick = (e) => {
      const removeSectionBtn = e.target.closest('[data-showcase-remove]');
      if (removeSectionBtn) {
        removeShowcaseSection(removeSectionBtn.dataset.showcaseRemove || '');
        return;
      }
      const addMediaBtn = e.target.closest('[data-showcase-media-add]');
      if (addMediaBtn) {
        activeShowcaseSectionId = addMediaBtn.dataset.showcaseMediaAdd || null;
        if (showcaseMediaSheet) showcaseMediaSheet.hidden = false;
        return;
      }
      const removeImageBtn = e.target.closest('[data-showcase-image-remove]');
      if (removeImageBtn) {
        const section = getShowcaseSection(removeImageBtn.dataset.showcaseImageRemove || '');
        const index = Number(removeImageBtn.dataset.imageIndex);
        if (section && !Number.isNaN(index)) {
          const url = section.images[index];
          revokeBlobUrl(url);
          section.images.splice(index, 1);
          section.mode = 'image';
          renderShowcaseSections();
        }
        return;
      }
      const removeVideoBtn = e.target.closest('[data-showcase-video-remove]');
      if (removeVideoBtn) {
        const section = getShowcaseSection(removeVideoBtn.dataset.showcaseVideoRemove || '');
        if (section) {
          revokeBlobUrl(section.video);
          section.video = '';
          section.videoDuration = 0;
          section.mode = 'image';
          renderShowcaseSections();
        }
      }
    };
    const onShowcaseMediaChange = async (e) => {
      const section = getShowcaseSection(activeShowcaseSectionId || '');
      const files = [...(e.target.files || [])];
      e.target.value = '';
      if (!section || !files.length) return;
      const videoFile = files.find((file) => String(file.type || '').startsWith('video/'));
      if (videoFile) {
        clearShowcaseImages(section);
        revokeBlobUrl(section.video);
        section.mode = 'video';
        section.video = URL.createObjectURL(videoFile);
        section.videoDuration = 0;
        renderShowcaseSections();
        const duration = await readVideoDuration(section.video);
        if (section.mode === 'video' && section.video) {
          section.videoDuration = duration;
          renderShowcaseSections();
        }
        return;
      }
      if (section.mode === 'video') {
        revokeBlobUrl(section.video);
        section.video = '';
        section.videoDuration = 0;
      }
      section.mode = 'image';
      if (!Array.isArray(section.images)) section.images = [];
      files.forEach((file) => {
        if (section.images.length >= SHOWCASE_IMAGE_MAX) return;
        if (!String(file.type || '').startsWith('image/')) return;
        section.images.push(URL.createObjectURL(file));
      });
      renderShowcaseSections();
    };
    const onPhoneInput = () => updateSendBtn();
    const onSendSmsClick = () => {
      if (countdownLeft > 0) return;
      const phone = phoneInput?.value?.trim() || '';
      if (!phone) return;
      if (!/^1\d{10}$/.test(phone)) {
        showToast('手机号格式不正确');
        return;
      }
      sentSmsCode = PREVIEW_SMS_CODE;
      showToast('短信验证码已发送', 'success');
      startCountdown();
    };

    const onCertTriggerClick = () => openCertSheet(certSheet);
    const onIdDocTypeTriggerClick = () => openIdDocTypeSheet(idDocTypeSheet);
    const onIdDocTypeSheetClick = (e) => {
      if (e.target.closest('[data-close-id-doc-type]')) {
        closeIdDocTypeSheet(idDocTypeSheet);
        return;
      }
      const item = e.target.closest('[data-id-doc-type]');
      if (!item) return;
      setIdDocType(root, item.dataset.idDocType || DEFAULT_ID_DOC_TYPE);
      closeIdDocTypeSheet(idDocTypeSheet);
    };
    const closeCustomCertDialog = () => {
      document.getElementById('apply-custom-cert-dialog')?.remove();
    };
    const openCustomCertDialog = () => {
      closeCustomCertDialog();
      closeCertSheet(certSheet);
      const dialog = document.createElement('div');
      dialog.id = 'apply-custom-cert-dialog';
      dialog.className = 'profile-dialog';
      dialog.innerHTML = `
        <div class="profile-dialog__mask" data-dialog-close></div>
        <div class="profile-dialog__panel" role="dialog" aria-modal="true">
          <div class="profile-dialog__title">自定义教练资质等级</div>
          <div class="profile-dialog__body">
            <input type="text" class="profile-dialog__input" id="apply-custom-cert-input" maxlength="30" placeholder="请输入资质等级名称" />
          </div>
          <div class="profile-dialog__actions">
            <button type="button" class="profile-dialog__btn" data-dialog-close>取消</button>
            <button type="button" class="profile-dialog__btn profile-dialog__btn--primary" data-dialog-confirm>确定</button>
          </div>
        </div>`;
      (shell || document.body).appendChild(dialog);
      const input = dialog.querySelector('#apply-custom-cert-input');
      setTimeout(() => input?.focus(), 50);
      dialog.addEventListener('click', (ev) => {
        if (ev.target.closest('[data-dialog-close]')) {
          closeCustomCertDialog();
          return;
        }
        if (ev.target.closest('[data-dialog-confirm]')) {
          const name = String(input?.value || '').trim();
          if (!name) {
            showToast('请输入教练资质等级');
            return;
          }
          if (certOptions.includes(name)) {
            showToast('当前资质等级名称已存在，不可重复');
            return;
          }
          setCertValue(root, name);
          closeCustomCertDialog();
        }
      });
    };
    const onCertSheetClick = (e) => {
      if (e.target.closest('[data-close-cert]')) {
        closeCertSheet(certSheet);
        return;
      }
      const item = e.target.closest('[data-cert]');
      if (!item) return;
      const cert = item.dataset.cert || '';
      if (cert === '其他') {
        openCustomCertDialog();
        return;
      }
      setCertValue(root, cert);
      closeCertSheet(certSheet);
    };

    const onProjectTriggerClick = () => openProjectSheet(projectSheet);
    const onProjectSheetClick = (e) => {
      if (e.target.closest('[data-close-project]')) {
        closeProjectSheet(projectSheet);
        return;
      }
      const item = e.target.closest('[data-project]');
      if (!item) return;
      const name = (item.dataset.project || '').trim();
      if (!name) return;
      const list = getSelectedProjects(root);
      const idx = list.indexOf(name);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        if (list.length >= PROJECT_TYPE_MAX) {
          showToast(`项目类型最多选择${PROJECT_TYPE_MAX}个`);
          return;
        }
        list.push(name);
      }
      setProjectTypes(root, list);
    };

    const closeShowcaseMediaSheet = () => {
      if (showcaseMediaSheet) showcaseMediaSheet.hidden = true;
    };

    const onShowcaseMediaSheetClick = (e) => {
      if (e.target.closest('[data-close-showcase-media]')) {
        closeShowcaseMediaSheet();
        return;
      }
      const pick = e.target.closest('[data-showcase-media-pick]');
      if (!pick || !showcaseMediaInput) return;
      const kind = pick.dataset.showcaseMediaPick || 'image';
      const section = getShowcaseSection(activeShowcaseSectionId || '');
      if (!section) {
        closeShowcaseMediaSheet();
        return;
      }
      if (kind === 'video') {
        showcaseMediaInput.accept = 'video/*';
        showcaseMediaInput.multiple = false;
      } else {
        const remain = SHOWCASE_IMAGE_MAX - (section.images || []).length;
        if (remain <= 0) {
          showToast('最多上传9张图片');
          closeShowcaseMediaSheet();
          return;
        }
        showcaseMediaInput.accept = 'image/*';
        showcaseMediaInput.multiple = true;
      }
      closeShowcaseMediaSheet();
      showcaseMediaInput.click();
    };

    const onShellClick = async (e) => {
      const withdrawBtn = e.target.closest('#apply-withdraw');
      if (withdrawBtn && shell?.contains(withdrawBtn)) {
        e.preventDefault();
        e.stopPropagation();
        if (!editContext.active || !editContext.heroId) return;
        if (!window.confirm('确认撤回本次资料变更审核？撤回后可重新修改再提交。')) return;
        try {
          const db = window.HeroPlazaDB;
          if (!db || !(await db.isAvailable())) {
            showToast('请先启动本地 API');
            return;
          }
          const res = await db.withdrawProfileChange(editContext.heroId);
          if (!res?.ok) {
            showToast('暂无待审资料可撤回');
            return;
          }
          try {
            localStorage.setItem('hero_plaza_profile_changes_updated', String(Date.now()));
            window.dispatchEvent(new CustomEvent('hero_plaza_profile_changes_updated'));
          } catch (_) {
            /* ignore */
          }
          showToast('已撤回审核', 'success');
          setTimeout(() => {
            if (window.PreviewNav?.navigateTo) {
              window.PreviewNav.navigateTo('profile.html', 'back', { replace: true });
            } else {
              window.location.href = 'profile.html';
            }
          }, 500);
        } catch (err) {
          showToast(`撤回失败：${err?.message || '请稍后重试'}`);
        }
        return;
      }
      const submitBtn = e.target.closest('#apply-submit');
      if (!submitBtn || !shell?.contains(submitBtn)) return;
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(root, agree);
    };

    root.querySelector('#apply-years-tags')?.addEventListener('click', onYearsTagsClick);
    agree?.addEventListener('change', onAgreeChange);
    certAddBtn?.addEventListener('click', onCertAddClick);
    certFileInput?.addEventListener('change', onCertFileChange);
    certGrid?.addEventListener('click', onCertGridClick);
    certTrigger?.addEventListener('click', onCertTriggerClick);
    certSheet?.addEventListener('click', onCertSheetClick);
    idDocTypeTrigger?.addEventListener('click', onIdDocTypeTriggerClick);
    idDocTypeSheet?.addEventListener('click', onIdDocTypeSheetClick);
    projectTrigger?.addEventListener('click', onProjectTriggerClick);
    projectSheet?.addEventListener('click', onProjectSheetClick);
    showcaseMediaSheet?.addEventListener('click', onShowcaseMediaSheetClick);
    showcaseList?.addEventListener('input', onShowcaseListInput);
    showcaseList?.addEventListener('click', onShowcaseListClick);
    showcaseMediaInput?.addEventListener('change', onShowcaseMediaChange);
    root.querySelector('[data-field="bio"]')?.addEventListener('input', onBioInput);
    phoneInput?.addEventListener('input', onPhoneInput);
    sendBtn?.addEventListener('click', onSendSmsClick);
    shell?.addEventListener('click', onShellClick, true);

    syncAgreeVisual();
    updateSendBtn();
    renderShowcaseSections();
    updateBioCount();

    const applyDraft = (draft) => {
      if (!draft || !getRoot()) return;
      fillDraft(root, draft, {
        appendCertItem,
        updateSendBtn,
        renderShowcaseSections,
        updateBioCount,
      });
    };

    if (pendingDraft) {
      applyDraft(pendingDraft);
    } else if (!isEdit) {
      loadDraftApplication().then(applyDraft);
    }

    cleanup = () => {
      clearInterval(countdownTimer);
      closeCertNameDialog();
      root.querySelector('#apply-years-tags')?.removeEventListener('click', onYearsTagsClick);
      agree?.removeEventListener('change', onAgreeChange);
      certAddBtn?.removeEventListener('click', onCertAddClick);
      certFileInput?.removeEventListener('change', onCertFileChange);
      certGrid?.removeEventListener('click', onCertGridClick);
      certTrigger?.removeEventListener('click', onCertTriggerClick);
      certSheet?.removeEventListener('click', onCertSheetClick);
      idDocTypeTrigger?.removeEventListener('click', onIdDocTypeTriggerClick);
      idDocTypeSheet?.removeEventListener('click', onIdDocTypeSheetClick);
      projectTrigger?.removeEventListener('click', onProjectTriggerClick);
      projectSheet?.removeEventListener('click', onProjectSheetClick);
      showcaseMediaSheet?.removeEventListener('click', onShowcaseMediaSheetClick);
      showcaseList?.removeEventListener('input', onShowcaseListInput);
      showcaseList?.removeEventListener('click', onShowcaseListClick);
      showcaseMediaInput?.removeEventListener('change', onShowcaseMediaChange);
      root.querySelector('[data-field="bio"]')?.removeEventListener('input', onBioInput);
      phoneInput?.removeEventListener('input', onPhoneInput);
      sendBtn?.removeEventListener('click', onSendSmsClick);
      shell?.removeEventListener('click', onShellClick, true);
      closeCertSheet(certSheet);
      closeIdDocTypeSheet(idDocTypeSheet);
      closeProjectSheet(projectSheet);
      document.getElementById('apply-custom-cert-dialog')?.remove();
      certSheet?.remove();
      idDocTypeSheet?.remove();
      projectSheet?.remove();
    };
  }

  async function boot() {
    try {
      await initHeroApplyPage();
    } catch (err) {
      console.error('[hero-apply-preview]', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.addEventListener('preview:navigate', () => {
    if (getRoot()) boot();
  });

  window.initHeroApplyPage = initHeroApplyPage;
})();
