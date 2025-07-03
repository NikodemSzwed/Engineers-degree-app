<template>
    <div class="w-full flex flex-col items-center justify-center gap-2 text-primary-500">
        <span class="text-4xl font-bold">{{ time }}</span>
        <span class="text-xl text-muted-color-emphasis">{{ date }}</span>

    </div>
</template>

<script>
export const widgetMeta = { minW: 4, minH: 6, name: "Dzisiaj" };
</script>

<script setup>
import { ref } from 'vue';
const time = ref(new Date().toLocaleTimeString())
const date = ref(new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }))
setInterval(() => {
    time.value = new Date().toLocaleTimeString()
}, 1000);
</script>