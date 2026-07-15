<!--
  ReportLayout
  ===========================================================
  数据报表 — 父级 layout
  - 顶部面包屑（数据报表 / 子模块）
  - Tab 切换三个子模块（综合报表 / 漏斗分析 / 用户行为）
  - keep-alive 保留子页面状态
  - 通过 <router-view /> 渲染当前子页面
  ===========================================================
-->
<template>
  <div class="report-layout">
    <!-- 顶部：面包屑 -->
    <div class="report-breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/report/overview' }">数据报表</el-breadcrumb-item>
        <el-breadcrumb-item>{{ currentTabLabel }}</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="report-breadcrumb-sub">综合报表 · 漏斗分析 · 用户行为，全维度数据洞察</div>
    </div>

    <!-- 顶部：Tab 切换 -->
    <div class="report-tabs">
      <el-tabs :model-value="activeTab" class="report-el-tabs" @tab-change="onTabChange">
        <el-tab-pane name="overview" label="综合报表">
          <template #label>
            <span class="report-tab-label">
              <el-icon><DataAnalysis /></el-icon>
              <span>综合报表</span>
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="funnel" label="漏斗分析">
          <template #label>
            <span class="report-tab-label">
              <el-icon><Filter /></el-icon>
              <span>漏斗分析</span>
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="behavior" label="用户行为">
          <template #label>
            <span class="report-tab-label">
              <el-icon><User /></el-icon>
              <span>用户行为</span>
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 子路由内容（keep-alive 保留状态） -->
    <div class="report-content">
      <router-view v-slot="{ Component }">
        <keep-alive :include="cachedViews">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DataAnalysis, Filter, User } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

const ROUTE_TO_TAB: Record<string, string> = {
  ReportOverview: 'overview',
  ReportFunnel: 'funnel',
  ReportBehavior: 'behavior',
};
const TAB_TO_ROUTE: Record<string, string> = {
  overview: 'ReportOverview',
  funnel: 'ReportFunnel',
  behavior: 'ReportBehavior',
};

const TAB_LABELS: Record<string, string> = {
  overview: '综合报表',
  funnel: '漏斗分析',
  behavior: '用户行为',
};

const activeTab = ref<string>(ROUTE_TO_TAB[route.name as string] || 'overview');

const cachedViews = ['ReportOverview', 'ReportFunnel', 'ReportBehavior'];

const currentTabLabel = computed(() => TAB_LABELS[activeTab.value] || '');

watch(
  () => route.name,
  (newName) => {
    if (newName && ROUTE_TO_TAB[newName as string]) {
      activeTab.value = ROUTE_TO_TAB[newName as string];
    }
  },
);

const onTabChange = (name: string | number) => {
  const target = String(name);
  const routeName = TAB_TO_ROUTE[target];
  if (routeName && route.name !== routeName) {
    router.push({ name: routeName });
  }
};
</script>
