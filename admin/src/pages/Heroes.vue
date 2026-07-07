<template>
  <section class="admin-page">
    <h1>英雄管理</h1>
    <p class="admin-page__hint">申请审核 · API: GET /api/admin/applications</p>

    <div class="admin-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="admin-tabs__item"
        :class="{ active: currentStatus === tab.value }"
        @click="switchTab(tab.value)"
      >{{ tab.label }}</button>
    </div>

    <table class="admin-page__table">
      <thead>
        <tr>
          <th>姓名</th>
          <th>手机号</th>
          <th>项目类型</th>
          <th>申请时间</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="6">加载中…</td></tr>
        <tr v-else-if="!rows.length"><td colspan="6">暂无数据</td></tr>
        <tr v-for="row in rows" :key="row.application_id">
          <td>{{ row.name }}</td>
          <td>{{ row.phone }}</td>
          <td>{{ row.project_types_display }}</td>
          <td>{{ formatTime(row.submitted_at) }}</td>
          <td>{{ row.status_label }}</td>
          <td>
            <button type="button" @click="viewDetail(row.application_id)">查看</button>
            <template v-if="row.status === 'pending'">
              <button type="button" @click="approve(row.application_id)">批准</button>
              <button type="button" @click="reject(row.application_id)">驳回</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="detail" class="admin-detail">
      <h2>申请详情</h2>
      <p><strong>姓名：</strong>{{ detail.name }}</p>
      <p><strong>手机：</strong>{{ detail.phone }}</p>
      <p><strong>城市：</strong>{{ detail.city }}</p>
      <p><strong>资质：</strong>{{ detail.certification }}</p>
      <p><strong>简介：</strong>{{ detail.bio }}</p>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const API_BASE = 'http://127.0.0.1:8787';
const tabs = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '全部', value: '' },
];

const rows = ref([]);
const detail = ref(null);
const loading = ref(false);
const currentStatus = ref('pending');

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-CN');
}

async function loadList() {
  loading.value = true;
  try {
    const qs = currentStatus.value ? `?status=${currentStatus.value}` : '';
    const data = await request(`/api/admin/applications${qs}`);
    rows.value = data.items || [];
  } catch (err) {
    rows.value = [];
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function switchTab(status) {
  currentStatus.value = status;
  detail.value = null;
  loadList();
}

async function viewDetail(id) {
  detail.value = await request(`/api/admin/applications/${id}`);
}

async function approve(id) {
  if (!window.confirm('确认批准？')) return;
  await request(`/api/admin/applications/${id}/approve`, { method: 'POST', body: '{}' });
  detail.value = null;
  loadList();
}

async function reject(id) {
  const reason = window.prompt('驳回原因', '资料不完整');
  if (reason === null) return;
  await request(`/api/admin/applications/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  detail.value = null;
  loadList();
}

onMounted(loadList);
</script>

<style scoped>
.admin-page { padding: 24px; }
.admin-page__hint { color: #5c6c7a; margin-bottom: 16px; }
.admin-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.admin-tabs__item { padding: 8px 16px; border: 1px solid #e1e5e8; background: #fff; cursor: pointer; border-radius: 6px; }
.admin-tabs__item.active { background: #0d6efd; color: #fff; border-color: #0d6efd; }
.admin-page__table { width: 100%; border-collapse: collapse; }
.admin-page__table th, .admin-page__table td { border: 1px solid #e1e5e8; padding: 12px; text-align: left; }
.admin-detail { margin-top: 24px; padding: 16px; border: 1px solid #e1e5e8; border-radius: 8px; }
</style>
