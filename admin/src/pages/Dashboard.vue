<template>
  <section class="admin-page">
    <h1>仪表盘</h1>
    <p class="admin-page__hint">管理后台 · 需求见 docs/admin/pages/仪表盘.md</p>
    <ul class="admin-page__cards">
      <li><strong>认证英雄</strong> 128</li>
      <li><strong>进行中招募</strong> 24</li>
      <li><strong>本月报名</strong> 356</li>
      <li><strong>待审核</strong> 5</li>
    </ul>
  </section>
</template>

<script setup>
/** M1 占位 · admin/src/pages/Dashboard.vue */
</script>

<style scoped>
.admin-page { padding: 24px; }
.admin-page__hint { color: #5c6c7a; margin-bottom: 24px; }
.admin-page__cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; list-style: none; padding: 0; }
.admin-page__cards li { padding: 20px; background: #fafafa; border-radius: 8px; }
</style>
