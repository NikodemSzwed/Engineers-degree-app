<template>
    <div>
        <Card :pt="{ body: 'p-2 lg:p-5' }">
            <template #content>
                <DataTable :items="items" :columns="columns" :advancedInteractionsAvailable="true"
                    :showInteractions="true" :loading="loading" @addItem="addItem" @editItem="editItem"
                    @deleteItem="deleteItem" @showAdvancedObjectView="showAdvancedObjectView">
                </DataTable>
            </template>
        </Card>
        <Dialog v-model:visible="addItemDialogVisible" header="Dodaj użytkownika" class="w-11/12 lg:w-1/3" modal>
            <Form :fields="addItemFields" @submit="addItemSave" />
        </Dialog>
        <Dialog v-model:visible="editItemDialogVisible" header="Edytuj użytkownika" class="w-11/12 lg:w-1/3" modal>
            <Form :initial-values="initialValues" :fields="editItemFields" @submit="editItemSave" />
        </Dialog>
        <Dialog v-model:visible="advancedObjectViewVisible" header="Podgląd użytkownika" class="w-11/12 lg:w-3/4" modal
            maximizable :pt="{ content: 'bg-emphasis rounded-b-xl pt-5' }">
            <ObjectView :item="showItem" :fieldMap="fieldMap" :complexFieldsColumns="complexFieldsColumns"></ObjectView>
        </Dialog>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useToast } from "primevue/usetoast";
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
    email: { label: 'Email' },
    login: { label: 'Login' },
    layout: { show: false },
    primaryColor: { label: 'Kolor przewodni' },
    darkMode: { label: 'Tryb ciemny' },
    PersonalSettings_json: { label: 'Ustawienia personalne' },
    Groups: { label: 'Należy do grup' }
});
const complexFieldsColumns = ref({
    Groups: [
        { label: 'GID', field: 'GID', dataKay: true, addToGlobalFilter: true },
        { label: 'Nazwa grupy', field: 'name', addToGlobalFilter: true }
    ]
})
const mainKey = 'UID';
const mainPath = '/users';

const initialValues = ref({});

const addItemFields = ref([
    {
        name: 'login',
        label: 'Login',
        component: 'InputText',
        componentOptions: {
            type: 'text',
        },
        conditions: [{
            check: "required",
            message: "Login jest wymagany."
        }, {
            check: "minlength",
            value: 3,
            message: "Login musi zawierać co najmniej 3 znaki."
        }, {
            check: "maxlength",
            value: 25,
            message: "Login musi zawierać co najwyżej 25 znaków."
        },
        {
            check: "regex",
            value: "^[a-zA-Z0-9]+$",
            message: "Login może się składać tylko z liter i cyfr."
        }]
    },
    {
        name: 'email',
        label: 'Email',
        component: 'InputText',
        componentOptions: {
            type: 'text',
        },
        conditions: [{
            check: "regex",
            value: "^\\w+([\\-\\.]\\w+)*@([\\w\\-]+\\.)+[\\w\\-]{2,4}$",
            message: "Email nie jest prawidłowy."
        }]
    },
    {
        name: 'password',
        label: 'Hasło',
        component: 'Password',
        componentOptions: {
            type: 'password',
            toggleMask: true,
        },
        conditions: [{
            check: "required",
            message: "Hasło jest wymagane."
        }]
    },
    {
        name: 'passwordRepeat',
        label: 'Powtórz hasło',
        component: 'Password',
        componentOptions: {
            type: 'password',
            toggleMask: true,
            feedback: false
        },
        conditions: [{
            check: "custom",
            message: "Hasła nie są identyczne.",
            function: (values) => values.password !== values.passwordRepeat
        }]
    },
]);

const editItemFields = ref([
    {
        name: 'login',
        label: 'Login',
        component: 'InputText',
        componentOptions: {
            type: 'text',
        },
        conditions: [{
            check: "required",
            message: "Login jest wymagany."
        }, {
            check: "minlength",
            value: 3,
            message: "Login musi zawierać co najmniej 3 znaki."
        }, {
            check: "maxlength",
            value: 25,
            message: "Login musi zawierać co najwyżej 25 znaków."
        },
        {
            check: "regex",
            value: "^[a-zA-Z0-9]+$",
            message: "Login może się składać tylko z liter i cyfr."
        }]
    },
    {
        name: 'email',
        label: 'Email',
        component: 'InputText',
        componentOptions: {
            type: 'text',
        },
        conditions: [{
            check: "regex",
            value: "^\\w+([\\-\\.]\\w+)*@([\\w\\-]+\\.)+[\\w\\-]{2,4}$",
            message: "Email nie jest prawidłowy."
        }]
    },
    {
        name: 'password',
        label: 'Nowe Hasło (opcjonalne)',
        component: 'Password',
        componentOptions: {
            type: 'password',
            toggleMask: true,
        },
        optional: true,
    },
    {
        name: 'passwordRepeat',
        label: 'Powtórz nowe hasło (opcjonalne)',
        component: 'Password',
        componentOptions: {
            type: 'password',
            toggleMask: true,
            feedback: false
        },
        optional: true,
        conditions: [{
            check: "custom",
            message: "Hasła nie są identyczne.",
            function: (values) => {
                return values.password !== values.passwordRepeat
            }
        }]
    }
]);


const columns = ref([
    { label: 'UID', field: 'UID', type: 'numeric', dataKey: true, show: false },
    { label: 'Login', field: 'login', type: 'text', addToGlobalFilter: true },
    { label: 'Email', field: 'email', type: 'text', addToGlobalFilter: true },
    { label: 'Ustawienia personalne', field: 'personallSettings', type: 'text', show: false },
])

const loading = ref(true);

onMounted(async () => {
    try {
        let response = await api.get(mainPath);
        items.value = response.data;
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
    payload.passwd = payload.password;
    delete payload.passwordRepeat;
    delete payload.password;

    try {
        let response = await api.post(mainPath, payload);

        delete response.data.passwd;

        items.value.push(response.data);

        toast.add(toastHandler('success', 'Dodano użytkownika', 'Pomyślnie dodano użytkownika'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się dodać użytkownika', error));
    }

    addItemDialogVisible.value = false;

}


function editItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano użytkownika', 'Wybierz użytkownika którego chcesz zmodyfikować'));
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
        await api.put(mainPath + '/' + values.originalObject[mainKey], payload);

        delete payload.password;

        let index = items.value.findIndex(item => item[mainKey] === values.originalObject[mainKey]);
        if (index === -1) throw new Error("Nie znaleziono użytkownika lokalnie.");

        Object.assign(items.value[index], payload);
        toast.add(toastHandler('success', 'Zmodyfikowano użytkownika', 'Pomyślnie zmodyfikowano użytkownika'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się zmodyfikować użytkownika.', error));
    }

    editItemDialogVisible.value = false;
}

async function deleteItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano użytkownika', 'Wybierz użytkownika którego chcesz usunąć'));
        return;
    }

    try {
        let index = items.value.indexOf(item);

        await api.delete(mainPath + '/' + item[mainKey]);
        items.value.splice(index, 1);
        toast.add(toastHandler('success', 'Usunięto użytkownika', 'Pomyślnie usunięto użytkownika'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się usunąć użytkownika.', error));
    }
}

async function showAdvancedObjectView(data) {
    try {
        let user = api.get(mainPath + '/' + data[mainKey]);

        showItem.value = (await user).data;
        advancedObjectViewVisible.value = true;
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
    }
}

</script>