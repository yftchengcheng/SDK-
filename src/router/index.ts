import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// Static imports to avoid Vite dynamic-import-helper issues
import Login from '../views/auth/Login.vue';
import Register from '../views/auth/Register.vue';
import MainLayout from '../layout/MainLayout.vue';
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
      {
        path: 'traffic-group',
        name: 'TrafficGroup',
        component: TrafficGroup,
        meta: { title: '流量分组', icon: 'Filter' },
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
        meta: { title: '广告网络', icon: 'Share' },
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
  } else if (to.meta.noAuth && token) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
