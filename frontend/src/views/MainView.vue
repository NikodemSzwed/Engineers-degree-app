<template>
    <div class="flex h-screen w-full overflow-hidden">
        <Drawer v-model:visible="sidebarVisible" class="w-64">
            <template #header> Wearhouse Logistics </template>
            <div class="flex h-full flex-col justify-between">
                <ul class="flex w-full flex-col gap-2">
                    <RouterLink v-for="route in routes" :key="route.path" :to="route.path"
                        @click="sidebarVisible = false">
                        <li
                            class="border-surface-100 hover:bg-surface-100 text-primary-500 flex cursor-pointer flex-row items-center rounded border-1 p-2 shadow">
                            <i class="pi text-3xl" :class="route.icon" />
                            <span class="ml-4 text-lg">{{ route.name }}</span>
                        </li>
                    </RouterLink>
                </ul>
            </div>
        </Drawer>
        <div class="flex flex-1 flex-col">
            <Menubar class="rounded-none">
                <template #start>
                    <Button icon="pi pi-bars text-xl" @click="sidebarVisible = true" text rounded />
                    <span class="ml-4 text-lg font-semibold">{{ router.currentRoute.value.name }}</span>
                </template>
                <template #end>

                    <Avatar @click="toggle" class="cursor-pointer"> {{ name.charAt(0).toUpperCase() }} </Avatar>


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

            <div class="flex flex-1 flex-col overflow-y-auto">
                <div class="flex flex-1 flex-col">
                    <RouterView />
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
    .children.filter(route => route.redirect === undefined);

const menu = ref(null);
const toggle = event => {
    menu.value.toggle(event);
};
const items = ref([
    {
        label: 'Wyloguj',
        icon: 'pi pi-sign-out',
        command: () => {
            logout();
        },
    },
]);
</script>
