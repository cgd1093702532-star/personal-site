/** 管理后台 · 主页变更审核 */
(function () {
  const tbody = document.getElementById('pc-admin-tbody');
  const detail = document.getElementById('pc-admin-detail');
  const hint = document.getElementById('pc-admin-hint');
  if (!tbody) return;

  let currentStatus = 'pending';

  function formatTime(iso) {
    if (!iso) return '—';
    const d = typeof iso === 'number' ? new Date(iso * 1000) : new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('zh-CN');
  }

  function detailBody() {
    return detail?.querySelector('.admin-card__body') || detail;
  }

  async function getDb() {
    if (!window.HeroPlazaDB || !(await window.HeroPlazaDB.isAvailable())) {
      if (hint) hint.textContent = '本地 API 未启动，请先运行 bash scripts/start-dev.sh';
      return null;
    }
    if (hint) hint.textContent = '';
    return window.HeroPlazaDB;
  }

  function renderDiff(before, after) {
    const keys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
    if (!keys.length) return '<p class="admin-page-tip">无字段变更</p>';
    return keys
      .map((k) => {
        const b = before?.[k];
        const a = after?.[k];
        return `<div class="admin-diff-row"><strong>${k}</strong><div class="admin-diff-cols"><div><span class="admin-page-tip">修改前</span><pre>${JSON.stringify(b, null, 2)}</pre></div><div><span class="admin-page-tip">修改后</span><pre>${JSON.stringify(a, null, 2)}</pre></div></div></div>`;
      })
      .join('');
  }

  async function showDetail(id) {
    const db = await getDb();
    if (!db || !detail) return;
    detail.hidden = false;
    detailBody().innerHTML = '<p>加载详情…</p>';
    try {
      const item = await db.getProfileChange(id);
      detailBody().innerHTML = `
        <div class="admin-detail">
          <h3 class="admin-card__title">${item.hero_name || item.hero_id} · ${item.change_type_label || item.change_type}</h3>
          <p>状态：${item.status_label || item.status} · 提交：${formatTime(item.submitted_at)}</p>
          ${item.reject_reason ? `<p>驳回原因：${item.reject_reason}</p>` : ''}
          ${renderDiff(item.before, item.after)}
          ${
            item.status === 'pending'
              ? `<div class="admin-cell-ops" style="margin-top:12px">
                  <button type="button" class="admin-btn admin-btn--primary" data-approve="${item.change_id}">通过</button>
                  <button type="button" class="admin-btn" data-reject="${item.change_id}">驳回</button>
                </div>`
              : ''
          }
        </div>`;
      detailBody().querySelector('[data-approve]')?.addEventListener('click', async (e) => {
        await db.approveProfileChange(e.currentTarget.dataset.approve);
        detail.hidden = true;
        loadList();
      });
      detailBody().querySelector('[data-reject]')?.addEventListener('click', async (e) => {
        const reason = window.prompt('驳回原因', '未通过审核') || '';
        await db.rejectProfileChange(e.currentTarget.dataset.reject, reason);
        detail.hidden = true;
        loadList();
      });
    } catch (err) {
      detailBody().innerHTML = `<p>加载失败：${err.message}</p>`;
    }
  }

  async function loadList() {
    const db = await getDb();
    if (!db) {
      tbody.innerHTML = '<tr><td colspan="5" class="admin-table__empty">无法连接 API</td></tr>';
      return;
    }
    try {
      const query = {};
      if (currentStatus) query.status = currentStatus;
      const rows = await db.listProfileChanges(query);
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="admin-table__empty">暂无数据</td></tr>';
        return;
      }
      tbody.innerHTML = rows
        .map(
          (row) => `
        <tr>
          <td>${row.hero_name || row.hero_id || '—'}</td>
          <td>${row.change_type_label || row.change_type || '—'}</td>
          <td>${formatTime(row.submitted_at)}</td>
          <td><span class="admin-badge admin-badge--${row.status}">${row.status_label || row.status}</span></td>
          <td class="admin-cell-ops">
            <button type="button" class="admin-link" data-view="${row.change_id}">查看</button>
            ${
              row.status === 'pending'
                ? `<button type="button" class="admin-link" data-approve="${row.change_id}">通过</button>
                   <button type="button" class="admin-link admin-link--danger" data-reject="${row.change_id}">驳回</button>`
                : ''
            }
          </td>
        </tr>`,
        )
        .join('');
      tbody.querySelectorAll('[data-view]').forEach((btn) => {
        btn.addEventListener('click', () => showDetail(btn.dataset.view));
      });
      tbody.querySelectorAll('[data-approve]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await db.approveProfileChange(btn.dataset.approve);
          loadList();
        });
      });
      tbody.querySelectorAll('[data-reject]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const reason = window.prompt('驳回原因', '未通过审核') || '';
          await db.rejectProfileChange(btn.dataset.reject, reason);
          loadList();
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="admin-table__empty">加载失败：${err.message}</td></tr>`;
    }
  }

  document.querySelectorAll('[data-pc-status]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-pc-status]').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      currentStatus = tab.dataset.pcStatus || '';
      loadList();
    });
  });

  loadList();
})();
