<template>
    <!-- 
     used for virtual scroller height
     <div ref="wrapper" class="flex-1"> -->

    <DataTable v-model:selection="selected" :value="props.items" :dataKey="dataKey" :loading="props.loading"
        size="normal" scrollable :scrollHeight="scrollHeight" stripedRows :rows="10"
        :rowsPerPageOptions="[5, 10, 15, 20, 50]" :paginator="!virtualScrollerActive" :paginatorTemplate="{
            '640px': 'PrevPageLink CurrentPageReport NextPageLink RowsPerPageDropdown',
            '960px': 'FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown',
            '1300px': 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown',
            default: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown'
        }" sortMode="multiple" removableSort v-model:filters="filters"
        :filterDisplay="advancedFilters ? 'menu' : 'none'" :globalFilterFields="globalFilterFields"
        :pt="{ header: { class: 'pt-0 px-0' } }">
        <!-- :virtualScrollerOptions="{ itemSize: 44, delay: 20 }" -->
        <template #header>
            <div class="flex flex-col lg:flex-row justify-between gap-3">
                <div class="w-full flex flex-row gap-3 justify-between lg:justify-start">
                    <IconField class="flex-1 lg:flex-none">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Szukaj" fluid />
                    </IconField>
                    <Button v-if="advancedFilters" outlined @click="resetFilters()">
                        <i class="pi pi-filter-slash" />
                        Wyczyść
                    </Button>
                </div>
                <div class="flex gap-2 justify-between">
                    <div class="flex gap-2" v-if="props.showInteractions">
                        <Button @click="$emit('addItem')">
                            <i class="pi pi-plus" />
                        </Button>
                        <Button outlined @click="$emit('editItem', selected)">
                            <i class="pi pi-pencil" />
                        </Button>
                        <Button outlined @click="$emit('deleteItem', selected)">
                            <i class="pi pi-trash" />
                        </Button>
                    </div>

                    <Button outlined @click="toggleAdvancedMenu" v-if="advancedFiltersAvailable">
                        <i class="pi pi-ellipsis-v" />
                    </Button>
                    <Popover ref="advancedMenuPopover" v-if="advancedFiltersAvailable">
                        <div class="flex flex-col gap-3">
                            <div class="flex flex-row gap-3" v-if="advancedFiltersAvailable">
                                <span>Zaawansowane filtry </span>
                                <ToggleSwitch v-model="advancedFilters" @change="advancedFiltersToggle" />
                            </div>
                        </div>
                    </Popover>
                </div>
            </div>
        </template>
        <template #empty>
            Brak wyników.
        </template>
        <Column selectionMode="single" headerStyle="width: 1rem" v-if="props.showInteractions"></Column>
        <Column v-for="col of localColumns" :field="col.field" :header="col.label" sortable
            v-show="col.show == false ? false : true" :key="col.field"
            :dataType="col.type == 'list' ? 'text' : col.type" :showFilterMatchModes="col.type == 'list' ? false : true"
            :showFilterOperator="col.type == 'list' ? false : true" :showAddButton="col.type == 'list' ? false : true"
            showClearButton>
            <template #body="{ data }">
                <div v-if="col.type == 'date'">
                    {{ formatDate(data[col.field], col) }}
                </div>
                <div v-else>
                    {{ data[col.field] }}
                </div>
            </template>
            <template #filter="{ filterModel }" v-if="advancedFilters">
                <InputText v-if="col.type == 'text'" v-model="filterModel.value" type="text" placeholder="Wyszukaj" />
                <InputNumber v-else-if="col.type == 'numeric'" v-model="filterModel.value" placeholder="Wyszukaj" />
                <DatePicker v-else-if="col.type == 'date'" v-model="filterModel.value" placeholder="Wyszukaj"
                    :dateFormat="col.dateFormat.replace('yyyy', 'yy').replace('MM', 'mm')" />
                <MultiSelect v-else-if="col.type == 'list'" v-model="filterModel.value" :options="col.options"
                    placeholder="Wybierz" showClear>
                    <template #option="slotProps">
                        {{ slotProps.option }}
                    </template>
                </MultiSelect>
            </template>

        </Column>
    </DataTable>

    <!-- </div> -->

</template>

<script setup>
import { DataTable, Column } from 'primevue';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onMounted, ref } from 'vue';
import { InputIcon, InputText, InputNumber, IconField, Button, Popover, ToggleSwitch, DatePicker, MultiSelect } from 'primevue';
import { format } from 'date-fns';

const props = defineProps({
    items: {
        type: Array,
        required: true
    },
    columns: {
        type: Object,
        required: true
    },
    advancedFiltersAvailable: {
        type: Boolean,
        default: true,
    },
    virtualScrollerActive: {
        // doesn't work - don't use yet
        type: Boolean,
        default: false
    },
    showInteractions: {
        type: Boolean,
        default: true
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['addItem', 'editItem', 'deleteItem']);

const localColumns = ref([
    ...props.columns.filter(col => col.show == false ? false : true)
]);
const dataKey = ref();

// used for virtual scroller height
// const wrapper = ref();
const selected = ref();

const advancedFilters = ref(false);
const filters = ref();
const defaultfilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const globalFilterFields = ref([]);

for (const col of props.columns) {
    let matchMode = FilterMatchMode.STARTS_WITH;
    if (col.type == 'date') {
        matchMode = FilterMatchMode.DATE_IS;
    } else if (col.type == 'numeric') {
        matchMode = FilterMatchMode.EQUALS;
    } else if (col.type == 'list') {
        matchMode = FilterMatchMode.IN;
    }

    defaultfilters.value[col.field] = { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: matchMode }] };

    if (col.addToGlobalFilter) {
        globalFilterFields.value.push(col.field);
    }

    if (col.dataKey) {
        dataKey.value = col.field;
    }
}

function setFilters(newFilters) {
    filters.value = JSON.parse(JSON.stringify(newFilters));
}
function resetFilters() {
    filters.value = JSON.parse(JSON.stringify(defaultfilters.value));
}
function advancedFiltersToggle() {
    resetFilters();
}
setFilters(defaultfilters.value);


const scrollHeight = ref('flex');
const virtualScrollerActive = ref(false);

if (virtualScrollerActive.value) {
    scrollHeight.value = '35rem';
}

const advancedMenuPopover = ref();
function toggleAdvancedMenu(event) {
    advancedMenuPopover.value.toggle(event);
}

function formatDate(date, col) {
    let fmt = col.dateFormat || 'yyyy-MM-dd';
    if (col.showTime) fmt += ' ' + (col.timeFormat || 'HH:mm');
    return format(new Date(date), fmt);
}



//to do virtuallscroller
// onMounted(() => {

//     if (virtualScrollerActive.value) {
//         scrollHeight.value = getDivContentHeight(wrapper.value);
//     }

// })

// function getDivContentHeight(div) {
//     if (!div) return '35rem';
//     //to do - calculate height of padding
//     const height = div.scrollHeight - 40 - 130;
//     return height + 'px';
// }



</script>