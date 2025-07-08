<template>
    <div ref="droppableElement" draggable="true" unselectable="on" @drag="drag" @dragend="dragEnd">
        <slot name="content"></slot>
    </div>
</template>

<script setup>
    import { onBeforeUnmount, onMounted, ref, computed } from 'vue';
    import throttle from 'lodash.throttle';

    const props = defineProps({
        layout: { type: Array, required: true },
        wraperBounds: { type: Object, required: true },
        gridLayout: { type: Object, required: true },
        component: { type: Object, default: {} },
    });

    const emit = defineEmits(['update:layout', 'update:wraperBounds', 'update:gridLayout']);

    const localLayout = computed({
        get: () => props.layout,
        set: v => emit('update:layout', v),
    });

    const localWrapper = computed({
        get: () => props.wraperBounds,
    });

    const localGridLayout = computed({
        get: () => props.gridLayout,
        set: v => emit('update:gridLayout', v),
    });

    const droppableElement = ref();
    const mouseAt = { x: -1, y: -1 };

    const defultMinMax = { minW: 5, minH: 5, maxH: 22 };
    const dropId = 'drop';
    const dragItem = {
        x: -1,
        y: -1,
        w: props.component?.itemData?.minW || defultMinMax.minW,
        h: props.component?.itemData?.minH || defultMinMax.minH,
        i: '',
    };

    let heighOffset = 0;
    let widthOffset = 0;
    let dropping = false;
    let waitingForRender = false;

    onMounted(() => {
        document.addEventListener('dragover', syncMousePosition);
        const droppableRect = droppableElement.value.getBoundingClientRect();
        heighOffset = droppableRect.height / 2;
        widthOffset = droppableRect.width / 2;
    });

    onBeforeUnmount(() => {
        document.removeEventListener('dragover', syncMousePosition);
    });

    function syncMousePosition(event) {
        mouseAt.x = event.clientX;
        mouseAt.y = event.clientY;
    }

    const drag = throttle(async () => {
        const parentRect = localWrapper.value?.getBoundingClientRect();

        if (!parentRect || !localGridLayout.value || dropping || waitingForRender) {
            return;
        }

        const mouseInGrid =
            mouseAt.x > parentRect.left &&
            mouseAt.x < parentRect.right &&
            mouseAt.y > parentRect.top &&
            mouseAt.y < parentRect.bottom;

        if (mouseInGrid && !localLayout.value.find(item => item.i === dropId)) {
            localLayout.value = [
                ...localLayout.value,
                {
                    x: (localLayout.value.length * 2) % 12,
                    y: localLayout.value.length + 12, // puts it at the bottom
                    w: props.component?.itemData?.minW || defultMinMax.minW,
                    h: props.component?.itemData?.minH || defultMinMax.minH,
                    i: dropId,
                },
            ];
            while (!localGridLayout.value.getItem(dropId)) {
                waitingForRender = true;
                await setTimeout(20);
            }
            waitingForRender = false;
            const item = localGridLayout.value.getItem(dropId);

            if (!item) return;

            try {
                item.wrapper.style.display = 'none';
            } catch (e) {}
        }

        const index = localLayout.value.findIndex(item => item.i === dropId);

        if (index !== -1) {
            const item = localGridLayout.value.getItem(dropId);

            if (!item) return;

            Object.assign(item.state, {
                top: mouseAt.y - parentRect.top,
                left: mouseAt.x - parentRect.left,
            });

            const newPos = item.calcXY(
                mouseAt.y - parentRect.top - heighOffset,
                mouseAt.x - parentRect.left - widthOffset
            );

            if (mouseInGrid) {
                localGridLayout.value.dragEvent('dragstart', dropId, newPos.x, newPos.y, dragItem.h, dragItem.w);
                dragItem.i = String(index);
                dragItem.x = localLayout.value[index].x;
                dragItem.y = localLayout.value[index].y;
            } else {
                localGridLayout.value.dragEvent('dragend', dropId, newPos.x, newPos.y, dragItem.h, dragItem.w);
                localLayout.value = localLayout.value.filter(item => item.i !== dropId);
            }
        }
    }, 20);

    const dragEnd = async () => {
        dropping = true;
        const parentRect = localWrapper.value?.getBoundingClientRect();

        if (!parentRect || !localGridLayout.value) {
            dropping = false;
            return;
        }
        const mouseInGrid =
            mouseAt.x > parentRect.left &&
            mouseAt.x < parentRect.right &&
            mouseAt.y > parentRect.top &&
            mouseAt.y < parentRect.bottom;

        if (mouseInGrid) {
            localGridLayout.value.dragEvent('dragend', dropId, dragItem.x, dragItem.y, dragItem.h, dragItem.w);
            localLayout.value = localLayout.value.filter(item => item.i !== dropId);
        } else {
            dropping = false;
            return;
        }

        let max = Math.max(...localLayout.value.map(item => item.i).filter(isFinite));
        if (!isFinite(max)) max = 0;

        localLayout.value = [
            ...localLayout.value.filter(item => item.i !== dropId),
            {
                x: dragItem.x,
                y: dragItem.y,
                w: dragItem.w,
                h: dragItem.h,
                i: max + 1,
                ...(props.component?.itemData || {
                    minW: defultMinMax.minW,
                    minH: defultMinMax.minH,
                    maxH: defultMinMax.maxH,
                }),
                props: { ...(props.component.metaData || { name: '' }) },
            },
        ];

        await setTimeout(() => {
            dropping = false;
            dragItem.x = 0;
            dragItem.y = 0;
            dragItem.i = '';
        }, 100);
    };
</script>
