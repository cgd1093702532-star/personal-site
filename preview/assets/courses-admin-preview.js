/** 课程管理 · 后台预览（含富文本编辑器） */
(function () {
  const tbody = document.getElementById('courses-admin-tbody');
  const detailPanel = document.getElementById('courses-admin-detail');
  const hint = document.getElementById('courses-admin-hint');
  if (!tbody) return;

  const API = window.HeroPlazaDB;
  let rows = [];
  let editingId = null;

  function formatPrice(item) {
    const p = item.price != null ? item.price : item.fee;
    return p != null ? `¥${p}` : '—';
  }

  function execCommand(cmd, value) {
    document.execCommand(cmd, false, value || null);
  }

  function renderToolbar() {
    return (
      `<div class="rich-editor__toolbar">` +
      `<button type="button" data-cmd="bold"><b>B</b></button>` +
      `<button type="button" data-cmd="italic"><i>I</i></button>` +
      `<button type="button" data-cmd="insertUnorderedList">• 列表</button>` +
      `<button type="button" data-cmd="formatBlock" data-value="h3">标题</button>` +
      `<button type="button" data-cmd="createLink" data-link>链接</button>` +
      `</div>`
    );
  }

  function bindEditor(panel) {
    panel.querySelectorAll('[data-cmd]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        if (cmd === 'createLink') {
          const url = window.prompt('链接地址', 'https://');
          if (url) execCommand(cmd, url);
          return;
        }
        execCommand(cmd, btn.dataset.value);
        panel.querySelector('.rich-editor__body')?.focus();
      });
    });
  }

  function renderTable() {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="admin-table__empty">暂无课程</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(
        (item) =>
          `<tr>` +
          `<td><div class="admin-table__thumb"><span class="admin-table__thumb-placeholder">📚</span><span>${item.title || '—'}</span></div></td>` +
          `<td>${formatPrice(item)}</td>` +
          `<td>${item.total || item.headcount || '—'}</td>` +
          `<td>${item.hero_name || '—'}</td>` +
          `<td class="admin-cell-ops"><button type="button" class="admin-link" data-edit="${item.course_id || item.id}">编辑详情</button></td>` +
          `</tr>`,
      )
      .join('');
    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => openDetail(btn.dataset.edit));
    });
  }

  function openDetail(id) {
    const item = rows.find((r) => (r.course_id || r.id) === id);
    if (!item || !detailPanel) return;
    editingId = id;
    const html = item.detail_html || `<p>${item.description || ''}</p>`;
    const body = detailPanel.querySelector('.admin-card__body') || detailPanel;
    detailPanel.hidden = false;
    body.innerHTML =
      `<div class="admin-detail">` +
      `<h2 class="admin-detail__title">编辑课程详情 · ${item.title}</h2>` +
      `<p class="admin-page-tip">使用富文本编辑器维护课程详情，保存后前台详情页将展示 HTML 内容。</p>` +
      `<div class="rich-editor">` +
      renderToolbar() +
      `<div class="rich-editor__body" contenteditable="true">${html}</div>` +
      `</div>` +
      `<div class="admin-detail__actions">` +
      `<button type="button" class="admin-btn admin-btn--primary" id="courses-save-detail">保存</button>` +
      `<button type="button" class="admin-btn" id="courses-close-detail">关闭</button>` +
      `</div></div>`;
    bindEditor(body);
    body.querySelector('#courses-close-detail')?.addEventListener('click', () => {
      detailPanel.hidden = true;
      editingId = null;
    });
    body.querySelector('#courses-save-detail')?.addEventListener('click', saveDetail);
  }

  async function saveDetail() {
    if (!editingId || !API) return;
    const body = detailPanel.querySelector('.admin-card__body') || detailPanel;
    const editor = body.querySelector('.rich-editor__body');
    const detail_html = body ? body.innerHTML : '';
    try {
      await API.updateCourse(editingId, { detail_html });
      const idx = rows.findIndex((r) => (r.course_id || r.id) === editingId);
      if (idx >= 0) rows[idx] = { ...rows[idx], detail_html };
      detailPanel.insertAdjacentHTML('beforeend', '<p style="color:green;margin-top:8px">已保存</p>');
      setTimeout(() => {
        const msg = detailPanel.querySelector('p[style*="green"]');
        if (msg) msg.remove();
      }, 2000);
    } catch (err) {
      window.alert('保存失败，请确认本地 API 已启动');
      console.error(err);
    }
  }

  async function load() {
    if (hint) hint.textContent = '课程详情富文本 · API: GET/PUT /api/courses/:id';
    if (!API) {
      tbody.innerHTML = '<tr><td colspan="5">缺少 db-client.js</td></tr>';
      return;
    }
    try {
      const ok = await API.isAvailable();
      if (!ok) throw new Error('offline');
      rows = await API.listCourses();
    } catch (_) {
      rows = [
        {
          course_id: 'c1',
          title: 'ASA101-103培训课',
          price: 1280,
          total: 16,
          hero_name: '小哥',
          detail_html: '<p>ASA 101+103 组合课程</p>',
        },
      ];
      if (hint) hint.textContent += '（离线演示数据）';
    }
    renderTable();
  }

  load();
})();
