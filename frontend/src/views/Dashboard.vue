<template>
    <div class="flex flex-col gap-5 w-full">


        <div class="flex flex-row gap-5 w-full">
            <div class="flex flex-col gap-5 w-full">
                <Card class="flex-1">
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
                <!-- <Card class="flex-1">
                <template #content>
                    <Chart type="bar" :data="chartData" :options="chartOptions" class="h-[20rem] w-full" />
                </template>
            </Card> -->
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
            <!-- <Card class="flex-1">
                <template #content>
                    <Chart type="bar" :data="chartData" :options="chartOptions" class="h-[20rem] w-full" />
                </template>
            </Card> -->
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
    </div>
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

const userData = useUserStore();
const name = ref(userData.login);
const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toLocaleString('pl-PL', { month: 'long' });
}).reverse()

const dataMatrix = ref();
onMounted(async () => {


    try {
        let orders = (await api.get('/orders')).data;
        // let realizedOrders = orders.filter(order => order.State == 2);
        // // console.log("🚀 ~ onMounted ~ realizedOrders:", realizedOrders)
        // let notrealizedOrders = orders.filter(order => order.State != 2);
        // // console.log("🚀 ~ onMounted ~ notrealizedOrders:", notrealizedOrders)

        dataMatrix.value = [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]];

        for (let i = 0; i < orders.length; i++) {
            let deadlineDate = new Date(orders[i].deadline);
            let currentDate = new Date();
            let monthDifference = (deadlineDate.getFullYear() - currentDate.getFullYear()) * 12 + deadlineDate.getMonth() - currentDate.getMonth();
            if (monthDifference <= 0) {
                monthDifference += 5;
            }
            console.log("🚀 ~ onMounted ~ monthDifference:", monthDifference)
            if (monthDifference >= 0 && monthDifference < 6) {
                dataMatrix.value[0][monthDifference] += orders[i].State != 2 ? 1 : 0;
                dataMatrix.value[1][monthDifference] += orders[i].State != 2 ? 0 : 1;
            }

        }
        // dataMatrix.value[0] = dataMatrix.value[0].reverse();
        // dataMatrix.value[1] = dataMatrix.value[1].reverse();
        console.log("🚀 ~ onMounted ~ dataMatrix.value:", dataMatrix.value)


    } catch (error) {
        console.log(error);
    }

    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});


const chartData = ref();
const chartOptions = ref();

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
            },
            // {
            //     type: 'bar',
            //     label: 'Dataset 3',
            //     backgroundColor: documentStyle.getPropertyValue('--p-orange-500'),
            //     data: [41, 52, 24, 74, 23, 21, 32]
            // }
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
