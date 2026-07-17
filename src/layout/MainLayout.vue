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
        <template v-for="item in menuItems" :key="item.path || item.label">
          <!-- 父级菜单（聚合管理）：点击展开/折叠；当前路由在子路径下时默认展开 -->
          <div
            v-if="item.children && item.children.length > 0"
            class="nav-group"
            :class="{ 'nav-group--active': isGroupActive(item.children) }"
          >
            <div class="nav-item nav-item--group" @click="toggleGroup(item.label)">
              <el-icon :size="14"><component :is="item.icon" /></el-icon>
              <transition name="fade-text">
                <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
              </transition>
              <transition name="fade-text">
                <el-icon v-if="!isCollapsed" :size="10" class="nav-group-arrow">
                  <component :is="expandedGroups[item.label] ? 'ArrowDown' : 'ArrowRight'" />
                </el-icon>
              </transition>
            </div>
            <transition name="slide-down">
              <div v-if="!isCollapsed && expandedGroups[item.label]" class="nav-sublist">
                <div
                  v-for="sub in item.children"
                  :key="sub.path"
                  class="nav-item nav-item--sub"
                  :class="{ active: currentRoute === sub.path }"
                  @click="router.push(sub.path)"
                >
                  <el-icon :size="12"><component :is="sub.icon" /></el-icon>
                  <span class="nav-label">{{ sub.label }}</span>
                </div>
              </div>
            </transition>
          </div>
          <!-- 普通菜单项 -->
          <div
            v-else
            class="nav-item"
            :class="{ active: currentRoute === item.path }"
            @click="router.push(item.path)"
          >
            <el-icon :size="14"><component :is="item.icon" /></el-icon>
            <transition name="fade-text">
              <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
            </transition>
          </div>
        </template>
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
import { ref, computed, watch, onMounted, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import request from '@/utils/request';
import {
  DataAnalysis, Cellphone, PictureFilled, Connection, SetUp, Filter,
  TrendCharts, DocumentChecked, Share, Bell, User, ArrowDown, ArrowRight,
  ChatLineSquare, SwitchButton, Refresh, Close, Operation,
  DArrowLeft, DArrowRight, OfficeBuilding, DataLine, Box, Reading, Histogram, Lock,
} from '@element-plus/icons-vue';
import HalWidget from '@/components/HalWidget.vue';

interface MenuItem {
  path: string;
  label: string;
  icon: Component;
  children?: MenuItem[];
}

const baseMenuItems: MenuItem[] = [
  { path: '/dashboard', label: '数据看板', icon: DataAnalysis },
  { path: '/app', label: '应用管理', icon: Cellphone },
  { path: '/placement', label: '广告位管理', icon: PictureFilled },
  {
    path: '/aggregation',
    label: '聚合管理',
    icon: Operation,
    children: [
      { path: '/aggregation/traffic-group', label: '流量分组', icon: Filter },
      { path: '/aggregation/ad-source', label: '广告源管理', icon: Connection },
      { path: '/aggregation/waterfall', label: '瀑布流配置', icon: SetUp },
    ],
  },
  {
    path: '/report',
    label: '数据报表',
    icon: TrendCharts,
    children: [
      { path: '/report/overview', label: '综合报表', icon: DataAnalysis },
      { path: '/report/funnel', label: '漏斗分析', icon: Filter },
      { path: '/report/behavior', label: '用户行为', icon: User },
      { path: '/reconciliation', label: '对账管理', icon: DocumentChecked },
    ],
  },
  { path: '/network', label: '广告平台', icon: Share },
  { path: '/message', label: '消息中心', icon: Bell },
  {
    path: '/sdk',
    label: 'SDK 管理',
    icon: Box,
    children: [
      { path: '/sdk', label: 'SDK 下载', icon: Box },
      { path: '/sdk/docs', label: '技术文档', icon: Reading },
      { path: '/sdk/history', label: '版本历史', icon: Histogram },
      { path: '/sdk/privacy', label: '隐私政策', icon: Lock },
    ],
  },
  { path: '/profile', label: '个人中心', icon: User },
];

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const menuItems = computed<MenuItem[]>(() => {
  if (userStore.isAdmin) {
    return [
      ...baseMenuItems,
      { path: '/admin/developers', label: '开发者管理', icon: OfficeBuilding },
      { path: '/admin/report-metric', label: '指标字典', icon: DataLine },
      {
        path: '/admin/sdk',
        label: 'SDK 后台',
        icon: Operation,
        children: [
          { path: '/admin/sdk/releases', label: '版本管理', icon: Box },
          { path: '/admin/sdk/docs', label: '文档管理', icon: Reading },
          { path: '/admin/sdk/privacy', label: '隐私政策', icon: Lock },
        ],
      },
    ];
  }
  return baseMenuItems;
});
const isCollapsed = ref(false);
const unreadCount = ref(0);

// 父级菜单展开状态（聚合管理）
const expandedGroups = ref<Record<string, boolean>>({});
const toggleGroup = (label: string) => {
  expandedGroups.value[label] = !expandedGroups.value[label];
};
// 判断父级菜单是否在当前路由下激活（精确匹配或前缀匹配）
const isGroupActive = (children: MenuItem[]): boolean => {
  return children.some((c) => {
    if (c.path === route.path) return true;
    // 父级路径（如 /sdk, /admin/sdk）下所有子项都视作激活
    if (c.path && c.path !== '/sdk' && c.path !== '/admin/sdk' && route.path.startsWith(c.path)) return true;
    return false;
  });
};

const currentRoute = computed(() => route.path);
const currentTitle = computed(() => (route.meta.title as string) || '');
const avatarLetter = computed(() => {
  const email = userStore.userInfo?.email || 'U';
  return email.charAt(0).toUpperCase();
});

// 路由变化时自动展开父级菜单（聚合管理 / 数据报表 / SDK 管理 / SDK 后台）
watch(
  () => route.path,
  (newPath) => {
    if (newPath.startsWith('/aggregation')) {
      expandedGroups.value['聚合管理'] = true;
    }
    if (newPath.startsWith('/report') || newPath === '/reconciliation') {
      expandedGroups.value['数据报表'] = true;
    }
    if (newPath === '/sdk' || newPath.startsWith('/sdk/')) {
      expandedGroups.value['SDK 管理'] = true;
    }
    if (newPath.startsWith('/admin/sdk')) {
      expandedGroups.value['SDK 后台'] = true;
    }
  },
  { immediate: true },
);

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


