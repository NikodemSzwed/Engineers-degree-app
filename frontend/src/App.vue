<template>
    <div class="h-[100vh] w-[100vw]"><router-view /></div>
</template>

<script setup>
import { onMounted } from 'vue';
import { loadTheme, loadDefaultTheme } from './services/themeChanger';
import { useUserStore } from './stores/userData';
import api from './services/api';

const userData = useUserStore();

onMounted(async () => {
    try {
        const response = await api.post('/users/refresh');

        const userData = useUserStore();

        userData.personalSettings = JSON.parse(response.data.personalSettings);
        loadTheme();

    } catch (error) {
        console.log('Refresh failed');
        loadDefaultTheme();
    }
});
</script>
