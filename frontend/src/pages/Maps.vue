<template>
    <!-- <div class="bg-red-200">
        <GridLayout v-model:layout="layout" :col-num="12" :row-height="30" is-draggable is-resizable
            :vertical-compact="false" use-css-transforms>
            <template #item="{ item }">
                <div class="bg-white w-full h-full">
                    {{ item.i }}
                </div>
            </template>
</GridLayout>
</div> -->
    <div>
        <div class="h-20 w-54">
            <DraggableItem
                v-model:layout="layout"
                v-model:wraperBounds="wrapper"
                v-model:gridLayout="gridLayout"
                :component="{ itemData: { minW: 2, minH: 2 }, metaData: { name: 'test' } }"
            >
                <template #content>
                    <div>Drag me!</div>
                </template>
            </DraggableItem>
        </div>

        <div ref="wrapper" class="w-full">
            <GridLayout
                ref="gridLayout"
                v-model:layout="layout"
                :col-num="100"
                :row-height="10"
                :margin="[0, 0]"
                :vertical-compact="false"
                :prevent-collision="true"
            >
                <template #item="{ item }">
                    <span class="text">{{ item.i }}</span>
                </template>
            </GridLayout>
        </div>
    </div>

    <!-- <GridLayout>
        <GridItem />
    </GridLayout> -->
</template>

<script setup lang="ts">
    import { GridLayout } from 'grid-layout-plus';
    import { onMounted, reactive, ref } from 'vue';
    import DraggableItem from '../components/GridLayout/DraggableItem.vue';

    const layout = ref([
        { x: 0, y: 0, w: 20, h: 20, i: '0', static: false },
        { x: 3, y: 0, w: 20, h: 20, i: '1', static: false },
        { x: 4, y: 0, w: 20, h: 20, i: '2', static: false },
        { x: 6, y: 0, w: 20, h: 20, i: '3', static: false },
        { x: 8, y: 0, w: 20, h: 20, i: '4', static: false },
        // { x: 10, y: 0, w: 2, h: 3, i: '5', static: false },
        // { x: 0, y: 5, w: 2, h: 5, i: '6', static: false },
        // { x: 2, y: 5, w: 2, h: 5, i: '7', static: false },
        // { x: 4, y: 5, w: 2, h: 5, i: '8', static: false },
        // { x: 6, y: 3, w: 2, h: 4, i: '9', static: false },
        // { x: 8, y: 4, w: 2, h: 4, i: '10', static: false },
        // { x: 10, y: 4, w: 2, h: 4, i: '11', static: false },
        // { x: 0, y: 10, w: 2, h: 5, i: '12', static: false },
        // { x: 2, y: 10, w: 2, h: 5, i: '13', static: false },
        // { x: 4, y: 8, w: 2, h: 4, i: '14', static: false },
        // { x: 6, y: 8, w: 2, h: 4, i: '15', static: false },
        // { x: 8, y: 10, w: 2, h: 5, i: '16', static: false },
        // { x: 10, y: 4, w: 2, h: 2, i: '17', static: false },
        // { x: 0, y: 9, w: 2, h: 3, i: '18', static: false },
        // { x: 2, y: 6, w: 2, h: 2, i: '19', static: false },
    ]);
    const wrapper = ref();
    const wrapperBounds = ref(null);
    const gridLayout = ref();

    onMounted(() => {
        wrapperBounds.value = wrapper.value.getBoundingClientRect();
    });
</script>

<style scoped>
    .vgl-layout {
        background-color: #eee;
    }

    :deep(.vgl-item:not(.vgl-item--placeholder)) {
        background-color: #ccc;
        border: 1px solid black;
    }

    :deep(.vgl-item--resizing) {
        opacity: 90%;
    }

    :deep(.vgl-item--static) {
        background-color: #cce;
    }

    .text {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        margin: auto;
        font-size: 24px;
        text-align: center;
    }

    .layout-json {
        padding: 10px;
        margin-top: 10px;
        background-color: #ddd;
        border: 1px solid black;
    }

    .columns {
        columns: 120px;
    }

    .droppable-element {
        width: 150px;
        padding: 10px;
        margin: 10px 0;
        text-align: center;
        background-color: #fdd;
        border: 1px solid black;
    }
</style>
