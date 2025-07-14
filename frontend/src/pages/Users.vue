<template>
    <div>
        <Card :pt="{ body: 'p-2 lg:p-5' }">
            <template #content>
                <DataTable :items="items" :columns="columns" :advancedFiltersAvailable="true" :showInteractions="true"
                    :loading="loading" @addItem="addItem" @editItem="editItem" @deleteItem="deleteItem">
                    <template #body-custom="{ data }">
                        <div :class="data.custom.value">{{ data.custom.name }}</div>
                    </template>
                    <template #filter-custom="{ filterModel }">
                        <MultiSelect v-model="filterModel.value" :options="colors" optionLabel="name" filter showClear>
                            <template #option="slotProps">
                                <div :class="slotProps.option.value">{{ slotProps.option.name }}</div>
                            </template>
                            <template #value="slotProps">
                                <div v-for="color of slotProps.value" :class="color.value">{{ color.name }}</div>
                            </template>
                        </MultiSelect>

                    </template>
                </DataTable>
            </template>
        </Card>
        <Dialog v-model:visible="addItemDialogVisible" class="w-11/12 lg:w-1/3">
            <Form></Form>
        </Dialog>
    </div>


</template>

<script setup>
import { onMounted, ref } from 'vue';

import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import DataTable from '../components/DataTable/DataTable.vue';
import api from '../services/api';
import { MultiSelect } from 'primevue';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import Form from '../components/Form/Form.vue';


const items = ref([]);
const addItemDialogVisible = ref(false);

const adjectives = ['Red', 'Big', 'Small', 'Old', 'New', 'Long', 'Round', 'Flat', 'Green', 'Blue'];
const nouns = ['Pen', 'Pencil', 'Book', 'Desk', 'Chair', 'Door', 'Window', 'Car', 'Bike', 'Table'];

const categories = ['Writing', 'Painting', 'Sculpture', 'Architecture', 'Design', 'Art', 'Photography', 'Music', 'Dance', 'Theater'];
const colors = [
    { name: 'Blue', value: 'bg-blue-500' },
    { name: 'Red', value: 'bg-red-500' },
    { name: 'Green', value: 'bg-green-500' },
    { name: 'Yellow', value: 'bg-yellow-500' },
    { name: 'Orange', value: 'bg-orange-500' },
    { name: 'Purple', value: 'bg-purple-500' },
    { name: 'Pink', value: 'bg-pink-500' },
    { name: 'Teal', value: 'bg-teal-500' },
];


const columns = ref([
    // { label: 'Id', field: 'id', type: 'numeric', dataKey: true, show: false },
    // { label: 'Code', field: 'code', type: 'text', addToGlobalFilter: true },
    // { label: 'Name', field: 'name', type: 'text', addToGlobalFilter: true },
    // {
    //     label: 'Custom', field: 'custom', type: 'any',
    //     overrideBodyTemplate: true,
    //     overrideFilterTemplate: true,
    //     colProps: {
    //         showFilterMatchModes: false,
    //         showFilterOperator: false,
    //         showAddButton: false,
    //         sortField: 'custom.name'
    //     },
    //     overrideFilter: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.IN }] }
    // },
    // { label: 'Category', field: 'category', type: 'list', options: categories },
    // { label: 'Quantity', field: 'quantity', type: 'numeric' },
    // { label: 'Created', field: 'created', type: 'date', dateFormat: 'dd.MM.yyyy', showTime: true, timeFormat: 'HH:mm' },


    { label: 'UID', field: 'UID', type: 'numeric', dataKey: true, show: false },
    { label: 'Login', field: 'login', type: 'text', addToGlobalFilter: true },
    { label: 'Email', field: 'email', type: 'text', addToGlobalFilter: true },
    { label: 'Ustawienia personalne', field: 'personallSettings', type: 'text', show: false },
])

const loading = ref(true);

onMounted(async () => {
    try {
        let response = await api.get('/users');
        items.value = response.data;
    } catch (error) {
        console.log("🚀 ~ onMounted ~ error:", error);
    }
    loading.value = false;

    // for (let i = 0; i < 200; i++) {
    //     const ele = {
    //         id: i,
    //         code: Array(6).fill('').map(() => (Math.random() < 0.5 ? String.fromCharCode(Math.floor(Math.random() * 26) + 97) : Math.floor(Math.random() * 10).toString())).join(''),
    //         name: adjectives[Math.floor(Math.random() * adjectives.length)] + ' ' + nouns[Math.floor(Math.random() * nouns.length)] + '' + i,
    //         category: categories[Math.floor(Math.random() * categories.length)],
    //         quantity: Math.floor(Math.random() * 90) + 10,
    //         created: new Date(Date.now() + (Math.floor(Math.random() * 31) - 15) * 24 * 60 * 60 * 1000),
    //         custom: colors[Math.floor(Math.random() * colors.length)],

    //     };

    //     products.value.push(ele);
    // }

    // setTimeout(() => { loading.value = false; }, 2000);

    console.log("🚀 ~ products.value:", items.value)
})

function addItem() {
    addItemDialogVisible.value = true;
    console.log("addItem")
}

function editItem(item) {
    console.log("editItem", item)
}

function deleteItem(item) {
    console.log("deleteItem", item)
}



</script>