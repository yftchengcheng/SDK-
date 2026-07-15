import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// Static imports to avoid Vite dynamic-import-helper issues
import Login from '../views/auth/Login.vue';
import Register from '../views/auth/Register.vue';
import MainLayout from '../layout/MainLayout.vue';
import AggregationLayout from '../layout/AggregationLayout.vue';
import Dashboard from '../views/dashboard/Index.vue';
import AppManage from '../views/app/Index.vue';
import PlacementManage from '../views/placement/Index.vue';
import AdSourceManage from '../views/ad-source/Index.vue';
import WaterfallConfig from '../views/waterfall/Index.vue';
import TrafficGroup from '../views/traffic-group/Index.vue';
import Report from '../views/report/Index.vue';
import Reconciliation from '../views/reconciliation/Index.vue';
import NetworkManage from '../views/network/Index.vue';
import MessageCenter from '../views/message/Index.vue';
import Profile from '../views/profile/Index.vue';
import AdminDevelopers from '../views/admin/Developers.vue';
import { useUserStore } from '../stores/user';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录', noAuth: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { title: '注册', noAuth: true },
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '数据看板', icon: 'DataAnalysis' },
      },
      {
        path: 'app',
        name: 'AppManage',
        component: AppManage,
        meta: { title: '应用管理', icon: 'Cellphone' },
      },
      {
        path: 'placement',
        name: 'PlacementManage',
        component: PlacementManage,
        meta: { title: '广告位管理', icon: 'PictureFilled' },
      },
      // 聚合管理（嵌套路由 + 父级 layout）
      {
        path: 'aggregation',
        component: AggregationLayout,
        redirect: '/aggregation/waterfall',
        meta: { title: '聚合管理', icon: 'SetUp', isAggregationGroup: true },
        children: [
          {
            path: 'traffic-group',
            name: 'TrafficGroup',
            component: TrafficGroup,
            meta: { title: '流量分组', icon: 'Filter' },
          },
          {
            path: 'ad-source',
            name: 'AdSourceManage',
            component: AdSourceManage,
            meta: { title: '广告源管理', icon: 'Connection' },
          },
          {
            path: 'waterfall',
            name: 'WaterfallConfig',
            component: WaterfallConfig,
            meta: { title: '瀑布流配置', icon: 'SetUp' },
          },
        ],
      },
      // 兼容旧 URL（重定向到聚合管理新地址）
      {
        path: 'traffic-group',
        redirect: '/aggregation/traffic-group',
      },
      {
        path: 'ad-source',
        redirect: '/aggregation/ad-source',
      },
      {
        path: 'waterfall',
        redirect: '/aggregation/waterfall',
      },
      {
        path: 'report',
        name: 'Report',
        component: Report,
        meta: { title: '数据报表', icon: 'TrendCharts' },
      },
      {
        path: 'reconciliation',
        name: 'Reconciliation',
        component: Reconciliation,
        meta: { title: '对账管理', icon: 'DocumentChecked' },
      },
      {
        path: 'network',
        name: 'NetworkManage',
        component: NetworkManage,
        meta: { title: '广告平台', icon: 'Share' },
      },
      {
        path: 'message',
        name: 'MessageCenter',
        component: MessageCenter,
        meta: { title: '消息中心', icon: 'Bell' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: { title: '个人中心', icon: 'UserFilled' },
      },
      {
        path: 'admin/developers',
        name: 'AdminDevelopers',
        component: AdminDevelopers,
        meta: { title: '开发者管理', icon: 'OfficeBuilding', requiresAdmin: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
router.beforeEach((to, _from, next) => {
  // Set page title
  document.title = `${to.meta.title || '广告SDK聚合平台'} - 广告SDK聚合平台`;

  // Check authentication
  const token = localStorage.getItem('token');
  if (!to.meta.noAuth && !token) {
    next({ name: 'Login' });
    return;
  }
  if (to.meta.noAuth && token) {
    next({ name: 'Dashboard' });
    return;
  }

  // Admin-only routes: 拦截非 admin 用户
  if (to.meta.requiresAdmin) {
    const userStore = useUserStore();
    if (userStore.role !== 'admin') {
      next({ name: 'Dashboard' });
      return;
    }
  }

  next();
});

export default router;
