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
        <Dialog v-model:visible="addItemDialogVisible" header="Dodaj mapę" class="w-11/12 lg:w-1/2" modal>
            <Form :fields="addItemFields" @submit="addItemSave" />
        </Dialog>
        <Dialog v-model:visible="editItemDialogVisible" header="Edytuj mapę" class="w-11/12 lg:w-3/4" modal maximizable
            :pt="{ content: 'bg-emphasis rounded-b-xl pt-5' }">
            <!-- <Form :initial-values="initialValues" :fields="editItemFields" @submit="editItemSave" /> -->
            <div class="w-full h-full flex  min-h-[75vh]">
                <MapInterface :editAvailable="true"></MapInterface>
            </div>

        </Dialog>
        <Dialog v-model:visible="advancedObjectViewVisible" header="Podgląd mapy" class="w-11/12 lg:w-3/4" modal
            maximizable :pt="{ content: 'bg-emphasis rounded-b-xl pt-5' }">
            <div class="w-full h-full flex min-h-[75vh]">
                <MapInterface></MapInterface>
            </div>

            <!-- <ObjectView :item="showItem" :fieldMap="fieldMap" :complexFieldsColumns="complexFieldsColumns"></ObjectView> -->
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
import MapInterface from '../components/Map/MapInterface.vue';

const toast = useToast();

const items = ref([]);
const addItemDialogVisible = ref(false);
const editItemDialogVisible = ref(false);

const advancedObjectViewVisible = ref(false);
const showItem = ref({});
const fieldMap = ref({
    name: { label: 'Nazwa mapy' },
    // Users: { label: 'Członkowie grupy' },
    // MapsAndElements: { label: 'Dostęp do map' }
});
const complexFieldsColumns = ref({
    // Users: [
    //     { label: 'UID', field: 'UID', dataKay: true, addToGlobalFilter: true },
    //     { label: 'Login', field: 'login', addToGlobalFilter: true },
    //     { label: 'Email', field: 'email', addToGlobalFilter: true }
    // ],
    // MapsAndElements: [
    //     { label: 'EID', field: 'EID', dataKay: true, addToGlobalFilter: true },
    //     { label: 'Nazwa mapy', field: 'name', addToGlobalFilter: true }
    // ]
})
const mainKey = 'EID';
const mainPath = '/mapsandelements';

const initialValues = ref({});

const addItemFields = ref([
    {
        name: 'name',
        label: 'Nazwa mapy',
        component: 'InputText',
        componentOptions: {
            type: 'text',
        },
        conditions: [{
            check: "required",
            message: "Nazwa mapy jest wymagana."
        }, {
            check: "minlength",
            value: 3,
            message: "Nazwa mapy musi zawierać co najmniej 3 znaki."
        }, {
            check: "maxlength",
            value: 25,
            message: "Nazwa mapy musi zawierać co najwyżej 25 znaków."
        }]
    }
]);

const editItemFields = ref(addItemFields.value);


const columns = ref([
    { label: 'EID', field: 'EID', type: 'numeric', dataKey: true, show: false },
    { label: 'Nazwa', field: 'name', type: 'text', addToGlobalFilter: true },
])

const loading = ref(true);

onMounted(async () => {
    try {
        let groups = api.get(mainPath);

        items.value = (await groups).data;
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.'));
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
    payload.ETID = 1;

    try {
        let response = await api.post(mainPath, payload);

        items.value.push(response.data);

        toast.add(toastHandler('success', 'Dodano mapę', 'Pomyślnie dodano mapę'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się dodać mapy', error));
    }

    addItemDialogVisible.value = false;
}

async function editItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano mapy', 'Wybierz mapę którą chcesz zmodyfikować'));
        return;
    }

    try {
        let response = await api.get(mainPath + '/' + item[mainKey]);

        let values = { ...response.data };

        initialValues.value = values;

    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych mapy', error));
    }

    editItemDialogVisible.value = true;

}

async function editItemSave(values) {
    let payload = Object.fromEntries(
        Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value])
    );
    payload.userUIDs = payload.userUIDs.map(item => item.UID);
    payload.mapEIDs = payload.mapEIDs.map(item => item.EID);

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
        toast.add(toastHandler('warn', 'Nie wybrano mapy', 'Wybierz mapę którą chcesz usunąć'));
        return;
    }

    try {
        let index = items.value.indexOf(item);
        if (index == -1) {
            toast.add(toastHandler('warn', 'Nie wybrano mapy', 'Wybierz mapę którą chcesz usunąć'));
            return;
        }

        await api.delete(mainPath + '/' + item[mainKey]);
        items.value.splice(index, 1);
        toast.add(toastHandler('success', 'Usunięto mapę', 'Pomyślnie usunięto mapę'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się usunąć mapy.', error));
    }
}

async function showAdvancedObjectView(data) {
    try {
        let element = api.get(mainPath + '/' + data[mainKey]);

        showItem.value = (await element).data;
        advancedObjectViewVisible.value = true;
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
    }


}

</script>
