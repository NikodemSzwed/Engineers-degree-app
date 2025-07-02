<template>
    <div class="w-full">
        <GridLayout v-model:layout="localLayout" :col-num="colNum" :row-height="rowHeight" :is-draggable="isDraggable"
            :is-resizable="isResizable" :vertical-compact="verticalCompact" :use-css-transforms="useCssTransforms">
            <GridItem v-if="localLayout.length > 0" v-for="item in localLayout" :key="item.i" v-bind="item">
                <Card class="w-full h-full" :pt="{ body: 'h-full', content: 'h-full' }">
                    <template #content>
                        <component :is="componentMap[item.component]" v-bind="item.props" class="w-full h-full">
                        </component>
                    </template>
                </Card>
            </GridItem>
            <slot v-else name="items" />
        </GridLayout>
    </div>
</template>

<script setup>
import { ref, watch, toRefs, onMounted } from 'vue'
import { GridLayout, GridItem } from 'grid-layout-plus';
import Card from 'primevue/card';
import { widgets, widgetsMeta } from './widgets';


const componentMap = {
    ...widgets
}

const props = defineProps({
    layout: {
        type: Array,
        required: true,
    },
    "colNum": {
        type: Number,
        default: 12
    },
    "rowHeight": {
        type: Number,
        default: 30
    },
    "isEditable": {
        type: Boolean,
        default: true
    },
    "isDraggable": {
        type: Boolean,
        default: true
    },
    "isResizable": {
        type: Boolean,
        default: true
    },
    "verticalCompact": {
        type: Boolean,
        default: true
    },
    "useCssTransforms": {
        type: Boolean,
        default: true
    },
    "maxHInnerItem": {
        type: Number,
        default: 20
    },
    "fixKeys": {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:layout'])
const { layout } = toRefs(props);
const isDraggable = ref(props.isDraggable)
const isResizable = ref(props.isResizable)

const localLayout = ref([]);
localLayout.value = layout.value ? [...layout.value] : [];
assignWidgetsMetaToLayout();

watch(layout, (newLayout) => {
    localLayout.value = [...newLayout]
    assignWidgetsMetaToLayout();
})

watch(localLayout, (newLayout) => {
    emit('update:layout', newLayout)
})

watch(() => props.isEditable, (newVal) => {
    isDraggable.value = newVal
    isResizable.value = newVal
})

onMounted(() => {
    isDraggable.value = props.isEditable;
    isResizable.value = props.isEditable;
})

function assignWidgetsMetaToLayout() {
    let keys = {};
    localLayout.value.forEach(item => {
        if (keys[item.i] && props.fixKeys) {
            item.i = (Math.max(...Object.keys(keys)) | 0) + 1;
        }
        keys[item.i] = 1;
        if (item.component in widgetsMeta) {
            if (!item?.minW) item.minW = widgetsMeta[item.component].minW;
            if (!item?.minH) item.minH = widgetsMeta[item.component].minH;
        }
        if (!item?.maxH) {
            // console.log("🚀 ~ assignWidgetsMetaToLayout ~ item:", item.maxH)
            item.maxH = props.maxHInnerItem
        }
    })
    // console.log("🚀 ~ assignWidgetsMetaToLayout ~ widgetsMeta:", widgetsMeta)
}

</script>