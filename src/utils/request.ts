import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';

// 防重入：避免多个 401 并发时反复跳登录
let redirectingToLogin = false;

function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
}

function handleUnauthorized(): void {
  // 通知所有打开的 tab 同步登出（自定义事件 + storage 事件）
  clearAuth();
  // 触发全局事件，stores/user.ts 监听并同步 Pinia 状态
  window.dispatchEvent(new CustomEvent('auth:logout'));
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  // 使用 SPA 导航而不是 location.href，避免整页刷新
  if (router.currentRoute.value.path !== '/login') {
    router.replace('/login').finally(() => {
      // 1.5s 后允许再次触发（给登录页时间完成状态初始化）
      setTimeout(() => { redirectingToLogin = false; }, 1500);
    });
  } else {
    redirectingToLogin = false;
  }
}

const request: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 15000,
  // HttpOnly Cookie 由浏览器自动管理；启用此选项后，跨域 / 同源 cookie 都会带上
  withCredentials: true,
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 优先用 Bearer Token（兼容 SDK 直连场景 + 跨域 cookie 不可用时回退）
    // HttpOnly Cookie 不需要手动读取，浏览器自动附加
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    if (data.code !== undefined && data.code !== 0) {
      // 静默消息：参数校验类 4xx 不弹错误（避免与表单校验冲突）
      const silent = (cfg: InternalAxiosRequestConfig): boolean =>
        Boolean((cfg as unknown as { __silent?: boolean }).__silent);
      if (!silent(response.config as InternalAxiosRequestConfig)) {
        ElMessage.error(data.message || '请求失败');
      }
      if (data.code === 401) {
        handleUnauthorized();
      }
      return Promise.reject(new Error(data.message || 'Request failed'));
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      handleUnauthorized();
    } else {
      const cfg = error.config as InternalAxiosRequestConfig | undefined;
      const silent = cfg ? Boolean((cfg as unknown as { __silent?: boolean }).__silent) : false;
      if (!silent) {
        const msg = error.response?.data?.message || error.message || '网络异常';
        ElMessage.error(msg);
      }
    }
    return Promise.reject(error);
  }
);

export default request;
