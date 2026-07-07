/** 管理后台 · 英雄管理（申请审核 + 已认证英雄） */
(function () {
  const root = document.getElementById('admin-page-root') || document.getElementById('heroes-admin-root');
  if (!root) return;

  const tabs = root.querySelectorAll('[data-status-tab]');
  const modeTabs = root.querySelectorAll('[data-hero-mode]');
  const tbody = document.getElementById('heroes-admin-tbody');
  const certifiedTbody = document.getElementById('heroes-certified-tbody');
  const detail = document.getElementById('heroes-admin-detail');
  const applicationsPanel = document.getElementById('heroes-applications-panel');
  const certifiedPanel = document.getElementById('heroes-certified-panel');
  const statusHint = document.getElementById('heroes-admin-hint');
  const certifiedSearch = document.getElementById('heroes-certified-search');

  let currentStatus = 'pending';
  let currentMode = 'applications';
  let selectedId = null;

  function formatTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function getDb() {
    if (!window.HeroPlazaDB || !(await window.HeroPlazaDB.isAvailable())) {
      statusHint.textContent = '本地 API 未启动，请先运行 bash scripts/start-dev.sh';
      return null;
    }
    statusHint.textContent =
      currentMode === 'applications'
        ? '申请审核 · API: GET /api/admin/applications'
        : '已认证英雄 · API: GET /api/admin/heroes';
    return window.HeroPlazaDB;
  }

  async function loadApplications() {
    const db = await getDb();
    if (!db || !tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">加载中…</td></tr>';
    try {
      const items = await db.listApplications({ status: currentStatus || '' });
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">暂无数据</td></tr>';
        return;
      }
      tbody.innerHTML = items
        .map(
          (row) => `
        <tr data-id="${row.application_id}">
          <td>${row.name || '—'}</td>
          <td>${row.phone || '—'}</td>
          <td>${row.project_types_display || '—'}</td>
          <td>${formatTime(row.submitted_at)}</td>
          <td><span class="admin-badge admin-badge--${row.status}">${row.status_label}</span></td>
          <td class="admin-cell-ops">
            <button type="button" class="admin-link" data-view="${row.application_id}">查看</button>
            ${
              row.status === 'pending'
                ? `<button type="button" class="admin-link" data-approve="${row.application_id}">批准</button>
                   <button type="button" class="admin-link admin-link--danger" data-reject="${row.application_id}">驳回</button>`
                : ''
            }
            <button type="button" class="admin-link admin-link--danger" data-delete="${row.application_id}">删除</button>
          </td>
        </tr>`,
        )
        .join('');
      tbody.querySelectorAll('[data-view]').forEach((btn) => {
        btn.addEventListener('click', () => showDetail(btn.dataset.view));
      });
      tbody.querySelectorAll('[data-approve]').forEach((btn) => {
        btn.addEventListener('click', () => approve(btn.dataset.approve));
      });
      tbody.querySelectorAll('[data-reject]').forEach((btn) => {
        btn.addEventListener('click', () => reject(btn.dataset.reject));
      });
      tbody.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', () => removeApplication(btn.dataset.delete));
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6">加载失败：${err.message}</td></tr>`;
    }
  }

  async function loadCertifiedHeroes() {
    const db = await getDb();
    if (!db || !certifiedTbody) return;
    certifiedTbody.innerHTML = '<tr><td colspan="6">加载中…</td></tr>';
    try {
      const query = {};
      if (certifiedSearch && certifiedSearch.value.trim()) query.q = certifiedSearch.value.trim();
      const items = await db.listAdminHeroes(query);
      if (!items.length) {
        certifiedTbody.innerHTML = '<tr><td colspan="6">暂无英雄</td></tr>';
        return;
      }
      certifiedTbody.innerHTML = items
        .map(
          (hero) => `
        <tr>
          <td>${hero.name || '—'}</td>
          <td>${hero.rating != null ? hero.rating : '—'}</td>
          <td>${hero.years_exp != null ? `${hero.years_exp} 年` : '—'}</td>
          <td>${hero.student_count != null ? hero.student_count : '—'}</td>
          <td>${hero.project_types_display || '—'}</td>
          <td>${(hero.honor_titles || []).slice(0, 2).join('、') || '—'}</td>
        </tr>`,
        )
        .join('');
    } catch (err) {
      certifiedTbody.innerHTML = `<tr><td colspan="6">加载失败：${err.message}</td></tr>`;
    }
  }

  async function showDetail(id) {
    const db = await getDb();
    if (!db || !detail) return;
    selectedId = id;
    detail.hidden = false;
    const body = detail.querySelector('.admin-card__body') || detail;
    body.innerHTML = '<p>加载详情…</p>';
    try {
      const app = await db.getApplication(id);
      const types = (app.project_types || []).join('、') || '—';
      body.innerHTML = `
        <div class="admin-detail">
          <h2 class="admin-detail__title">申请详情</h2>
          <dl class="admin-detail__grid">
            <dt>姓名</dt><dd>${app.name || '—'}</dd>
            <dt>手机号</dt><dd>${app.phone || '—'}</dd>
            <dt>项目类型</dt><dd>${types}</dd>
            <dt>常驻城市</dt><dd>${app.city || '—'}</dd>
            <dt>教练资质</dt><dd>${app.certification || '—'}</dd>
            <dt>从业年限</dt><dd>${app.years_exp || '—'}</dd>
            <dt>详细介绍</dt><dd>${(app.bio || '—').replace(/\n/g, '<br>')}</dd>
            <dt>曾获荣誉</dt><dd>${(app.honors || '—').replace(/\n/g, '<br>')}</dd>
            <dt>状态</dt><dd>${app.status_label || app.status}</dd>
            ${app.reject_reason ? `<dt>驳回原因</dt><dd>${app.reject_reason}</dd>` : ''}
          </dl>
          ${
            app.status === 'pending'
              ? `<div class="admin-detail__actions">
            <button type="button" class="admin-btn admin-btn--primary" id="heroes-approve">批准</button>
            <button type="button" class="admin-btn admin-btn--danger" id="heroes-reject">驳回</button>
          </div>`
              : ''
          }
        </div>`;
      document.getElementById('heroes-approve')?.addEventListener('click', () => approve(id));
      document.getElementById('heroes-reject')?.addEventListener('click', () => reject(id));
    } catch (err) {
      body.innerHTML = `<p>加载失败：${err.message}</p>`;
    }
  }

  async function approve(id) {
    const db = await getDb();
    if (!db) return;
    if (!window.confirm('确认批准该申请？')) return;
    try {
      await db.approveApplication(id);
      window.alert('已批准，小程序个人中心将显示为已认证英雄');
      detail.hidden = true;
      selectedId = null;
      loadApplications();
    } catch (err) {
      window.alert(`批准失败：${err.message}`);
    }
  }

  async function reject(id) {
    const db = await getDb();
    if (!db) return;
    const reason = window.prompt('请输入驳回原因（可选）', '资料不完整');
    if (reason === null) return;
    try {
      await db.rejectApplication(id, reason);
      window.alert('已驳回');
      detail.hidden = true;
      selectedId = null;
      loadApplications();
    } catch (err) {
      window.alert(`驳回失败：${err.message}`);
    }
  }

  async function removeApplication(id) {
    const db = await getDb();
    if (!db) return;
    if (!window.confirm('确认删除该申请记录？删除后用户将恢复为未认证状态。')) return;
    try {
      await db.deleteApplication(id);
      if (selectedId === id) {
        detail.hidden = true;
        selectedId = null;
      }
      loadApplications();
    } catch (err) {
      window.alert(`删除失败：${err.message}`);
    }
  }

  function switchMode(mode) {
    currentMode = mode;
    modeTabs.forEach((t) => t.classList.toggle('is-active', t.dataset.heroMode === mode));
    if (applicationsPanel) applicationsPanel.hidden = mode !== 'applications';
    if (certifiedPanel) certifiedPanel.hidden = mode !== 'certified';
    if (mode === 'applications') loadApplications();
    else loadCertifiedHeroes();
  }

  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      modeTabs.forEach((t) => t.classList.remove('is-active', 'active'));
      tab.classList.add('is-active');
      switchMode(tab.dataset.heroMode);
    });
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      currentStatus = tab.dataset.statusTab;
      detail.hidden = true;
      selectedId = null;
      loadApplications();
    });
  });

  certifiedSearch?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadCertifiedHeroes();
  });
  document.getElementById('heroes-certified-search-btn')?.addEventListener('click', loadCertifiedHeroes);

  switchMode('applications');
})();
