<script setup>
import HelloWorld from './components/HelloWorld.vue';
import Button from 'primevue/button';
import tak from './components/tak.vue';
</script>

<template>
    <div>
        <a href="https://vite.dev" target="_blank"> <img src="/vite.svg" class="logo" alt="Vite logo" /> </a>
        <a href="https://vuejs.org/" target="_blank"> <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" /></a>
    </div>
    <div class="bg-red-500 h-[100px] w-[200px] ml-4 mr-4">
        <Button label="Przycisk" @click="console.log('Przycisk został kliknięty')" class="h-[50px]"></Button>
    </div>
    <HelloWorld msg="Vite + Vue" />
    <tak></tak>
    <router-view />
</template>

<style scoped>
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}

.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
