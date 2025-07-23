<template>
    <Toast></Toast>
    <div class="flex h-screen w-full overflow-hidden">
        <div class="bg-emphasis relative flex flex-1 flex-col max-w-screen overflow-y-auto">
            <div class="flex flex-row items-center justify-between w-full" v-if="validated">
                <div
                    class="bg-[var(--p-card-background)] text-lg mt-1 lg:mt-3 mx-1 lg:mx-3 p-2 lg:p-3 shadow rounded-xl">
                    Monitor: {{ displayName }}
                </div>
                <Button class="mx-1 lg:mx-3 mt-1 lg:mt-3" raised @click="showEmptyDock()">Zgłoś problem</Button>
            </div>
            <div class="mx-1 mt-1 lg:mx-3 lg:mt-3 flex flex-1 flex-col items-center" v-if="validated">
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
                                <div class="flex flex-row">
                                    <div v-if="item.data.alerts.length > 0" :class="{
                                        'text-orange-500': !item.data.newAlertPresent,
                                        'text-red-500': item.data.newAlertPresent
                                    }" class="text-md">
                                        <span class="mr-1">{{ item.data.alerts.length > 3 ? '3+' :
                                            item.data.alerts.length
                                            }}</span>
                                        <i class="pi pi-exclamation-triangle" :class="{
                                            'animate-ping': item.data.newAlertPresent
                                        }"></i>
                                    </div>
                                    <div class="w-10 flex justify-end items-center cursor-pointer"
                                        @click.stop="showItemDialog(item)">

                                        <i class="pi pi-window-maximize pr-1"></i>
                                    </div>
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
                                        <div class="rounded-xl flex-1 flex flex-row gap-1 lg:gap-3 p-2 lg:p-3 min-w-40 justify-between"
                                            v-for="(order, j) in item.orders" :class="{
                                                'bg-surface-200': j % 2 === 1,
                                                'bg-surface-100': j % 2 === 0,
                                                'outline-2 outline-primary rounded-xl': order.selected
                                            }" @click.stop="selectObject(order)">
                                            <div>{{ order.name }}</div>
                                            <div v-if="order.alerts.length > 0" :class="{
                                                'text-amber-500': !order.newAlertPresent,
                                                'text-red-500': order.newAlertPresent
                                            }">
                                                <span class="mr-1">{{ order.alerts.length > 3 ? '3+' :
                                                    order.alerts.length
                                                    }}</span>
                                                <i class="pi pi-exclamation-triangle" :class="{
                                                    'animate-ping': order.newAlertPresent
                                                }"></i>
                                            </div>
                                        </div>
                                        <div v-if="item.orders.length == 0">Brak zleceń na sektorze.</div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
                <Dock v-model:visible="dockVisible" header="Zgłoś problem">
                    <template #content>
                        <div class="w-full h-30 bg-emphasis shadow cursor-pointer rounded-xl flex items-center justify-center"
                            v-for="at in alertTypes" @click="addAlert(at)">
                            <span>{{ at.name }}</span>
                        </div>
                        <div v-if="alertTypes.length == 0">Wybierz obiekt.</div>
                    </template>
                </Dock>
            </div>
            <div v-if="!validated" class="flex-1 flex justify-center items-center">
                <Card>
                    <template #content>
                        <div class="flex flex-col gap-3 justify-center items-center">
                            <span>Oczekiwanie na zatwierdzenie monitora</span>
                            <i class="pi pi-spin pi-spinner w-fit"></i>
                        </div>

                    </template>
                </Card>

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
import { onMounted, onUnmounted, ref } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Toast from 'primevue/toast';
import { toastHandler } from '../services/toastHandler.js';
import { useToast } from 'primevue';
import Dock from '../components/Dock/Dock.vue';
import { format } from 'date-fns';
import { Tag, Dialog } from 'primevue';
import api from '../services/api.js';
import { loadDefaultTheme } from '../services/themeChanger';
import { useRouter } from 'vue-router';
import { connect } from '../services/websocket';

const toast = useToast();
const router = useRouter();

const dockVisible = ref(false);
const selectedItem = ref(null);
const showItem = ref({});
const itemDialog = ref(false);
// const displayUUID = ref();
const validated = ref(false);
const displayName = ref(null);
const socket = connect();
const displayUUID = ref(true ? '8c029a90-074a-4f24-a2d0-d80cad6338f5' : 'f3c10244-b6eb-4267-abce-6e2809446b5c');

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

function runAfter10MinOfInactivity(callback) {
    let timeoutId;
    const events = [
        'click',
        'keydown',
        'mousemove',
        'scroll',
        'touchstart',
        'wheel',
        'pointerdown'
    ];

    function resetTimer() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(callback, 2 * 60 * 1000);
    }

    events.forEach(event => {
        window.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();

    return function stop() {
        clearTimeout(timeoutId);
        events.forEach(event => {
            window.removeEventListener(event, resetTimer);
        });
    };
}


const stopInactivityWatcher = runAfter10MinOfInactivity(() => {
    selectObject(null);
    itemDialog.value = false;
});

onMounted(async () => {
    loadDefaultTheme();

    await getData();

    console.log("🚀 ~ items:", items.value)

    socket.emit('join', 'UUID-' + displayUUID.value);
    socket.on('updateDisplay', (data) => {
        console.log("🚀 ~ socket.on ~ data:", data)
        getData();
    });
    socket.on('deleteDisplay', (data) => {
        socket.emit('leave', 'UUID-' + displayUUID.value);
        localStorage.removeItem('displayUUID');
        router.push('/Login');
    });
    socket.on('updateSector', (data) => {
        console.log("🚀 ~ socket.on ~ updateSector data:", data)
    });
    socket.on('updateSectorNewOrder', (data) => {
        data.newElement.alerts = [];
        data.newElement.newAlertPresent = false;
        items.value.find(item => item.EID == data.newElement.ParentEID).orders.push(data.newElement);

    });
    socket.on('updateSectorUpdateOrder', (data) => {
        Object.assign(items.value.find(item => item.EID == data.orderElement.ParentEID).orders.find(el => el.EID == data.orderElement.EID), data.orderElement);
    });
    socket.on('updateSectorDeleteOrder', (data) => {
        const parentItem = items.value.find(item => item.EID === data.orderElement.ParentEID);
        if (parentItem) {
            const index = parentItem.orders.findIndex(order => order.EID === data.orderElement.EID);
            if (index !== -1) {
                parentItem.orders.splice(index, 1);
            }
        }
    });
    socket.on('newAlert', (data) => {
        let item = items.value.find(item => item.EID == data.EID);
        if (item) {
            item.data.alerts.push(data);
            item.data.newAlertPresent = true;
        } else {
            items.value.forEach(item => {
                if (item?.orders.length > 0) {
                    let order = item.orders.find(order => order.EID == data.EID);
                    if (!order) return;
                    order.alerts.push(data);
                    order.newAlertPresent = true;
                }
            })

        }
    });
    socket.on('updateAlert', (data) => {
        let item = items.value.find(item => item.EID == data.EID);
        if (item) {

            if (data.State == 2) item.data.alerts = item.data.alerts.filter(el => el.AID != data.AID);
            else item.data.alerts.find(el => el.AID == data.AID).State = data.State;

            if (item.data.alerts.length == 0) item.data.newAlertPresent = false;
            else item.data.alerts.find(el => el.State == 0) ? item.data.newAlertPresent = true : item.data.newAlertPresent = false;
        } else {
            items.value.forEach(item => {
                if (item?.orders.length > 0) {
                    let order = item.orders.find(order => order.EID == data.EID);

                    if (!order) return;

                    if (data.State == 2) order.alerts = order.alerts.filter(el => el.AID != data.AID);
                    else order.alerts.find(el => el.AID == data.AID).State = data.State;

                    if (order.alerts.length == 0) order.newAlertPresent = false;
                    else order.alerts.find(el => el.State == 0) ? order.newAlertPresent = true : order.newAlertPresent = false;
                }
            })

        }
    });
    socket.on('deleteAlert', (data) => {
        let item = items.value.find(item => item.EID == data.EID);
        if (item) {
            item.data.alerts = item.data.alerts.filter(el => el.AID != data.AID);
            if (item.data.alerts.length == 0) item.data.newAlertPresent = false;
            else item.data.alerts.find(el => el.State == 0) ? item.data.newAlertPresent = true : item.data.newAlertPresent = false;

        } else {
            items.value.forEach(item => {
                if (item?.orders.length > 0) {
                    let order = item.orders.find(order => order.EID == data.EID);

                    if (!order) return;

                    order.alerts = order.alerts.filter(el => el.AID != data.AID);
                    if (order.alerts.length == 0) order.newAlertPresent = false;
                    else order.alerts.find(el => el.State == 0) ? order.newAlertPresent = true : order.newAlertPresent = false;
                }
            })

        }
    });
})

onUnmounted(() => {
    socket.emit('leave', 'UUID-' + displayUUID.value);
    socket.disconnect();
    stopInactivityWatcher();
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

async function addAlert(alertType) {
    try {
        let response = await api.post('/displays/remote/createAlert/' + displayUUID.value, {
            EID: selectedItem.value.EID,
            AAID: alertType.AAID
        });

        selectObject(null);
        toast.add(toastHandler('success', 'Sukces', 'Pomyślnie dodano alert'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się dodać alertu.', error));
    }
}

async function getData() {
    // displayUUID.value = localStorage.getItem('displayUUID');

    try {
        let response = await api.get('/displays/remote/' + displayUUID.value);
        validated.value = true
        let data = response.data;
        displayName.value = data.name;

        allAlertTypes = data.AlertsTypes;
        items.value = data.DisplayElementsAssignments.map(item => {
            let element = data.MapsAndElements.find(el => el.EID == item.EID);

            if (!element) return;

            if (element.ETID == 1) {
                let sectors = data.MapsAndElements.filter(el => el.ParentEID == element.EID);
                let orders = data.MapsAndElements.filter(el => sectors.some(sector => sector.EID === el.ParentEID));
                let allEIDs = [...sectors.map(el => el.EID), ...orders.map(el => el.EID), element.EID];
                sectors.forEach(sector => {
                    socket.emit('join', 'sector-' + element.EID);
                });
                return {
                    label: 'Mapa: ' + element.name,
                    ETID: element.ETID,
                    EID: element.EID,
                    data: {
                        ...element,
                        newAlertPresent: element.alerts.find(el => el.State == 0) ? true : false
                    }
                }
            } else if (element.ETID == 2) {
                let moreData = data.Orders.find(el => el.EID == element.EID);
                socket.emit('join', 'order-' + element.EID);
                return {
                    label: 'Zlecenie: ' + element.name,
                    ETID: element.ETID,
                    EID: element.EID,
                    data: {
                        ...element,
                        ...moreData,
                        newAlertPresent: element.alerts.find(el => el.State == 0) ? true : false
                    }
                }
            } else {
                let orders = data.MapsAndElements.filter(el => el.ParentEID == element.EID);
                orders = orders.map(order => {
                    let found = order.alerts.find(el => el.State == 0)
                    order.newAlertPresent = found ? true : false;
                    return order;
                });
                socket.emit('join', 'sector-' + element.EID);
                return {
                    label: 'Sektor: ' + element.name,
                    ETID: element.ETID,
                    EID: element.EID,
                    data: {
                        ...element,
                        newAlertPresent: element.alerts.find(el => el.State == 0) ? true : false
                    },
                    orders
                }
            }
        })
    } catch (error) {
        if (error.response.data.error == 'Display not found') {
            localStorage.removeItem('displayUUID');
            router.push('/Login');
        }
        else if (error.response.data.error != "Display not validated") {
            toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
        }
    }
}

</script>