import api from './api';
import router from '../router';
import { startAuthRefresh, stopAuthRefresh } from '../services/tokenRefresh.js';
import { useUserStore } from '@/stores/userData';
import { useHistory } from '../stores/useHistory.js';
import { loadTheme } from './themeChanger.js';

export async function login(login, password) {
    try {
        const response = await api.post('/users/login', {
            login: login,
            passwd: password,
        });

        const userData = useUserStore();

        userData.setUser(response.data.user);
        loadTheme();
        startAuthRefresh();
        await router.push({ name: 'Dashboard' });
    } catch (error) {
        console.log('Login failed', error);
    }
}

export async function logout() {
    try {
        await api.post('/users/logout');
    } catch (error) {
        console.log('Logout failed', error.response.data);
    }
    const userData = useUserStore();
    userData.clearUser();
    loadTheme();
    stopAuthRefresh();
    useHistory().clear();
    await router.push({ name: 'Login' });
}
