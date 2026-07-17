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
import ReportLayout from '../layout/ReportLayout.vue';
import ReportOverview from '../views/report/Overview.vue';
import ReportFunnel from '../views/report/Funnel.vue';
import ReportBehavior from '../views/report/Behavior.vue';
import Reconciliation from '../views/reconciliation/Index.vue';
import NetworkManage from '../views/network/Index.vue';
import MessageCenter from '../views/message/Index.vue';
import Profile from '../views/profile/Index.vue';
import SdkHome from '../views/sdk/Index.vue';
import SdkDocs from '../views/sdk/Docs.vue';
import SdkPrivacy from '../views/sdk/Privacy.vue';
import SdkHistory from '../views/sdk/History.vue';
import AdminDevelopers from '../views/admin/Developers.vue';
import AdminReportMetric from '../views/admin/ReportMetric.vue';
import AdminSdkReleases from '../views/admin/SdkReleases.vue';
import AdminSdkDocs from '../views/admin/SdkDocs.vue';
import AdminSdkPrivacy from '../views/admin/SdkPrivacy.vue';
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
      // 数据报表（嵌套路由 + 父级 layout）
      {
        path: 'report',
        component: ReportLayout,
        redirect: '/report/overview',
        meta: { title: '数据报表', icon: 'TrendCharts', isReportGroup: true },
        children: [
          {
            path: 'overview',
            name: 'ReportOverview',
            component: ReportOverview,
            meta: { title: '综合报表', icon: 'DataAnalysis' },
          },
          {
            path: 'funnel',
            name: 'ReportFunnel',
            component: ReportFunnel,
            meta: { title: '漏斗分析', icon: 'Filter' },
          },
          {
            path: 'behavior',
            name: 'ReportBehavior',
            component: ReportBehavior,
            meta: { title: '用户行为', icon: 'User' },
          },
        ],
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
      // SDK 管理（开发者视角）
      {
        path: 'sdk',
        component: SdkHome,
        name: 'SdkHome',
        meta: { title: 'SDK 下载', icon: 'Box' },
      },
      {
        path: 'sdk/docs',
        name: 'SdkDocs',
        component: SdkDocs,
        meta: { title: '技术文档', icon: 'Reading', hidden: true },
      },
      {
        path: 'sdk/privacy',
        name: 'SdkPrivacy',
        component: SdkPrivacy,
        meta: { title: '隐私政策', icon: 'Lock', hidden: true },
      },
      {
        path: 'sdk/history',
        name: 'SdkHistory',
        component: SdkHistory,
        meta: { title: '版本历史', icon: 'Histogram', hidden: true },
      },
      {
        path: 'admin/developers',
        name: 'AdminDevelopers',
        component: AdminDevelopers,
        meta: { title: '开发者管理', icon: 'OfficeBuilding', requiresAdmin: true },
      },
      {
        path: 'admin/report-metric',
        name: 'AdminReportMetric',
        component: AdminReportMetric,
        meta: { title: '指标字典', icon: 'DataLine', requiresAdmin: true },
      },
      {
        path: 'admin/sdk/releases',
        name: 'AdminSdkReleases',
        component: AdminSdkReleases,
        meta: { title: 'SDK 版本管理', icon: 'Box', requiresAdmin: true },
      },
      {
        path: 'admin/sdk/docs',
        name: 'AdminSdkDocs',
        component: AdminSdkDocs,
        meta: { title: 'SDK 文档管理', icon: 'Reading', requiresAdmin: true },
      },
      {
        path: 'admin/sdk/privacy',
        name: 'AdminSdkPrivacy',
        component: AdminSdkPrivacy,
        meta: { title: 'SDK 隐私政策', icon: 'Lock', requiresAdmin: true },
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
