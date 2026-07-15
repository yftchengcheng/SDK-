<!--
  ReportLayout
  ===========================================================
  数据报表 — 父级 layout
  - 去除面包屑 / 顶部 Tab 切换（统一由左侧 sidebar 导航 + 子页面 page-header 承接）
  - keep-alive 保留子页面状态
  - 通过 <router-view /> 渲染当前子页面
  ===========================================================
-->
<template>
  <div class="report-layout">
    <!-- 子路由内容（keep-alive 保留状态） -->
    <router-view v-slot="{ Component }">
      <keep-alive :include="cachedViews">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup lang="ts">
const cachedViews = ['ReportOverview', 'ReportFunnel', 'ReportBehavior'];
</script>
