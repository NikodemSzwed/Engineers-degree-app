<template>
    <!-- 
     used for virtual scroller height
     <div ref="wrapper" class="flex-1"> -->

    <DataTable v-model:selection="selected" :value="props.items" :dataKey="dataKey" :loading="props.loading"
        size="small" scrollable :scrollHeight="scrollHeight" stripedRows columnResizeMode="fit" :rows="10"
        :rowsPerPageOptions="[5, 10, 15, 20, 50]" :paginator="!virtualScrollerActive && props.showPaginator"
        :paginatorTemplate="{
            '640px': 'PrevPageLink CurrentPageReport NextPageLink RowsPerPageDropdown',
            '960px': 'FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown',
            '1300px': 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown',
            default: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown'
        }" sortMode="multiple" :multiSortMeta="multiSortMeta" removableSort v-model:filters="filters"
        :filterDisplay="advancedFilters ? 'menu' : 'none'" :globalFilterFields="globalFilterFields"
        selectionMode="single" :pt="{ header: { class: 'pt-0 px-0' } }">
        <!-- :virtualScrollerOptions="{ itemSize: 44, delay: 20 }" -->
        <template v-if="props.showHeader" #header>
            <div class="flex flex-col lg:flex-row justify-between gap-2 lg:gap-3 pb-1 lg:pb-2">
                <div class="w-full flex flex-row gap-2 lg:gap-3 justify-between lg:justify-start">
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
                <div class="flex gap-2"
                    :class="{ 'justify-between': props.showInteractions, 'justify-end': !props.showInteractions }">
                    <div class="flex gap-2" v-if="props.showInteractions">
                        <Button v-if="props.showAddButton" @click="$emit('addItem')">
                            <i class="pi pi-plus" />
                        </Button>
                        <Button v-if="props.showEditButton" outlined @click="$emit('editItem', selected)">
                            <i class="pi pi-pencil" />
                        </Button>
                        <Button v-if="props.showDeleteButton" outlined @click="$emit('deleteItem', selected)">
                            <i class="pi pi-trash" />
                        </Button>
                    </div>

                    <Button outlined @click="toggleAdvancedMenu" v-if="advancedInteractionsAvailable">
                        <i class="pi pi-ellipsis-v" />
                    </Button>
                    <Popover ref="advancedMenuPopover" v-if="advancedInteractionsAvailable"
                        class="lg:min-w-sm max-w-sm">
                        <div class="flex flex-col gap-3">
                            <div class="flex flex-row gap-3 w-full justify-between" v-if="advancedFiltersAvailable">
                                <span>Zaawansowane filtry </span>
                                <ToggleSwitch v-model="advancedFilters" @change="advancedFiltersToggle" />
                            </div>
                            <div class="flex flex-row gap-3  w-full justify-between" v-if="advancedColumnsAvailable">
                                <span>Zaawansowana obsługa kolumn</span>
                                <ToggleSwitch v-model="advancedColumns" />
                            </div>
                            <div class="flex flex-row gap-3" v-if="advancedColumns">
                                <FloatLabel variant="on">
                                    <MultiSelect :id="'on_label'" v-model="localColumns" :options="localColumnsOptions"
                                        optionLabel="label" fluid />
                                    <label for="on_label">Pokaż kolumny</label>
                                </FloatLabel>
                            </div>
                            <div class="flex flex-row gap-3" v-if="advancedColumns">
                                <FloatLabel variant="on">
                                    <MultiSelect :id="'on_label'" v-model="frozenColumns" :options="localColumnsOptions"
                                        optionLabel="label" fluid />
                                    <label for="on_label">Zamroź kolumny</label>
                                </FloatLabel>
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

        <Column v-for="col of localColumns" :field="col.field" :header="col.label" :key="col.field"
            :sortable="col.sortable == false ? false : true" v-show="col.show == false ? false : true"
            :frozen="frozenColumns.includes(col)" :dataType="col.type == 'list' ? 'any' : col.type"
            :showFilterMatchModes="col.type == 'list' ? false : true"
            :showFilterOperator="col.type == 'list' ? false : true" :showAddButton="col.type == 'list' ? false : true"
            v-bind="col.colProps" showClearButton class="w-fit min-w-35">
            <template #body="{ data }">
                <slot v-if="col.overrideBodyTemplate" :name="'body-' + col.field" v-bind="{ data }"></slot>
                <div v-else-if="col.type == 'date'" class="text-nowrap">
                    {{ formatDate(data[col.field], col) }}
                </div>
                <div v-else class="text-nowrap">
                    {{ data[col.field] }}
                </div>

            </template>
            <template #filter="{ filterModel }" v-if="advancedFilters && (col.noFilter == true ? false : true)">
                <slot v-if="col.overrideFilterTemplate" :name="'filter-' + col.field" v-bind="{ filterModel }"></slot>
                <InputText v-else-if="col.type == 'text'" v-model="filterModel.value" type="text"
                    placeholder="Wyszukaj" />
                <InputNumber v-else-if="col.type == 'numeric'" v-model="filterModel.value" placeholder="Wyszukaj" />
                <DatePicker v-else-if="col.type == 'date'" v-model="filterModel.value" placeholder="Wyszukaj"
                    :dateFormat="col.dateFormat.replace('yyyy', 'yy').replace('MM', 'mm')" />
                <!-- filtrowanie po czasie nie działa :showTime="col.showTime" hourFormat="24" -->
                <MultiSelect v-else-if="col.type == 'list'" v-model="filterModel.value" :options="col.options"
                    placeholder="Wybierz" filter showClear>
                    <template #option="slotProps">
                        {{ slotProps.option }}
                    </template>
                </MultiSelect>
            </template>

        </Column>
        <Column v-if="props.showAdvancedObjectView" class="w-4 !text-end">
            <template #body="{ data }">
                <Button icon="pi pi-search" @click="$emit('showAdvancedObjectView', data)" severity="secondary"
                    rounded></Button>
            </template>
        </Column>

    </DataTable>

    <!-- </div> -->

</template>

<script setup>
import { DataTable, Column } from 'primevue';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { onMounted, ref, watch } from 'vue';
import { InputIcon, InputText, InputNumber, IconField, Button, Popover, ToggleSwitch, DatePicker, MultiSelect, FloatLabel } from 'primevue';
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
    advancedInteractionsAvailable: {
        type: Boolean,
        default: true,
    },
    advancedFiltersAvailable: {
        type: Boolean,
        default: true
    },
    activateAdvancedFilters: {
        // works only if advancedInteractionsAvailable is true
        type: Boolean,
        default: false
    },
    advancedColumnsAvailable: {
        type: Boolean,
        default: true
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
    showAddButton: {
        type: Boolean,
        default: true
    },
    showEditButton: {
        type: Boolean,
        default: true
    },
    showDeleteButton: {
        type: Boolean,
        default: true
    },
    showAdvancedObjectView: {
        type: Boolean,
        default: true
    },
    showHeader: {
        type: Boolean,
        default: true
    },
    showPaginator: {
        type: Boolean,
        default: true
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['addItem', 'editItem', 'deleteItem', 'showAdvancedObjectView']);

const localColumnsOptions = ref([...props.columns.filter(col => col.show == false ? false : true)]);
const localColumns = ref(localColumnsOptions.value);
const frozenColumns = ref([...props.columns.filter(col => col.frozen == true ? true : false)]);
const dataKey = ref();

// used for virtual scroller height
// const wrapper = ref();
const selected = ref();
const multiSortMeta = ref([]);

const advancedFilters = ref(false);
if (props.advancedInteractionsAvailable) advancedFilters.value = props.activateAdvancedFilters;

const advancedColumns = ref(false);

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

    if (col.overrideFilter) defaultfilters.value[col.field] = col.overrideFilter;
    else defaultfilters.value[col.field] = { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: matchMode }] };

    if (col.addToGlobalFilter) {
        globalFilterFields.value.push(col.field);
    }

    if (col.dataKey) {
        dataKey.value = col.field;
    }

    if (col.sortOptions) {
        multiSortMeta.value.push({ field: col.field, order: col.sortOptions.order });
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


// function advancedColumnsToggle() {
//     advancedColumns.value = !advancedColumns.value;
// }

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

// if (virtualScrollerActive.value) {
//     scrollHeight.value = getDivContentHeight(wrapper.value);
// }

// }
// })

// function getDivContentHeight(div) {
//     if (!div) return '35rem';
//     //to do - calculate height of padding
//     const height = div.scrollHeight - 40 - 130;
//     return height + 'px';
// }



</script>