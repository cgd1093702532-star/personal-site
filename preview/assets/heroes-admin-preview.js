/** 管理后台 · 供方列表 */
(function () {
  const root =
    document.getElementById('admin-page-root') ||
    document.querySelector('.admin-main__inner') ||
    document.body;
  if (!root) return;

  const tbody = document.getElementById('suppliers-tbody');
  const tabs = root.querySelectorAll('#suppliers-tabs [data-tab]');
  const tabCountApply = document.getElementById('tab-count-apply');
  const tabCountProfile = document.getElementById('tab-count-profile');
  const filterId = document.getElementById('filter-supplier-id');
  const filterKeyword = document.getElementById('filter-supplier-keyword');
  const filterProject = document.getElementById('filter-project-type');
  const filterEnabled = document.getElementById('filter-enabled');
  const filterAudit = document.getElementById('filter-audit-status');
  const searchBtn = document.getElementById('suppliers-search');
  const resetBtn = document.getElementById('suppliers-reset');
  const exportBtn = document.getElementById('suppliers-export');
  const orderReportBtn = document.getElementById('suppliers-order-report');
  const createBtn = document.getElementById('suppliers-create');
  const batchReviewBtn = document.getElementById('suppliers-batch-review');
  const checkAll = document.getElementById('suppliers-check-all');
  const paginationEl = document.getElementById('suppliers-pagination');
  const paginationTotal = document.getElementById('suppliers-pagination-total');
  const paginationPages = document.getElementById('suppliers-pagination-pages');
  const pagePrevBtn = document.getElementById('suppliers-page-prev');
  const pageNextBtn = document.getElementById('suppliers-page-next');

  const reviewModal = document.getElementById('heroes-review-modal');
  const reviewBody = document.getElementById('heroes-review-body');
  const reviewFoot = document.getElementById('heroes-review-foot');
  const reviewSubmit = document.getElementById('heroes-review-submit');
  const heroModal = document.getElementById('heroes-hero-modal');
  const heroBody = document.getElementById('heroes-hero-body');
  const heroFoot = document.getElementById('heroes-hero-foot');
  const heroSubmit = document.getElementById('heroes-hero-submit');
  const heroTitle = document.getElementById('heroes-hero-title');
  const deleteModal = document.getElementById('heroes-delete-modal');
  const deleteConfirmBtn = document.getElementById('heroes-delete-confirm');
  const deleteDesc = document.getElementById('heroes-delete-desc');

  const IMG_BASE = '../assets/images/';
  const AUDIT_LABEL = { pending: '待审核', approved: '审核通过', rejected: '审核驳回' };
  const PAGE_SIZE = 10;

  let currentTab = 'all';
  let currentPage = 1;
  let allRows = [];
  let selectedId = null;
  let deleteTargetId = null;
  let deleteTargetKind = 'hero';
  let heroEditId = null;
  let heroModalMode = 'view';
  let filters = {
    supplierId: '',
    keyword: '',
    projectType: '',
    enabled: '',
    auditStatus: '',
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function syncSelectPlaceholders() {
    [filterProject, filterEnabled, filterAudit].forEach((el) => {
      if (!el) return;
      el.classList.toggle('admin-select--placeholder', !el.value);
    });
  }

  function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      const s = String(iso);
      return s.includes('T') ? s.replace('T', ' ').replace(/-/g, '/') : s;
    }
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function maskPhone(phone) {
    const raw = String(phone || '').replace(/\s+/g, '');
    if (!raw) return '—';
    if (/^1\d{10}$/.test(raw)) return `${raw.slice(0, 3)}****${raw.slice(-4)}`;
    if (raw.length >= 7) return `${raw.slice(0, 3)}****${raw.slice(-4)}`;
    return raw;
  }

  function maskIdCard(idCard) {
    const raw = String(idCard || '').trim().toUpperCase();
    if (!raw) return '—';
    if (/^\d{17}[\dX]$/.test(raw)) return `${raw.slice(0, 6)}********${raw.slice(-4)}`;
    if (/^\d{15}$/.test(raw)) return `${raw.slice(0, 6)}*****${raw.slice(-4)}`;
    if (raw.length >= 10) {
      const keep = Math.min(6, Math.floor(raw.length / 3));
      return `${raw.slice(0, keep)}${'*'.repeat(Math.max(4, raw.length - keep - 4))}${raw.slice(-4)}`;
    }
    return raw;
  }

  function formatYears(value) {
    if (value == null || value === '') return '—';
    const raw = String(value);
    if (raw.includes('年')) return raw;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 10) return `${n}年+`;
    if (Number.isFinite(n)) return `${n}年`;
    return raw;
  }

  function displaySupplierId(row) {
    if (row.supplier_id) return String(row.supplier_id);
    const raw = String(row.hero_id || row.application_id || '');
    const digits = raw.replace(/\D/g, '');
    if (digits) {
      const n = Number(digits);
      if (Number.isFinite(n) && n < 1000) return String(10238330 + n);
      return digits.slice(-8);
    }
    return '—';
  }

  function avatarHtml(row) {
    const src = row.avatar_img ? `${IMG_BASE}${row.avatar_img}` : '';
    if (src) {
      return `<img class="admin-supplier-info__avatar" src="${escapeHtml(src)}" alt="" />`;
    }
    return `<span class="admin-supplier-info__avatar admin-supplier-info__avatar--placeholder" aria-hidden="true">供</span>`;
  }

  async function getDb() {
    if (!window.HeroPlazaDB || !(await window.HeroPlazaDB.isAvailable())) return null;
    return window.HeroPlazaDB;
  }

  function emptyRowHtml(message) {
    return `<tr><td colspan="13" class="admin-table__empty">
      <div class="admin-empty">
        <div class="admin-empty__icon" aria-hidden="true">
          <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M28 58h64l8 18H20l8-18Z" fill="#E8EEF6" stroke="#C5D0E0" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M34 58V42c0-2 1.5-4 4-4h44c2.5 0 4 2 4 4v16" stroke="#C5D0E0" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M42 38V30c0-2 1.5-3.5 3.5-3.5h29C76.5 26.5 78 28 78 30v8" stroke="#C5D0E0" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="admin-empty__text">${message}</div>
      </div>
    </td></tr>`;
  }

  function normalizeHeroRow(hero) {
    const audit = hero.audit_status || 'approved';
    return {
      kind: 'hero',
      row_key: `hero:${hero.hero_id}`,
      hero_id: hero.hero_id,
      application_id: hero.application_id || '',
      supplier_id: hero.supplier_id || '',
      name: hero.name || '',
      phone: hero.phone || '',
      id_card: hero.id_card || '',
      avatar_img: hero.avatar_img || '',
      project_types: hero.project_types || [],
      project_types_display: hero.project_types_display || (hero.project_types || []).join('、') || '—',
      certification: hero.certification || '—',
      enabled: hero.enabled !== false,
      audit_status: audit,
      audit_label: AUDIT_LABEL[audit] || hero.audit_status_label || '审核通过',
      reviewer: hero.reviewer != null ? hero.reviewer : audit === 'pending' ? '' : '小李',
      reviewed_at: hero.reviewed_at || '',
      channel: hero.channel != null ? hero.channel : audit === 'pending' ? '' : '后台创建',
      created_at: hero.created_at || hero.applied_at || '',
      profile_pending: false,
    };
  }

  function normalizeAppRow(app) {
    const audit = app.status || 'pending';
    return {
      kind: 'application',
      row_key: `app:${app.application_id}`,
      hero_id: app.hero_id || '',
      application_id: app.application_id,
      supplier_id: '',
      name: app.name || '',
      phone: app.phone || '',
      id_card: app.id_card || '',
      avatar_img: app.avatar_img || '',
      project_types: app.project_types || [],
      project_types_display: app.project_types_display || (app.project_types || []).join('、') || '—',
      certification: app.certification || '—',
      enabled: audit === 'approved',
      audit_status: audit,
      audit_label: AUDIT_LABEL[audit] || app.status_label || audit,
      reviewer: app.reviewer || (audit === 'pending' ? '' : '小李'),
      reviewed_at: app.reviewed_at || '',
      channel: app.channel || '自主申请',
      created_at: app.created_at || app.submitted_at || '',
      profile_pending: false,
    };
  }

  function buildUnifiedRows(heroes, applications, profilePendingIds) {
    const heroIdsWithPendingApp = new Set(
      applications.filter((a) => a.status === 'pending' && a.hero_id).map((a) => String(a.hero_id)),
    );
    const approvedHeroIds = new Set(heroes.map((h) => String(h.hero_id)));
    const rows = [];

    applications
      .filter((a) => a.status === 'pending' || (a.status !== 'approved' && !a.hero_id) || a.status === 'rejected')
      .forEach((app) => {
        if (app.status === 'approved' && app.hero_id && approvedHeroIds.has(String(app.hero_id))) return;
        const row = normalizeAppRow(app);
        if (app.hero_id && profilePendingIds.has(String(app.hero_id))) row.profile_pending = true;
        rows.push(row);
      });

    heroes.forEach((hero) => {
      if (heroIdsWithPendingApp.has(String(hero.hero_id)) && hero.audit_status === 'pending') return;
      const row = normalizeHeroRow(hero);
      if (profilePendingIds.has(String(hero.hero_id))) row.profile_pending = true;
      rows.push(row);
    });

    return rows;
  }

  function readFilters() {
    filters = {
      supplierId: (filterId?.value || '').trim(),
      keyword: (filterKeyword?.value || '').trim(),
      projectType: filterProject?.value || '',
      enabled: filterEnabled?.value || '',
      auditStatus: filterAudit?.value || '',
    };
  }

  function resetFilters() {
    if (filterId) filterId.value = '';
    if (filterKeyword) filterKeyword.value = '';
    if (filterProject) filterProject.value = '';
    if (filterEnabled) filterEnabled.value = '';
    if (filterAudit) filterAudit.value = '';
    readFilters();
    syncSelectPlaceholders();
  }

  function matchFilters(row) {
    if (filters.supplierId && !displaySupplierId(row).includes(filters.supplierId)) return false;
    if (filters.keyword) {
      const kw = filters.keyword;
      if (!(row.name || '').includes(kw) && !(row.phone || '').includes(kw)) return false;
    }
    if (filters.projectType) {
      const types = row.project_types || [];
      const display = row.project_types_display || '';
      if (!types.includes(filters.projectType) && !display.includes(filters.projectType)) return false;
    }
    // 入驻待审申请尚无启用态，Tab 下不按「供方状态」过滤
    const skipEnabled =
      currentTab === 'apply-pending' || (row.kind === 'application' && row.audit_status === 'pending');
    if (!skipEnabled) {
      if (filters.enabled === 'enabled' && !row.enabled) return false;
      if (filters.enabled === 'disabled' && row.enabled) return false;
    }
    if (filters.auditStatus && row.audit_status !== filters.auditStatus) return false;
    return true;
  }

  function matchTab(row) {
    if (currentTab === 'apply-pending') return row.kind === 'application' && row.audit_status === 'pending';
    if (currentTab === 'profile-pending') return row.profile_pending;
    return true;
  }

  function updateTabCounts() {
    const applyCount = allRows.filter((r) => r.kind === 'application' && r.audit_status === 'pending').length;
    const profileCount = allRows.filter((r) => r.profile_pending).length;
    if (tabCountApply) tabCountApply.textContent = `(${applyCount})`;
    if (tabCountProfile) tabCountProfile.textContent = `(${profileCount})`;
  }

  function getSelectedKeys() {
    if (!tbody) return [];
    return [...tbody.querySelectorAll('input[data-row-check]:checked')].map((el) => el.value).filter(Boolean);
  }

  function syncCheckAllState() {
    if (!checkAll || !tbody) return;
    const boxes = [...tbody.querySelectorAll('input[data-row-check]')];
    if (!boxes.length) {
      checkAll.checked = false;
      checkAll.indeterminate = false;
      return;
    }
    const checked = boxes.filter((el) => el.checked).length;
    checkAll.checked = checked === boxes.length;
    checkAll.indeterminate = checked > 0 && checked < boxes.length;
  }

  function filteredRows() {
    return allRows.filter((row) => matchTab(row) && matchFilters(row));
  }

  function pageCount(total) {
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }

  function clampPage(total) {
    const pages = pageCount(total);
    if (currentPage > pages) currentPage = pages;
    if (currentPage < 1) currentPage = 1;
  }

  function goToPage(page) {
    currentPage = page;
    renderTable();
  }

  function renderPagination(total) {
    if (!paginationEl) return;
    clampPage(total);
    const pages = pageCount(total);
    paginationEl.hidden = false;
    if (paginationTotal) paginationTotal.textContent = `共 ${total} 条`;
    if (pagePrevBtn) pagePrevBtn.disabled = currentPage <= 1 || total === 0;
    if (pageNextBtn) pageNextBtn.disabled = currentPage >= pages || total === 0;
    if (!paginationPages) return;
    const buttons = [];
    for (let i = 1; i <= pages; i += 1) {
      const active = i === currentPage ? ' is-active' : '';
      buttons.push(
        `<button type="button" class="admin-pagination__btn${active}" data-page="${i}" ${
          i === currentPage ? 'aria-current="page"' : ''
        }>${i}</button>`,
      );
    }
    paginationPages.innerHTML = total === 0 ? '' : buttons.join('');
    paginationPages.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const page = Number(btn.dataset.page) || 1;
        if (page === currentPage) return;
        goToPage(page);
      });
    });
  }

  function renderTable() {
    if (!tbody) return;
    if (checkAll) {
      checkAll.checked = false;
      checkAll.indeterminate = false;
    }
    const items = filteredRows();
    clampPage(items.length);
    renderPagination(items.length);
    if (!items.length) {
      tbody.innerHTML = emptyRowHtml('暂无数据');
      return;
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = items.slice(start, start + PAGE_SIZE);
    tbody.innerHTML = pageItems
      .map((row) => {
        const id = displaySupplierId(row);
        const auditClass =
          row.audit_status === 'pending'
            ? 'pending'
            : row.audit_status === 'rejected'
              ? 'rejected'
              : 'approved';
        const pendingApp = row.kind === 'application' && row.audit_status === 'pending';
        const canToggleVisibility = row.kind === 'hero';
        const visibilityLabel = row.enabled ? '禁用' : '启用';
        const ops = [
          `<button type="button" class="admin-link" data-detail="${escapeHtml(row.row_key)}">查看</button>`,
          pendingApp
            ? `<button type="button" class="admin-link" data-approve="${escapeHtml(row.application_id)}">通过</button>`
            : '',
          pendingApp
            ? `<button type="button" class="admin-link" data-reject="${escapeHtml(row.application_id)}">驳回</button>`
            : '',
          canToggleVisibility
            ? `<button type="button" class="admin-link" data-toggle-visibility="${escapeHtml(row.row_key)}">${visibilityLabel}</button>`
            : '',
          `<button type="button" class="admin-link admin-link--danger" data-delete-row="${escapeHtml(row.row_key)}">删除</button>`,
        ]
          .filter(Boolean)
          .join('\n             ');
        return `<tr data-key="${escapeHtml(row.row_key)}">
          <td class="admin-table__check">
            <input type="checkbox" data-row-check value="${escapeHtml(row.row_key)}" aria-label="选择 ${escapeHtml(row.name || id)}" />
          </td>
          <td>${escapeHtml(id)}</td>
          <td>
            <div class="admin-supplier-info">
              ${avatarHtml(row)}
              <div class="admin-supplier-info__meta">
                <span class="admin-supplier-info__name">${escapeHtml(row.name || '—')}</span>
              </div>
            </div>
          </td>
          <td>${escapeHtml(maskPhone(row.phone))}</td>
          <td>${escapeHtml(maskIdCard(row.id_card))}</td>
          <td>${escapeHtml(row.project_types_display || '—')}</td>
          <td>${escapeHtml(row.certification || '—')}</td>
          <td>${escapeHtml(row.channel || '—')}</td>
          <td><span class="admin-badge admin-badge--${auditClass}">${escapeHtml(row.audit_label)}</span></td>
          <td>${escapeHtml(row.reviewer || '—')}</td>
          <td>${escapeHtml(formatTime(row.reviewed_at) || '—')}</td>
          <td>${escapeHtml(formatTime(row.created_at) || '—')}</td>
          <td class="admin-cell-ops">${ops}</td>
        </tr>`;
      })
      .join('');

    tbody.querySelectorAll('[data-detail]').forEach((btn) => {
      btn.addEventListener('click', () => openDetail(btn.dataset.detail));
    });
    tbody.querySelectorAll('[data-approve]').forEach((btn) => {
      btn.addEventListener('click', () => showReview(btn.dataset.approve, 'approve'));
    });
    tbody.querySelectorAll('[data-reject]').forEach((btn) => {
      btn.addEventListener('click', () => showReview(btn.dataset.reject, 'reject'));
    });
    tbody.querySelectorAll('[data-toggle-visibility]').forEach((btn) => {
      btn.addEventListener('click', () => toggleVisibility(btn.dataset.toggleVisibility));
    });
    tbody.querySelectorAll('[data-delete-row]').forEach((btn) => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.deleteRow));
    });
    tbody.querySelectorAll('input[data-row-check]').forEach((box) => {
      box.addEventListener('change', syncCheckAllState);
    });
    syncCheckAllState();
  }

  async function toggleVisibility(rowKey) {
    const row = findRow(rowKey);
    if (!row || row.kind !== 'hero' || !row.hero_id) return;
    const db = await getDb();
    if (!db) {
      window.alert('本地 API 不可用');
      return;
    }
    const nextEnabled = !row.enabled;
    try {
      if (nextEnabled) {
        await db.updateHero(row.hero_id, { enabled: true, disable_reason: '' });
      } else {
        const reason = window.prompt('请填写禁用原因（必填）');
        if (reason == null) return;
        const text = String(reason).trim();
        if (!text) {
          window.alert('禁用原因必填');
          return;
        }
        await db.updateHero(row.hero_id, { enabled: false, disable_reason: text });
      }
      row.enabled = nextEnabled;
      renderTable();
    } catch (err) {
      window.alert(`${nextEnabled ? '启用' : '禁用'}失败：${err.message}`);
    }
  }

  let loadSeq = 0;

  async function loadSuppliers(options = {}) {
    const silent = !!options.silent;
    const db = await getDb();
    if (!db || !tbody) return;
    const seq = ++loadSeq;
    if (!silent || !allRows.length) {
      tbody.innerHTML = emptyRowHtml('加载中…');
    }
    try {
      const [heroes, applications, profileChanges] = await Promise.all([
        db.listAdminHeroes(),
        db.listApplications({}),
        db.listProfileChanges({ status: 'pending' }).catch(() => []),
      ]);
      if (seq !== loadSeq) return;
      const profilePendingIds = new Set(
        (profileChanges || []).map((item) => String(item.hero_id)).filter(Boolean),
      );
      allRows = buildUnifiedRows(heroes || [], applications || [], profilePendingIds);
      updateTabCounts();
      renderTable();
    } catch (err) {
      if (seq !== loadSeq) return;
      tbody.innerHTML = emptyRowHtml(`加载失败：${escapeHtml(err.message)}`);
    }
  }

  function findRow(key) {
    return allRows.find((r) => r.row_key === key);
  }

  function fieldHtml(label, value, full) {
    return `<div class="admin-modal__field${full ? ' admin-modal__field--full' : ''}">
      <span class="admin-modal__label">${label}</span>
      <div class="admin-modal__value${full ? ' admin-modal__value--block' : ''}">${value || '—'}</div>
    </div>`;
  }

  function inputFieldHtml(label, name, value, full) {
    return `<div class="admin-modal__field${full ? ' admin-modal__field--full' : ''}">
      <label class="admin-modal__label" for="hero-edit-${name}">${label}</label>
      <input id="hero-edit-${name}" class="admin-input" name="${name}" type="text" value="${escapeHtml(value ?? '')}" />
    </div>`;
  }

  function closeReviewModal() {
    if (!reviewModal) return;
    reviewModal.hidden = true;
    selectedId = null;
    if (reviewBody) reviewBody.innerHTML = '';
    if (reviewFoot) reviewFoot.hidden = true;
    if (deleteModal?.hidden !== false && heroModal?.hidden !== false) document.body.style.overflow = '';
  }

  function closeHeroModal() {
    if (!heroModal) return;
    heroModal.hidden = true;
    heroEditId = null;
    heroModalMode = 'view';
    if (heroBody) heroBody.innerHTML = '';
    if (heroFoot) heroFoot.hidden = true;
    if (deleteModal?.hidden !== false && reviewModal?.hidden !== false) document.body.style.overflow = '';
  }

  function closeDeleteModal() {
    if (!deleteModal) return;
    deleteModal.hidden = true;
    deleteTargetId = null;
    deleteTargetKind = 'hero';
    if (reviewModal?.hidden !== false && heroModal?.hidden !== false) document.body.style.overflow = '';
  }

  function openDeleteModal(rowKey) {
    const row = findRow(rowKey);
    if (!row || !deleteModal) return;
    if (row.kind === 'application') {
      deleteTargetId = row.application_id;
      deleteTargetKind = 'application';
      if (deleteDesc) {
        deleteDesc.textContent = `确定要删除该入驻申请（${row.name || row.application_id}）吗？删除后不可恢复！`;
      }
    } else {
      deleteTargetId = row.hero_id;
      deleteTargetKind = 'hero';
      if (deleteDesc) {
        deleteDesc.textContent = `确定要删除该供方（${row.name || row.hero_id}）吗？删除后不可恢复！`;
      }
    }
    deleteModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeAllModals() {
    closeDeleteModal();
    closeReviewModal();
    closeHeroModal();
  }

  function notifyHeroesUpdated() {
    try {
      localStorage.setItem('hero_plaza_heroes_updated', String(Date.now()));
    } catch (_) {
      /* ignore */
    }
  }

  function notifyApplicationsUpdated() {
    try {
      localStorage.setItem('hero_plaza_applications_updated', String(Date.now()));
      window.dispatchEvent(new CustomEvent('hero_plaza_applications_updated'));
    } catch (_) {
      /* ignore */
    }
  }

  async function openDetail(rowKey) {
    const row = findRow(rowKey);
    if (!row) return;
    if (row.kind === 'application') {
      await showReview(row.application_id);
      return;
    }
    window.location.href = `supplier-edit.html?id=${encodeURIComponent(row.hero_id)}`;
  }

  async function openHeroModal(id, mode) {
    const db = await getDb();
    if (!db || !heroModal || !heroBody || !id) return;
    heroEditId = id;
    heroModalMode = mode === 'edit' ? 'edit' : 'view';
    if (heroTitle) heroTitle.textContent = heroModalMode === 'edit' ? '编辑供方' : '供方详情';
    heroModal.hidden = false;
    document.body.style.overflow = 'hidden';
    heroBody.innerHTML = '<p class="admin-modal__loading">加载详情…</p>';
    if (heroFoot) heroFoot.hidden = true;
    try {
      const hero = await db.getHero(id);
      const types = (hero.project_types || []).join('、') || '—';
      const enabled = hero.enabled !== false;
      const cert =
        hero.certification ||
        hero.certification_level ||
        (hero.cert_badges || [])[0] ||
        (hero.honor_titles || [])[0] ||
        '—';
      if (heroModalMode === 'view') {
        heroBody.innerHTML = `
          <div class="admin-modal__fields">
            ${fieldHtml('供方id', escapeHtml(hero.supplier_id || displaySupplierId({ hero_id: id, supplier_id: hero.supplier_id })))}
            ${fieldHtml('昵称', escapeHtml(hero.name))}
            ${fieldHtml('手机号', escapeHtml(hero.phone || '—'))}
            ${fieldHtml('状态', enabled ? '启用' : '禁用')}
            ${fieldHtml('常驻城市', escapeHtml(hero.city || '—'))}
            ${fieldHtml('资质等级', escapeHtml(cert))}
            ${fieldHtml('从业年限', escapeHtml(formatYears(hero.years_exp)))}
            ${fieldHtml('项目类型', escapeHtml(types), true)}
            ${fieldHtml('简介', escapeHtml(hero.bio || hero.about_me || '—'), true)}
          </div>`;
        if (heroFoot) heroFoot.hidden = true;
      } else {
        heroBody.innerHTML = `
          <div class="admin-modal__fields">
            ${inputFieldHtml('昵称', 'name', hero.name || '')}
            ${inputFieldHtml('手机号', 'phone', hero.phone || '')}
            ${inputFieldHtml('常驻城市', 'city', hero.city || '')}
            ${inputFieldHtml('资质等级', 'certification', cert === '—' ? '' : cert)}
            ${inputFieldHtml('从业年限', 'years_exp', hero.years_exp ?? '')}
            ${inputFieldHtml('项目类型（顿号分隔）', 'project_types', (hero.project_types || []).join('、'), true)}
            ${inputFieldHtml('简介', 'bio', hero.bio || hero.about_me || '', true)}
          </div>`;
        if (heroFoot) heroFoot.hidden = false;
      }
    } catch (err) {
      heroBody.innerHTML = `<p class="admin-modal__loading">加载失败：${escapeHtml(err.message)}</p>`;
    }
  }

  async function saveHeroEdit() {
    if (!heroEditId || heroModalMode !== 'edit') return;
    const db = await getDb();
    if (!db) return;
    const getVal = (name) => heroBody?.querySelector(`[name="${name}"]`)?.value?.trim() ?? '';
    const splitList = (raw) =>
      raw
        .split(/[、,，]/)
        .map((s) => s.trim())
        .filter(Boolean);
    const patch = {
      name: getVal('name'),
      phone: getVal('phone'),
      city: getVal('city'),
      certification: getVal('certification'),
      years_exp: getVal('years_exp'),
      bio: getVal('bio'),
      project_types: splitList(getVal('project_types')),
    };
    if (!patch.name) {
      window.alert('请填写昵称');
      return;
    }
    try {
      await db.updateHero(heroEditId, patch);
      window.alert('已保存');
      closeHeroModal();
      notifyHeroesUpdated();
      loadSuppliers();
    } catch (err) {
      window.alert(`保存失败：${err.message}`);
    }
  }

  function syncRejectBox() {
    const rejectBox = document.getElementById('heroes-review-reject-box');
    const action = reviewBody?.querySelector('input[name="heroes-review-action"]:checked')?.value;
    if (!rejectBox) return;
    rejectBox.hidden = action !== 'reject';
  }

  async function showReview(id, defaultAction) {
    const db = await getDb();
    if (!db || !reviewModal || !reviewBody) return;
    selectedId = id;
    const action = defaultAction === 'reject' ? 'reject' : 'approve';
    reviewModal.hidden = false;
    document.body.style.overflow = 'hidden';
    reviewBody.innerHTML = '<p class="admin-modal__loading">加载详情…</p>';
    if (reviewFoot) reviewFoot.hidden = true;
    try {
      const app = await db.getApplication(id);
      const types = (app.project_types || []).join('、') || '—';
      const statusLabel = AUDIT_LABEL[app.status] || app.status_label || app.status;
      const pending = app.status === 'pending';
      reviewBody.innerHTML = `
        <section class="admin-modal__section">
          <h3 class="admin-modal__section-title">供方信息</h3>
          <div class="admin-modal__fields">
            ${fieldHtml('昵称', escapeHtml(app.name))}
            ${fieldHtml('手机号', escapeHtml(app.phone))}
            ${fieldHtml('审核状态', escapeHtml(statusLabel))}
            ${fieldHtml('项目类型', escapeHtml(types))}
            ${fieldHtml('常驻城市', escapeHtml(app.city))}
            ${fieldHtml('申请时间', escapeHtml(formatTime(app.submitted_at)))}
          </div>
        </section>
        <section class="admin-modal__section">
          <h3 class="admin-modal__section-title">资质信息</h3>
          <div class="admin-modal__fields">
            ${fieldHtml('资质等级', escapeHtml(app.certification))}
            ${fieldHtml('从业年限', escapeHtml(formatYears(app.years_exp)))}
            ${fieldHtml('曾获荣誉', escapeHtml(app.honors || '—'), true)}
            ${fieldHtml('详细介绍', escapeHtml(app.bio || '—'), true)}
            ${app.reject_reason ? fieldHtml('驳回原因', escapeHtml(app.reject_reason), true) : ''}
          </div>
        </section>
        ${
          pending
            ? `<section class="admin-modal__section">
          <h3 class="admin-modal__section-title">审核处理</h3>
          <div class="admin-modal__radio-row">
            <label class="admin-modal__radio"><input type="radio" name="heroes-review-action" value="approve"${action === 'approve' ? ' checked' : ''}> 通过</label>
            <label class="admin-modal__radio"><input type="radio" name="heroes-review-action" value="reject"${action === 'reject' ? ' checked' : ''}> 驳回</label>
          </div>
          <div class="admin-modal__reject-box" id="heroes-review-reject-box"${action === 'reject' ? '' : ' hidden'}>
            <label class="admin-modal__label" for="heroes-review-reason">驳回原因</label>
            <textarea class="admin-modal__textarea" id="heroes-review-reason" placeholder="请输入驳回原因"></textarea>
          </div>
        </section>`
            : ''
        }`;
      if (reviewFoot) reviewFoot.hidden = !pending;
      reviewBody.querySelectorAll('input[name="heroes-review-action"]').forEach((input) => {
        input.addEventListener('change', syncRejectBox);
      });
      syncRejectBox();
    } catch (err) {
      reviewBody.innerHTML = `<p class="admin-modal__loading">加载失败：${escapeHtml(err.message)}</p>`;
      if (reviewFoot) reviewFoot.hidden = true;
    }
  }

  async function submitReview() {
    if (!selectedId) return;
    const db = await getDb();
    if (!db) return;
    const action = reviewBody?.querySelector('input[name="heroes-review-action"]:checked')?.value || 'approve';
    if (action === 'reject') {
      const reason = (document.getElementById('heroes-review-reason')?.value || '').trim();
      if (!reason) {
        window.alert('请填写驳回原因');
        return;
      }
      try {
        await db.rejectApplication(selectedId, reason);
        window.alert('已驳回');
        closeReviewModal();
        notifyApplicationsUpdated();
        loadSuppliers();
      } catch (err) {
        window.alert(`驳回失败：${err.message}`);
      }
      return;
    }
    try {
      await db.approveApplication(selectedId);
      window.alert('已通过审核');
      closeReviewModal();
      notifyHeroesUpdated();
      loadSuppliers();
    } catch (err) {
      window.alert(`审核失败：${err.message}`);
    }
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;
    const db = await getDb();
    if (!db) return;
    const id = deleteTargetId;
    const kind = deleteTargetKind;
    try {
      if (kind === 'hero') {
        await db.deleteAdminHero(id);
        closeDeleteModal();
        if (heroEditId === id) closeHeroModal();
        notifyHeroesUpdated();
        notifyApplicationsUpdated();
      } else {
        await db.deleteApplication(id);
        closeDeleteModal();
        if (selectedId === id) closeReviewModal();
        notifyApplicationsUpdated();
        notifyHeroesUpdated();
      }
      loadSuppliers();
    } catch (err) {
      window.alert(`删除失败：${err.message}`);
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      currentTab = tab.dataset.tab || 'all';
      currentPage = 1;
      closeAllModals();
      renderTable();
    });
  });

  [filterProject, filterEnabled, filterAudit].forEach((el) => {
    el?.addEventListener('change', syncSelectPlaceholders);
  });

  [filterId, filterKeyword].forEach((el) => {
    el?.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      readFilters();
      currentPage = 1;
      renderTable();
    });
  });

  searchBtn?.addEventListener('click', () => {
    readFilters();
    currentPage = 1;
    closeAllModals();
    renderTable();
  });

  resetBtn?.addEventListener('click', () => {
    resetFilters();
    currentPage = 1;
    closeAllModals();
    renderTable();
  });

  pagePrevBtn?.addEventListener('click', () => {
    if (currentPage <= 1) return;
    goToPage(currentPage - 1);
  });

  pageNextBtn?.addEventListener('click', () => {
    const total = filteredRows().length;
    if (currentPage >= pageCount(total)) return;
    goToPage(currentPage + 1);
  });

  exportBtn?.addEventListener('click', () => {
    window.alert('导出功能开发中');
  });

  orderReportBtn?.addEventListener('click', () => {
    window.alert('订单报表功能开发中');
  });

  createBtn?.addEventListener('click', () => {
    window.location.href = 'supplier-edit.html';
  });

  checkAll?.addEventListener('change', () => {
    if (!tbody) return;
    tbody.querySelectorAll('input[data-row-check]').forEach((box) => {
      box.checked = checkAll.checked;
    });
    checkAll.indeterminate = false;
  });

  batchReviewBtn?.addEventListener('click', () => {
    const keys = getSelectedKeys();
    const pending = keys
      .map((key) => findRow(key))
      .filter((row) => row && row.kind === 'application' && row.audit_status === 'pending');
    if (!pending.length) {
      window.alert('请先勾选待审核的入驻申请');
      return;
    }
    showReview(pending[0].application_id, 'approve');
  });

  reviewModal?.addEventListener('click', (e) => {
    if (e.target.closest('[data-modal-close]')) closeReviewModal();
  });
  reviewSubmit?.addEventListener('click', submitReview);
  deleteModal?.addEventListener('click', (e) => {
    if (e.target.closest('[data-delete-close]')) closeDeleteModal();
  });
  deleteConfirmBtn?.addEventListener('click', confirmDelete);
  heroModal?.addEventListener('click', (e) => {
    if (e.target.closest('[data-hero-modal-close]')) closeHeroModal();
  });
  heroSubmit?.addEventListener('click', saveHeroEdit);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (deleteModal && !deleteModal.hidden) {
      closeDeleteModal();
      return;
    }
    if (heroModal && !heroModal.hidden) {
      closeHeroModal();
      return;
    }
    if (reviewModal && !reviewModal.hidden) closeReviewModal();
  });

  syncSelectPlaceholders();
  loadSuppliers();

  // 勿监听 window focus：从其它窗口点回时，focus 会先于 click 触发并重渲染表格，导致第一次点击无效。
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadSuppliers({ silent: true });
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'hero_plaza_heroes_updated' || e.key === 'hero_plaza_applications_updated') {
      loadSuppliers({ silent: true });
    }
  });
  window.addEventListener('hero_plaza_applications_updated', () => loadSuppliers({ silent: true }));
})();
