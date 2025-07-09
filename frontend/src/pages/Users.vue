<template>
    <div ref="wrapper" class="flex-1">
        <Card>
            <template #content>
                <DataTable v-model:selection="selected" :value="products" dataKey="id" size="normal" scrollable
                    :scrollHeight="scrollHeight" stripedRows paginator :rows="10"
                    :rowsPerPageOptions="[5, 10, 15, 20, 50]" :paginatorTemplate="{
                        '640px': 'PrevPageLink CurrentPageReport NextPageLink RowsPerPageDropdown',
                        '960px': 'FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown',
                        '1300px': 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown',
                        default: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown'
                    }" sortMode="multiple" removableSort v-model:filters="filters" filterDisplay="menu"
                    :globalFilterFields="['code', 'name', 'category', 'quantity']"
                    :pt="{ header: { class: 'pt-0 px-0' } }">
                    <template #header>
                        <div class="flex flex-col lg:flex-row justify-between gap-3">
                            <div class="w-full flex flex-row gap-3 justify-between lg:justify-start">
                                <IconField class="flex-1 lg:flex-none">
                                    <InputIcon>
                                        <i class="pi pi-search" />
                                    </InputIcon>
                                    <InputText v-model="filters['global'].value" placeholder="Keyword Search" fluid />
                                </IconField>
                                <Button v-if="advancedFilters" outlined @click="resetFilters()">
                                    <i class="pi pi-filter-slash" />
                                    Clear
                                </Button>
                            </div>
                            <div class="flex gap-2 justify-between">
                                <div class="flex gap-2">
                                    <Button>
                                        <i class="pi pi-plus" />
                                    </Button>
                                    <Button outlined>
                                        <i class="pi pi-pencil" />
                                    </Button>
                                    <Button outlined>
                                        <i class="pi pi-trash" />
                                    </Button>
                                </div>

                                <Button outlined>
                                    <i class="pi pi-ellipsis-v" />
                                </Button>
                            </div>
                        </div>
                    </template>
                    <Column selectionMode="single" headerStyle="width: 1rem"></Column>
                    <Column field="code" sortable header="Code"></Column>
                    <Column field="name" sortable header="Name">
                        <template #body="{ data }">
                            {{ data.name }}
                        </template>
                        <template #filter="{ filterModel }" v-if="advancedFilters">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by name" />
                        </template>
                    </Column>
                    <Column field="category" header="Category"></Column>
                    <Column field="quantity" sortable header="Quantity"></Column>
                </DataTable>
            </template>
        </Card>
    </div>

</template>

<script setup>
import Card from 'primevue/card';
import { DataTable, Column } from 'primevue';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onMounted, ref } from 'vue';
import { InputIcon, InputText, IconField, Button } from 'primevue';

const wrapper = ref();
const scrollHeight = ref('35rem');
const selected = ref();

const advancedFilters = ref(true);
const filters = ref();
const defaultfilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    code: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    category: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    quantity: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    // representative: { value: null, matchMode: FilterMatchMode.IN },
    // date: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    // balance: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    // status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    // activity: { value: [0, 100], matchMode: FilterMatchMode.BETWEEN },
    // verified: { value: null, matchMode: FilterMatchMode.EQUALS }
});

onMounted(() => {
    scrollHeight.value = getDivContentHeight(wrapper.value);
    console.log(products)

})

function setFilters(newFilters) {
    filters.value = newFilters;
}
function resetFilters() {
    filters.value = defaultfilters.value;
}
setFilters(defaultfilters.value);

function getDivContentHeight(div) {
    if (!div) return '35rem';
    // console.log("🚀 ~ getDivContentHeight ~ div:", div)
    // const divStyle = getComputedStyle(div.$el);
    // const marginBottom = parseInt(divStyle.marginBottom);
    // console.log("🚀 ~ getDivContentHeight ~ marginBottom:", marginBottom)
    // const marginTop = parseInt(divStyle.marginTop);
    // const paddingBottom = parseInt(divStyle.paddingBottom);
    // console.log("🚀 ~ getDivContentHeight ~ paddingBottom:", paddingBottom)

    // const paddingTop = parseInt(divStyle.paddingTop);

    const height = div.scrollHeight - 40 - 130;
    // console.log("🚀 ~ getDivContentHeight ~ height:", height)
    return height + 'px';
}

const products = ref([
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f230fh0g3', name: 'Pencil', category: 'Writing', quantity: 10 },
    { code: 'cf13f36p2', name: 'Eraser', category: 'Writing', quantity: 5 },
    { code: '56hfr0i3', name: 'Pen', category: 'Writing', quantity: 20 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 },
    { code: 'f45hf0i3', name: 'Pencil', category: 'Writing', quantity: 15 }
])
let a = 0;
for (const element of products.value) {
    element.id = a++;
}

</script>