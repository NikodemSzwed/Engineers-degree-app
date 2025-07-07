<template>
    <div class="w-full">
        <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 -translate-y-4"
            enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-4">
            <div v-if="editLayout" class="w-full flex sticky">
                <Card class="w-full" :pt="{ body: 'p-3' }">
                    <template #content>
                        <div class="flex gap-3">
                            <Button @click="save()">Zapisz</Button>
                            <Button outlined @click="widgetDockVisible = true">Dodaj widżet</Button>
                        </div>

                    </template>

                </Card>
            </div>
        </Transition>
        <div ref="wrapper">
            <!-- wrapper is needed for dragging elements and for constraining gridLayout -->
            <GridLayout ref="gridLayout" v-model:layout="layout" :isEditable="editLayout" fixKeys :cols="cols"
                responsive>
            </GridLayout>

        </div>
        <SpeedDial :model="items" direction="down" class="fixed top-21 left-7"
            :buttonProps="{ severity: 'primary', rounded: true }" :tooltipOptions="{ position: 'left' }" />

        <Dock v-model:visible="widgetDockVisible" header="Widżety">
            <template #content>
                <DraggableItem v-for="(w, i) in widgetsMeta" :key="i" v-model:layout="layout"
                    v-model:wraperBounds="wrapper" v-model:gridLayout="grid" :component="w" class="w-64 h-44">
                    <template #content>
                        <div
                            class="w-full h-full border-primary-500 border-2 rounded-xl bg-emphasis cursor-all-scroll flex items-center justify-center hover:bg-highlight">
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
const name = ref(userData.login);
const editLayout = ref(true);
const layout = ref([]);
const widgetDockVisible = ref(true);

const wrapper = ref();
const gridLayout = ref();
const grid = computed({
    get: () => gridLayout.value?.grid,
    set: v => gridLayout.value.grid = v
});


const cols = ref({
    lg: 24,
    md: 12,
    sm: 6,
    xs: 4,
    xxs: 2
});

let components = [
    { ...widgetsMeta['OrderRealization'].itemData, props: { ...widgetsMeta['OrderRealization'].metaData } },
    { ...widgetsMeta['AlertsFromLast10Minutes'].itemData, props: { ...widgetsMeta['AlertsFromLast10Minutes'].metaData } },
    { ...widgetsMeta['CurrentMonthOrderAnalysys'].itemData, props: { ...widgetsMeta['CurrentMonthOrderAnalysys'].metaData } },
    { ...widgetsMeta['LastVisited'].itemData, props: { ...widgetsMeta['LastVisited'].metaData } },
    { ...widgetsMeta['Clock'].itemData, props: { ...widgetsMeta['Clock'].metaData } },

];

layout.value = [

    // { x: 0, y: 0, w: 8, h: 11, i: 0, static: false, ...components[0] },
    // { x: 0, y: 0, w: 16, h: 15, i: 1, static: false, ...components[1] },
    // { x: 0, y: 0, w: 8, h: 11, i: 2, minW: 5, static: false, ...components[2] },
    // { x: 0, y: 0, w: 16, h: 7, i: 3, static: false, ...components[3] },

    // lg: [
    { x: 0, y: 0, w: 8, h: 11, i: 0, static: false, ...components[0] },
    { x: 8, y: 0, w: 16, h: 15, i: 1, static: false, ...components[1] },
    { x: 0, y: 0, w: 8, h: 11, i: 2, minW: 5, static: false, ...components[2] },
    { x: 8, y: 0, w: 16, h: 7, i: 3, static: false, ...components[3] },
    // { x: 8, y: 7, w: 4, h: 5, i: 4, static: false, ...components[4] }
    // ],
    // md: [
    //     { x: 0, y: 0, w: 4, h: 11, i: 0, static: false, ...components[0] },
    //     { x: 4, y: 0, w: 8, h: 15, i: 1, static: false, ...components[1] },
    //     { x: 0, y: 8, w: 4, h: 11, i: 2, minW: 4, static: false, ...components[2] },
    //     { x: 4, y: 15, w: 8, h: 7, i: 3, static: false, ...components[3] }
    // ],
    // sm: [
    //     { x: 0, y: 0, w: 6, h: 11, i: 0, static: false, ...components[0] },
    //     { x: 0, y: 6, w: 6, h: 15, i: 1, static: false, ...components[1] },
    //     { x: 0, y: 12, w: 6, h: 11, i: 2, static: false, ...components[2] },
    //     { x: 0, y: 18, w: 6, h: 7, i: 3, static: false, ...components[3] }
    // ]
]
// };

onMounted(() => {
    // console.log("🚀 ~ gridLayout:", gridLayout.value.grid.getItem(1))
    console.log("🚀 ~ widgetsMeta:", widgetsMeta)
})

// watch(widgetDockVisible, (newVal) => {
//     console.log('widgetDockVisible', newVal)
// })

// watch(layout, (newVal) => {
//     console.log('layout', newVal)
// })

const items = ref([
    {
        label: 'Edytuj kokpit',
        icon: 'pi pi-pencil',
        command: () => {
            if (editLayout.value) {
                widgetDockVisible.value = false;
            }
            editLayout.value = !editLayout.value;
        }
    }
])

const save = () => {
    editLayout.value = false;
    widgetDockVisible.value = false;
}


</script>
