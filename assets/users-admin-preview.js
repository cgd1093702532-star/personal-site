/** 管理后台 · 用户管理 */
(function () {
  const tbody = document.getElementById('users-admin-tbody');
  const hint = document.getElementById('users-admin-hint');
  const searchInput = document.getElementById('users-admin-search');
  if (!tbody) return;

  let currentStatus = '';

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

  async function loadList() {
    const db = await getDb();
    if (!db) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">无法连接 API</td></tr>';
      return;
    }
    try {
      const query = {};
      if (currentStatus) query.status = currentStatus;
      if (searchInput && searchInput.value.trim()) query.q = searchInput.value.trim();
      const rows = await db.listUsers(query);
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">暂无数据</td></tr>';
        return;
      }
      tbody.innerHTML = rows
        .map(
          (row) => `
        <tr>
          <td>${row.nickname || row.name || '—'}</td>
          <td>${row.phone || '—'}</td>
          <td>${formatTime(row.registered_at)}</td>
          <td>${row.signup_count != null ? row.signup_count : 0}</td>
          <td><span class="admin-badge admin-badge--${row.status}">${row.status_label || row.status}</span></td>
          <td class="admin-cell-ops">
            ${
              row.status === 'disabled'
                ? `<button type="button" class="admin-link" data-enable="${row.user_id}">启用</button>`
                : `<button type="button" class="admin-link admin-link--danger" data-disable="${row.user_id}">禁用</button>`
            }
          </td>
        </tr>`,
        )
        .join('');
      tbody.querySelectorAll('[data-disable]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await db.disableUser(btn.dataset.disable);
          loadList();
        });
      });
      tbody.querySelectorAll('[data-enable]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await db.enableUser(btn.dataset.enable);
          loadList();
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="admin-table__empty">加载失败：${err.message}</td></tr>`;
    }
  }

  document.querySelectorAll('[data-user-status]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-user-status]').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      currentStatus = tab.dataset.userStatus || '';
      loadList();
    });
  });
  document.getElementById('users-admin-search-btn')?.addEventListener('click', loadList);
  document.getElementById('users-admin-reset-btn')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    loadList();
  });

  loadList();
})();
