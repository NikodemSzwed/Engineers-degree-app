<template>
    <div class="h-[100vh] w-[100vw]"><router-view /></div>
</template>

<script setup>
    import { onMounted } from 'vue';
    import { loadTheme, loadDefaultTheme } from './services/themeChanger';
    import { useUserStore } from './stores/userData';

    onMounted(() => {
        const userData = useUserStore();

        if (userData.personalSettings) loadTheme();
        else loadDefaultTheme();
    });
</script>
