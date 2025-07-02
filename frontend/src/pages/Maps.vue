<template>
    <div class="bg-red-200">
        <GridLayout v-model:layout="layout" :col-num="12" :row-height="30" is-draggable is-resizable
            :vertical-compact="false" use-css-transforms>
            <template #item="{ item }">
                <div class="bg-white w-full h-full">
                    {{ item.i }}
                </div>
            </template>
        </GridLayout>
    </div>

    <!-- <GridLayout>
        <GridItem />
    </GridLayout> -->
</template>

<script setup lang="ts">
import { GridLayout, GridItem } from 'grid-layout-plus'
import { reactive } from 'vue'

const layout = reactive([
    { x: 0, y: 0, w: 2, h: 2, i: '0', static: false },
    { x: 3, y: 0, w: 2, h: 4, i: '1', static: false },
    { x: 4, y: 0, w: 2, h: 5, i: '2', static: false },
    { x: 6, y: 0, w: 2, h: 3, i: '3', static: false },
    { x: 8, y: 0, w: 2, h: 3, i: '4', static: false },
    { x: 10, y: 0, w: 2, h: 3, i: '5', static: false },
    { x: 0, y: 5, w: 2, h: 5, i: '6', static: false },
    { x: 2, y: 5, w: 2, h: 5, i: '7', static: false },
    { x: 4, y: 5, w: 2, h: 5, i: '8', static: false },
    { x: 6, y: 3, w: 2, h: 4, i: '9', static: false },
    { x: 8, y: 4, w: 2, h: 4, i: '10', static: false },
    { x: 10, y: 4, w: 2, h: 4, i: '11', static: false },
    { x: 0, y: 10, w: 2, h: 5, i: '12', static: false },
    { x: 2, y: 10, w: 2, h: 5, i: '13', static: false },
    { x: 4, y: 8, w: 2, h: 4, i: '14', static: false },
    { x: 6, y: 8, w: 2, h: 4, i: '15', static: false },
    { x: 8, y: 10, w: 2, h: 5, i: '16', static: false },
    { x: 10, y: 4, w: 2, h: 2, i: '17', static: false },
    { x: 0, y: 9, w: 2, h: 3, i: '18', static: false },
    { x: 2, y: 6, w: 2, h: 2, i: '19', static: false },
])
</script>

<script></script>