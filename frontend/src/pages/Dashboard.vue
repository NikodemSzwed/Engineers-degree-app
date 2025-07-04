<template>
    <div class="flex flex-row">
        <!-- empty div is needed to hold grid layout in bounds -->
        <GridLayout :layout="layout" :isEditable="editLayout" fixKeys :cols="cols" responsive>
        </GridLayout>
        <SpeedDial :model="items" direction="down" :style="{ position: 'absolute', right: '1.25rem', top: '1.25rem' }"
            :buttonProps="{ severity: 'primary', rounded: true }" :tooltipOptions="{ position: 'left' }" />

        <Dock v-model:visible="widgetDockVisible" header="Widżety">
            <template #content>
                <div v-for="i in 5" :key="i" class="bg-blue-200 w-64 h-44">
                    <!-- <span>{{ w.generalName ? w.generalName : w.name }}</span> -->
                </div>
                <!-- <div v-for="(w, i) in widgetsMeta" :key="i" class="bg-blue-200 w-full h-44">
                    <span>{{ w.generalName ? w.generalName : w.name }}</span>
                </div> -->
            </template>
        </Dock>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
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


const userData = useUserStore();
const name = ref(userData.login);
const editLayout = ref(true);
const layout = ref([]);
const widgetDockVisible = ref(true);

const cols = ref({
    lg: 24,
    md: 12,
    sm: 6,
    xs: 4,
    xxs: 2
});

let components = [
    { component: 'OrderRealization', props: {} },
    { component: 'AlertsFromLast10Minutes', props: {} },
    { component: 'CurrentMonthOrderAnalysys', props: {} },
    { component: 'LastVisited', props: {} },
    { component: 'Clock', props: {} },
];

layout.value = {
    lg: [
        { x: 0, y: 0, w: 8, h: 11, i: 0, static: false, ...components[0] },
        { x: 8, y: 0, w: 16, h: 15, i: 1, static: false, ...components[1] },
        { x: 0, y: 0, w: 8, h: 11, i: 2, minW: 5, static: false, ...components[2] },
        { x: 8, y: 0, w: 16, h: 7, i: 3, static: false, ...components[3] },
        { x: 8, y: 7, w: 4, h: 5, i: 4, static: false, ...components[4] }
    ],
    md: [
        { x: 0, y: 0, w: 4, h: 11, i: 0, static: false, ...components[0] },
        { x: 4, y: 0, w: 8, h: 15, i: 1, static: false, ...components[1] },
        { x: 0, y: 8, w: 4, h: 11, i: 2, minW: 4, static: false, ...components[2] },
        { x: 4, y: 15, w: 8, h: 7, i: 3, static: false, ...components[3] }
    ],
    sm: [
        { x: 0, y: 0, w: 6, h: 11, i: 0, static: false, ...components[0] },
        { x: 0, y: 6, w: 6, h: 15, i: 1, static: false, ...components[1] },
        { x: 0, y: 12, w: 6, h: 11, i: 2, static: false, ...components[2] },
        { x: 0, y: 18, w: 6, h: 7, i: 3, static: false, ...components[3] }
    ]
};

watch(widgetDockVisible, (newVal) => {
    console.log('widgetDockVisible', newVal)
})

const items = ref([
    {
        label: 'Dodaj widżet',
        icon: 'pi pi-plus',
        command: () => {
            editLayout.value = true;
            widgetDockVisible.value = true;
        }
    },
    {
        label: 'Edytuj kokpit',
        icon: 'pi pi-pencil',
        command: () => {
            editLayout.value = true;
        }
    },
    {
        label: 'Zapisz',
        icon: 'pi pi-save',
        command: () => {
            editLayout.value = false;
            widgetDockVisible.value = false;
        }
    }
])


</script>
