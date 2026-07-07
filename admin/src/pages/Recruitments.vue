<template>
  <section class="admin-page">
    <h1>赛事管理</h1>
    <p class="admin-page__hint">API: GET /api/admin/recruitments · POST .../close</p>

    <div class="admin-toolbar">
      <input v-model="searchQ" class="admin-search" type="search" placeholder="搜索赛事标题" @keydown.enter="loadList" />
      <button type="button" class="admin-btn" @click="loadList">搜索</button>
    </div>

    <div class="admin-tabs">
      <button v-for="tab in tabs" :key="tab.value" type="button" class="admin-tabs__item" :class="{ active: statusFilter === tab.value }" @click="setStatus(tab.value)">{{ tab.label }}</button>
    </div>

    <table class="admin-page__table">
      <thead>
        <tr>
          <th>标题</th><th>类型</th><th>英雄</th><th>报名</th><th>价格</th><th>时间</th><th>状态</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="8">加载中…</td></tr>
        <tr v-else-if="!rows.length"><td colspan="8">暂无数据</td></tr>
        <tr v-for="row in rows" :key="row.recruit_id">
          <td>{{ row.title }}</td>
          <td>{{ row.typeLabel }}</td>
          <td>{{ row.hero_name }}</td>
          <td>{{ row.signup_summary }}</td>
          <td>{{ row.fee != null ? `¥${row.fee}` : '—' }}</td>
          <td>{{ formatRange(row.start_at, row.end_at) }}</td>
          <td>{{ row.admin_status_label }}</td>
          <td>
            <button type="button" @click="viewDetail(row.recruit_id)">查看</button>
            <button v-if="row.admin_status !== 'cancelled' && row.admin_status !== 'ended'" type="button" class="btn-danger" @click="close(row.recruit_id)">关闭</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="detail" class="admin-detail">
      <h2>{{ detail.title }}</h2>
      <p><strong>英雄：</strong>{{ detail.hero_name }} · <strong>状态：</strong>{{ detail.admin_status_label }}</p>
      <p><strong>报名：</strong>{{ detail.signup_summary }}</p>
      <h3>已报名人员</h3>
      <ul v-if="signups.length">
        <li v-for="s in signups" :key="s.signup_id">{{ s.name }} · {{ s.phone }} · {{ s.pay_status_label }}</li>
      </ul>
      <p v-else>暂无报名</p>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const API_BASE = 'http://127.0.0.1:8787';
const tabs = [
  { label: '全部', value: '' },
  { label: '招募中', value: 'recruiting' },
  { label: '报名中', value: 'enrolling' },
  { label: '已满员', value: 'full' },
  { label: '已结束', value: 'ended' },
  { label: '已取消', value: 'cancelled' },
];

const rows = ref([]);
const detail = ref(null);
const signups = ref([]);
const loading = ref(false);
const statusFilter = ref('');
const searchQ = ref('');

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function formatRange(start, end) {
  if (!start) return '—';
  const fmt = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  return end ? `${fmt(start)} - ${fmt(end)}` : fmt(start);
}

function setStatus(v) { statusFilter.value = v; detail.value = null; loadList(); }

async function loadList() {
  loading.value = true;
  try {
    const qs = new URLSearchParams();
    if (statusFilter.value) qs.set('status', statusFilter.value);
    if (searchQ.value.trim()) qs.set('q', searchQ.value.trim());
    const data = await request(`/api/admin/recruitments?${qs}`);
    rows.value = data.items || [];
  } catch (err) {
    rows.value = [];
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function viewDetail(id) {
  detail.value = await request(`/api/admin/recruitments/${id}`);
  const data = await request(`/api/admin/recruitments/${id}/signups`);
  signups.value = data.items || [];
}

async function close(id) {
  if (!window.confirm('确认关闭该赛事？')) return;
  await request(`/api/admin/recruitments/${id}/close`, { method: 'POST', body: '{}' });
  detail.value = null;
  loadList();
}

onMounted(loadList);
</script>

<style scoped>
.admin-page { padding: 24px; }
.admin-page__hint { color: #5c6c7a; margin-bottom: 16px; }
.admin-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.admin-search { flex: 1; max-width: 320px; padding: 8px 12px; border: 1px solid #e1e5e8; border-radius: 6px; }
.admin-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.admin-tabs__item { padding: 8px 14px; border: 1px solid #e1e5e8; background: #fff; border-radius: 6px; cursor: pointer; }
.admin-tabs__item.active { background: #0d6efd; color: #fff; border-color: #0d6efd; }
.admin-page__table { width: 100%; border-collapse: collapse; }
.admin-page__table th, .admin-page__table td { border: 1px solid #e1e5e8; padding: 12px; text-align: left; }
.admin-detail { margin-top: 24px; padding: 16px; border: 1px solid #e1e5e8; border-radius: 8px; }
.btn-danger { margin-left: 8px; color: #dc3545; }
</style>
