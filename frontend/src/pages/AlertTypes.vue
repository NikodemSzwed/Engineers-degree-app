<template>
    <div>
        <Toast />
        <Card :pt="{ body: 'p-2 lg:p-5' }">
            <template #content>
                <DataTable :items="items" :columns="columns" :advancedFiltersAvailable="true" :showInteractions="true"
                    :loading="loading" @addItem="addItem" @editItem="editItem" @deleteItem="deleteItem"
                    @showAdvancedObjectView="showAdvancedObjectView">
                </DataTable>
            </template>
        </Card>
        <Dialog v-model:visible="addItemDialogVisible" header="Dodaj typ alertu" class="w-11/12 lg:w-1/2" modal>
            <Form :fields="addItemFields" @submit="addItemSave" />
        </Dialog>
        <Dialog v-model:visible="editItemDialogVisible" header="Edytuj typ alertu" class="w-11/12 lg:w-1/2" modal>
            <Form :initial-values="initialValues" :fields="editItemFields" @submit="editItemSave" />
        </Dialog>
        <Dialog v-model:visible="advancedObjectViewVisible" header="Podgląd typu alertu" class="w-11/12 lg:w-3/4" modal
            maximizable :pt="{ content: 'bg-emphasis rounded-b-xl pt-5' }">
            <ObjectView :item="showItem" :fieldMap="fieldMap" :complexFieldsColumns="complexFieldsColumns"></ObjectView>
        </Dialog>
    </div>


</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useToast } from "primevue/usetoast";
import Toast from 'primevue/toast';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
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
    name: { label: 'Nazwa typu' },
    ElementsTypes: { label: 'Rodzaje elementów do których się odnosi' },
});
const complexFieldsColumns = ref({
    ElementsTypes: [
        { label: 'ETID', field: 'ETID', dataKay: true, addToGlobalFilter: true },
        { label: 'Nazwa elementu', field: 'name', addToGlobalFilter: true },
    ]
})
const mainKey = 'AAID';
const mainPath = '/alertstypes';

const initialValues = ref({});

const addItemFields = ref([
    {
        name: 'name',
        label: 'Nazwa typu alertu',
        component: 'InputText',
        componentOptions: {
            type: 'text',
        },
        conditions: [{
            check: "required",
            message: "Nazwa typu alertu jest wymagana."
        }, {
            check: "minlength",
            value: 3,
            message: "Nazwa typu alertu musi zawierać co najmniej 3 znaki."
        }, {
            check: "maxlength",
            value: 30,
            message: "Nazwa typu alertu musi zawierać co najwyżej 25 znaków."
        }]
    },
    {
        name: 'ETIDs',
        label: 'Lista przypisanych rodzajów elementów',
        component: 'MultiSelect',
        componentOptions: {
            options: [],
            optionLabel: "name",
            display: "chip",
            filter: true
        },
        conditions: [{
            check: "required",
            message: "Lista elementów jest wymagana."
        }]
    }
]);

const editItemFields = ref(addItemFields.value);


const columns = ref([
    { label: 'AAID', field: 'AAID', type: 'numeric', dataKey: true, show: false },
    { label: 'Nazwa', field: 'name', type: 'text', addToGlobalFilter: true },
])

const loading = ref(true);

onMounted(async () => {
    try {
        let responseItems = api.get(mainPath);
        let elementTypes = api.get('/elementstypes');

        addItemFields.value.find(item => item.name === 'ETIDs').componentOptions.options = (await elementTypes).data;

        items.value = (await responseItems).data;
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
    payload.ETIDs = payload.ETIDs.map(item => item.ETID);

    try {
        let response = await api.post(mainPath, payload);

        delete response.data.ETIDs;

        items.value.push(response.data);

        toast.add(toastHandler('success', 'Dodano typ alertu', 'Pomyślnie dodano typ alertu'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się dodać typu alertu.', error));
    }

    addItemDialogVisible.value = false;
}



async function editItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano typu alertu', 'Wybierz typ alertu który chcesz zmodyfikować'));
        return;
    }

    try {
        let response = await api.get(mainPath + '/' + item[mainKey]);

        let ETIDs = response.data.ElementsTypes;
        delete response.data.ElementsTypes;
        let values = { ...response.data, ETIDs };

        initialValues.value = values;

    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych typu alertu.', error));
    }

    editItemDialogVisible.value = true;

}

async function editItemSave(values) {
    let payload = Object.fromEntries(
        Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value])
    );
    payload.ETIDs = payload.ETIDs.map(item => item.ETID);

    try {
        await api.put(mainPath + '/' + values.originalObject[mainKey], payload);

        delete payload.ETIDs;

        let index = items.value.findIndex(item => item[mainKey] === values.originalObject[mainKey]);
        if (index === -1) throw new Error("Nie znaleziono typu alertu lokalnie.");

        Object.assign(items.value[index], payload);

        toast.add(toastHandler('success', 'Zmodyfikowano typ alertu', 'Pomyślnie zmodyfikowano typ alertu'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się zmodyfikować typu alertu.', error));
    }

    editItemDialogVisible.value = false;
}

async function deleteItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano typu alertu', 'Wybierz typ alertu który chcesz usunąć'));
        return;
    }

    try {
        let index = items.value.indexOf(item);
        if (index == -1) {
            toast.add(toastHandler('warn', 'Nie wybrano typu alertu', 'Wybierz typ alertu który chcesz usunąć'));
            return;
        }

        await api.delete(mainPath + '/' + item[mainKey]);
        items.value.splice(index, 1);
        toast.add(toastHandler('success', 'Usunięto typ alertu', 'Pomyślnie usunięto typ alertu'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się usunąć typu alertu.', error));
    }
}

async function showAdvancedObjectView(data) {
    try {
        let item = api.get(mainPath + '/' + data[mainKey]);

        showItem.value = (await item).data;
        advancedObjectViewVisible.value = true;
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
    }


}

</script>