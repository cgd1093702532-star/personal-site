/** 英雄广场 · 本地数据库客户端（预览 / 浏览器） */
(function (global) {
  const BASE = 'http://127.0.0.1:8787';
  let available = null;

  async function request(path, options) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options && options.headers) },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  async function checkAvailable() {
    try {
      const res = await fetch(`${BASE}/api/health`, { method: 'GET' });
      available = res.ok;
    } catch (_) {
      available = false;
    }
    return available;
  }

  const HeroPlazaDB = {
    BASE,

    async isAvailable() {
      return checkAvailable();
    },

    async getHero(heroId) {
      return request(`/api/heroes/${heroId}`);
    },

    async updateHero(heroId, patch) {
      return request(`/api/heroes/${heroId}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
    },

    async listRecruitments(query) {
      const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
      const data = await request(`/api/recruitments${qs}`);
      return data.items || [];
    },

    async getRecruitment(id) {
      return request(`/api/recruitments/${id}`);
    },

    async createRecruitment(item, scope) {
      const body = { ...item };
      if (scope) body.scope = scope;
      return request('/api/recruitments', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    async updateRecruitment(id, patch) {
      return request(`/api/recruitments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
    },

    async deleteRecruitment(id) {
      return request(`/api/recruitments/${id}`, { method: 'DELETE' });
    },

    async listCourses() {
      const data = await request('/api/courses');
      return data.items || [];
    },

    async getCourse(id) {
      return request(`/api/courses/${id}`);
    },

    async createCourse(item) {
      return request('/api/courses', {
        method: 'POST',
        body: JSON.stringify(item),
      });
    },

    async updateCourse(id, patch) {
      return request(`/api/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
    },

    async getMyRecruitmentLists() {
      const tabs = ['active', 'ended', 'draft'];
      const lists = {};
      for (let i = 0; i < tabs.length; i += 1) {
        const tab = tabs[i];
        const data = await request(`/api/recruitments/mine/${tab}`);
        lists[tab] = data.items || [];
      }
      return lists;
    },

    async getAppState(key) {
      const data = await request(`/api/app-state/${key}`);
      return data.value;
    },

    async setAppState(key, value) {
      const data = await request(`/api/app-state/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
      return data.value;
    },

    async getHeroApplyStatus(userId) {
      const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
      return request(`/api/heroes/apply/status${qs}`);
    },

    async submitHeroApply(application) {
      return request('/api/heroes/apply', {
        method: 'POST',
        body: JSON.stringify(application),
      });
    },

    async withdrawHeroApply(userId) {
      return request('/api/heroes/apply/withdraw', {
        method: 'POST',
        body: JSON.stringify(userId ? { user_id: userId } : {}),
      });
    },

    async listApplications(query) {
      const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
      const data = await request(`/api/admin/applications${qs}`);
      return data.items || [];
    },

    async getApplication(id) {
      return request(`/api/admin/applications/${id}`);
    },

    async approveApplication(id) {
      return request(`/api/admin/applications/${id}/approve`, { method: 'POST', body: '{}' });
    },

    async rejectApplication(id, reason) {
      return request(`/api/admin/applications/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || '' }),
      });
    },

    async deleteApplication(id) {
      return request(`/api/admin/applications/${id}`, { method: 'DELETE' });
    },

    async listAdminSignups(query) {
      const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
      const data = await request(`/api/admin/signups${qs}`);
      return data.items || [];
    },

    async getSignup(id) {
      return request(`/api/admin/signups/${id}`);
    },

    async cancelSignup(id) {
      return request(`/api/admin/signups/${id}/cancel`, { method: 'POST', body: '{}' });
    },

    async listAdminRecruitments(query) {
      const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
      const data = await request(`/api/admin/recruitments${qs}`);
      return data.items || [];
    },

    async getAdminRecruitment(id) {
      return request(`/api/admin/recruitments/${id}`);
    },

    async listRecruitmentSignups(recruitId) {
      const data = await request(`/api/admin/recruitments/${recruitId}/signups`);
      return data.items || [];
    },

    async closeRecruitment(id) {
      return request(`/api/admin/recruitments/${id}/close`, { method: 'POST', body: '{}' });
    },

    async listAdminHeroes(query) {
      const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
      const data = await request(`/api/admin/heroes${qs}`);
      return data.items || [];
    },

    async reset() {
      return request('/api/reset', { method: 'POST', body: '{}' });
    },
  };

  global.HeroPlazaDB = HeroPlazaDB;
})(typeof window !== 'undefined' ? window : globalThis);
