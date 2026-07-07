<template>
  <section class="admin-page">
    <h1>课程管理</h1>
    <p class="admin-page__hint">课程详情富文本 · API: GET/PUT /api/courses/:id</p>

    <table class="admin-page__table">
      <thead>
        <tr>
          <th>课程名称</th>
          <th>价格</th>
          <th>人数</th>
          <th>授课英雄</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="5">加载中…</td></tr>
        <tr v-else-if="!rows.length"><td colspan="5">暂无课程</td></tr>
        <tr v-for="row in rows" :key="row.course_id || row.id">
          <td>{{ row.title }}</td>
          <td>{{ formatPrice(row) }}</td>
          <td>{{ row.total || row.headcount || '—' }}</td>
          <td>{{ row.hero_name || '—' }}</td>
          <td><button type="button" @click="openEditor(row)">编辑详情</button></td>
        </tr>
      </tbody>
    </table>

    <div v-if="editing" class="admin-detail">
      <h2>编辑课程详情 · {{ editing.title }}</h2>
      <p class="admin-page__hint">使用富文本编辑器维护课程详情 HTML。</p>
      <div class="rich-editor">
        <div class="rich-editor__toolbar">
          <button type="button" @click="exec('bold')"><b>B</b></button>
          <button type="button" @click="exec('italic')"><i>I</i></button>
          <button type="button" @click="exec('insertUnorderedList')">• 列表</button>
          <button type="button" @click="exec('formatBlock', 'h3')">标题</button>
          <button type="button" @click="insertLink">链接</button>
        </div>
        <div
          ref="editorRef"
          class="rich-editor__body"
          contenteditable="true"
          @input="onEditorInput"
        ></div>
      </div>
      <div style="margin-top: 16px; display: flex; gap: 8px">
        <button type="button" @click="save">保存</button>
        <button type="button" @click="closeEditor">关闭</button>
      </div>
      <p v-if="savedMsg" style="color: green; margin-top: 8px">{{ savedMsg }}</p>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue';

const API_BASE = 'http://127.0.0.1:8787';
const rows = ref([]);
const loading = ref(false);
const editing = ref(null);
const editorRef = ref(null);
const savedMsg = ref('');

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function formatPrice(item) {
  const p = item.price != null ? item.price : item.fee;
  return p != null ? `¥${p}` : '—';
}

async function loadList() {
  loading.value = true;
  try {
    const data = await request('/api/courses');
    rows.value = data.items || [];
  } catch (err) {
    rows.value = [];
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function exec(cmd, value) {
  document.execCommand(cmd, false, value || null);
  editorRef.value?.focus();
}

function insertLink() {
  const url = window.prompt('链接地址', 'https://');
  if (url) exec('createLink', url);
}

function onEditorInput() {
  savedMsg.value = '';
}

async function openEditor(row) {
  editing.value = row;
  savedMsg.value = '';
  await nextTick();
  if (editorRef.value) {
    editorRef.value.innerHTML = row.detail_html || `<p>${row.description || ''}</p>`;
  }
}

function closeEditor() {
  editing.value = null;
  savedMsg.value = '';
}

async function save() {
  if (!editing.value || !editorRef.value) return;
  const id = editing.value.course_id || editing.value.id;
  const detail_html = editorRef.value.innerHTML;
  try {
    await request(`/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ detail_html }),
    });
    const idx = rows.value.findIndex((r) => (r.course_id || r.id) === id);
    if (idx >= 0) rows.value[idx] = { ...rows.value[idx], detail_html };
    savedMsg.value = '已保存';
  } catch (err) {
    window.alert('保存失败');
    console.error(err);
  }
}

onMounted(loadList);
</script>

<style scoped>
.admin-page { padding: 24px; }
.admin-page__hint { color: #5c6c7a; margin-bottom: 16px; }
.admin-page__table { width: 100%; border-collapse: collapse; }
.admin-page__table th, .admin-page__table td { border: 1px solid #e1e5e8; padding: 12px; text-align: left; }
.admin-detail { margin-top: 24px; padding: 16px; border: 1px solid #e1e5e8; border-radius: 8px; }
</style>
