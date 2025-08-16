<template>
    <div>
        <Card :pt="{ body: 'p-2 lg:p-5' }">
            <template #content>
                <DataTable :items="items" :columns="columns" :advancedFiltersAvailable="true" :showInteractions="true"
                    :loading="loading" @addItem="addItem" @editItem="editItem" @deleteItem="deleteItem"
                    @showAdvancedObjectView="showAdvancedObjectView">
                    <template #body-allowMapEdit="{ data }">
                        {{ data.allowMapEdit ? 'Tak' : 'Nie' }}
                    </template>
                    <template #filter-allowMapEdit="{ filterModel }">
                        <MultiSelect v-model="filterModel.value" :options="[true, false]" placeholder="Wybierz">
                            <template #value="slotProps">
                                <span v-for="(val, idx) in slotProps.value" :key="idx">
                                    {{ val ? 'Tak' : 'Nie' }}<span v-if="idx < slotProps.value.length - 1">, </span>
                                </span>
                            </template>
                            <template #option="slotProps">
                                {{ slotProps.option ? 'Tak' : 'Nie' }}
                            </template>
                        </MultiSelect>
                    </template>
                </DataTable>
            </template>
        </Card>
        <Dialog v-model:visible="addItemDialogVisible" header="Dodaj grupę" class="w-11/12 lg:w-1/2" modal>
            <Form :fields="addItemFields" @submit="addItemSave">
                <template #input-allowMapEdit="{ field, $field }">
                    <div class="flex flex-row gap-3">
                        <label>{{ field.label }}</label>
                        <ToggleSwitch v-model="$field.value"></ToggleSwitch>
                    </div>
                </template>
            </Form>
        </Dialog>
        <Dialog v-model:visible="editItemDialogVisible" header="Edytuj grupę" class="w-11/12 lg:w-1/2" modal>
            <Form :initial-values="initialValues" :fields="editItemFields" @submit="editItemSave">
                <template #input-allowMapEdit="{ field, $field }">
                    <div class="flex flex-row gap-3">
                        <label>{{ field.label }}</label>
                        <ToggleSwitch v-model="$field.value"></ToggleSwitch>
                    </div>
                </template>
            </Form>
        </Dialog>
        <Dialog v-model:visible="advancedObjectViewVisible" header="Podgląd grupy" class="w-11/12 lg:w-3/4" modal
            maximizable :pt="{ content: 'bg-emphasis rounded-b-xl pt-5' }">
            <ObjectView :item="showItem" :fieldMap="fieldMap" :complexFieldsColumns="complexFieldsColumns"></ObjectView>
        </Dialog>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { useToast } from "primevue/usetoast";
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import { ToggleSwitch, MultiSelect } from 'primevue';
import DataTable from '../components/DataTable/DataTable.vue';
import api from '../services/api';
import Form from '../components/Form/Form.vue';
import ObjectView from '../components/ObjectView/ObjectView.vue';
import { toastHandler } from '../services/toastHandler';

const toast = useToast();

const items = ref([]);
const addItemDialogVisible = ref(false);
const editItemDialogVisible = ref(false);

const advancedObjectViewVisible = ref(false);
const showItem = ref({});
const fieldMap = ref({
    name: { label: 'Nazwa grupy' },
    allowMapEdit: {
        label: 'Zezwól na edycję przypisanych map',
        boolean: true
    },
    Users: { label: 'Członkowie grupy' },
    MapsAndElements: { label: 'Dostęp do map' }
});
const complexFieldsColumns = ref({
    Users: [
        { label: 'UID', field: 'UID', dataKay: true, addToGlobalFilter: true },
        { label: 'Login', field: 'login', addToGlobalFilter: true },
        { label: 'Email', field: 'email', addToGlobalFilter: true }
    ],
    MapsAndElements: [
        { label: 'EID', field: 'EID', dataKay: true, addToGlobalFilter: true },
        { label: 'Nazwa mapy', field: 'name', addToGlobalFilter: true }
    ]
})
const mainKey = 'GID';
const mainPath = '/groups';

const initialValues = ref({});

const addItemFields = ref([
    {
        name: 'name',
        label: 'Nazwa grupy',
        component: 'InputText',
        componentOptions: {
            type: 'text',
        },
        conditions: [{
            check: "required",
            message: "Nazwa grupy jest wymagana."
        }, {
            check: "minlength",
            value: 3,
            message: "Nazwa grupy musi zawierać co najmniej 3 znaki."
        }, {
            check: "maxlength",
            value: 25,
            message: "Nazwa grupy musi zawierać co najwyżej 25 znaków."
        }]
    },
    {
        name: 'userUIDs',
        label: 'Lista użytkowników',
        component: 'MultiSelect',
        componentOptions: {
            options: [],
            optionLabel: "login",
            display: "chip",
            filter: true
        },
        conditions: [{
            check: "required",
            message: "Lista użytkowników jest wymagana."
        }]
    },
    {
        name: 'mapEIDs',
        label: 'Lista map',
        component: 'MultiSelect',
        componentOptions: {
            options: [],
            optionLabel: "name",
            display: "chip",
            filter: true
        }, conditions: [{
            check: "required",
            message: "Lista map jest wymagana."
        }]
    },
    {
        name: 'allowMapEdit',
        label: 'Zezwól na edycję przydzielonych map',
        component: 'custom',
        componentOptions: {},
        conditions: []
    }
]);

const editItemFields = ref(addItemFields.value);

const columns = ref([
    { label: 'GID', field: 'GID', type: 'numeric', dataKey: true, show: false },
    { label: 'Nazwa', field: 'name', type: 'text', addToGlobalFilter: true },
    {
        label: 'Zezwól na edycję przypisanych map', field: 'allowMapEdit', type: 'any',
        overrideBodyTemplate: true,
        overrideFilterTemplate: true,
        colProps: {
            showFilterMatchModes: false,
            showFilterOperator: false,
            showAddButton: false,
        },
        overrideFilter: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.IN }] }
    },
])

const loading = ref(true);

onMounted(async () => {
    try {
        let users = api.get('/users');
        let maps = api.get('/mapsandelements');
        let groups = api.get(mainPath);

        addItemFields.value.find(item => item.name === 'userUIDs').componentOptions.options = (await users).data.map(item => {
            delete item.PersonalSettings_json;
            return item;
        });
        addItemFields.value.find(item => item.name === 'mapEIDs').componentOptions.options = (await maps).data.map(item => {
            delete item.ETID;
            delete item.DimensionsAndStructure_json;
            delete item.ParentEID
            return item;
        });

        items.value = (await groups).data;
        console.log("🚀 ~ items.value:", items.value)
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
    }
    loading.value = false;
})

function addItem() {
    addItemDialogVisible.value = true;
}

async function addItemSave(values) {
    let payload = Object.fromEntries(
        Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value])
    );
    payload.userUIDs = payload.userUIDs.map(item => item.UID);
    payload.mapEIDs = payload.mapEIDs.map(item => item.EID);

    try {
        let response = await api.post(mainPath, payload);

        items.value.push(response.data);

        toast.add(toastHandler('success', 'Dodano grupę', 'Pomyślnie dodano grupę'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się dodać grupy', error));
    }

    addItemDialogVisible.value = false;
}

async function editItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano grupy', 'Wybierz grupę którą chcesz zmodyfikować'));
        return;
    }

    initialValues.value = {};

    try {
        let response = await api.get(mainPath + '/' + item[mainKey]);

        let userUIDs = response.data.Users;
        delete response.data.Users;
        let mapEIDs = response.data.MapsAndElements;
        delete response.data.MapsAndElements;
        let values = { ...response.data, userUIDs, mapEIDs };

        if (item[mainKey] == 1) editItemFields.value = addItemFields.value.filter(item => item.name !== 'mapEIDs');
        else editItemFields.value = addItemFields.value;

        initialValues.value = values;
        editItemDialogVisible.value = true;
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych grupy', error));
    }
}

async function editItemSave(values) {
    let payload = Object.fromEntries(
        Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value])
    );
    payload.userUIDs = payload.userUIDs.map(item => item.UID);
    payload.mapEIDs = payload.mapEIDs.map(item => item.EID);
    console.log("🚀 ~ editItemSave ~ payload:", payload)

    try {
        await api.put(mainPath + '/' + values.originalObject[mainKey], payload);

        delete payload.userUIDs;
        delete payload.mapEIDs;

        let index = items.value.findIndex(item => item[mainKey] === values.originalObject[mainKey]);
        if (index === -1) throw new Error("Nie znaleziono użytkownika lokalnie.");

        Object.assign(items.value[index], payload);

        toast.add(toastHandler('success', 'Zmodyfikowano grupę', 'Pomyślnie zmodyfikowano grupę'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się zmodyfikować grupy.', error));
    }

    editItemDialogVisible.value = false;
}

async function deleteItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano grupy', 'Wybierz grupę którą chcesz usunąć'));
        return;
    }

    try {
        await api.delete(mainPath + '/' + item[mainKey]);

        let index = items.value.indexOf(item);
        items.value.splice(index, 1);
        toast.add(toastHandler('success', 'Usunięto grupę', 'Pomyślnie usunięto grupę'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się usunąć grupy.', error));
    }
}

async function showAdvancedObjectView(data) {
    try {
        let group = api.get(mainPath + '/' + data[mainKey]);

        showItem.value = (await group).data;
        advancedObjectViewVisible.value = true;
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
    }
}

</script>