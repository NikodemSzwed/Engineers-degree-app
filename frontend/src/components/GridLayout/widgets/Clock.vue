<template>
    <div class="text-primary-500 flex w-full flex-col items-center justify-center gap-2">
        <span class="text-4xl font-bold">{{ time }}</span>
        <span class="text-muted-color-emphasis text-xl">{{ date }}</span>
    </div>
</template>

<script>
    import getSourceFileName from '@/services/getAndGeneralizeNameOfFiles';

    export const widgetMeta = {
        itemData: {
            component: getSourceFileName(import.meta.url),
            minW: 4,
            minH: 6,
        },
        metaData: {
            name: 'Dzisiaj',
            generalName: 'Zegar i data',
        },
    };
</script>

<script setup>
    import { ref } from 'vue';
    const time = ref(new Date().toLocaleTimeString());
    const date = ref(new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }));
    setInterval(() => {
        time.value = new Date().toLocaleTimeString();
    }, 1000);
</script>
