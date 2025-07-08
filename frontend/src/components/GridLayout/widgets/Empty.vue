<template>
    <div class="w-full"></div>
</template>

<script>
    import getSourceFileName from '@/services/getAndGeneralizeNameOfFiles';

    export const widgetMeta = {
        itemData: {
            component: getSourceFileName(import.meta.url),
            minW: 2,
            minH: 2,
        },
        metaData: {
            name: '',
            generalName: 'Wypełniacz',
        },
    };
</script>
