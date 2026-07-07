/** 管理后台 · 报名管理（预览） */
(function () {
  const tbody = document.getElementById('signups-admin-tbody');
  const detail = document.getElementById('signups-admin-detail');
  const hint = document.getElementById('signups-admin-hint');
  const searchInput = document.getElementById('signups-admin-search');
  if (!tbody) return;

  let currentStatus = '';
  let currentPayStatus = '';
  let rows = [];

  function detailBody() {
    return detail?.querySelector('.admin-card__body') || detail;
  }

  function setTabActive(selector, tab) {
    document.querySelectorAll(selector).forEach((t) => t.classList.remove('is-active', 'active'));
    tab.classList.add('is-active');
  }

  function formatTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('zh-CN');
  }

  async function getDb() {
    if (!window.HeroPlazaDB || !(await window.HeroPlazaDB.isAvailable())) {
      if (hint) hint.textContent = '本地 API 未启动，请先运行 bash scripts/start-dev.sh';
      return null;
    }
    if (hint) hint.textContent = '';
    return window.HeroPlazaDB;
  }

  function renderTable() {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-table__empty">暂无数据</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(
        (row) => `
      <tr>
        <td>${row.name || '—'}</td>
        <td>${row.phone || '—'}</td>
        <td>${row.title || '—'}</td>
        <td>${row.type_label || row.type || '—'}</td>
        <td>${formatTime(row.created_at)}</td>
        <td><span class="admin-badge admin-badge--${row.pay_status}">${row.pay_status_label}</span></td>
        <td><span class="admin-badge admin-badge--${row.status}">${row.status_label}</span></td>
        <td class="admin-cell-ops">
          <button type="button" class="admin-link" data-view="${row.signup_id}">查看</button>
          ${
            row.status !== 'cancelled'
              ? `<button type="button" class="admin-link admin-link--danger" data-cancel="${row.signup_id}">取消报名</button>`
              : ''
          }
        </td>
      </tr>`,
      )
      .join('');
    tbody.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => showDetail(btn.dataset.view));
    });
    tbody.querySelectorAll('[data-cancel]').forEach((btn) => {
      btn.addEventListener('click', () => cancelSignup(btn.dataset.cancel));
    });
  }

  async function loadList() {
    const db = await getDb();
    if (!db) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-table__empty">无法连接 API</td></tr>';
      return;
    }
    tbody.innerHTML = '<tr><td colspan="8" class="admin-table__empty">加载中…</td></tr>';
    try {
      const query = {};
      if (currentStatus) query.status = currentStatus;
      if (currentPayStatus) query.pay_status = currentPayStatus;
      if (searchInput && searchInput.value.trim()) query.q = searchInput.value.trim();
      rows = await db.listAdminSignups(query);
      renderTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="admin-table__empty">加载失败：${err.message}</td></tr>`;
    }
  }

  async function showDetail(id) {
    const db = await getDb();
    if (!db || !detail) return;
    detail.hidden = false;
    detailBody().innerHTML = '<p>加载详情…</p>';
    try {
      const item = await db.getSignup(id);
      detailBody().innerHTML = `
        <div class="admin-detail">
          <h2 class="admin-detail__title">报名详情</h2>
          <dl class="admin-detail__grid">
            <dt>报名人</dt><dd>${item.name || '—'}</dd>
            <dt>手机号</dt><dd>${item.phone || '—'}</dd>
            <dt>项目</dt><dd>${item.title || '—'}</dd>
            <dt>场景</dt><dd>${item.type_label || item.type || '—'}</dd>
            <dt>地点</dt><dd>${item.location || '—'}</dd>
            <dt>费用</dt><dd>${item.fee != null ? `¥${item.fee}` : '—'}</dd>
            <dt>报名时间</dt><dd>${formatTime(item.created_at)}</dd>
            <dt>支付状态</dt><dd>${item.pay_status_label}</dd>
            <dt>报名状态</dt><dd>${item.status_label}</dd>
          </dl>
          ${
            item.status !== 'cancelled'
              ? `<div class="admin-detail__actions"><button type="button" class="admin-btn admin-btn--danger" id="signup-cancel-btn">取消报名</button></div>`
              : ''
          }
        </div>`;
      document.getElementById('signup-cancel-btn')?.addEventListener('click', () => cancelSignup(id));
    } catch (err) {
      detailBody().innerHTML = `<p>加载失败：${err.message}</p>`;
    }
  }

  async function cancelSignup(id) {
    const db = await getDb();
    if (!db) return;
    if (!window.confirm('确认取消该报名？')) return;
    try {
      await db.cancelSignup(id);
      window.alert('已取消报名');
      detail.hidden = true;
      loadList();
    } catch (err) {
      window.alert(`操作失败：${err.message}`);
    }
  }

  document.querySelectorAll('[data-signup-status]').forEach((tab) => {
    tab.addEventListener('click', () => {
      setTabActive('[data-signup-status]', tab);
      currentStatus = tab.dataset.signupStatus;
      detail.hidden = true;
      loadList();
    });
  });

  document.querySelectorAll('[data-pay-status]').forEach((tab) => {
    tab.addEventListener('click', () => {
      setTabActive('[data-pay-status]', tab);
      currentPayStatus = tab.dataset.payStatus;
      detail.hidden = true;
      loadList();
    });
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadList();
  });
  document.getElementById('signups-admin-search-btn')?.addEventListener('click', loadList);
  document.getElementById('signups-admin-reset-btn')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    loadList();
  });

  loadList();
})();
