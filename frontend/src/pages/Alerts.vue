<template>
    <div>
        <Card :pt="{ body: 'p-2 lg:p-5' }">
            <template #content>
                <DataTable :items="items" :columns="columns" :advancedFiltersAvailable="true" :showInteractions="true"
                    :loading="loading" :showAddButton="false" @editItem="editItem" @deleteItem="deleteItem"
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
        <Dialog v-model:visible="editItemDialogVisible" header="Edytuj alert" class="w-11/12 lg:w-1/2" modal>
            <Form :initial-values="initialValues" :fields="editItemFields" @submit="editItemSave">
                <template #input-State="{ field, $field }">
                    <FloatLabel variant="on">
                        <Select v-model="$field.value" :id="'label' + field.name" :options="statesSimplified"
                            placeholder="Wybierz status" v-bind="$field" fluid>
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
        <Dialog v-model:visible="advancedObjectViewVisible" header="Podgląd alertu" class="w-11/12 lg:w-3/4" modal
            maximizable :pt="{ content: 'bg-emphasis rounded-b-xl pt-5' }">
            <ObjectView :item="showItem" :fieldMap="fieldMap" :complexFieldsColumns="complexFieldsColumns"></ObjectView>
        </Dialog>
    </div>


</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useToast } from "primevue/usetoast";
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
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
const editItemDialogVisible = ref(false);

const advancedObjectViewVisible = ref(false);
const showItem = ref({});

const fieldMap = ref({
    AAID: { show: false },
    EID: { show: false },
    EIDName: { label: 'Dotyczy' },
    AAName: { label: 'Rodzaj alertu' },
    date: { date: true, label: "Data zgłoszenia" },
    State: {
        label: "Status",
        translateValue: (val) => {
            return getMessage(val)
        }
    },
    ElementsTypes: { label: 'Rodzaje elementów do których się odnosi' },
});
const complexFieldsColumns = ref({})
const mainKey = 'AID';
const mainPath = '/alerts';
const statesSimplified = [0, 1, 2];

const initialValues = ref({});

const editItemFields = ref([
    {
        name: 'State',
        label: 'Status alertu',
        component: 'custom',
        componentOptions: {},
        conditions: [{
            check: "required",
            message: "Status alertu jest wymagany."
        }]
    }
]);

const columns = ref([
    { label: 'AID', field: 'AID', type: 'numeric', dataKey: true, show: false },
    { label: 'AAID', field: 'AAID', type: 'numeric', show: false },
    { label: 'EID', field: 'EID', type: 'numeric', show: false },
    {
        label: 'Zgłoszono',
        field: 'AAName',
        type: 'list',
        addToGlobalFilter: true,
        options: []
    },
    { label: 'Dotyczy', field: 'EIDName', type: 'text', addToGlobalFilter: true },
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
        overrideFilter: { operator: FilterOperator.AND, constraints: [{ value: [0, 1], matchMode: FilterMatchMode.IN }] }
    },
    {
        label: 'Data zgłoszenia',
        field: 'date',
        type: 'date',
        dateFormat: 'dd.MM.yyyy',
        showTime: true,
        timeFormat: 'HH:mm',
        sortOptions: { order: -1 }
    },
])

const loading = ref(true);

onMounted(async () => {
    try {
        let responseItems = api.get(mainPath);
        let alertsTypes = api.get('/alertstypes');

        columns.value.find(item => item.field === 'AAName').options = (await alertsTypes).data.map(item => item.name);

        items.value = (await responseItems).data.map(item => {
            item.date = new Date(item.date);
            return item;
        });
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
    }
    loading.value = false;
})

async function editItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano alertu', 'Wybierz alert który chcesz zmodyfikować'));
        return;
    }

    try {
        let response = await api.get(mainPath + '/' + item[mainKey]);

        let values = { ...response.data };

        initialValues.value = values;
        editItemDialogVisible.value = true;
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych alertu.', error));
    }
}

async function editItemSave(values) {
    let payload = Object.fromEntries(
        Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value])
    );

    try {
        await api.put(mainPath + '/' + values.originalObject[mainKey], payload);


        let index = items.value.findIndex(item => item[mainKey] === values.originalObject[mainKey]);
        if (index === -1) throw new Error("Nie znaleziono alertu lokalnie.");

        Object.assign(items.value[index], payload);

        toast.add(toastHandler('success', 'Zmodyfikowano alert', 'Pomyślnie zmodyfikowano alert'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się zmodyfikować alertu.', error));
    }

    editItemDialogVisible.value = false;
}

async function deleteItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano alertu', 'Wybierz alert który chcesz usunąć'));
        return;
    }

    try {
        let index = items.value.indexOf(item);

        await api.delete(mainPath + '/' + item[mainKey]);

        items.value.splice(items.value.indexOf(item), 1);
        toast.add(toastHandler('success', 'Usunięto alert', 'Pomyślnie usunięto alert'));
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się usunąć alertu.', error));
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

function getSeverity(state) {
    switch (state) {
        case 0:
        case "0":
            return 'danger';
        case 1:
        case "1":
            return 'warn';
        case 2:
        case "2":
            return 'success';
        default:
            return 'info';
    }
}

function getMessage(state) {
    switch (state) {
        case 0:
        case "0":
            return 'Nowy';
        case 1:
        case "1":
            return 'W trakcie rozwiązywania';
        case 2:
        case "2":
            return 'Rozwiązany';
        default:
            return 'Inny';
    }
}
</script>