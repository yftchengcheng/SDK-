<!--
  AggregationLayout
  ===========================================================
  聚合管理 — 父级 layout
  - 顶部面包屑（聚合管理 / 子模块）
  - Tab 切换三个子模块（流量分组 / 广告源管理 / 瀑布流配置）
  - keep-alive 保留子页面状态
  - 通过 <router-view /> 渲染当前子页面
  ===========================================================
-->
<template>
  <div class="aggregation-layout">
    <!-- 顶部：面包屑 -->
    <div class="aggregation-breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/aggregation/waterfall' }">聚合管理</el-breadcrumb-item>
        <el-breadcrumb-item>{{ currentTabLabel }}</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="aggregation-breadcrumb-sub">流量分组 · 广告源 · 瀑布流，一站式配置</div>
    </div>

    <!-- 顶部：Tab 切换 -->
    <div class="aggregation-tabs">
      <el-tabs :model-value="activeTab" class="aggregation-el-tabs" @tab-change="onTabChange">
        <el-tab-pane name="traffic-group" label="流量分组">
          <template #label>
            <span class="aggregation-tab-label">
              <el-icon><Filter /></el-icon>
              <span>流量分组</span>
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="ad-source" label="广告源管理">
          <template #label>
            <span class="aggregation-tab-label">
              <el-icon><Connection /></el-icon>
              <span>广告源管理</span>
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="waterfall" label="瀑布流配置">
          <template #label>
            <span class="aggregation-tab-label">
              <el-icon><SetUp /></el-icon>
              <span>瀑布流配置</span>
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 子路由内容（keep-alive 保留状态） -->
    <div class="aggregation-content">
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
import { Filter, Connection, SetUp } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

// route.name -> tab pane name 的映射
const ROUTE_TO_TAB: Record<string, string> = {
  TrafficGroup: 'traffic-group',
  AdSourceManage: 'ad-source',
  WaterfallConfig: 'waterfall',
};
const TAB_TO_ROUTE: Record<string, string> = {
  'traffic-group': 'TrafficGroup',
  'ad-source': 'AdSourceManage',
  waterfall: 'WaterfallConfig',
};

const TAB_LABELS: Record<string, string> = {
  'traffic-group': '流量分组',
  'ad-source': '广告源管理',
  waterfall: '瀑布流配置',
};

// 当前激活的 Tab（与子路由对齐）
const activeTab = ref<string>(ROUTE_TO_TAB[route.name as string] || 'waterfall');

// keep-alive 缓存的子页面（用 route name）
const cachedViews = ['TrafficGroup', 'AdSourceManage', 'WaterfallConfig'];

const currentTabLabel = computed(() => TAB_LABELS[activeTab.value] || '');

// 监听 route.name 变化以同步 Tab（用户直接改 URL 或浏览器前进/后退时也能切换 Tab）
watch(
  () => route.name,
  (newName) => {
    if (newName && ROUTE_TO_TAB[newName as string]) {
      activeTab.value = ROUTE_TO_TAB[newName as string];
    }
  },
);

// Tab 切换 → 路由跳转（@tab-change 在 Element Plus 2.6+ 中提供）
const onTabChange = (name: string | number) => {
  const target = String(name);
  const routeName = TAB_TO_ROUTE[target];
  if (routeName && route.name !== routeName) {
    router.push({ name: routeName });
  }
};
</script>
