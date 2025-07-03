import { createRouter, createWebHistory } from 'vue-router';
import api from '../services/api.js';
import { logout } from '../services/authFunctions';
import { useHistory } from '../stores/useHistory.js';
import Dashboard from '@/pages/Dashboard.vue';
import Maps from '@/pages/Maps.vue';
import Orders from '@/pages/Dashboard.vue';
import Displays from '@/pages/Dashboard.vue';
import Alerts from '@/pages/Dashboard.vue';
import Users from '@/pages/Dashboard.vue';
import NotFound from '@/views/NotFound.vue';
import MainView from '../views/MainView.vue';
import Settings from '../pages/Settings.vue';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/About.vue'),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: '/',
        component: MainView,
        children: [
            { path: '', redirect: '/dashboard' },
            { path: 'dashboard', name: 'Dashboard', component: Dashboard },
            { path: 'maps', name: 'Maps', component: Maps },
            { path: 'orders', name: 'Orders', component: Orders },
            { path: 'displays', name: 'Displays', component: Displays, meta: { requiresAdmin: true } },
            { path: 'alerts', name: 'Alerts', component: Alerts },
            { path: 'users', name: 'Users', component: Users, meta: { requiresAdmin: true } },
            { path: 'settings', name: 'Settings', component: Settings },
        ],
        meta: { requiresAuth: true },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFound,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async to => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

    if (!requiresAuth) return true;

    const requiredAdmin = to.matched.some(record => record.meta.requiresAdmin);

    try {
        const response = await api.post('/users/refresh');

        if (requiredAdmin && !response.data.adminPrivileges) {
            alert('Brak uprawnień, aby uzyskać dostęp do tej strony.');
            return { name: 'Dashboard' };
        }

        return true;
    } catch (error) {
        if (error.response.status === 401) {
            console.log('Unauthorized');
            await logout();
        } else console.error(error);
    }
});

router.afterEach(to => {
    useHistory().push(to.fullPath);
});

export default router;
