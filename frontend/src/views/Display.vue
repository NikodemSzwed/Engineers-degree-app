<template>
    <Toast></Toast>
    <div class="flex h-screen w-full overflow-hidden">
        <div class="bg-emphasis relative flex flex-1 flex-col max-w-screen overflow-y-auto">
            <div class="flex flex-row items-center justify-between w-full">
                <div
                    class="bg-[var(--p-card-background)] text-lg mt-1 lg:mt-3 mx-1 lg:mx-3 p-2 lg:p-3 shadow rounded-xl">
                    Monitor: asd</div>
                <Button class="mx-1 lg:mx-3 mt-1 lg:mt-3" raised @click="showEmptyDock()">Zgłoś problem</Button>
            </div>
            <div class="mx-1 mt-1 lg:mx-3 lg:mt-3 flex flex-1 flex-col items-center">
                <div class="flex flex-row flex-wrap gap-1 lg:gap-3 w-full items-stretch justify-center flex-1">
                    <Card class="flex-1 min-w-[55vw] lg:min-w-[35vw] overflow-hidden" :class="{
                        'outline-2 outline-primary rounded-xl': item.selected,
                        'h-[43.5vh]': items.length > 2,
                        'h-[88vh]': items.length <= 2
                    }" v-for="item in items" @click="selectObject(item)"
                        :pt="{ content: 'overflow-hidden', body: 'overflow-hidden' }">
                        <template #title>
                            <div class="w-full flex flex-row justify-between">
                                <div>
                                    {{ item.label }}
                                </div>
                                <div class="w-10 flex justify-end cursor-pointer" @click.stop="showItemDialog(item)">
                                    <i class="pi pi-window-maximize pr-1"></i>
                                </div>
                            </div>
                        </template>
                        <template #content>
                            <div class="h-full overflow-y-auto">
                                <div v-if="item.ETID == 1">
                                    mapa
                                </div>
                                <div v-else-if="item.ETID == 2">
                                    <div class="flex flex-col gap-1">
                                        <div class="rounded-xl w-full flex flex-row gap-1 lg:gap-3"
                                            v-for="(field, j) in orderFields"
                                            :class="{ 'bg-surface-200': j % 2 === 1, 'bg-surface-100': j % 2 === 0 }">
                                            <div class="p-2 lg:p-3 min-w-40">{{ field.label }}</div>
                                            <div v-if="field.key == 'State'" class="p-2 lg:p-3">
                                                <Tag :severity="getSeverity(item.data[field.key])"
                                                    :value="getMessage(item.data[field.key])"></Tag>
                                            </div>
                                            <div v-else-if="field.key == 'deadline'" class="p-2 lg:p-3">
                                                {{ formatDate(item.data[field.key]) }}
                                            </div>
                                            <div v-else class="p-2 lg:p-3">{{ item.data[field.key] }}</div>
                                        </div>
                                        <div class="bg-surface-100 rounded-xl flex flex-col">
                                            <div class="p-2 lg:p-3 min-w-40">Dostawy:</div>
                                            <div class="mx-2 mb-2 lg:mx-3 lg:mb-3 flex flex-col gap-1">
                                                <div class="p-1 pl-2 lg:pl-3 lg:p-3 bg-white rounded-xl"
                                                    v-for="delivery in item.data.Deliveries">
                                                    {{ formatDate(delivery.date, 'dd.MM.yyyy HH:mm') }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else-if="item.ETID == 3">
                                    <div class="flex flex-col gap-1 m-1">
                                        <div class="rounded-xl flex-1 flex flex-row gap-1 lg:gap-3 p-2 lg:p-3 min-w-40"
                                            v-for="(order, j) in item.orders" :class="{
                                                'bg-surface-200': j % 2 === 1,
                                                'bg-surface-100': j % 2 === 0,
                                                'outline-2 outline-primary rounded-xl': order.selected
                                            }" @click.stop="selectObject(order)">
                                            {{ order.name }}
                                        </div>
                                        <div v-if="item.orders.length == 0">Brak zleceń na sektorze.</div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
                <Dock v-model:visible="dockVisible" header="Wybierz problem">
                    <template #content>
                        <div class="w-full h-30 bg-emphasis shadow cursor-pointer rounded-xl flex items-center justify-center"
                            v-for="at in alertTypes">
                            <span>{{ at.name }}</span>
                        </div>
                        <div v-if="alertTypes.length == 0">Wybierz obiekt.</div>
                    </template>
                </Dock>
            </div>

            <footer class="text-surface-300 p-3 text-center text-sm">
                &copy; {{ new Date().getFullYear() }} Warehouse Logistics - Nikodem Szwed.
            </footer>
        </div>
    </div>
    <Dialog v-model:visible="itemDialog" modal maximizable class="w-[70%]">
        <template #header>
            {{ showItem.label }}
        </template>
        <template #default>
            <div class="h-full overflow-y-auto">
                <div v-if="showItem.ETID == 1">
                    mapa
                </div>
                <div v-else-if="showItem.ETID == 2">
                    <div class="flex flex-col gap-1">
                        <div class="rounded-xl w-full flex flex-row gap-1 lg:gap-3" v-for="(field, j) in orderFields"
                            :class="{ 'bg-surface-200': j % 2 === 1, 'bg-surface-100': j % 2 === 0 }">
                            <div class="p-2 lg:p-3 min-w-40">{{ field.label }}</div>
                            <div v-if="field.key == 'State'" class="p-2 lg:p-3">
                                <Tag :severity="getSeverity(showItem.data[field.key])"
                                    :value="getMessage(showItem.data[field.key])"></Tag>
                            </div>
                            <div v-else-if="field.key == 'deadline'" class="p-2 lg:p-3">
                                {{ formatDate(showItem.data[field.key]) }}
                            </div>
                            <div v-else class="p-2 lg:p-3">{{ showItem.data[field.key] }}</div>
                        </div>
                        <div class="bg-surface-100 rounded-xl flex flex-col">
                            <div class="p-2 lg:p-3 min-w-40">Dostawy:</div>
                            <div class="mx-2 mb-2 lg:mx-3 lg:mb-3 flex flex-col gap-1">
                                <div class="p-1 pl-2 lg:pl-3 lg:p-3 bg-white rounded-xl"
                                    v-for="delivery in showItem.data.Deliveries">
                                    {{ formatDate(delivery.date, 'dd.MM.yyyy HH:mm') }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="showItem.ETID == 3">
                    <div class="flex flex-col gap-1 m-1">
                        <div class="rounded-xl flex-1 flex flex-row gap-1 lg:gap-3 p-2 lg:p-3 min-w-40"
                            v-for="(order, j) in showItem.orders" :class="{
                                'bg-surface-200': j % 2 === 1,
                                'bg-surface-100': j % 2 === 0,
                                'outline-2 outline-primary rounded-xl': order.selected
                            }" @click.stop="selectObject(order)">
                            {{ order.name }}
                        </div>
                        <div v-if="showItem.orders.length == 0">Brak zleceń na sektorze.</div>
                    </div>
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Toast from 'primevue/toast';
import { toastHandler } from '../services/toastHandler.js';
import { useToast } from 'primevue';
import Dock from '../components/Dock/Dock.vue';
import { format } from 'date-fns';
import { Tag, Dialog } from 'primevue';
import api from '../services/api.js';

const toast = useToast();
const dockVisible = ref(false);
const selectedItem = ref(null);
const showItem = ref({});
const itemDialog = ref(false);

const items = ref([]);
const orderFields = ref([
    {
        label: 'Nazwa zlecenia',
        key: 'name'
    },
    {
        label: 'Status',
        key: 'State'
    },
    {
        label: 'Termin realizacji',
        key: 'deadline'
    },
    {
        label: 'Priorytet',
        key: 'Priority'
    }
]);
const alertTypes = ref([]);
let allAlertTypes = [];


onMounted(async () => {
    try {
        let response = await api.get('/displays/remote/8c029a90-074a-4f24-a2d0-d80cad6338f5');
        let data = response.data;
        console.log("🚀 ~ onMounted ~ data:", data)
        allAlertTypes = data.AlertsTypes;
        items.value = data.DisplayElementsAssignments.map(item => {
            let element = data.MapsAndElements.find(el => el.EID == item.EID);

            if (!element) return;

            if (element.ETID == 1) {
                let sectors = data.MapsAndElements.filter(el => el.ParentEID == element.EID);
                let orders = data.MapsAndElements.filter(el => sectors.some(sector => sector.EID === el.ParentEID));
                return {
                    label: 'Mapa: ' + element.name,
                    ETID: element.ETID,
                    EID: element.EID
                }
            } else if (element.ETID == 2) {
                let moreData = data.Orders.find(el => el.EID == element.EID);
                return {
                    label: 'Zlecenie: ' + element.name,
                    ETID: element.ETID,
                    EID: element.EID,
                    data: {
                        ...element,
                        ...moreData
                    }
                }
            } else {
                let orders = data.MapsAndElements.filter(el => el.ParentEID == element.EID);
                return {
                    label: 'Sektor: ' + element.name,
                    ETID: element.ETID,
                    EID: element.EID,
                    orders
                }
            }
        })
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
    }

    console.log("🚀 ~ items:", items.value)
})

function selectObject(item) {
    if (item) item.selected = !item.selected;

    selectedItem.value = item?.selected ? item : null;
    alertTypes.value = allAlertTypes.filter(at => {
        return at.ElementsTypes.some(et => et.ETID == item?.ETID);
    });
    dockVisible.value = item?.selected;

    items.value.forEach(i => {
        if (i?.orders) {
            i.orders.forEach(order => {
                if (item !== order) order.selected = false;
            })
        }

        if (item !== i) i.selected = false;
    });
}

const showEmptyDock = () => {
    selectObject(null);
    alertTypes.value = [];
    dockVisible.value = true;
}

const showItemDialog = (item) => {
    showItem.value = item;
    itemDialog.value = true;
}

function getSeverity(state) {
    switch (state) {
        case 0:
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
            return 'Niezrealizowany';
        case 1:
            return 'Gotowy do montażu';
        case 2:
            return 'Zrealizowany';
        default:
            return 'Inny';
    }
}

function formatDate(date, fmt = 'dd.MM.yyyy') {
    return format(new Date(date), fmt);
}

</script>