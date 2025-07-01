<template>
    <div class="h-[100vh] w-[100vw]"><router-view /></div>

</template>

<script setup>
import { onMounted } from 'vue';
import { loadTheme } from './services/themeChanger';

onMounted(() => {
    loadTheme();
})
</script>
