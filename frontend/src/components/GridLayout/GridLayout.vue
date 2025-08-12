<template>
    <div class="w-full select-none">
        <GridLayout v-model:layout="localLayout" :col-num="colNum" :row-height="rowHeight" :is-draggable="isDraggable"
            :is-resizable="isResizable" :vertical-compact="verticalCompact" :use-css-transforms="useCssTransforms"
            :margin="[10, 10]" @breakpoint-changed="onBreakpointChanged" :responsive="responsive" :cols="cols"
            v-model:responsive-layouts="presetLayouts" :breakpoints="tailwndBreakpoints" ref="grid">
            <GridItem v-if="localLayout.length > 0" v-for="item in localLayout" :key="item.i" v-bind="item">
                <Card class="h-full w-full" v-show="item.component !== 'Empty' || localIsEditable"
                    :pt="{ body: 'h-full', content: 'h-full overflow-hidden' }">
                    <template #title>
                        <div class="flex justify-between">
                            <span>{{ item.props?.name }}</span>
                            <div v-if="localIsEditable" class="cursor-pointer hover:text-red-500"
                                @click="removeItem(item.i)">
                                <i class="pi pi-trash" />
                            </div>
                        </div>
                    </template>
                    <template #content>
                        <!-- chart.js scales in a strange way (h-full overflows for some reason) - overflow-hidden seems to force it to scale to parent -->
                        <component :is="componentMap[item.component]" v-bind="item.props" class="h-full w-full">
                        </component>
                    </template>
                </Card>
            </GridItem>
            <slot v-else name="items" />
        </GridLayout>
    </div>
</template>

<script setup>
import { ref, watch, toRefs, onMounted, computed } from 'vue';
import { GridLayout, GridItem } from 'grid-layout-plus';
import Card from 'primevue/card';
import { widgets, widgetsMeta } from './widgets';

const componentMap = {
    ...widgets,
};

const props = defineProps({
    layout: {
        type: [Array, Object],
        default: () => [],
    },
    colNum: {
        type: Number,
        default: 12,
    },
    rowHeight: {
        type: Number,
        default: 30,
    },
    isEditable: {
        type: Boolean,
        default: false,
    },
    isDraggable: {
        type: Boolean,
        default: false,
    },
    isResizable: {
        type: Boolean,
        default: false,
    },
    verticalCompact: {
        type: Boolean,
        default: true,
    },
    useCssTransforms: {
        type: Boolean,
        default: true,
    },
    responsive: {
        type: Boolean,
        default: true,
    },
    presetLayouts: {
        type: Object,
        default: {},
    },
});

const emit = defineEmits(['update:layout'], ['update:presetLayouts']);
const grid = ref(null);
defineExpose({
    grid,
});

const isDraggable = ref(props.isDraggable);
const isResizable = ref(props.isResizable);
const localIsEditable = ref(props.isEditable);
const cols = ref({
    lg: 24,
    md: 24,
    sm: 8,
    xs: 6,
    xxs: 4,
});

const localLayout = computed({
    get: () => props.layout,
    set: value => {
        emit('update:layout', value);
    },
});
const presetLayouts = computed({
    get: () => props.presetLayouts,
    set: value => {
        emit('update:presetLayouts', value);
    },
});

const tailwndBreakpoints = ref({ lg: 1536, md: 1250, sm: 1024, xs: 768, xxs: 640 });
const breakpointsMapToTailwind = { lg: '2xl', md: 'xl', sm: 'lg', xs: 'md', xxs: 'sm' };
let currentBreakpoint = 'lg';

watch(
    () => props.isEditable,
    newVal => {
        if (currentBreakpoint == 'xl' || currentBreakpoint == '2xl') {
            isDraggable.value = newVal;
            isResizable.value = newVal;
            localIsEditable.value = newVal;
        }
    }
);

onMounted(() => {
    if (currentBreakpoint === 'xl' || currentBreakpoint === '2xl') {
        isDraggable.value = props.isEditable;

        isResizable.value = props.isEditable;
        localIsEditable.value = props.isEditable;
    }

    if (props.responsive && presetLayouts.value?.cols) {
        cols.value = presetLayouts.value.cols;
    }
});

function onBreakpointChanged(breakpoint) {
    currentBreakpoint = breakpointsMapToTailwind[breakpoint];

    // if (['xl', 'lg', 'md', 'sm'].includes(currentBreakpoint)) {
    //     localLayout.value.forEach(item => {
    //         item.w = 8;
    //     })
    // }
}

function removeItem(id) {
    const index = localLayout.value.findIndex(item => item.i === id);

    if (index > -1) {
        localLayout.value.splice(index, 1);
    }
}
</script>
