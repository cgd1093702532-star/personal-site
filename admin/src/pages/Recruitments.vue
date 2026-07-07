<template>
  <section class="admin-page">
    <h1>招募管理</h1>
    <p class="admin-page__hint">需求见 docs/admin/pages/招募管理.md</p>
    <ul class="admin-page__list">
      <li v-for="item in list" :key="item.id">
        <strong>{{ item.title }}</strong> · {{ item.hero }} · {{ item.status }}
      </li>
    </ul>
  </section>
</template>

<script setup>
const list = [
  { id: 1, title: '企业家杯月赛', hero: '小哥', status: '招募中' },
  { id: 2, title: '亲子帆船体验日', hero: '小哥', status: '报名中' },
];
</script>

<style scoped>
.admin-page { padding: 24px; }
.admin-page__hint { color: #5c6c7a; margin-bottom: 16px; }
.admin-page__list { padding-left: 20px; line-height: 2; }
</style>
