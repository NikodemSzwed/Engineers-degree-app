<template>
    <Chart type="bar" :data="chartData" :options="chartOptions"></Chart>
</template>

<script>
    import getSourceFileName from '@/services/getAndGeneralizeNameOfFiles';

    export const widgetMeta = {
        itemData: {
            component: getSourceFileName(import.meta.url),
            minW: 5,
            minH: 8,
        },
        metaData: {
            name: 'Ilości zrealizowanych zleceń',
        },
    };
</script>

<script setup>
    import { ref, onMounted } from 'vue';
    import api from '@/services/api';
    import Chart from 'primevue/chart';
    import { useToast } from 'primevue';
    import { toastHandler } from '../../../services/toastHandler';

    const toast = useToast();

    const dataMatrix = ref();
    const chartData = ref();
    const chartOptions = ref();
    const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toLocaleString('pl-PL', { month: 'long' });
    }).reverse();

    onMounted(async () => {
        let start = new Date();
        start.setMonth(start.getMonth() - 5);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        let end = new Date();
        end.setMonth(end.getMonth() + 1);
        end.setDate(1);
        end.setHours(0, 0, 0, 0);

        try {
            let orders = (
                await api.get('/orders', {
                    params: {
                        startDate: start.toISOString(),
                        endDate: end.toISOString(),
                    },
                })
            ).data;

            dataMatrix.value = [
                [0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0],
            ];
            let liporders = [];

            for (let i = 0; i < orders.length; i++) {
                let deadlineDate = new Date(orders[i].deadline);
                let currentDate = new Date();
                let monthDifference =
                    (deadlineDate.getFullYear() - currentDate.getFullYear()) * 12 +
                    deadlineDate.getMonth() -
                    currentDate.getMonth();
                if (monthDifference <= 0) {
                    monthDifference += 5;
                }

                if (monthDifference == 5) {
                    liporders.push(orders[i]);
                }

                if (orders[i].State == 2) {
                    dataMatrix.value[0][monthDifference] += 1;
                } else {
                    dataMatrix.value[1][monthDifference] += 1;
                }
            }
        } catch (error) {
            toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
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
                    data: dataMatrix.value[0],
                },
                {
                    type: 'bar',
                    label: 'Niezrealizowane zlecenia',
                    backgroundColor: documentStyle.getPropertyValue('--p-gray-500'),
                    data: dataMatrix.value[1],
                },
            ],
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
                    intersect: false,
                },
                legend: {
                    labels: {
                        color: textColor,
                    },
                },
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: textColorSecondary,
                    },
                    grid: {
                        color: surfaceBorder,
                    },
                },
                y: {
                    stacked: true,
                    ticks: {
                        color: textColorSecondary,
                    },
                    grid: {
                        color: surfaceBorder,
                    },
                },
            },
        };
    };
</script>
