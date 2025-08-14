<template>
    <div>
        <Toast />
        <Card :pt="{ body: 'p-2 lg:p-5' }">
            <template #content>
                <DataTable :items="items" :columns="columns" :advancedFiltersAvailable="true" :showInteractions="true"
                    :loading="loading" @addItem="addItem" @editItem="editItem" @deleteItem="deleteItem"
                    @showAdvancedObjectView="showAdvancedObjectView">
                    <template #body-State="{ data }">
                        <Tag :severity="getSeverity(data.State)" :value="getMessage(data.State)"></Tag>
                    </template>
                    <template #filter-State="{ filterModel }">
                        <MultiSelect v-model="filterModel.value" :options="statesSimplified"
                            placeholder="Wybierz status">
                            <template #value="slotProps">
                                <Tag v-for="state of slotProps.value" :severity="getSeverity(state)"
                                    :value="getMessage(state)" class="mr-2">
                                </Tag>
                            </template>
                            <template #option="slotProps">
                                <Tag :severity="getSeverity(slotProps.option)" :value="getMessage(slotProps.option)">
                                </Tag>
                            </template>
                        </MultiSelect>
                    </template>
                </DataTable>
            </template>
        </Card>
        <Dialog v-model:visible="addItemDialogVisible" header="Dodaj zlecenie" class="w-11/12 lg:w-1/2" modal>
            <Form :fields="addItemFields" @submit="addItemSave">
                <template #input-State="{ field, $field }">
                    <FloatLabel variant="on">
                        <Select v-model="$field.value" :id="'label' + field.name" :options="statesSimplified"
                            v-bind="$field" fluid>
                            <template #value="slotProps">
                                <Tag v-if="slotProps.value > -1" :severity="getSeverity(slotProps.value)"
                                    :value="getMessage(slotProps.value)">
                                </Tag>
                            </template>
                            <template #option="slotProps">
                                <Tag :severity="getSeverity(slotProps.option)" :value="getMessage(slotProps.option)">
                                </Tag>
                            </template>
                        </Select>
                        <label :for="'label' + field.name">{{ field.label }}</label>
                    </FloatLabel>
                </template>
                <template #input-ParentEID="{ field }">
                    <FloatLabel variant="on">
                        <Select :options="mapList" optionLabel="name" :id="'label' + field.name" v-model="chosenMap"
                            fluid :invalid="showError" />
                        <label :for="'label' + field.name">{{ field.label }}</label>
                    </FloatLabel>

                    <FormField v-slot="{ id, name, value, onInput, invalid, errors }" :name="field.name"
                        :initialValue="field.initialValue" class="flex flex-col gap-1" :resolver="field.resolver">
                        <MapInterface v-if="showMap" :data="chosenMapData" :id="id" :name="name" :value="value"
                            @update:value="val => onInput({ target: { value: val } })" ref="mapInterface" />
                        <Message v-if="invalid" v-for="err in errors" severity="error" size="small" variant="simple">
                            {{(() => { showError = true })()}}
                            {{ err.message }}
                        </Message>
                        <div v-else>
                            {{(() => { showError = false })()}}
                        </div>
                    </FormField>

                </template>
            </Form>

        </Dialog>
        <Dialog v-model:visible="editItemDialogVisible" header="Edytuj zlecenie" class="w-11/12 lg:w-1/2" modal>
            <Form :initial-values="initialValues" :fields="editItemFields" @submit="editItemSave">
                <template #input-State="{ field, $field }">
                    <FloatLabel variant="on">
                        <Select v-model="$field.value" :id="'label' + field.name" :options="statesSimplified"
                            v-bind="$field" fluid>
                            <template #value="slotProps">
                                <Tag :severity="getSeverity(slotProps.value)" :value="getMessage(slotProps.value)">
                                </Tag>
                            </template>
                            <template #option="slotProps">
                                <Tag :severity="getSeverity(slotProps.option)" :value="getMessage(slotProps.option)">
                                </Tag>
                            </template>
                        </Select>
                        <label :for="'label' + field.name">{{ field.label }}</label>
                    </FloatLabel>
                </template>
                <template #input-ParentEID="{ field }">
                    <FloatLabel variant="on">
                        <Select :options="mapList" optionLabel="name" :id="'label' + field.name" v-model="chosenMap"
                            fluid :invalid="showError" />
                        <label :for="'label' + field.name">{{ field.label }}</label>
                    </FloatLabel>

                    <FormField v-slot="{ id, name, value, onInput, invalid, errors }" :name="field.name"
                        :initialValue="field.initialValue" class="flex flex-col gap-1" :resolver="field.resolver">
                        <MapInterface v-if="showMap" :data="chosenMapData" :id="id" :name="name" :value="value"
                            @update:value="val => onInput({ target: { value: val } })" ref="mapInterface" />
                        <Message v-if="invalid" v-for="err in errors" severity="error" size="small" variant="simple">
                            {{(() => { showError = true })()}}
                            {{ err.message }}
                        </Message>
                        <div v-else>
                            {{(() => { showError = false })()}}
                        </div>
                    </FormField>

                </template>
            </Form>
        </Dialog>
        <Dialog v-model:visible="advancedObjectViewVisible" header="Podgląd zlecenia" class="w-11/12 lg:w-3/4" modal
            maximizable :pt="{ content: 'bg-emphasis rounded-b-xl pt-5' }">
            <ObjectView :item="showItem" :fieldMap="fieldMap" :complexFieldsColumns="complexFieldsColumns"></ObjectView>
            <MapInterface v-if="showMap" :data="chosenMapData" ref="mapInterface" class="mt-3 min-h-[40vh]" />
        </Dialog>
    </div>


</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useToast } from "primevue/usetoast";
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import Toast from 'primevue/toast';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import DataTable from '../components/DataTable/DataTable.vue';
import api from '../services/api';
import Form from '../components/Form/Form.vue';
import ObjectView from '../components/ObjectView/ObjectView.vue';
import { toastHandler } from '../services/toastHandler';
import { MultiSelect, Tag, Select, FloatLabel, Message } from 'primevue';
import MapInterface from '../components/Map/MapInterface.vue';
import { FormField } from '@primevue/forms';


const toast = useToast();

const items = ref([]);
const addItemDialogVisible = ref(false);
const editItemDialogVisible = ref(false);

const advancedObjectViewVisible = ref(false);
const showItem = ref({});
const fieldMap = ref({
    EID: { show: false },
    State: { label: 'Status', translateValue: (val) => { return getMessage(val) } },
    Priority: { label: 'Priorytet' },
    deadline: { date: true, format: 'dd.MM.yyyy', label: 'Termin realizacji' },
    name: { label: 'Nazwa zlecenia' },
    ParentEIDName: { label: 'Nazwa sektora na którym się znajduje' },
    ParentEID: { show: false },
    EID_MapsAndElement: { show: false }
});
const complexFieldsColumns = ref({
    EID_MapsAndElement: []
})
const mainKey = 'OID';
const mainPath = '/orders';
const statesSimplified = [0, 1, 2];

const mapInterface = ref();

const mapList = ref([]);
const chosenMap = ref();
const chosenMapData = ref({});
const showMap = ref(false);
const showError = ref(null);

const initialValues = ref({});

const addItemFields = ref([
    {
        name: 'name',
        label: 'Nazwa zlecenia',
        component: 'InputText',
        componentOptions: {
            type: 'text',
        },
        conditions: [{
            check: "required",
            message: "Nazwa zlecenia jest wymagana."
        }, {
            check: "minlength",
            value: 3,
            message: "Nazwa zlecenia musi zawierać co najmniej 3 znaki."
        }]
    },
    {
        name: 'State',
        label: 'Status zlecenia',
        component: 'custom',
        componentOptions: {},
        conditions: [{
            check: "required",
            message: "Status zlecenia jest wymagany."
        }]
    },
    {
        name: 'Priority',
        label: 'Priorytet zlecenia',
        component: 'InputNumber',
        componentOptions: {
            min: 1,
            max: 255
        },
        conditions: [{
            check: "required",
            message: "Priorytet jest wymagany."
        }, {
            check: "min",
            value: 1,
            message: "Priorytet musi wynosić co najmniej 1."
        }, {
            check: "max",
            value: 255,
            message: "Priorytet musi wynosić co najwyżej 255."
        }]
    },
    {
        name: 'deadline',
        label: 'Termin realizacji',
        component: 'DatePicker',
        componentOptions: {
            type: 'date',
            dateFormat: 'dd.mm.yy',
        },
        conditions: [{
            check: "required",
            message: "Termin realizacji jest wymagany."
        }]
    },
    {
        name: 'ParentEID',
        label: 'Mapa na której się znajduje',
        component: 'customNoFormField',
        componentOptions: {},
        conditions: [
            {
                check: "required",
                message: "Sektor zlecenia jest wymagany."
            }

        ]
    },
]);

const editItemFields = ref(addItemFields.value);


const columns = ref([
    { label: 'OID', field: 'OID', type: 'numeric', dataKey: true, show: false },
    { label: 'Nazwa zlecenia', field: 'name', type: 'text', addToGlobalFilter: true },
    { label: 'Nazwa sektora na którym się znajduje', field: 'ParentEIDName', type: 'text', addToGlobalFilter: true },
    { label: 'Priorytet', field: 'Priority', type: 'numeric' },
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
        overrideFilter: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.IN }] }
    },
    {
        label: 'Termin realizacji',
        field: 'deadline',
        type: 'date',
        dateFormat: 'dd.MM.yyyy',
        showTime: false,
        sortOptions: { order: -1 }
    },
])

const loading = ref(true);

onMounted(async () => {
    try {
        let responseItems = api.get(mainPath);
        let maps = api.get('/mapsandelements');

        mapList.value = (await maps).data;

        items.value = (await responseItems).data
            .map(item => {
                item.deadline = new Date(item.deadline);
                return item;
            });
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
    }
    loading.value = false;
})

watch(chosenMap, async () => {
    showMap.value = false;
    try {
        if (chosenMap.value) {
            let mapData = api.get('/mapsandelements/' + chosenMap.value.EID);
            chosenMapData.value = (await mapData).data;
            showMap.value = true;
        }

    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
    }
})

function addItem() {
    chosenMap.value = null;
    showMap.value = false;
    addItemDialogVisible.value = true;
}

async function addItemSave(values) {
    let payload = Object.fromEntries(
        Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value])
    );
    payload.ParentEID = payload.ParentEID.customData.EID;
    chosenMap.value = null;
    showMap.value = false;

    try {
        let response = await api.post(mainPath, payload);

        let order = response.data.newOrder;
        order.deadline = new Date(response.data.newOrder.deadline);
        order.name = response.data.newElement.name;

        let parent = await api.get('/mapsandelements/singleObject/' + response.data.newElement.ParentEID);
        order.ParentEIDName = parent.data.name;

        items.value.push(order);

        toast.add(toastHandler('success', 'Dodano zlecenie', 'Pomyślnie dodano zlecenie'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się dodać zlecenia.', error));
    }

    addItemDialogVisible.value = false;
}



async function editItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano zlecenia', 'Wybierz zlecenie które chcesz zmodyfikować'));
        return;
    }

    try {
        let response = await api.get(mainPath + '/' + item[mainKey]);
        let sector = await api.get('/mapsandelements/singleObject/' + response.data.ParentEID);

        response.data.deadline = new Date(response.data.deadline);
        let values = { ...response.data };

        initialValues.value = { ...values };
        chosenMap.value = mapList.value.find(item => item.EID === sector.data.ParentEID);

        initialValues.value.ParentEID = undefined;

        editItemDialogVisible.value = true;

        let mapSetupInterval;
        mapSetupInterval = setInterval(() => {
            if (mapInterface.value) {
                mapInterface.value.setSelect(values.ParentEID);
                clearInterval(mapSetupInterval);
            }
        }, 100)

    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych zlecenia.', error));
    }
}

async function editItemSave(values) {
    let payload = Object.fromEntries(
        Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value])
    );
    payload.ParentEIDName = payload.ParentEID.customData.name;
    payload.ParentEID = payload.ParentEID.customData.EID;
    chosenMap.value = null;
    showMap.value = false;

    try {
        await api.put(mainPath + '/' + values.originalObject[mainKey], payload);

        let index = items.value.findIndex(item => item[mainKey] === values.originalObject[mainKey]);
        if (index === -1) throw new Error("Nie znaleziono zlecenia lokalnie.");

        Object.assign(items.value[index], payload);

        toast.add(toastHandler('success', 'Zmodyfikowano zlecenie', 'Pomyślnie zmodyfikowano zlecenie'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się zmodyfikować zlecenia.', error));
    }

    editItemDialogVisible.value = false;
}

async function deleteItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano zlecenia', 'Wybierz zlecenie który chcesz usunąć'));
        return;
    }

    try {
        let index = items.value.indexOf(item);
        if (index == -1) {
            toast.add(toastHandler('warn', 'Nie wybrano zlecenia', 'Wybierz zlecenie który chcesz usunąć'));
            return;
        }

        await api.delete(mainPath + '/' + item[mainKey]);
        items.value.splice(index, 1);
        toast.add(toastHandler('success', 'Usunięto zlecenie', 'Pomyślnie usunięto zlecenie'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się usunąć zlecenia.', error));
    }
}

async function showAdvancedObjectView(data) {
    try {
        let item = api.get(mainPath + '/' + data[mainKey]);

        showItem.value = (await item).data;

        let sector = await api.get('/mapsandelements/singleObject/' + showItem.value.ParentEID);
        chosenMap.value = mapList.value.find(item => item.EID === sector.data.ParentEID);

        advancedObjectViewVisible.value = true;

        let mapSetupInterval;
        mapSetupInterval = setInterval(() => {
            if (mapInterface.value) {
                mapInterface.value.setSelect(showItem.value.ParentEID);
                clearInterval(mapSetupInterval);
            }
        }, 100)
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
    }



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

</script>