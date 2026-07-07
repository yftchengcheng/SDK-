import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '../utils/request';

interface UserInfo {
  developerId: string;
  email: string;
  company: string | null;
  companyShortName: string | null;
  contactName: string | null;
  phone: string | null;
  accessType: number;
  apiAccessToken: string | null;
  status: number;
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const getStoredUserInfo = (): UserInfo | null => {
    try {
      const raw = localStorage.getItem('userInfo');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const userInfo = ref<UserInfo | null>(getStoredUserInfo());

  const isLoggedIn = computed(() => !!token.value);

  async function login(email: string, password: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await request.post('/api/v1/auth/login', { email, password });
    token.value = res.data.token;
    userInfo.value = res.data;
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('userInfo', JSON.stringify(res.data));
  }

  function logout() {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  }

  async function fetchUserInfo() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await request.get('/api/v1/auth/me');
    userInfo.value = res.data;
    localStorage.setItem('userInfo', JSON.stringify(res.data));
  }

  // 监听全局登出事件（request.ts 401 时触发）
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:logout', logout);
  }

  return { token, userInfo, isLoggedIn, login, logout, fetchUserInfo };
});
