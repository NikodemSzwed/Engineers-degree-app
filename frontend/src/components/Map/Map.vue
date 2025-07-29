<template>
    <div class="flex flex-1 flex-col gap-3">
        <div class="flex flex-row gap-3">
            <Button @click="currentMode = 'view'">View</Button>
            <Button @click="currentMode = 'draw'">Draw</Button>
            <Button @click="currentMode = 'modify'">Edit</Button>
            <Button @click="currentMode = 'modifyPolygon'">Edit Polygon</Button>
            <!-- <Button @click="currentMode = 'select'">Select</Button> -->
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
import { Style, Stroke, Fill, Text } from 'ol/style';
import { createBox } from 'ol/interaction/Draw';
import Feature from 'ol/Feature';
import { Polygon, LineString, Point, LinearRing, GeometryCollection, MultiLineString, MultiPoint, MultiPolygon } from 'ol/geom';
import { Button, Card } from 'primevue';
import { primaryAction } from 'ol/events/condition';
import DragPan from 'ol/interaction/DragPan';
import TileLayer from 'ol/layer/Tile';
import { TileDebug } from 'ol/source';
import TileImage from 'ol/source/TileImage';
import { containsExtent } from 'ol/extent';
import Transform from 'ol-ext/interaction/Transform';
import { rotate } from 'ol/transform';
import { GeoJSON } from 'ol/format';
import * as jsts from 'jsts/dist/jsts.min.js';
import { fromExtent } from 'ol/geom/Polygon';

const parser = new jsts.io.OL3Parser();
parser.inject(
    Polygon,
    Point, LineString, LinearRing, MultiPoint, MultiLineString, MultiPolygon,
    GeometryCollection
);
const reader = new jsts.io.GeoJSONReader();
const geoJson = new GeoJSON();

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
let transform;
let translate;
let dragPanInteraction = new DragPan();
let cursorWasOutside = false;

let originalGeom = null;
const snapTolerance = 1;

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
            resolutions: [6, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625],
            center: [width / 2, height / 2],
            // zoom: 1,
            constrainOnlyCenter: true,
            extent: mapExtent,
            constrainResolution: false,
        }),
    });

    const labelStyle = new Style({
        stroke: new Stroke({
            color: 'blue',
            width: 2,
        }),
        fill: new Fill({
            color: 'rgba(0, 0, 255, 0.1)',
        }),
        text: new Text({
            text: 'Your Label',
            font: '14px Calibri,sans-serif',
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({ color: '#fff', width: 3 }),
            overflow: true,
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
    rectangles[0].setStyle(labelStyle);
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
    backgroundRectangle.setStyle(labelStyle);

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
    modifyInteraction.on('modifying', (e) => {
        console.log("🚀 ~ modifying:", e)

    })

    transform = new Transform({
        rotate: true,
        translateFeature: true,
        translate: true,
        scale: true,
        stretch: false,
        keepAspectRatio: false,
        layers: [sectorLayer],
    });

    transform.on('translating', (e) => {
        const featuresToSnap = sectorLayer.getSource().getFeatures();
        const currentPointerCoord = map.getCoordinateFromPixel(e.pixel);

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

            let snapDx = 0;
            let snapDy = 0;
            let snapFound = false;

            featuresToSnap.forEach((otherFeature) => {
                if (otherFeature === feature) return; // skip self

                const otherGeom = otherFeature.getGeometry();
                const otherExtent = otherGeom.getExtent();

                // Example: snap if left edge close to other's right edge
                const distLeftRight = Math.abs(extent[0] + dx - otherExtent[2]);
                if (distLeftRight < snapTolerance) {
                    snapDx = otherExtent[2] - extent[0];
                    snapFound = true;
                }

                // Similarly for right edge to left edge
                const distRightLeft = Math.abs(extent[2] + dx - otherExtent[0]);
                if (distRightLeft < snapTolerance) {
                    snapDx = otherExtent[0] - extent[2];
                    snapFound = true;
                }

                // For top/bottom edges snapping
                const distTopBottom = Math.abs(extent[3] + dy - otherExtent[1]);
                if (distTopBottom < snapTolerance) {
                    snapDy = otherExtent[1] - extent[3];
                    snapFound = true;
                }

                const distBottomTop = Math.abs(extent[1] + dy - otherExtent[3]);
                if (distBottomTop < snapTolerance) {
                    snapDy = otherExtent[3] - extent[1];
                    snapFound = true;
                }
            });

            if (snapFound) {
                dx = snapDx;
                dy = snapDy;
            }

            if (dx !== 0 || dy !== 0) {
                geometry.translate(dx, dy);
            }
        });
    });
    transform.on('rotating', (e) => {

        const feature = e.feature;
        const geometry = feature.getGeometry();
        const extent = geometry.getExtent();

        const isInside =
            extent[0] >= mapExtent[0] &&
            extent[1] >= mapExtent[1] &&
            extent[2] <= mapExtent[2] &&
            extent[3] <= mapExtent[3];

        if (!isInside && originalGeom) {
            feature.setGeometry(originalGeom.clone());
        } else {
            originalGeom = geometry.clone();
        }
    })
    transform.on('scaling', (e) => {
        const feature = e.feature;
        const geometry = feature.getGeometry();
        const extent = geometry.getExtent();

        const isInside =
            extent[0] >= mapExtent[0] &&
            extent[1] >= mapExtent[1] &&
            extent[2] <= mapExtent[2] &&
            extent[3] <= mapExtent[3];

        if (!isInside && originalGeom) {
            feature.setGeometry(originalGeom.clone());
        } else {
            originalGeom = geometry.clone();
        }
    })

    ///**** by coordinates */
    // // const extentPolygon = fromExtent(mapExtent); // OL geometry
    //     // console.log("🚀 ~ extentPolygon:", extentPolygon)
    //     // const jstsExtent = parser.read(extentPolygon);
    //     // console.log("🚀 ~ jstsExtent:", jstsExtent)
    //     // console.log("🚀 ~ jstsExtent:", jstsExtent.isValid())
    //     // // console.log("🚀 ~ jstsExtent:", jstsExtent)

    //     // const jstsGeom = parser.read(geometry);
    //     // console.log("🚀 ~ geometry:", geometry)
    //     // console.log("🚀 ~ jstsGeom:", jstsGeom)
    //     // console.log("🚀 ~ jstsGeom:", jstsGeom.isValid())
    //     // if (!jstsExtent.contains(jstsGeom)) {
    //     //     console.log("🚀 ~ not inside:")
    //     // } else {
    //     //     console.log("🚀 ~ inside:")
    //     // }

    //     const olExtentPolygon = fromExtent(mapExtent);
    //     const jstsExtent = reader.read(geoJson.writeGeometryObject(olExtentPolygon));
    //     console.log("🚀 ~ jstsExtent:", jstsExtent)

    //     const jstsGeom = reader.read(geoJson.writeGeometryObject(geometry));
    //     console.log("🚀 ~ jstsGeom:", jstsGeom)

    //     // Validity check
    //     // console.log("Extent valid?", jstsExtent.isValid()); // should now be true
    //     // console.log("Geometry valid?", jstsGeom.isValid()); // should now be true

    //     jstsGeom.normalize();
    //     jstsExtent.normalize();

    //     const cleanExtent = jstsExtent.buffer(0);
    //     const cleanGeom = jstsGeom.buffer(0);

    //     // if (!cleanExtent.contains(cleanGeom)) {
    //     //     console.log("❌ Not inside");
    //     //     feature.setGeometry(originalGeom.clone());
    //     // } else {
    //     //     originalGeom = geometry.clone();
    //     //     console.log("✅ Inside");
    //     // }



    // translate = new Translate({ features: selectInteraction.getFeatures() });
    // translate.on('translating', (e) => {
    //     console.log("🚀 ~ e:", e)
    //     const currentPointerCoord = map.getCoordinateFromPixel(e.mapBrowserEvent.pixel);

    //     const outsideTop = currentPointerCoord[1] > mapExtent[3];
    //     const outsideBottom = currentPointerCoord[1] < mapExtent[1];
    //     const outsideLeft = currentPointerCoord[0] < mapExtent[0];
    //     const outsideRight = currentPointerCoord[0] > mapExtent[2];

    //     e.features.forEach((feature) => {
    //         const geometry = feature.getGeometry();
    //         const extent = geometry.getExtent();

    //         let dx = 0;
    //         let dy = 0;

    //         if (outsideLeft) {
    //             dx = mapExtent[0] - extent[0];
    //         } else if (outsideRight) {
    //             dx = mapExtent[2] - extent[2];
    //         } else {
    //             if (extent[0] < mapExtent[0]) {
    //                 dx = mapExtent[0] - extent[0];
    //             } else if (extent[2] > mapExtent[2]) {
    //                 dx = mapExtent[2] - extent[2];
    //             }
    //         }

    //         if (outsideBottom) {
    //             dy = mapExtent[1] - extent[1];
    //         } else if (outsideTop) {
    //             dy = mapExtent[3] - extent[3];
    //         } else {
    //             if (extent[1] < mapExtent[1]) {
    //                 dy = mapExtent[1] - extent[1];
    //             } else if (extent[3] > mapExtent[3]) {
    //                 dy = mapExtent[3] - extent[3];
    //             }
    //         }

    //         if (dx !== 0 || dy !== 0) {
    //             geometry.translate(dx, dy);
    //         }
    //     });
    // });

    dragPanInteraction.setActive(false);
    drawInteraction.setActive(false);
    modifyInteraction.setActive(false);
    selectInteraction.setActive(false);
    // translate.setActive(false);
    transform.setActive(false);

    map.addInteraction(dragPanInteraction);
    map.addInteraction(drawInteraction);
    map.addInteraction(selectInteraction);
    map.addInteraction(modifyInteraction);
    // map.addInteraction(translate);
    map.addInteraction(transform);

    fitMapToContainer()

});

watch(currentMode, (mode) => {
    dragPanInteraction.setActive(false);
    drawInteraction.setActive(false);
    modifyInteraction.setActive(false);
    selectInteraction.setActive(false);
    selectInteraction.getFeatures().clear();
    // translate.setActive(false);
    transform.setActive(false);


    if (mode === 'draw') {
        dragPanInteraction.setActive(true);
        drawInteraction.setActive(true);
    } else if (mode === 'modifyPolygon') {
        selectInteraction.setActive(true);
        modifyInteraction.setActive(true);
    } else if (mode === 'modify') {

        transform.setActive(true);
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