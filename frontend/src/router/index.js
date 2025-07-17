import { createRouter, createWebHistory } from 'vue-router';
import api from '../services/api.js';
import { logout } from '../services/authFunctions';
import { useHistory } from '../stores/useHistory.js';
import Dashboard from '@/pages/Dashboard.vue';
import Maps from '@/pages/Maps.vue';
import Orders from '@/pages/Orders.vue';
import Displays from '@/pages/Displays.vue';
import Alerts from '@/pages/Alerts.vue';
import AlertTypes from '@/pages/AlertTypes.vue';
import Users from '@/pages/Users.vue';
import Groups from '@/pages/Groups.vue';
import NotFound from '@/views/NotFound.vue';
import MainView from '../views/MainView.vue';
import Settings from '../pages/Settings.vue';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: {
            requiresAuth: false,
        },
    },
    {
        path: '/',
        component: MainView,
        children: [
            { path: '', redirect: '/dashboard' },
            { path: 'dashboard', name: 'Dashboard', component: Dashboard, meta: { icon: 'pi pi-home' } },
            { path: 'maps', name: 'Maps', component: Maps, meta: { icon: 'pi pi-map' } },
            { path: 'orders', name: 'Orders', component: Orders, meta: { icon: 'pi pi-box' } },
            {
                path: 'displays',
                name: 'Displays',
                component: Displays,
                meta: { icon: 'pi pi-desktop', requiresAdmin: true },
            },
            {
                path: 'alerts',
                name: 'Alerts',
                component: Alerts,
                meta: { icon: 'pi pi-exclamation-triangle' },
            },
            {
                path: 'alerttypes',
                name: 'Alert Types',
                component: AlertTypes,
                meta: { icon: 'pi pi-sitemap', requiresAdmin: true },
            },
            {
                path: 'users',
                name: 'Users',
                component: Users,
                meta: { icon: 'pi pi-user', requiresAdmin: true },
            },
            {
                path: 'groups',
                name: 'Groups',
                component: Groups,
                meta: { icon: 'pi pi-users', requiresAdmin: true },
            },
            { path: 'settings', name: 'Settings', component: Settings, meta: { icon: 'pi pi-cog' } },
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
