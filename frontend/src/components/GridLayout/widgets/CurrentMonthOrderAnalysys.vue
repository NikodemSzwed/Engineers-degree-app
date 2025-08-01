<template>
    <Chart class="flex items-center justify-center" type="polarArea" :data="chartData" :options="chartOptions" />
</template>

<script>
import getSourceFileName from '@/services/getAndGeneralizeNameOfFiles';

const date = new Date();

export const widgetMeta = {
    itemData: {
        component: getSourceFileName(import.meta.url),
        minW: 6,
        minH: 9,
    },
    metaData: {
        name:
            'Terminy zleceń - ' +
            date.toLocaleString('pl-PL', { month: 'long' }).charAt(0).toUpperCase() +
            date.toLocaleString('pl-PL', { month: 'long' }).slice(1),
        generalName: 'Terminy zleceń',
    },
};
</script>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import Chart from 'primevue/chart';
import { blendColors } from '../../../services/themeChanger';

const dataMatrix = ref();
const chartData = ref();
const chartOptions = ref();

onMounted(async () => {
    let start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    // console.log("🚀 ~ onMounted ~ start:", start)
    let end = new Date();
    end.setMonth(end.getMonth() + 1);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);
    // console.log("🚀 ~ onMounted ~ end:", end)

    try {
        let orders = (
            await api.get('/orders', {
                params: {
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                },
            })
        ).data;
        // console.log("🚀 ~ onMounted ~ orders:", orders)

        dataMatrix.value = [0, 0, 0, 0, 0];

        for (let i = 0; i < orders.length; i++) {
            if (orders[i].State == 2) {
                // console.log("🚀 ~ onMounted ~ orders[i].State:", orders[i].State)
                continue;
            }

            let deadlineDate = new Date(orders[i].deadline);
            let currentDate = new Date();
            let dayDifference = Math.floor((deadlineDate - currentDate) / (1000 * 60 * 60 * 24));
            // let monthDifference = (deadlineDate.getFullYear() - currentDate.getFullYear()) * 12 + deadlineDate.getMonth() - currentDate.getMonth();

            let deadline = 0;
            if (dayDifference <= 3) {
                deadline = 0;
            } else if (dayDifference <= 7) {
                deadline = 1;
            } else if (dayDifference <= 14) {
                deadline = 2;
            } else if (dayDifference <= 21) {
                deadline = 3;
            } else if (dayDifference <= 28) {
                deadline = 4;
            }

            dataMatrix.value[deadline] += 1;
        }
        // console.log("🚀 ~ onMounted ~ dataMatrix.value:", dataMatrix.value)
    } catch (error) {
        console.log(error);
    }

    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});

const setChartData = () => {
    const documentStyle = getComputedStyle(document.documentElement);

    let gray = documentStyle.getPropertyValue('--p-gray-500');
    let primary = documentStyle.getPropertyValue('--p-primary-500');

    return {
        datasets: [
            {
                data: dataMatrix.value,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 3,
                backgroundColor: [
                    documentStyle.getPropertyValue('--p-primary-500'),
                    blendColors(gray, primary, 0.75),
                    blendColors(gray, primary, 0.5),
                    blendColors(gray, primary, 0.25),
                    documentStyle.getPropertyValue('--p-gray-500'),
                ],
                label: 'Liczba zleceń o tym lub krótszym terminie',
            },
        ],
        labels: ['3 dni', '1 tydzień', '2 tygodnie', '3 tygodnie', '4 tygodnie'],
    };
};

const setChartOptions = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    return {
        maintainAspectRatio: true,
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                },
            },
        },
        scales: {
            r: {
                grid: {
                    color: surfaceBorder,
                },
            },
        },
    };
};


</script>
