<template>
  <div class="main-layout">
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header" @click="isCollapsed = !isCollapsed">
        <div class="sidebar-logo">
          <img src="/logo.png" alt="新义聚合" class="logo-img" />
        </div>
        <transition name="fade-text">
          <span v-if="!isCollapsed" class="logo-text">新义聚合</span>
        </transition>
      </div>
      <nav class="sidebar-nav">
        <div
          v-for="item in menuItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: currentRoute === item.path }"
          @click="router.push(item.path)"
        >
          <el-icon :size="14"><component :is="item.icon" /></el-icon>
          <transition name="fade-text">
            <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
          </transition>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="nav-item collapse-btn" @click="isCollapsed = !isCollapsed">
          <el-icon :size="14"><component :is="isCollapsed ? 'DArrowRight' : 'DArrowLeft'" /></el-icon>
          <transition name="fade-text">
            <span v-if="!isCollapsed" class="nav-label">收起侧栏</span>
          </transition>
        </div>
      </div>
    </aside>
    <div class="main-area">
      <header class="top-bar">
        <div class="top-bar-left">
          <h2 class="page-title">{{ currentTitle }}</h2>
        </div>
        <div class="top-bar-right">
          <div class="top-action" @click="$router.push('/message')">
            <el-badge :value="unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : 0" :hidden="unreadCount === 0" :max="99">
              <el-icon :size="18"><Bell /></el-icon>
            </el-badge>
          </div>
          <el-divider direction="vertical" />
          <el-dropdown @command="handleCommand" trigger="click">
            <div class="user-info">
              <div class="user-avatar">{{ avatarLetter }}</div>
              <span class="user-name">{{ userStore.userInfo?.email || '用户' }}</span>
              <el-icon :size="12"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main class="content-area">
        <router-view />
      </main>
    </div>
    <HalWidget />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import request from '@/utils/request';
import {
  DataAnalysis, Cellphone, PictureFilled, Connection, SetUp, Filter,
  TrendCharts, DocumentChecked, Share, Bell, User, ArrowDown,
  ChatLineSquare, SwitchButton, Refresh, Close, Operation,
  DArrowLeft, DArrowRight,
} from '@element-plus/icons-vue';
import HalWidget from '@/components/HalWidget.vue';

interface MenuItem {
  path: string;
  label: string;
  icon: Component;
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '数据看板', icon: DataAnalysis },
  { path: '/app', label: '应用管理', icon: Cellphone },
  { path: '/placement', label: '广告位管理', icon: PictureFilled },
  { path: '/ad-source', label: '广告源管理', icon: Connection },
  { path: '/waterfall', label: '瀑布流配置', icon: SetUp },
  { path: '/traffic-group', label: '流量分组', icon: Filter },
  { path: '/report', label: '数据报表', icon: TrendCharts },
  { path: '/reconciliation', label: '对账管理', icon: DocumentChecked },
  { path: '/network', label: '广告网络', icon: Share },
  { path: '/message', label: '消息中心', icon: Bell },
  { path: '/profile', label: '个人中心', icon: User },
];

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isCollapsed = ref(false);
const unreadCount = ref(0);

const currentRoute = computed(() => route.path);
const currentTitle = computed(() => (route.meta.title as string) || '');
const avatarLetter = computed(() => {
  const email = userStore.userInfo?.email || 'U';
  return email.charAt(0).toUpperCase();
});

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


