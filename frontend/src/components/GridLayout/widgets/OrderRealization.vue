<template>
    <Chart class="w-full" type="bar" :data="chartData" :options="chartOptions"></Chart>
</template>

<script>
export const widgetMeta = { minW: 4, minH: 7 };
</script>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import Chart from 'primevue/chart';

const dataMatrix = ref();
const chartData = ref();
const chartOptions = ref();
const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toLocaleString('pl-PL', { month: 'long' });
}).reverse()


onMounted(async () => {
    try {
        let orders = (await api.get('/orders')).data;

        dataMatrix.value = [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]];

        for (let i = 0; i < orders.length; i++) {
            let deadlineDate = new Date(orders[i].deadline);
            let currentDate = new Date();
            let monthDifference = (deadlineDate.getFullYear() - currentDate.getFullYear()) * 12 + deadlineDate.getMonth() - currentDate.getMonth();
            if (monthDifference <= 0) {
                monthDifference += 5;
            }
            if (monthDifference >= 0 && monthDifference < 6) {
                dataMatrix.value[0][monthDifference] += orders[i].State == 2 ? 1 : 0;
                dataMatrix.value[1][monthDifference] += orders[i].State != 2 ? 1 : 0;
            }
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

    return {
        labels: months,
        datasets: [
            {
                type: 'bar',
                label: 'Zrealizowane zlecenia',
                backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                data: dataMatrix.value[0]
            },
            {
                type: 'bar',
                label: 'Niezrealizowane zlecenia',
                backgroundColor: documentStyle.getPropertyValue('--p-gray-500'),
                data: dataMatrix.value[1]
            }
        ]
    };
};
const setChartOptions = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            tooltips: {
                mode: 'index',
                intersect: false
            },
            legend: {
                labels: {
                    color: textColor
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y: {
                stacked: true,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            }
        }
    };
}


</script>