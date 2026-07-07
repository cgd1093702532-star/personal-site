<template>
  <section class="admin-page">
    <h1>报名管理</h1>
    <p class="admin-page__hint">API: GET /api/admin/signups · POST .../cancel</p>

    <div class="admin-toolbar">
      <input v-model="searchQ" class="admin-search" type="search" placeholder="搜索姓名、手机号" @keydown.enter="loadList" />
      <button type="button" class="admin-btn" @click="loadList">搜索</button>
    </div>

    <div class="admin-tabs">
      <button v-for="tab in statusTabs" :key="tab.value" type="button" class="admin-tabs__item" :class="{ active: statusFilter === tab.value }" @click="setStatus(tab.value)">{{ tab.label }}</button>
    </div>
    <div class="admin-tabs admin-tabs--sub">
      <span class="admin-tabs__label">支付：</span>
      <button v-for="tab in payTabs" :key="tab.value" type="button" class="admin-tabs__item" :class="{ active: payFilter === tab.value }" @click="setPay(tab.value)">{{ tab.label }}</button>
    </div>

    <table class="admin-page__table">
      <thead>
        <tr>
          <th>报名人</th><th>手机号</th><th>项目</th><th>场景</th><th>时间</th><th>支付</th><th>状态</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="8">加载中…</td></tr>
        <tr v-else-if="!rows.length"><td colspan="8">暂无数据</td></tr>
        <tr v-for="row in rows" :key="row.signup_id">
          <td>{{ row.name }}</td>
          <td>{{ row.phone }}</td>
          <td>{{ row.title }}</td>
          <td>{{ row.type_label || row.type }}</td>
          <td>{{ formatTime(row.created_at) }}</td>
          <td>{{ row.pay_status_label }}</td>
          <td>{{ row.status_label }}</td>
          <td>
            <button type="button" @click="viewDetail(row)">查看</button>
            <button v-if="row.status !== 'cancelled'" type="button" class="btn-danger" @click="cancel(row.signup_id)">取消</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="detail" class="admin-detail">
      <h2>报名详情</h2>
      <p><strong>报名人：</strong>{{ detail.name }} · {{ detail.phone }}</p>
      <p><strong>项目：</strong>{{ detail.title }}</p>
      <p><strong>支付/状态：</strong>{{ detail.pay_status_label }} / {{ detail.status_label }}</p>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const API_BASE = 'http://127.0.0.1:8787';
const statusTabs = [
  { label: '全部', value: '' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已取消', value: 'cancelled' },
  { label: '已退款', value: 'refunded' },
];
const payTabs = [
  { label: '全部', value: '' },
  { label: '待支付', value: 'unpaid' },
  { label: '已支付', value: 'paid' },
  { label: '已退款', value: 'refunded' },
];

const rows = ref([]);
const detail = ref(null);
const loading = ref(false);
const statusFilter = ref('');
const payFilter = ref('');
const searchQ = ref('');

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN');
}

function setStatus(v) { statusFilter.value = v; detail.value = null; loadList(); }
function setPay(v) { payFilter.value = v; detail.value = null; loadList(); }

async function loadList() {
  loading.value = true;
  try {
    const qs = new URLSearchParams();
    if (statusFilter.value) qs.set('status', statusFilter.value);
    if (payFilter.value) qs.set('pay_status', payFilter.value);
    if (searchQ.value.trim()) qs.set('q', searchQ.value.trim());
    const data = await request(`/api/admin/signups?${qs}`);
    rows.value = data.items || [];
  } catch (err) {
    rows.value = [];
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function viewDetail(row) { detail.value = row; }

async function cancel(id) {
  if (!window.confirm('确认取消该报名？')) return;
  await request(`/api/admin/signups/${id}/cancel`, { method: 'POST', body: '{}' });
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
.admin-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.admin-tabs__item { padding: 8px 14px; border: 1px solid #e1e5e8; background: #fff; border-radius: 6px; cursor: pointer; }
.admin-tabs__item.active { background: #0d6efd; color: #fff; border-color: #0d6efd; }
.admin-tabs--sub { margin-top: -4px; }
.admin-tabs__label { align-self: center; font-size: 13px; color: #5c6c7a; }
.admin-page__table { width: 100%; border-collapse: collapse; }
.admin-page__table th, .admin-page__table td { border: 1px solid #e1e5e8; padding: 12px; text-align: left; }
.admin-detail { margin-top: 24px; padding: 16px; border: 1px solid #e1e5e8; border-radius: 8px; }
.btn-danger { margin-left: 8px; color: #dc3545; }
</style>
