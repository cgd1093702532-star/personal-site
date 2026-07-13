/** 管理后台 · 仪表盘 */
(function () {
  const hint = document.getElementById('dashboard-hint');
  const list = document.getElementById('dashboard-activities');
  if (!list) return;

  function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('zh-CN');
  }

  async function load() {
    if (!window.HeroPlazaDB || !(await window.HeroPlazaDB.isAvailable())) {
      if (hint) hint.textContent = '本地 API 未启动，请先运行 bash scripts/start-dev.sh';
      list.innerHTML = '<li class="admin-page-tip">无法连接 API</li>';
      return;
    }
    if (hint) hint.textContent = '';
    try {
      const data = await window.HeroPlazaDB.getDashboard();
      const stats = data.stats || {};
      document.querySelectorAll('[data-stat]').forEach((el) => {
        const key = el.dataset.stat;
        el.textContent = stats[key] != null ? stats[key] : '—';
      });
      const activities = data.activities || [];
      if (!activities.length) {
        list.innerHTML = '<li class="admin-page-tip">暂无动态</li>';
        return;
      }
      list.innerHTML = activities
        .map(
          (a) =>
            `<li class="admin-activity-item"><span class="admin-activity-item__text">${a.text || ''}</span><span class="admin-activity-item__time">${formatTime(a.time)}</span></li>`,
        )
        .join('');
    } catch (err) {
      list.innerHTML = `<li class="admin-page-tip">加载失败：${err.message}</li>`;
    }
  }

  load();
})();
