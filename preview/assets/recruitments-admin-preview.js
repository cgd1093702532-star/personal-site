/** 管理后台 · 赛事管理（预览） */
(function () {
  const tbody = document.getElementById('recruitments-admin-tbody');
  const detail = document.getElementById('recruitments-admin-detail');
  const hint = document.getElementById('recruitments-admin-hint');
  const searchInput = document.getElementById('recruitments-admin-search');
  if (!tbody) return;

  let currentStatus = '';
  let rows = [];

  function detailBody() {
    return detail?.querySelector('.admin-card__body') || detail;
  }

  function coverThumb(row) {
    const img = row.cover_images && row.cover_images[0];
    const title = row.title || '活动';
    if (img) {
      return `<div class="admin-table__thumb"><img class="admin-table__thumb-img" src="../assets/images/${img}" alt=""><span>${title}</span></div>`;
    }
    return `<div class="admin-table__thumb"><span class="admin-table__thumb-placeholder">⛵</span><span>${title}</span></div>`;
  }

  function formatTimeRange(start, end) {
    if (!start) return '—';
    const fmt = (iso) => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    return end ? `${fmt(start)} - ${fmt(end)}` : fmt(start);
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
        <td>${coverThumb(row)}</td>
        <td>${row.typeLabel || row.type_label || '—'}</td>
        <td>${row.hero_name || '—'}</td>
        <td>${row.signup_summary || '—'}</td>
        <td>${row.fee != null ? `¥${row.fee}` : '—'}</td>
        <td>${formatTimeRange(row.start_at, row.end_at)}</td>
        <td><span class="admin-badge admin-badge--${row.admin_status}">${row.admin_status_label}</span></td>
        <td class="admin-cell-ops admin-cell-ops--stack">
          <span><button type="button" class="admin-link" data-view="${row.recruit_id}">查看</button></span>
          ${
            row.admin_status !== 'cancelled' && row.admin_status !== 'ended'
              ? `<span><button type="button" class="admin-link admin-link--danger" data-close="${row.recruit_id}">关闭赛事</button></span>`
              : ''
          }
        </td>
      </tr>`,
      )
      .join('');
    tbody.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => showDetail(btn.dataset.view));
    });
    tbody.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => closeRecruitment(btn.dataset.close));
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
      rows = await db.listAdminRecruitments(query);
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
      const [item, signups] = await Promise.all([
        db.getAdminRecruitment(id),
        db.listRecruitmentSignups(id),
      ]);
      const signupRows = signups.length
        ? signups
            .map(
              (s) =>
                `<tr><td>${s.name}</td><td>${s.phone}</td><td>${s.pay_status_label}</td><td>${s.status_label}</td></tr>`,
            )
            .join('')
        : '<tr><td colspan="4" class="admin-table__empty">暂无报名</td></tr>';
      detailBody().innerHTML = `
        <div class="admin-detail">
          <h2 class="admin-detail__title">${item.title}</h2>
          <dl class="admin-detail__grid">
            <dt>类型</dt><dd>${item.typeLabel || '—'}</dd>
            <dt>英雄</dt><dd>${item.hero_name || '—'}</dd>
            <dt>地点</dt><dd>${item.location || '—'}</dd>
            <dt>时间</dt><dd>${formatTimeRange(item.start_at, item.end_at)}</dd>
            <dt>费用</dt><dd>¥${item.fee != null ? item.fee : '—'}/人</dd>
            <dt>报名进度</dt><dd>${item.signup_summary}</dd>
            <dt>状态</dt><dd>${item.admin_status_label}</dd>
            <dt>详情</dt><dd>${(item.description || '—').replace(/\n/g, '<br>')}</dd>
          </dl>
          <h3 class="admin-form-section__title" style="margin-top:20px">已报名人员</h3>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead><tr><th>姓名</th><th>手机</th><th>支付</th><th>状态</th></tr></thead>
              <tbody>${signupRows}</tbody>
            </table>
          </div>
          ${
            item.admin_status !== 'cancelled' && item.admin_status !== 'ended'
              ? `<div class="admin-detail__actions"><button type="button" class="admin-btn admin-btn--danger" id="recruit-close-btn">关闭赛事</button></div>`
              : ''
          }
        </div>`;
      document.getElementById('recruit-close-btn')?.addEventListener('click', () => closeRecruitment(id));
    } catch (err) {
      detailBody().innerHTML = `<p>加载失败：${err.message}</p>`;
    }
  }

  async function closeRecruitment(id) {
    const db = await getDb();
    if (!db) return;
    if (!window.confirm('确认关闭该赛事？关闭后前台将不再接受新报名。')) return;
    try {
      await db.closeRecruitment(id);
      window.alert('已关闭');
      detail.hidden = true;
      loadList();
    } catch (err) {
      window.alert(`操作失败：${err.message}`);
    }
  }

  document.querySelectorAll('[data-recruit-status]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-recruit-status]').forEach((t) => t.classList.remove('is-active', 'active'));
      tab.classList.add('is-active');
      currentStatus = tab.dataset.recruitStatus;
      detail.hidden = true;
      loadList();
    });
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadList();
  });
  document.getElementById('recruitments-admin-search-btn')?.addEventListener('click', loadList);
  document.getElementById('recruitments-admin-reset-btn')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    loadList();
  });

  loadList();
})();
