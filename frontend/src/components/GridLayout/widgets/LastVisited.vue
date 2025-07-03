<template>
    <div class="flex flex-row gap-3 flex-wrap items-center justify-center w-full h-full overflow-auto">
        <Button v-for="(item, i) in allRoutes" :key="i"
            class="min-w-32 w-32 h-32 border-primary-emphasis bg-emphasis hover:bg-highlight-emphasis"
            severity="secondary" raised @click="open(item.path)">
            {{ item.name }}
        </Button>
    </div>
</template>

<script>
export const widgetMeta = { minW: 5, minH: 5, name: 'Ostatnio odwiedzone' }
</script>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useHistory } from '@/stores/useHistory'
import Button from 'primevue/button';
const history = useHistory();
const router = useRouter();

const allRoutes = ref(router.getRoutes().filter(route => history.list.includes(route.path)));
console.log("🚀 ~ allRoutes:", allRoutes)

function open(path) {
    router.push(path);
}
</script>