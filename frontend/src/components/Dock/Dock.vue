<template>
    <Dialog v-model:visible="localVisible" :header="header" :position="position" :modal="false"
        :class="{ 'w-[20rem] max-h-[50rem]': direction === 'vertical', 'max-w-[60rem]': direction === 'horizontal' }"
        :pt="{
            content: {
                ref: (el) => scrollableContainer = el,
                class: {
                    'overflow-auto': true,
                    'mb-6 ml-1.5 mr-1.5 pb-0 pr-1.5': hasVerticalScroll,
                    'mb-2 pb-2': hasHorizontalScroll
                }
            },
            header: {
                class: { 'cursor-grab': true }
            }
        }">
        <div class="flex gap-3"
            :class="{ 'flex-col items-center': direction === 'vertical', 'flex-row w-fit justify-center': direction === 'horizontal' }">
            <slot name="content" />
        </div>
    </Dialog>
</template>

<script setup>
import { ref, computed, toRefs, onMounted, onUpdated, nextTick } from 'vue'
import Dialog from 'primevue/dialog';



const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    header: {
        type: String,
        default: ''
    },
    position: {
        type: String,
        default: 'right'
    }
})

const emit = defineEmits(['update:visible'])



const { visible, position } = toRefs(props);

const direction = ref('horizontal');

if (position.value === 'right' || position.value === "left") {
    direction.value = 'vertical';
}


const localVisible = computed({
    get: () => visible.value,
    set: v => emit('update:visible', v)
})


const scrollableContainer = ref(null)
const hasVerticalScroll = ref(false)
const hasHorizontalScroll = ref(false)


const checkScroll = () => {
    if (scrollableContainer.value) {
        hasVerticalScroll.value = scrollableContainer.value.scrollHeight > scrollableContainer.value.clientHeight
        hasHorizontalScroll.value = scrollableContainer.value.scrollWidth > scrollableContainer.value.clientWidth
    }
}

onMounted(() => nextTick(checkScroll))
onUpdated(() => nextTick(checkScroll))
</script>