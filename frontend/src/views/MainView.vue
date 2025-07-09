<template>
    <div class="flex h-screen w-full overflow-hidden">
        <Drawer v-model:visible="sidebarVisible" class="w-64">
            <template #header> Wearhouse Logistics </template>
            <div class="flex h-full flex-col justify-between">
                <div class="flex w-full flex-col gap-1">
                    <RouterLink v-for="route in routes" :key="route.path" :to="route.path"
                        @click="sidebarVisible = false">
                        <div
                            class="dark:bg-emphasis hover:bg-highlight flex cursor-pointer flex-row items-center gap-2 rounded p-2 shadow">
                            <i class="pi mx-2 text-xl" :class="route.meta.icon" />
                            <span class="text-lg">{{ route.name }}</span>
                        </div>
                    </RouterLink>
                </div>
            </div>
        </Drawer>
        <div class="flex flex-1 flex-col">
            <Menubar class="rounded-none border-0 border-b-1">
                <template #start>
                    <Button icon="pi pi-bars text-xl" @click="sidebarVisible = true" text rounded />
                    <span class="ml-4 text-lg font-semibold">{{ router.currentRoute.value.name }}</span>
                </template>
                <template #end>
                    <Avatar @click="toggle" class="cursor-pointer">
                        {{ name.charAt(0).toUpperCase() }}
                    </Avatar>

                    <Menu ref="menu" id="overlay_menu" :model="items" :popup="true">
                        <template #start>
                            <div class="flex items-center p-2">
                                <span class="ml-2">Witaj, {{ name }}!</span>
                            </div>
                        </template>
                        <template #item="{ item }">
                            <div @click="item.command()" class="flex cursor-pointer items-center p-2">
                                <i :class="item.icon" />
                                <span class="ml-2">{{ item.label }}</span>
                            </div>
                        </template>
                    </Menu>
                </template>
            </Menubar>

            <div class="bg-emphasis relative flex flex-1 flex-col max-w-screen overflow-y-auto">
                <div class="mx-3 mt-3 flex flex-1 flex-col items-center">
                    <RouterView class="max-w-full w-full lg:w-10/12" />
                </div>

                <footer class="text-surface-300 p-3 text-center text-sm">
                    &copy; {{ new Date().getFullYear() }} Warehouse Logistics - Nikodem Szwed.
                </footer>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userData';
import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import Menubar from 'primevue/menubar';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';
import { logout } from '../services/authFunctions';

const sidebarVisible = ref(false);
const userData = useUserStore();
const name = ref(userData.login);
const router = useRouter();

const routes = ref([]);
routes.value = router
    .getRoutes()
    .find(route => route.path === '/' && route.redirect === undefined)
    .children.filter(route => {
        if (route.meta?.requiresAdmin) {
            return userData.isAdmin;
        }
        if (route.redirect === undefined) {
            return true;
        }
        return false;
    });

const menu = ref(null);
const toggle = event => {
    menu.value.toggle(event);
};
const items = ref([
    {
        label: 'Ustawienia',
        icon: 'pi pi-cog',
        command: () => {
            router.push('/settings');
        },
    },
    {
        label: 'Wyloguj',
        icon: 'pi pi-sign-out',
        command: () => {
            logout();
        },
    },
]);
</script>
