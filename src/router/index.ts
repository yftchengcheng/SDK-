import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { title: '登录', noAuth: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/Register.vue'),
    meta: { title: '注册', noAuth: true },
  },
  {
    path: '/',
    component: () => import('../layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/Index.vue'),
        meta: { title: '数据看板', icon: 'DataAnalysis' },
      },
      {
        path: 'app',
        name: 'AppManage',
        component: () => import('../views/app/Index.vue'),
        meta: { title: '应用管理', icon: 'Cellphone' },
      },
      {
        path: 'placement',
        name: 'PlacementManage',
        component: () => import('../views/placement/Index.vue'),
        meta: { title: '广告位管理', icon: 'PictureFilled' },
      },
      {
        path: 'ad-source',
        name: 'AdSourceManage',
        component: () => import('../views/ad-source/Index.vue'),
        meta: { title: '广告源管理', icon: 'Connection' },
      },
      {
        path: 'waterfall',
        name: 'WaterfallConfig',
        component: () => import('../views/waterfall/Index.vue'),
        meta: { title: '瀑布流配置', icon: 'SetUp' },
      },
      {
        path: 'traffic-group',
        name: 'TrafficGroup',
        component: () => import('../views/traffic-group/Index.vue'),
        meta: { title: '流量分组', icon: 'Filter' },
      },
      {
        path: 'report',
        name: 'Report',
        component: () => import('../views/report/Index.vue'),
        meta: { title: '数据报表', icon: 'TrendCharts' },
      },
      {
        path: 'reconciliation',
        name: 'Reconciliation',
        component: () => import('../views/reconciliation/Index.vue'),
        meta: { title: '对账管理', icon: 'DocumentChecked' },
      },
      {
        path: 'network',
        name: 'NetworkManage',
        component: () => import('../views/network/Index.vue'),
        meta: { title: '广告网络', icon: 'Share' },
      },
      {
        path: 'message',
        name: 'MessageCenter',
        component: () => import('../views/message/Index.vue'),
        meta: { title: '消息中心', icon: 'Bell' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/profile/Index.vue'),
        meta: { title: '个人中心', icon: 'User' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  if (!to.meta.noAuth && !token) {
    next('/login');
  } else if ((to.meta.noAuth) && token && (to.path === '/login' || to.path === '/register')) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
