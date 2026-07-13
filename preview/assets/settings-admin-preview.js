/** 管理后台 · 系统配置 */
(function () {
  const hint = document.getElementById('settings-admin-hint');
  const featuresRoot = document.getElementById('settings-features');
  const scenariosTbody = document.getElementById('settings-scenarios-tbody');
  if (!featuresRoot || !scenariosTbody) return;

  let settings = null;

  const FEATURE_LABELS = {
    hero_apply: '英雄认证',
    rating: '评级展示',
    certificates: '证书展示',
    online_pay: '在线支付',
    geolocation: '地理定位',
  };

  async function getDb() {
    if (!window.HeroPlazaDB || !(await window.HeroPlazaDB.isAvailable())) {
      if (hint) hint.textContent = '本地 API 未启动，请先运行 bash scripts/start-dev.sh';
      return null;
    }
    if (hint) hint.textContent = '';
    return window.HeroPlazaDB;
  }

  function render() {
    if (!settings) return;
    const copy = settings.copy || {};
    document.getElementById('settings-copy-hero').value = copy.hero || '';
    document.getElementById('settings-copy-recruitment').value = copy.recruitment || '';
    document.getElementById('settings-copy-signup').value = copy.signup || '';

    const features = settings.features || {};
    featuresRoot.innerHTML = Object.keys(FEATURE_LABELS)
      .map(
        (key) => `
      <label class="admin-form-item" style="flex-direction:row;align-items:center;gap:8px">
        <input type="checkbox" data-feature="${key}" ${features[key] ? 'checked' : ''} />
        <span>${FEATURE_LABELS[key]}</span>
      </label>`,
      )
      .join('');

    const scenarios = settings.scenarios || [];
    scenariosTbody.innerHTML = scenarios
      .map(
        (s, idx) => `
      <tr>
        <td>${s.name}</td>
        <td>${s.code}</td>
        <td><span class="admin-badge admin-badge--${s.status}">${s.status === 'active' ? '启用' : '停用'}</span></td>
        <td class="admin-cell-ops">
          <button type="button" class="admin-link" data-toggle-scenario="${idx}">${s.status === 'active' ? '停用' : '启用'}</button>
        </td>
      </tr>`,
      )
      .join('');
    scenariosTbody.querySelectorAll('[data-toggle-scenario]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.toggleScenario);
        const cur = settings.scenarios[i];
        cur.status = cur.status === 'active' ? 'disabled' : 'active';
        render();
      });
    });
  }

  async function load() {
    const db = await getDb();
    if (!db) return;
    try {
      settings = await db.getSettings();
      render();
    } catch (err) {
      if (hint) hint.textContent = `加载失败：${err.message}`;
    }
  }

  document.getElementById('settings-save-btn')?.addEventListener('click', async () => {
    const db = await getDb();
    if (!db || !settings) return;
    const features = { ...(settings.features || {}) };
    featuresRoot.querySelectorAll('[data-feature]').forEach((el) => {
      features[el.dataset.feature] = el.checked;
    });
    const patch = {
      copy: {
        hero: document.getElementById('settings-copy-hero').value.trim() || '英雄',
        recruitment: document.getElementById('settings-copy-recruitment').value.trim() || '招募',
        signup: document.getElementById('settings-copy-signup').value.trim() || '报名',
      },
      features,
      scenarios: settings.scenarios,
    };
    try {
      settings = await db.updateSettings(patch);
      if (hint) hint.textContent = '已保存';
      render();
    } catch (err) {
      if (hint) hint.textContent = `保存失败：${err.message}`;
    }
  });

  load();
})();
