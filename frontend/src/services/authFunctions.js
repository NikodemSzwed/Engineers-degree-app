import api from './api';
import router from '../router';
import { startAuthRefresh, stopAuthRefresh } from '../services/tokenRefresh.js';
import { useUserStore } from '@/stores/userData';
import { useHistory } from '../stores/useHistory.js';
import { loadTheme } from './themeChanger.js';

export async function saveUserData() {
    const history = useHistory();
    const userData = useUserStore();
    userData.personalSettings.history = history.list;

    try {
        await api.put(`/users/` + userData.id, {
            PersonalSettings_json: JSON.stringify(userData.personalSettings),
        });
    } catch (error) {
        console.log(error);
    }
}

export async function login(login, password) {
    try {
        const response = await api.post('/users/login', {
            login: login,
            passwd: password,
        });

        const userData = useUserStore();
        const userHistory = useHistory();

        userData.setUser(response.data.user);
        userHistory.set(JSON.parse(response.data.user.personalSettings).history || []);
        loadTheme();
        startAuthRefresh();
        await router.push({ path: '/dashboard' });
    } catch (error) {
        console.log('Login failed', error);
        throw error;
    }
}

export async function logout(safeLogout = false) {
    if (safeLogout) await saveUserData();
    try {
        await api.post('/users/logout');
    } catch (error) {
        console.log('Logout failed', error.response.data);
    }
    const userData = useUserStore();
    userData.clearUser();
    stopAuthRefresh();
    useHistory().clear();
    await router.push({ path: '/login' });
}
