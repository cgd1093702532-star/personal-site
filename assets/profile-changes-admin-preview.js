/** 管理后台 · 主页变更审核 */
(function () {
  const tbody = document.getElementById('pc-admin-tbody');
  const detail = document.getElementById('pc-admin-detail');
  const hint = document.getElementById('pc-admin-hint');
  const checkAll = document.getElementById('pc-check-all');
  const batchDeleteBtn = document.getElementById('pc-batch-delete');
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

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function getDb() {
    if (!window.HeroPlazaDB || !(await window.HeroPlazaDB.isAvailable())) {
      if (hint) hint.textContent = '本地 API 未启动，请先运行 bash scripts/start-dev.sh';
      return null;
    }
    if (hint) hint.textContent = '';
    return window.HeroPlazaDB;
  }

  function getSelectedIds() {
    return [...tbody.querySelectorAll('input[data-row-check]:checked')]
      .map((el) => el.value)
      .filter(Boolean);
  }

  function syncCheckAllState() {
    if (!checkAll) return;
    const boxes = [...tbody.querySelectorAll('input[data-row-check]')];
    if (!boxes.length) {
      checkAll.checked = false;
      checkAll.indeterminate = false;
      return;
    }
    const checked = boxes.filter((b) => b.checked).length;
    checkAll.checked = checked === boxes.length;
    checkAll.indeterminate = checked > 0 && checked < boxes.length;
  }

  function renderDiff(before, after) {
    const keys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
    if (!keys.length) return '<p class="admin-page-tip">无字段变更</p>';
    return keys
      .map((k) => {
        const b = before?.[k];
        const a = after?.[k];
        return `<div class="admin-diff-row"><strong>${escapeHtml(k)}</strong><div class="admin-diff-cols"><div><span class="admin-page-tip">修改前</span><pre>${escapeHtml(JSON.stringify(b, null, 2))}</pre></div><div><span class="admin-page-tip">修改后</span><pre>${escapeHtml(JSON.stringify(a, null, 2))}</pre></div></div></div>`;
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
          <h3 class="admin-card__title">${escapeHtml(item.hero_name || item.hero_id)} · ${escapeHtml(item.change_type_label || item.change_type)}</h3>
          <p>状态：${escapeHtml(item.status_label || item.status)} · 提交：${escapeHtml(formatTime(item.submitted_at))}</p>
          ${item.reject_reason ? `<p>驳回原因：${escapeHtml(item.reject_reason)}</p>` : ''}
          ${renderDiff(item.before, item.after)}
          ${
            item.status === 'pending'
              ? `<div class="admin-cell-ops" style="margin-top:12px">
                  <button type="button" class="admin-btn admin-btn--primary" data-approve="${escapeHtml(item.change_id)}">通过</button>
                  <button type="button" class="admin-btn" data-reject="${escapeHtml(item.change_id)}">驳回</button>
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
      detailBody().innerHTML = `<p>加载失败：${escapeHtml(err.message)}</p>`;
    }
  }

  async function loadList() {
    const db = await getDb();
    if (!db) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">无法连接 API</td></tr>';
      syncCheckAllState();
      return;
    }
    try {
      const query = {};
      if (currentStatus) query.status = currentStatus;
      const rows = await db.listProfileChanges(query);
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="admin-table__empty">暂无数据</td></tr>';
        syncCheckAllState();
        return;
      }
      tbody.innerHTML = rows
        .map(
          (row) => `
        <tr>
          <td class="admin-table__check">
            <input type="checkbox" data-row-check value="${escapeHtml(row.change_id)}" aria-label="选择 ${escapeHtml(row.hero_name || row.hero_id || '')}" />
          </td>
          <td>${escapeHtml(row.hero_name || row.hero_id || '—')}</td>
          <td>${escapeHtml(row.change_type_label || row.change_type || '—')}</td>
          <td>${escapeHtml(formatTime(row.submitted_at))}</td>
          <td><span class="admin-badge admin-badge--${escapeHtml(row.status)}">${escapeHtml(row.status_label || row.status)}</span></td>
          <td class="admin-cell-ops">
            <button type="button" class="admin-link" data-view="${escapeHtml(row.change_id)}">查看</button>
            ${
              row.status === 'pending'
                ? `<button type="button" class="admin-link" data-approve="${escapeHtml(row.change_id)}">通过</button>
                   <button type="button" class="admin-link admin-link--danger" data-reject="${escapeHtml(row.change_id)}">驳回</button>`
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
      tbody.querySelectorAll('input[data-row-check]').forEach((box) => {
        box.addEventListener('change', syncCheckAllState);
      });
      syncCheckAllState();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="admin-table__empty">加载失败：${escapeHtml(err.message)}</td></tr>`;
      syncCheckAllState();
    }
  }

  async function batchDelete() {
    const ids = getSelectedIds();
    if (!ids.length) {
      window.alert('请先勾选要删除的记录');
      return;
    }
    if (!window.confirm(`确认删除已选中的 ${ids.length} 条变更记录？删除后不可恢复。`)) {
      return;
    }
    const db = await getDb();
    if (!db) {
      window.alert('本地 API 不可用');
      return;
    }
    try {
      const res = await db.batchDeleteProfileChanges(ids);
      if (detail && !detail.hidden) detail.hidden = true;
      window.alert(`已删除 ${res?.deleted ?? ids.length} 条`);
      loadList();
    } catch (err) {
      window.alert(`删除失败：${err.message || err}`);
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

  checkAll?.addEventListener('change', () => {
    tbody.querySelectorAll('input[data-row-check]').forEach((box) => {
      box.checked = checkAll.checked;
    });
    checkAll.indeterminate = false;
  });

  batchDeleteBtn?.addEventListener('click', batchDelete);

  loadList();
})();
