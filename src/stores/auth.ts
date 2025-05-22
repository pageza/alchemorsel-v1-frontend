import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authService } from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(!!localStorage.getItem('auth_token'));

  async function login(credentials: { email: string; password: string }) {
    const response = await authService.login(credentials);
    localStorage.setItem('auth_token', response.token);
    isAuthenticated.value = true;
    return response;
  }

  async function register(data: { name: string; email: string; password: string }) {
    const response = await authService.register(data);
    localStorage.setItem('auth_token', response.token);
    isAuthenticated.value = true;
    return response;
  }

  function logout() {
    localStorage.removeItem('auth_token');
    isAuthenticated.value = false;
    window.location.href = '/login';
  }

  // Add a function to check token validity
  function checkAuth() {
    const token = localStorage.getItem('auth_token');
    isAuthenticated.value = !!token;
    return !!token;
  }

  return { isAuthenticated, login, register, logout, checkAuth };
}); 