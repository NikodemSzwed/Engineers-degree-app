<template>
    <div class="w-full">
    </div>
</template>

<script>
import getSourceFileName from '@/services/getAndGeneralizeNameOfFiles';

export const widgetMeta = {
    itemData: {
        component: getSourceFileName(import.meta.url),
        minW: 8,
        minH: 4
    },
    metaData: {
        name: "Ostrzeżenia z ostatnich 10 minut"
    }
};
</script>