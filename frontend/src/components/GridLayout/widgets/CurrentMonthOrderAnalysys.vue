<template>
    <Chart class="flex items-center justify-center" type="polarArea" :data="chartData" :options="chartOptions" />
</template>

<script>
const date = new Date();

export const widgetMeta = { minW: 6, minH: 9, name: "Terminy zlecen - " + date.toLocaleString('pl-PL', { month: 'long' }).charAt(0).toUpperCase() + date.toLocaleString('pl-PL', { month: 'long' }).slice(1) };
</script>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import Chart from 'primevue/chart';
import { RadioButtonGroup } from 'primevue';

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
        let orders = (await api.get('/orders',
            {
                params: {
                    startDate: start.toISOString(),
                    endDate: end.toISOString()
                }
            }
        )).data;
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
})



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
                    documentStyle.getPropertyValue('--p-gray-500')
                ],
                label: 'Liczba zleceń o tym lub krótszym terminie'
            },
        ],
        labels: ['3 dni', '1 tydzień', '2 tygodnie', '3 tygodnie', '4 tygodnie']
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
                    color: textColor
                }
            }
        },
        scales: {
            r: {
                grid: {
                    color: surfaceBorder
                }
            }
        }
    };
}

function blendColors(c0, c1, weight = 0.5) {
    // c0 and c1 are hex strings like "#336699"
    function hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }

    function rgbToHex(r, g, b) {
        const toHex = (x) => x.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    const rgb0 = hexToRgb(c0);
    const rgb1 = hexToRgb(c1);

    const r = Math.round(rgb0.r * (1 - weight) + rgb1.r * weight);
    const g = Math.round(rgb0.g * (1 - weight) + rgb1.g * weight);
    const b = Math.round(rgb0.b * (1 - weight) + rgb1.b * weight);

    return rgbToHex(r, g, b);
}
</script>
