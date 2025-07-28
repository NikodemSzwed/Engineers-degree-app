<template>
    <div class="flex flex-1 flex-col gap-3">
        <div class="flex flex-row gap-3">
            <Button @click="currentMode = 'view'">View</Button>
            <Button @click="currentMode = 'draw'">Draw</Button>
            <Button @click="currentMode = 'modify'">Edit</Button>
            <Button @click="currentMode = 'move'">Move</Button>
            <Button @click="currentMode = 'select'">Select</Button>
            <Button @click="fitMapToContainer">Reset</Button>
        </div>
        <Card class="w-full flex flex-1" :pt="{ content: 'flex flex-1', body: 'flex flex-1 p-2' }">
            <template #content>
                <div ref="mapContainer" class="w-full flex flex-1"></div>
            </template>
        </Card>


        <!-- <div class="flex flex-1 bg-red-500">
            asd
        </div> -->
    </div>

</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify, Select, Snap, Translate } from 'ol/interaction';
import { defaults as defaultInteractions } from 'ol/interaction';
import { Style, Stroke, Fill } from 'ol/style';
import { createBox } from 'ol/interaction/Draw';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import { Button, Card } from 'primevue';
import { primaryAction } from 'ol/events/condition';
import DragPan from 'ol/interaction/DragPan';
import TileLayer from 'ol/layer/Tile';
import { TileDebug } from 'ol/source';
import TileImage from 'ol/source/TileImage';
import { containsExtent } from 'ol/extent';

const currentMode = ref('view');
const mapContainer = ref(null);

const sectorSource = new VectorSource();
const sectorLayer = new VectorLayer({
    source: sectorSource,
    style: new Style({
        stroke: new Stroke({ color: getComputedStyle(document.documentElement).getPropertyValue('--color-primary'), width: 3 }),
        fill: new Fill({ color: 'rgba(0, 255, 0, 0.2)' }),
    }),
    renderBuffer: 1000,
});

const backgroundSource = new VectorSource();
const backgroundLayer = new VectorLayer({
    source: backgroundSource,
    style: new Style({
        stroke: new Stroke({ color: 'red', width: 3 }),
        fill: new Fill({ color: 'rgba(100, 100, 100, 1)' }),
    }),
    renderBuffer: 1000,
})

let map;

let drawInteraction, modifyInteraction, selectInteraction;
let translate;
let dragPanInteraction = new DragPan();
let cursorWasOutside = false;

onMounted(() => {
    // const mapContainerRect = mapContainer.value.getBoundingClientRect();
    let width = 1920;//mapContainerRect.width;
    let height = 1080;//mapContainerRect.height;
    let mapExtent = [0, 0, width, height];

    map = new Map({
        target: mapContainer.value,
        layers: [backgroundLayer, sectorLayer],
        // interactions: defaultInteractions({ dragPan: false }),
        view: new View({
            // center: [0, 0],
            // minZoom: 0,
            // maxZoom: 8,
            // zoom: 0,
            // extent: [0, 0, width, height],
            resolutions: [6, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625, 0.0078125],
            center: [width / 2, height / 2],
            // zoom: 1,
            constrainOnlyCenter: true,
            extent: mapExtent,
            constrainResolution: false,
        }),
    });


    const corners = [
        [0, 0],
        [width - 100, 0],
        [width - 100, height - 100],
        [0, height - 100],
    ];
    const rectangles = corners.map(([x, y]) => new Feature(
        new Polygon([[
            [x, y],
            [x + 100, y],
            [x + 100, y + 100],
            [x, y + 100],
            [x, y],
        ]])
    ));
    rectangles.push(new Feature(
        new Polygon([[
            [width / 2, height / 2],
            [width / 2 - 100, height / 2],
            [width / 2 - 100, height / 2 - 100],
            [width / 2, height / 2 - 100],
            [width / 2, height / 2]
        ]])
    ));
    sectorSource.addFeatures(rectangles);

    const backgroundRectangle = new Feature(
        new Polygon([[
            [0, 0],
            [width, 0],
            [width, height],
            [0, height],
            [0, 0],
        ]])
    )
    backgroundSource.addFeature(backgroundRectangle);

    drawInteraction = new Draw({
        source: sectorSource,
        type: 'Circle',
        geometryFunction: createBox(),
        extent: mapExtent,
    });

    selectInteraction = new Select({
        layers: [sectorLayer],
    });

    modifyInteraction = new Modify({
        features: selectInteraction.getFeatures(),
    });

    translate = new Translate({ features: selectInteraction.getFeatures() });
    translate.on('translating', (e) => {
        const currentPointerCoord = map.getCoordinateFromPixel(e.mapBrowserEvent.pixel);

        const outsideTop = currentPointerCoord[1] > mapExtent[3];
        const outsideBottom = currentPointerCoord[1] < mapExtent[1];
        const outsideLeft = currentPointerCoord[0] < mapExtent[0];
        const outsideRight = currentPointerCoord[0] > mapExtent[2];

        e.features.forEach((feature) => {
            const geometry = feature.getGeometry();
            const extent = geometry.getExtent();

            let dx = 0;
            let dy = 0;

            if (outsideLeft) {
                dx = mapExtent[0] - extent[0];
            } else if (outsideRight) {
                dx = mapExtent[2] - extent[2];
            } else {
                if (extent[0] < mapExtent[0]) {
                    dx = mapExtent[0] - extent[0];
                } else if (extent[2] > mapExtent[2]) {
                    dx = mapExtent[2] - extent[2];
                }
            }

            if (outsideBottom) {
                dy = mapExtent[1] - extent[1];
            } else if (outsideTop) {
                dy = mapExtent[3] - extent[3];
            } else {
                if (extent[1] < mapExtent[1]) {
                    dy = mapExtent[1] - extent[1];
                } else if (extent[3] > mapExtent[3]) {
                    dy = mapExtent[3] - extent[3];
                }
            }

            if (dx !== 0 || dy !== 0) {
                geometry.translate(dx, dy);
            }
        });
    });

    dragPanInteraction.setActive(false);
    drawInteraction.setActive(false);
    modifyInteraction.setActive(false);
    selectInteraction.setActive(false);
    translate.setActive(false);

    map.addInteraction(dragPanInteraction);
    map.addInteraction(drawInteraction);
    map.addInteraction(selectInteraction);
    map.addInteraction(modifyInteraction);
    map.addInteraction(translate);

    fitMapToContainer()

});

watch(currentMode, (mode) => {
    dragPanInteraction.setActive(false);
    drawInteraction.setActive(false);
    modifyInteraction.setActive(false);
    selectInteraction.setActive(false);
    translate.setActive(false);


    if (mode === 'draw') {
        dragPanInteraction.setActive(true);
        drawInteraction.setActive(true);
    } else if (mode === 'move') {
        selectInteraction.setActive(true);
        translate.setActive(true);
    } else if (mode === 'modify') {
        selectInteraction.setActive(true);
        modifyInteraction.setActive(true);
    } else if (mode === 'select') {
        selectInteraction.setActive(true);
    } else {
        dragPanInteraction.setActive(true);
    }

    if (selectInteraction)
        selectInteraction.on('select', (e) => {
            console.log('Selected features:', e.selected);
        });
});

function fitMapToContainer() {
    const mapWidth = 1920;
    const mapHeight = 1080;

    const container = map.getTargetElement();
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scaleX = mapWidth / containerWidth;
    const scaleY = mapHeight / containerHeight;

    const scale = Math.max(scaleX, scaleY);
    const baseResolution = 1;
    const newResolution = baseResolution * scale;

    const centerX = mapWidth / 2;
    const centerY = mapHeight / 2;

    map.getView().setCenter([centerX, centerY]);
    map.getView().setResolution(newResolution);
}

function createSolidColorTile(color, tileSize = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = tileSize;
    canvas.height = tileSize;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, tileSize, tileSize);
    return canvas;
}

</script>