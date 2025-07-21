<template>
    <div class="h-[100vh] w-[100vw]"><router-view /></div>
</template>

<script setup>
import { onMounted } from 'vue';
import { loadDefaultTheme } from './services/themeChanger';


onMounted(async () => {
    loadDefaultTheme();
});
</script>
