import { createRouter, createWebHistory } from 'vue-router';
import api from '../services/api.js';
import { logout } from '../services/authFunctions';
import Dashboard from '@/views/Dashboard.vue';
import Maps from '@/views/Dashboard.vue';
import Orders from '@/views/Dashboard.vue';
import Displays from '@/views/Dashboard.vue';
import Alerts from '@/views/Dashboard.vue';
import Users from '@/views/Dashboard.vue';
import NotFound from '@/views/NotFound.vue';
import MainView from '../views/MainView.vue';

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

export default router;
