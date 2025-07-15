<template>
    <div>
        <Toast />
        <Card :pt="{ body: 'p-2 lg:p-5' }">
            <template #content>
                <DataTable :items="items" :columns="columns" :advancedFiltersAvailable="true" :showInteractions="true"
                    :loading="loading" @addItem="addItem" @editItem="editItem" @deleteItem="deleteItem">
                </DataTable>
            </template>
        </Card>
        <Dialog v-model:visible="addItemDialogVisible" header="Dodaj grupę" class="w-11/12 lg:w-1/2" modal>
            <Form :fields="addItemFields" @submit="addItemSave" />
        </Dialog>
        <Dialog v-model:visible="editItemDialogVisible" header="Edytuj grupę" class="w-11/12 lg:w-1/2" modal>
            <Form :initial-values="initialValues" :fields="editItemFields" @submit="editItemSave" />
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

const toast = useToast();

const items = ref([]);
const addItemDialogVisible = ref(false);
const editItemDialogVisible = ref(false);

const initialValues = ref({
    userUIDs: [["1", "2"], []],
});

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
        component: 'PickList',
        initialValue: [["1", "2"], []],
        componentOptions: {
            pt: {
                sourceControls: {
                    class: "hidden"
                },
                targetControls: {
                    class: "hidden"
                }
            }
        },
        conditions: [{
            check: "required",
            message: "Lista użytkowników jest wymagana."
        }]
    },
    {
        name: 'mapEIDs',
        label: 'Lista map',
        component: 'PickList',
        componentOptions: {},
        conditions: [{
            check: "required",
            message: "Lista map jest wymagana."
        }]
    }
]);

const editItemFields = ref(addItemFields.value);


const columns = ref([
    { label: 'GID', field: 'GID', type: 'numeric', dataKey: true, show: false },
    { label: 'Nazwa', field: 'name', type: 'text', addToGlobalFilter: true },
])

const loading = ref(true);

onMounted(async () => {
    try {
        let response = await api.get('/groups');
        items.value = response.data;
    } catch (error) {
        console.log("🚀 ~ onMounted ~ error:", error);
    }
    loading.value = false;
})

function addItem() {
    addItemDialogVisible.value = true;
}

async function addItemSave(values) {
    console.log("🚀 ~ addItemSave ~ values:", values)
    console.log("🚀 ~ addItemSave ~ addItemFields:", addItemFields)
    // let payload = Object.fromEntries(
    //     Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value])
    // );
    // payload.passwd = payload.password;
    // delete payload.passwordRepeat;
    // delete payload.password;

    // try {
    //     let response = await api.post('/groups', payload);

    //     delete response.data.passwd;

    //     items.value.push(response.data);

    //     toast.add({ severity: 'success', summary: 'Dodano grupę', detail: 'Pomyślnie dodano grupę', life: 2000 });
    // } catch (error) {
    //     toast.add({ severity: 'error', summary: 'Wystąpił problem', detail: 'Nie udało się dodać grupy. Powód: ' + error.response.data.error, life: 6000 });
    // }

    addItemDialogVisible.value = false;

}



function editItem(item) {
    if (!item) {
        toast.add({ severity: 'warn', summary: 'Nie wybrano grupy', detail: 'Wybierz grupę którą chcesz zmodyfikować', life: 3000 });
        return;
    }

    initialValues.value = item;
    editItemDialogVisible.value = true;

}

async function editItemSave(values) {
    let payload = Object.fromEntries(
        Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value])
    );
    delete payload.passwordRepeat;

    try {
        await api.put('/groups/' + values.originalObject.UID, payload);

        delete payload.password;

        Object.assign(items.value[items.value.indexOf(values.originalObject)], payload);
        toast.add({ severity: 'success', summary: 'Zmodyfikowano grupę', detail: 'Pomyślnie zmodyfikowano grupę', life: 2000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Wystąpił problem', detail: 'Nie udało się zmodyfikować grupy. Powód: ' + error.response.data.error, life: 6000 });
    }

    editItemDialogVisible.value = false;
}

async function deleteItem(item) {
    if (!item) {
        toast.add({ severity: 'warn', summary: 'Nie wybrano grupy', detail: 'Wybierz grupę którą chcesz usunąć', life: 3000 });
        return;
    }

    try {
        await api.delete('/groups/' + item.GID);
        items.value.splice(items.value.indexOf(item), 1);
        toast.add({ severity: 'success', summary: 'Usunięto grupę', detail: 'Pomyślnie usunięto grupę', life: 2000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Wystąpił problem', detail: 'Nie udało się usunąć grupy. Powód: ' + error.response.data.error, life: 6000 });
    }
}

</script>