<template>
    <div class="flex h-full w-full flex-row flex-wrap items-center justify-center gap-3 overflow-auto">
        <Button v-for="(item, i) in allRoutes" :key="i"
            class="border-primary-emphasis bg-emphasis hover:bg-highlight-emphasis flex h-32 w-32 min-w-32 flex-col gap-2"
            severity="secondary" raised @click="open(item.path)">
            <i class="mx-2 text-3xl" :class="item.meta.icon" />
            <span class="text-lg">{{ item.name }}</span>
        </Button>
        <span v-if="!allRoutes.length" class="text-muted-color text-xl">Brak historii.</span>
    </div>
</template>

<script>
import getSourceFileName from '@/services/getAndGeneralizeNameOfFiles';
import { saveUserData } from '../../../services/authFunctions';

export const widgetMeta = {
    itemData: {
        component: getSourceFileName(import.meta.url),
        minW: 5,
        minH: 6,
    },
    metaData: {
        name: 'Ostatnio odwiedzone',
    },
};
</script>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useHistory } from '@/stores/useHistory';
import Button from 'primevue/button';
const history = useHistory();
const router = useRouter();

const allRoutes = ref(router.getRoutes().filter(route => history.list.includes(route.path)));

function open(path) {
    router.push(path);
}

onMounted(async () => {
    await saveUserData();
});
</script>
