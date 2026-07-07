<template>
  <div class="main-layout">
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-logo" @click="isCollapsed = !isCollapsed">
        <el-icon v-if="isCollapsed" :size="20"><Grid /></el-icon>
        <span v-else class="logo-text">SDK聚合平台</span>
      </div>
      <el-menu
        :default-active="currentRoute"
        :collapse="isCollapsed"
        :collapse-transition="false"
        background-color="#1E293B"
        text-color="#CBD5E1"
        active-text-color="#FFFFFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据看板</template>
        </el-menu-item>
        <el-menu-item index="/app">
          <el-icon><Cellphone /></el-icon>
          <template #title>应用管理</template>
        </el-menu-item>
        <el-menu-item index="/placement">
          <el-icon><PictureFilled /></el-icon>
          <template #title>广告位管理</template>
        </el-menu-item>
        <el-menu-item index="/ad-source">
          <el-icon><Connection /></el-icon>
          <template #title>广告源管理</template>
        </el-menu-item>
        <el-menu-item index="/waterfall">
          <el-icon><SetUp /></el-icon>
          <template #title>瀑布流配置</template>
        </el-menu-item>
        <el-menu-item index="/traffic-group">
          <el-icon><Filter /></el-icon>
          <template #title>流量分组</template>
        </el-menu-item>
        <el-menu-item index="/report">
          <el-icon><TrendCharts /></el-icon>
          <template #title>数据报表</template>
        </el-menu-item>
        <el-menu-item index="/reconciliation">
          <el-icon><DocumentChecked /></el-icon>
          <template #title>对账管理</template>
        </el-menu-item>
        <el-menu-item index="/network">
          <el-icon><Share /></el-icon>
          <template #title>广告网络</template>
        </el-menu-item>
        <el-menu-item index="/message">
          <el-icon><Bell /></el-icon>
          <template #title>消息中心</template>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <template #title>个人中心</template>
        </el-menu-item>
      </el-menu>
    </aside>
    <div class="main-area">
      <header class="top-bar">
        <div class="top-bar-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="top-bar-right">
          <el-badge :value="unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : 0" :hidden="unreadCount === 0" class="msg-badge">
            <el-icon :size="20" class="msg-icon" @click="$router.push('/message')"><Bell /></el-icon>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              <span class="user-name">{{ userStore.userInfo?.email || '用户' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import request from '../utils/request';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isCollapsed = ref(false);
const unreadCount = ref(0);

const currentRoute = computed(() => route.path);
const currentTitle = computed(() => (route.meta.title as string) || '');

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout();
    router.push('/login');
  } else if (command === 'profile') {
    router.push('/profile');
  }
};

const fetchUnreadCount = async () => {
  try {
    const res: any = await request.get('/api/v1/console/message/unread-count');
    unreadCount.value = res.data.count;
  } catch { /* ignore */ }
};

onMounted(() => {
  fetchUnreadCount();
});
</script>

