<template>
    <div class="flex flex-col gap-3">
        <Card>
            <template #content>
                <DataTable :items="localItemSimpleFields" :columns="simpleColumns" :showInteractions="false"
                    :showAdvancedObjectView="false" :show-header="false" :showPaginator="false"></DataTable>
            </template>

        </Card>
        <Card v-for="item of localItemJsonFields">
            <template #title>{{ props.fieldMap[item.key]?.label || item.key }}</template>
            <template #content>
                <DataTable :items="item.value" :columns="simpleColumns" :showInteractions="false"
                    :showAdvancedObjectView="false" :show-header="false" :showPaginator="false"></DataTable>
            </template>

        </Card>
        <Card v-for="item of localItemComplexFields">
            <template #title>{{ props.fieldMap[item.key]?.label || item.key }}</template>
            <template #content>
                <DataTable :items="item.value" :columns="props.complexFieldsColumns[item.key]" :showInteractions="false"
                    :showAdvancedObjectView="false"></DataTable>
            </template>

        </Card>

    </div>
</template>

<script setup>
import { ref, defineProps, onMounted } from 'vue';
import { Card } from 'primevue';
import DataTable from '../DataTable/DataTable.vue';
import { format } from 'date-fns';

const props = defineProps({
    item: {
        type: Object,
        required: true
    },
    fieldMap: {
        type: Object,
        default: () => ({})
    },
    complexFieldsColumns: {
        type: Object,
        required: true
    }
})

const simpleColumns = ref([{ label: 'Nazwa właściwości', field: 'key', dataKay: true }, { label: 'Wartość', field: 'value' }])

const localItem = ref();
const localItemSimpleFields = ref([]);
const localItemComplexFields = ref([]);
const localItemJsonFields = ref([]);

onMounted(() => {
    localItem.value = props.item;
    localItemSimpleFields.value = Object.entries(localItem.value)
        .filter(([key, value]) => typeof value !== 'object' && !key.includes('_json') && (props.fieldMap[key]?.show ?? true))
        .map(([key, value]) => {
            let val = value;
            if (props.fieldMap[key]?.date) val = formatDate(value, props.fieldMap[key]?.format || 'dd.MM.yyyy HH:mm');
            else if (props.fieldMap[key]?.boolean) val = value ? 'Tak' : 'Nie';
            else if (props.fieldMap[key]?.translateValue) val = props.fieldMap[key].translateValue(value);


            return { key: props.fieldMap[key]?.label || key, value: val };
        });
    localItemComplexFields.value = Object.entries(localItem.value)
        .filter(([key, value]) => typeof value === 'object' && (props.fieldMap[key]?.show ?? true))
        .map(([key, value]) => ({ key, value }));
    localItemJsonFields.value = Object.entries(localItem.value)
        .filter(([key, value]) => key.includes('_json') && (props.fieldMap[key]?.show ?? true))
        .map(([key, value]) => ({ key, value: JSON.parse(value) }))
        .map(item => {
            let values = Object.entries(item.value)
                .filter(([key, value]) => props.fieldMap[key]?.show ?? true)
                .map(([key, value]) => {
                    return { key: props.fieldMap[key]?.label || key, value }
                });
            return { key: item.key, value: values }
        });
})

function formatDate(date, fmt = 'dd.MM.yyyy HH:mm') {
    return format(new Date(date), fmt);
}

</script>
