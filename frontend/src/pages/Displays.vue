<template>
    <div>
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
            <div class="mt-1.5">
                <div class="mb-5 flex gap-3 flex-col" v-for="i in [0, 1, 2, 3]" :key="i">
                    <FloatLabel variant="on">
                        <Select v-model="elements[i].type" :id="'label_element' + i" option-label="label"
                            :options="elementTypes" fluid show-clear>
                        </Select>
                        <label :for="'label_element' + i">{{ `Wybierz rodzaj elementu nr ` + (i + 1)
                            + `(opcjonalne)` }}</label>
                    </FloatLabel>
                    <FloatLabel variant="on" v-if="elements[i].type">
                        <Select v-model="elements[i].data" :id="'label_element_name' + i" option-label="name"
                            :options="elementOptions[i]" fluid>
                        </Select>
                        <label :for="'label_element_name' + i">{{ 'Wybierz element nr ' + (i + 1) }}</label>
                    </FloatLabel>
                </div>
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
                                    <Tag :severity="getSeverity(slotProps.option)"
                                        :value="getMessage(slotProps.option)">
                                    </Tag>
                                </template>
                            </Select>
                            <label :for="'label' + field.name">{{ field.label }}</label>
                        </FloatLabel>
                    </template>
                </Form>
            </div>
        </Dialog>
        <Dialog v-model:visible="advancedObjectViewVisible" header="Podgląd monitora" class="w-11/12 lg:w-3/4" modal
            maximizable :pt="{ content: 'bg-emphasis rounded-b-xl pt-5' }">
            <ObjectView :item="showItem" :fieldMap="fieldMap" :complexFieldsColumns="complexFieldsColumns"></ObjectView>
        </Dialog>
    </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
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
    UUID: { show: false },
    name: { label: 'Nazwa monitora' },
    validated: {
        label: "Zweryfikowany",
        translateValue: (val) => {
            return getMessage(val)
        }
    },
    DisplayElementsAssignments: { label: 'Przypisane elementy' },
    MapsAndElements: { show: false },
    Orders: { show: false },
    Alerts: { show: false },
});
const complexFieldsColumns = ref({
    DisplayElementsAssignments: [
        { label: 'EID', field: 'EID', dataKay: true, type: 'numeric', show: false },
        { label: 'Rodzaj elementu', field: 'ETID', type: 'text', addToGlobalFilter: true },
        {
            label: 'Nazwa elementu', field: 'name', type: 'text', addToGlobalFilter: true,
        }
    ],
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
            value: 2,
            message: "Nazwa monitora musi zawierać co najmniej 2 znaki."
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

const elements = ref([{}, {}, {}, {}]);
const elementTypes = ref([{ value: 1, label: 'Mapa' }, { value: 2, label: 'Zlecenie' }, { value: 3, label: 'Sektor' }]);
const elementOptions = ref([[], [], [], []]);
const mapList = ref([]);
const orderList = ref([]);
const sectorList = ref([]);

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

watch(elements, (newElements) => {
    console.log("🚀 ~ newElements:", newElements)
    newElements.forEach((el, index) => {
        if (!el?.type?.value) {
            elementOptions.value[index] = [];
            return;
        }
        if (el.type.value != el?.data?.ETID) el.data = null;
        elementOptions.value[index] = el.type.value == 1 ? mapList.value : (el.type.value == 2 ? orderList.value : sectorList.value);
    })
    console.log("🚀 ~ elementOptions.valu:", elementOptions.value)
}, { deep: true })

async function editItem(item) {
    if (!item) {
        toast.add(toastHandler('warn', 'Nie wybrano monitora', 'Wybierz monitor który chcesz zmodyfikować'));
        return;
    }

    try {
        let response = await api.get(mainPath + '/' + item[mainKey]);

        let values = { ...response.data };

        mapList.value = (await api.get('/mapsandelements')).data;
        orderList.value = (await api.get('/orders')).data;
        sectorList.value = (await api.get('/mapsandelements/sectors')).data;

        elements.value = values.DisplayElementsAssignments.map(item => {
            item.type = elementTypes.value.find(type => type.value === values.MapsAndElements.find(el => el.EID === item.EID).ETID);
            item = {
                ...item,
                data:
                    item.type.value == 1 ? mapList.value.find(el => el.EID === item.EID) :
                        (item.type.value == 2 ? orderList.value.find(el => el.EID === item.EID) :
                            sectorList.value.find(el => el.EID === item.EID))
            }

            return item;
        });
        elements.value.forEach((el, index) => {
            elementOptions.value[index] = el.data.ETID == 1 ? mapList.value : (el.data.ETID == 2 ? orderList.value : sectorList.value);
        })

        while (elements.value.length < 4)
            elements.value.push({});

        console.log("🚀 ~ editItem ~ elements.value:", elements.value)


        initialValues.value = values;
        console.log("🚀 ~ editItem ~ initialValues.value:", initialValues.value)
        editItemDialogVisible.value = true;
    } catch (error) {
        toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych monitora.', error));
    }
}

async function editItemSave(values) {
    let payload = Object.fromEntries(
        Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value])
    );
    payload.EIDs = elements.value.filter(el => el.data && el.type).map(item => item.data.EID);
    console.log("🚀 ~ editItemSave ~ elements.value:", elements.value)
    console.log("🚀 ~ editItemSave ~ payload.EIDs:", payload.EIDs)

    try {
        await api.put(mainPath + '/' + values.originalObject[mainKey], payload);

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

        showItem.value.DisplayElementsAssignments = showItem.value.DisplayElementsAssignments.map(item => {
            item = { ...item, ...showItem.value.MapsAndElements.find(element => element.EID === item.EID) }
            item.ETID = item.ETID == 1 ? 'Mapa' : (item.ETID == 2 ? 'Zlecenie' : 'Sektor');
            return item;
        });
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