<template>
    <Card>
        <template #content>
            <DataTable :items="products" :columns="columns" :advancedFiltersAvailable="true" :showInteractions="true"
                :loading="loading" @addItem="addItem" @editItem="editItem" @deleteItem="deleteItem">
            </DataTable>
        </template>
    </Card>
</template>

<script setup>
import { onMounted, ref } from 'vue';

import Card from 'primevue/card';
import DataTable from '../components/DataTable/DataTable.vue';
import api from '../services/api';


const products = ref([]);

const adjectives = ['Red', 'Big', 'Small', 'Old', 'New', 'Long', 'Round', 'Flat', 'Green', 'Blue'];
const nouns = ['Pen', 'Pencil', 'Book', 'Desk', 'Chair', 'Door', 'Window', 'Car', 'Bike', 'Table'];

const categories = ['Writing', 'Painting', 'Sculpture', 'Architecture', 'Design'];


const columns = ref([
    // { label: 'Id', field: 'id', type: 'numeric', dataKey: true, show: false },
    // { label: 'Code', field: 'code', type: 'text', addToGlobalFilter: true },
    // { label: 'Name', field: 'name', type: 'text', addToGlobalFilter: true },
    // { label: 'Category', field: 'category', type: 'list', options: categories },
    // { label: 'Quantity', field: 'quantity', type: 'numeric' },
    // { label: 'Created', field: 'created', type: 'date', dateFormat: 'dd.MM.yyyy', showTime: false, timeFormat: 'HH:mm' },

    { label: 'UID', field: 'UID', type: 'numeric', dataKey: true, show: false },
    { label: 'Nazwa', field: 'login', type: 'text', addToGlobalFilter: true },
    { label: 'Email', field: 'email', type: 'text', addToGlobalFilter: true },
    { label: 'Ustawienia personalne', field: 'personallSettings', type: 'text', show: false },
])

const loading = ref(true);

onMounted(async () => {
    try {
        let response = await api.get('/users');
        products.value = response.data;
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
    //         created: new Date(Date.now() + (Math.floor(Math.random() * 31) - 15) * 24 * 60 * 60 * 1000)
    //     };

    //     products.value.push(ele);
    // }

    // setTimeout(() => { loading.value = false; }, 2000);

    // console.log("🚀 ~ products.value:", products.value)
})

function addItem() {
    console.log("addItem")
}

function editItem(item) {
    console.log("editItem", item)
}

function deleteItem(item) {
    console.log("deleteItem", item)
}



</script>