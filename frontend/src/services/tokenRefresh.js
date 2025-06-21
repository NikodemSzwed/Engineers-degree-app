import api from './api';
import { logout } from './authFunctions';

let refreshInterval = null;
let activityTimeout = null;
let isActive = false;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

function startRefreshLoop() {
    if (refreshInterval) return;
    refreshInterval = setInterval(refreshToken, REFRESH_INTERVAL);
    // console.log('🚀 ~ startRefreshLoop ~ Auth refresh loop started');
}

function stopRefreshLoop() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    // console.log('🚀 ~ stopRefreshLoop ~ Auth refresh loop stopped');
}

async function refreshToken() {
    try {
        await api.post('/users/refresh');
    } catch (err) {
        console.error('Token refresh failed', err);
        await logout();
    }
}

function onUserActivity() {
    if (!isActive) {
        isActive = true;
        startRefreshLoop();
    }

    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(() => {
        isActive = false;
        stopRefreshLoop();
    }, IDLE_TIMEOUT);
}

function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
        onUserActivity();
    } else {
        isActive = false;
        stopRefreshLoop();
    }
}

export function startAuthRefresh() {
    document.addEventListener('mousemove', onUserActivity);
    document.addEventListener('keydown', onUserActivity);
    document.addEventListener('visibilitychange', onVisibilityChange);
    onUserActivity();
    // console.log('🚀 ~ startAuthRefresh ~ Auth refresher started');
}

export function stopAuthRefresh() {
    document.removeEventListener('mousemove', onUserActivity);
    document.removeEventListener('keydown', onUserActivity);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    stopRefreshLoop();
    // console.log('🚀 ~ stopAuthRefresh ~ Auth refresher stopped');
}
