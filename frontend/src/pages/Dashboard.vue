<template>
    <div class="">
        <GridLayout :layout="layout" :col-num="24" :row-height="30" :isEditable="editLayout" fixKeys>
            <!-- <template #items>
                <GridItem v-for="item in layout" :key="item.i" :x="item.x" :y="item.y" :w="item.w" :h="item.h">
                    <OrderRealization class="h-[15rem]"></OrderRealization>
                </GridItem>
            </template> -->
        </GridLayout>
        <SpeedDial :model="items" direction="down" :style="{ position: 'absolute', right: '1.25rem', top: '1.25rem' }"
            :buttonProps="{ severity: 'primary', rounded: true }" :tooltipOptions="{ position: 'left' }" />
        <!-- <component :is="OrderRealization"></component> -->
    </div>


    <!-- <div class="flex flex-col gap-5 w-full">
        <div class="flex flex-row gap-5 w-full">
            <div class="flex flex-col gap-5 w-full">
                <Card class="flex-1 w-1/2">
                    <template #content>
                        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-[15rem]" />
                    </template>
</Card>
<Card class="flex-1">
    <template #content>
                        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-[15rem]" />
                    </template>
</Card>
</div>
<div class="flex flex-col gap-5 w-full">
    <Card class="flex-1">
        <template #content>
                        <div class="w-full">
                            <span>alerty z 10min. Welcome {{ name }}</span>
                            <div class="h-[5rem]">tak0 asd asd asd asd asa</div>
                            <div class="bg-emphasis h-[5rem]">tak asd asd asd asd asa</div>
                            <div class="bg-highlight h-[5rem]">tak2 asd asd asd asd asa</div>
                            <div class="bg-highlight-emphasis h-[5rem]">tak3 asd asd asd asd asa</div>
                        </div>

                    </template>
    </Card>
</div>
</div>
<div class="flex flex-col gap-5 w-full">
    <Card class="flex-1">
        <template #content>
                    <div class="w-full">
                        <span>ostatnie</span>
                        <div class="h-[5rem]">tak0 asd asd asd asd asa</div>
                        <div class="bg-emphasis h-[5rem]">tak asd asd asd asd asa</div>
                        <div class="bg-highlight h-[5rem]">tak2 asd asd asd asd asa</div>
                    </div>

                </template>
    </Card>
</div>
</div> -->
    <!-- <div class="bg-red-200 h-[200vh]"> -->
    <!-- </div> -->
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../stores/userData';
import Button from 'primevue/button';
import Chart from 'primevue/chart';
import { Card } from 'primevue';
import api from '../services/api';
import { GridItem } from 'grid-layout-plus';
import GridLayout from '../components/GridLayout/GridLayout.vue';
import SpeedDial from 'primevue/speeddial';
import OrderRealization from '../components/GridLayout/widgets/OrderRealization.vue';

const userData = useUserStore();
const name = ref(userData.login);
const editLayout = ref(true);
const layout = ref([]);
const items = ref([
    {
        label: 'Edytuj',
        icon: 'pi pi-pencil',
        command: () => {
            editLayout.value = !editLayout.value;
        }
    },
    {
        label: 'Zapisz',
        icon: 'pi pi-save',
        command: () => {
            editLayout.value = !editLayout.value;
        }
    }
])
onMounted(async () => {

    layout.value = [
        { x: 0, y: 0, w: 8, h: 11, i: 0, static: false, component: 'OrderRealization', props: {} },
        { x: 8, y: 0, w: 16, h: 15, i: 1, static: false, component: 'Empty', props: {} },
        { x: 0, y: 0, w: 8, h: 11, i: 1, static: false, component: 'Empty', props: {} },
        { x: 8, y: 0, w: 16, h: 7, i: 1, static: false, component: 'Empty', props: {} },
        // { x: 5, y: 0, w: 11, minW: 3, h: 11, minH: 7, i: 2, static: false, component: 'GridLayout', props: {} },
    ];
});





</script>
