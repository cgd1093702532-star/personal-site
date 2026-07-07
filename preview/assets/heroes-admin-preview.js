/** 管理后台 · 英雄申请审核（预览） */
(function () {
  const root = document.getElementById('heroes-admin-root');
  if (!root) return;

  const tabs = root.querySelectorAll('[data-status-tab]');
  const tbody = document.getElementById('heroes-admin-tbody');
  const detail = document.getElementById('heroes-admin-detail');
  const statusHint = document.getElementById('heroes-admin-hint');
  let currentStatus = 'pending';
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
      statusHint.textContent = '本地 API 未启动，请先运行 bash scripts/start-local-db.sh';
      return null;
    }
    statusHint.textContent = '';
    return window.HeroPlazaDB;
  }

  async function loadList() {
    const db = await getDb();
    if (!db || !tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">加载中…</td></tr>';
    try {
      const items = await db.listApplications({ status: currentStatus || '' });
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="6">暂无数据</td></tr>';
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
          <td><button type="button" class="admin-btn admin-btn--link" data-view="${row.application_id}">查看</button></td>
        </tr>`,
        )
        .join('');
      tbody.querySelectorAll('[data-view]').forEach((btn) => {
        btn.addEventListener('click', () => showDetail(btn.dataset.view));
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6">加载失败：${err.message}</td></tr>`;
    }
  }

  async function showDetail(id) {
    const db = await getDb();
    if (!db || !detail) return;
    selectedId = id;
    detail.hidden = false;
    detail.innerHTML = '<p>加载详情…</p>';
    try {
      const app = await db.getApplication(id);
      const types = (app.project_types || []).join('、') || '—';
      detail.innerHTML = `
        <div class="admin-detail">
          <h2>申请详情</h2>
          <dl class="admin-detail__grid">
            <dt>姓名</dt><dd>${app.name || '—'}</dd>
            <dt>手机号</dt><dd>${app.phone || '—'}</dd>
            <dt>项目类型</dt><dd>${types}</dd>
            <dt>常驻城市</dt><dd>${app.city || '—'}</dd>
            <dt>教练资质</dt><dd>${app.certification || '—'}</dd>
            <dt>从业年限</dt><dd>${app.years_exp || '—'}</dd>
            <dt>详细介绍</dt><dd>${(app.bio || '—').replace(/\n/g, '<br>')}</dd>
            <dt>曾获荣誉</dt><dd>${(app.honors || '—').replace(/\n/g, '<br>')}</dd>
            <dt>状态</dt><dd>${app.status}</dd>
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
      detail.innerHTML = `<p>加载失败：${err.message}</p>`;
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
      loadList();
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
      loadList();
    } catch (err) {
      window.alert(`驳回失败：${err.message}`);
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentStatus = tab.dataset.statusTab;
      detail.hidden = true;
      selectedId = null;
      loadList();
    });
  });

  loadList();
})();
