<template>
    <DataTable :items="items" :columns="columns" :showInteractions="false" activateAdvancedFilters
        :showAdvancedObjectView="false" :loading="loading">
        <template #body-State="{ data }">
            <Tag :severity="getSeverity(data.State)" :value="getMessage(data.State)"></Tag>
        </template>
        <template #filter-State="{ filterModel }">
            <MultiSelect v-model="filterModel.value" :options="statesSimplified" placeholder="Wybierz status">
                <template #value="slotProps">
                    <Tag v-for="state of slotProps.value" :severity="getSeverity(state)" :value="getMessage(state)"
                        class="mr-2">
                    </Tag>
                </template>
                <template #option="slotProps">
                    <Tag :severity="getSeverity(slotProps.option)" :value="getMessage(slotProps.option)"></Tag>
                </template>
            </MultiSelect>
        </template>
    </DataTable>
</template>

<script>
import getSourceFileName from '@/services/getAndGeneralizeNameOfFiles';

export const widgetMeta = {
    itemData: {
        component: getSourceFileName(import.meta.url),
        minW: 11,
        minH: 10,
    },
    metaData: {
        name: 'Ostrzeżenia z ostatnich 10 minut',
    },
};
</script>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import api from '../../../services/api';
import DataTable from '@/components/DataTable/DataTable.vue';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { Tag, MultiSelect } from 'primevue';
import { connect } from '../../../services/websocket';

const states = [
    { name: 'Nowy', value: 0, severity: 'danger' },
    { name: 'W trakcie rozwiązywania', value: 1, severity: 'warn' },
    { name: 'Rozwiązany', value: 2, severity: 'success' },
];
const statesSimplified = [0, 1, 2];
const loading = ref(true);
const socket = connect();

const columns = ref([
    { label: 'AID', field: 'AID', type: 'numeric', dataKey: true, show: false },
    { label: 'AAID', field: 'AAID', type: 'numeric', show: false },
    { label: 'EID', field: 'EID', type: 'numeric', show: false },
    { label: 'Zgłoszono', field: 'AAName', type: 'list', addToGlobalFilter: true, options: [] },
    { label: 'Dotyczy', field: 'EIDName', type: 'text', addToGlobalFilter: true },
    {
        label: 'Status', field: 'State', type: 'any',
        overrideBodyTemplate: true,
        overrideFilterTemplate: true,
        colProps: {
            showFilterMatchModes: false,
            showFilterOperator: false,
            showAddButton: false,
            sortField: 'State'
        },
        overrideFilter: { operator: FilterOperator.AND, constraints: [{ value: [0, 1], matchMode: FilterMatchMode.IN }] }
    },
    {
        label: 'Data zgłoszenia',
        field: 'date',
        type: 'date',
        dateFormat: 'dd.MM.yyyy',
        showTime: true,
        timeFormat: 'HH:mm',
        noFilter: true,
        sortOptions: { order: -1 }
    },
])

const items = ref([]);

let cleanItemsIntervalId;

onMounted(async () => {
    try {
        let alertTypes = await api.get('/alertstypes');
        columns.value.find(item => item.field === 'AAName').options = alertTypes.data.map(item => item.name);

        let response = await api.get('/alerts', {
            params: {
                afterDate: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            }
        });

        items.value = response.data.map(item => {
            item.date = new Date(item.date);
            return item;
        });
        console.log("🚀 ~ onMounted ~ items.value:", items.value)

    } catch (error) {
        console.log("🚀 ~ onMounted ~ error:", error);
    }
    loading.value = false;

    socket.on('newAlert', async (data) => {
        console.log("🚀 ~ socket.on ~ data:", data)
        data.date = new Date();
        items.value.push(data);

    });
    socket.on('updateAlert', (data) => {

    });
    socket.on('deleteAlert', (data) => {

    });

    if (cleanItemsIntervalId) clearInterval(cleanItemsIntervalId);
    cleanItemsIntervalId = setInterval(() => {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        items.value = items.value.filter(item => new Date(item.date) > tenMinutesAgo);
    }, 60000)
})

onUnmounted(() => {
    clearInterval(cleanItemsIntervalId);
    socket.disconnect();
})

function getSeverity(state) {
    switch (state) {
        case 0:
        case "0":
            return 'danger';
        case 1:
            return 'warn';
        case 2:
            return 'success';
        default:
            return 'info';
    }
}

function getMessage(state) {
    switch (state) {
        case 0:
        case "0":
            return 'Nowy';
        case 1:
            return 'W trakcie rozwiązywania';
        case 2:
            return 'Rozwiązany';
        default:
            return 'Inny';
    }
}
</script>
