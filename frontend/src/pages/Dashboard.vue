<template>
    <div class="w-full">
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-4"
        >
            <div v-if="editLayout" class="sticky flex w-full">
                <Card class="w-full" :pt="{ body: 'p-3' }">
                    <template #content>
                        <div class="flex gap-3">
                            <Button @click="save()">Zapisz</Button>
                            <Button outlined @click="widgetDockVisible = true" class="hidden lg:block"
                                >Dodaj widżet</Button
                            >
                        </div>
                    </template>
                </Card>
            </div>
        </Transition>

        <div ref="wrapper">
            <!-- wrapper is needed for dragging elements and for constraining gridLayout -->
            <GridLayout ref="gridLayout" v-model:layout="layout" :isEditable="editLayout"> </GridLayout>
        </div>
        <SpeedDial
            :model="items"
            direction="down"
            class="fixed top-21 left-6 hidden 2xl:flex"
            :buttonProps="{ severity: 'primary', rounded: true }"
            :tooltipOptions="{ position: 'left' }"
        />

        <Dock v-model:visible="widgetDockVisible" header="Widżety">
            <template #content>
                <DraggableItem
                    v-for="(w, i) in widgetsMeta"
                    :key="i"
                    v-model:layout="layout"
                    :wraperBounds="wrapper"
                    v-model:gridLayout="grid"
                    :component="w"
                    class="h-44 w-64"
                >
                    <template #content>
                        <div
                            class="border-primary-500 bg-emphasis hover:bg-highlight flex h-full w-full cursor-all-scroll items-center justify-center rounded-xl border-2"
                        >
                            <span>{{ w.metaData?.generalName ? w.metaData.generalName : w.metaData.name }}</span>
                        </div>
                    </template>
                </DraggableItem>
            </template>
        </Dock>
    </div>
</template>

<script setup>
    import { ref, onMounted, watch, computed } from 'vue';
    import { useUserStore } from '../stores/userData';
    import Button from 'primevue/button';
    import Chart from 'primevue/chart';
    import { Card } from 'primevue';
    import api from '../services/api';
    import { GridItem } from 'grid-layout-plus';
    import GridLayout from '../components/GridLayout/GridLayout.vue';
    import SpeedDial from 'primevue/speeddial';
    import Dock from '../components/Dock/Dock.vue';
    import { widgetsMeta } from '../components/GridLayout/widgets';
    import DraggableItem from '../components/GridLayout/DraggableItem.vue';

    const userData = useUserStore();
    const editLayout = ref(false);
    const layout = ref([]);
    const widgetDockVisible = ref(false);

    const wrapper = ref();
    const gridLayout = ref();
    const grid = computed({
        get: () => gridLayout.value?.grid,
        set: v => (gridLayout.value.grid = v),
    });

    let components = [
        {
            ...widgetsMeta['OrderRealization'].itemData,
            props: { ...widgetsMeta['OrderRealization'].metaData },
        },
        {
            ...widgetsMeta['AlertsFromLast10Minutes'].itemData,
            props: { ...widgetsMeta['AlertsFromLast10Minutes'].metaData },
        },
        {
            ...widgetsMeta['CurrentMonthOrderAnalysys'].itemData,
            props: { ...widgetsMeta['CurrentMonthOrderAnalysys'].metaData },
        },
        { ...widgetsMeta['LastVisited'].itemData, props: { ...widgetsMeta['LastVisited'].metaData } },
        { ...widgetsMeta['Clock'].itemData, props: { ...widgetsMeta['Clock'].metaData } },
    ];

    /*** example of preset layouts */
    // const presetLayouts = ref({
    //     cols: {
    //         lg: 24,
    //         md: 12,
    //         sm: 6,
    //         xs: 4,
    //         xxs: 2
    //     },
    //     lg: [
    //         { x: 0, y: 0, w: 8, h: 10, i: 0, ...components[0] },
    //         { x: 8, y: 0, w: 16, h: 14, i: 1, ...components[1] },
    //         { x: 0, y: 10, w: 8, h: 10, i: 2, ...components[2] },
    //         { x: 8, y: 14, w: 16, h: 6, i: 3, ...components[3] }
    //     ],
    //     md: [
    //         { x: 0, y: 0, w: 4, h: 11, i: 0, ...components[0] },
    //         { x: 4, y: 0, w: 8, h: 15, i: 1, ...components[1] },
    //         { x: 0, y: 8, w: 4, h: 11, i: 2, ...components[2] },
    //         { x: 4, y: 15, w: 8, h: 7, i: 3, ...components[3] }
    //     ],
    //     sm: [
    //         { x: 0, y: 0, w: 6, h: 11, i: 0, ...components[0] },
    //         { x: 0, y: 11, w: 6, h: 15, i: 1, ...components[1] },
    //         { x: 0, y: 26, w: 6, h: 11, i: 2, ...components[2] },
    //         { x: 0, y: 37, w: 6, h: 7, i: 3, ...components[3] }
    //     ]
    // });

    onMounted(() => {
        if (userData.personalSettings.layout) {
            layout.value = JSON.parse(JSON.stringify(userData.personalSettings.layout));
        } else {
            layout.value = [
                { x: 0, y: 0, w: 8, h: 10, i: 0, ...components[0] },
                { x: 8, y: 0, w: 16, h: 14, i: 1, ...components[1] },
                { x: 0, y: 10, w: 8, h: 10, i: 2, ...components[2] },
                { x: 8, y: 14, w: 16, h: 6, i: 3, ...components[3] },
            ];
        }
    });

    const items = ref([
        {
            label: 'Edytuj kokpit',
            icon: 'pi pi-pencil',
            command: () => {
                activateEditMode();
            },
        },
    ]);

    const save = async () => {
        editLayout.value = false;
        widgetDockVisible.value = false;
        userData.personalSettings.layout = JSON.parse(JSON.stringify(layout.value));
        await api.put(`/users/` + userData.id, {
            PersonalSettings_json: JSON.stringify(userData.personalSettings),
        });
    };

    const activateEditMode = () => {
        if (editLayout.value) {
            widgetDockVisible.value = false;
        }
        editLayout.value = !editLayout.value;
    };
</script>
