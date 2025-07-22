<template>
    <div>
        <Toast />
        <Card :pt="{ body: 'p-2 lg:p-5' }">
            <template #content>
                <DataTable :items="items" :columns="columns" :advancedFiltersAvailable="true" :showInteractions="true"
                    :loading="loading" :showAddButton="false" @editItem="editItem" @deleteItem="deleteItem"
                    @showAdvancedObjectView="showAdvancedObjectView">
                    <template #body-validated="{ data }">
                        <Tag :severity="getSeverity(data.validated)" :value="getMessage(data.validated)"></Tag>
                    </template>
                    <template #filter-validated="{ filterModel }">
                        <MultiSelect v-model="filterModel.value" :options="statesSimplified"
                            placeholder="Wybierz czy zweryfikowany">
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
        <Dialog v-model:visible="editItemDialogVisible" header="Edytuj monitor" class="w-11/12 lg:w-1/2" modal>
            <Form :initial-values="initialValues" :fields="editItemFields" @submit="editItemSave">
                <template #input-validated="{ field, $field }">
                    <FloatLabel variant="on">
                        <Select v-model="$field.value" :id="'label' + field.name" :options="statesSimplified"
                            placeholder="Wybierz czy zweryfikowany" v-bind="$field" fluid>
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
            </Form>
        </Dialog>
        <Dialog v-model:visible="advancedObjectViewVisible" header="Podgląd monitora" class="w-11/12 lg:w-3/4" modal
            maximizable :pt="{ content: 'bg-emphasis rounded-b-xl pt-5' }">
            <ObjectView :item="showItem" :fieldMap="fieldMap" :complexFieldsColumns="complexFieldsColumns"></ObjectView>
        </Dialog>
    </div>


</template>

<script setup>
import { onMounted, ref } from 'vue';
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
import { Tag, MultiSelect, Select, FloatLabel } from 'primevue';

const toast = useToast();

const items = ref([]);
const addItemDialogVisible = ref(false);
const editItemDialogVisible = ref(false);

const advancedObjectViewVisible = ref(false);
const showItem = ref({});

const fieldMap = ref({
    UUID: { show: false },
    name: { label: 'Nazwa monitora' },
    validated: {
        label: "Zweryfikowany",
        translateValue: (val) => {
            return getMessage(val)
        }
    }
});
const complexFieldsColumns = ref({
    DisplayElementsAssignments: [],
    MapsAndElements: [],
    Orders: [],
    Alerts: [],
})
const mainKey = 'DID';
const mainPath = '/displays';
const statesSimplified = [0, 1];

const initialValues = ref({});

const editItemFields = ref([
    {
        name: 'name',
        label: 'Nazwa monitora',
        component: 'InputText',
        componentOptions: {
            type: 'text',
        },
        conditions: [{
            check: "required",
            message: "Nazwa monitora jest wymagana."
        }, {
            check: "minlength",
            value: 3,
            message: "Nazwa monitora musi zawierać co najmniej 3 znaki."
        }]
    },
    {
        name: 'validated',
        label: 'Zweryfikowany',
        component: 'custom',
        componentOptions: {},
        conditions: [{
            check: "required",
            message: "Odpowiedź jest wymagana."
        }]
    }
]);


const columns = ref([
    { label: 'DID', field: 'DID', type: 'numeric', dataKey: true, show: false },
    { label: 'Nazwa monitora', field: 'name', type: 'text', addToGlobalFilter: true },
    { label: 'UUID', field: 'UUID', type: 'numeric', show: false },
    {
        label: 'Zweryfikowany', field: 'validated', type: 'any',
        overrideBodyTemplate: true,
        overrideFilterTemplate: true,
        colProps: {
            showFilterMatchModes: false,
            showFilterOperator: false,
            showAddButton: false,
            sortField: 'validated'
        },
        overrideFilter: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.IN }] }
    }
])

const loading = ref(true);

onMounted(async () => {
    try {
        let responseItems = api.get(mainPath);

        items.value = (await responseItems).data;
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
    }
    loading.value = false;
})



async function editItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano monitora', 'Wybierz monitor który chcesz zmodyfikować'));
        return;
    }

    try {
        let response = await api.get(mainPath + '/' + item[mainKey]);

        let values = { ...response.data };

        initialValues.value = values;
        console.log("🚀 ~ editItem ~ initialValues.value:", initialValues.value)

    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych monitora.', error));
    }

    editItemDialogVisible.value = true;

}


async function editItemSave(values) {
    let payload = Object.fromEntries(
        Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value])
    );

    try {
        await api.put(mainPath + '/' + values.originalObject[mainKey], payload);

        console.log("🚀 ~ editItemSave ~ values.originalObject[mainKey]:", values)
        console.log("🚀 ~ editItemSave ~ mainKey:", mainKey)
        console.log("🚀 ~ editItemSave ~ items:", items)
        let index = items.value.findIndex(item => item[mainKey] === values.originalObject[mainKey]);

        if (index === -1) throw new Error("Nie znaleziono monitora lokalnie.");

        Object.assign(items.value[index], payload);

        toast.add(toastHandler('success', 'Zmodyfikowano monitor', 'Pomyślnie zmodyfikowano monitor'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się zmodyfikować monitora.', error));
    }



    editItemDialogVisible.value = false;
}

async function deleteItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano monitora', 'Wybierz monitor który chcesz usunąć'));
        return;
    }

    try {
        let index = items.value.indexOf(item);
        if (index == -1) {
            toast.add(toastHandler('warn', 'Nie wybrano monitora', 'Wybierz monitor który chcesz usunąć'));
            return;
        }

        await api.delete(mainPath + '/' + item[mainKey]);

        items.value.splice(items.value.indexOf(item), 1);
        toast.add(toastHandler('success', 'Usunięto monitor', 'Pomyślnie usunięto monitor'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się usunąć monitora.', error));
    }
}

async function showAdvancedObjectView(data) {
    try {
        let item = api.get(mainPath + '/' + data[mainKey]);

        showItem.value = (await item).data;
        console.log("🚀 ~ showAdvancedObjectView ~ showItem.value:", showItem.value)
        advancedObjectViewVisible.value = true;
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
    }


}

function getSeverity(state) {
    switch (state) {
        case 0:
            return 'danger';
        case 1:
            return 'success';
        default:
            return 'info';
    }
}

function getMessage(state) {
    switch (state) {
        case 0:
            return 'Nie';
        case 1:
            return 'Tak';
        default:
            return 'Inny';
    }
}

</script>