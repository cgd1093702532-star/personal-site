/** 管理后台 · 评价管理 */
(function () {
  const tbody = document.getElementById('reviews-admin-tbody');
  const hint = document.getElementById('reviews-admin-hint');
  const searchInput = document.getElementById('reviews-admin-search');
  if (!tbody) return;

  let currentStatus = '';
  let rows = [];

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
      .map((row) => {
        const low = Number(row.score) <= 2 ? ' admin-badge--warn' : '';
        return `
      <tr>
        <td>${row.reviewer_nickname || '—'}</td>
        <td>${row.hero_id || '—'}</td>
        <td>${row.scene || row.title || '—'}</td>
        <td><span class="admin-badge${low}">${row.score}</span></td>
        <td>${(row.content || '').slice(0, 40)}${(row.content || '').length > 40 ? '…' : ''}</td>
        <td>${formatTime(row.reviewed_at)}</td>
        <td><span class="admin-badge admin-badge--${row.status}">${row.status_label || row.status}</span></td>
        <td class="admin-cell-ops">
          ${row.status !== 'hidden' ? `<button type="button" class="admin-link" data-hide="${row.review_id}">隐藏</button>` : ''}
          ${row.status !== 'deleted' ? `<button type="button" class="admin-link admin-link--danger" data-delete="${row.review_id}">删除</button>` : ''}
        </td>
      </tr>`;
      })
      .join('');
    tbody.querySelectorAll('[data-hide]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        // #region agent log
        fetch('http://127.0.0.1:7447/ingest/69cf0779-133f-40c0-9884-95fcd1c2d840',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'628f41'},body:JSON.stringify({sessionId:'628f41',runId:'pre-fix',hypothesisId:'C',location:'reviews-admin-preview.js:hide',message:'hide review clicked',data:{id:btn.dataset.hide},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        const db = await getDb();
        if (!db) return;
        await db.hideReview(btn.dataset.hide);
        loadList();
      });
    });
    tbody.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        // #region agent log
        fetch('http://127.0.0.1:7447/ingest/69cf0779-133f-40c0-9884-95fcd1c2d840',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'628f41'},body:JSON.stringify({sessionId:'628f41',runId:'pre-fix',hypothesisId:'C',location:'reviews-admin-preview.js:delete',message:'delete review clicked',data:{id:btn.dataset.delete},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (!window.confirm('确认删除该评价？')) return;
        const db = await getDb();
        if (!db) return;
        await db.deleteReview(btn.dataset.delete);
        loadList();
      });
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
      if (searchInput && searchInput.value.trim()) query.q = searchInput.value.trim();
      rows = await db.listAdminReviews(query);
      renderTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="admin-table__empty">加载失败：${err.message}</td></tr>`;
    }
  }

  document.querySelectorAll('[data-review-status]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-review-status]').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      currentStatus = tab.dataset.reviewStatus || '';
      loadList();
    });
  });
  document.getElementById('reviews-admin-search-btn')?.addEventListener('click', loadList);
  document.getElementById('reviews-admin-reset-btn')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    loadList();
  });

  loadList();
})();
