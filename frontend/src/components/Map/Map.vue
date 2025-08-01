<template>
    <div class="flex flex-1 flex-col gap-3">
        <!-- <div class="flex flex-row gap-3">
            <Button @click="currentMode = 'view'">View</Button>
            <Button @click="currentMode = 'draw'">Draw</Button>
            <Button @click="currentMode = 'modify'">Edit</Button>
            <Button @click="currentMode = 'modifyPolygon'">Edit Polygon</Button>
            <Button @click="currentMode = 'select'">Select</Button>
            <Button @click="fitMapToContainer">Reset</Button>
            <ToggleButton v-model="enableSnap" onLabel="Snap On" offLabel="Snap Off" />
            <ToggleButton v-model="enableSimplifyGeometry" onLabel="Simplify Geometry On"
                offLabel="Simplify Geometry Off" />
            <ToggleButton v-model="enableZones" onLabel="Zones On" offLabel="Zones Off" />
            <Button @click="setSelectedShapeToRectangle">Reset Rect</Button>
        </div> -->

        <Card class="w-full flex flex-1" :pt="{ content: 'flex flex-1', body: 'flex flex-1 p-2' }">
            <template #content>
                <div ref="mapContainer" class="w-full flex flex-1"></div>
            </template>
        </Card>


        <!-- <img src="@/assets/vue.svg">

        </img> -->
        <!-- <div id="sector-icon" style="position: absolute;">
            <Card>
                <template #content>
                    <i class="pi pi-cog"></i>
                </template>
            </Card>

        </div> -->

    </div>

</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import olMap from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify, Select, Snap, Translate } from 'ol/interaction';
// import { defaults as defaultInteractions } from 'ol/interaction';
import { Style, Stroke, Fill, Text, Icon } from 'ol/style';
import { createBox } from 'ol/interaction/Draw';
import Feature from 'ol/Feature';
import { Polygon, LineString, Point, LinearRing, GeometryCollection, MultiLineString, MultiPoint, MultiPolygon } from 'ol/geom';
import { Button, Card, ToggleButton } from 'primevue';
// import { primaryAction } from 'ol/events/condition';
import DragPan from 'ol/interaction/DragPan';
// import TileLayer from 'ol/layer/Tile';
// import { TileDebug } from 'ol/source';
// import TileImage from 'ol/source/TileImage';
// import { containsExtent } from 'ol/extent';
import Transform from 'ol-ext/interaction/Transform';
// import { rotate } from 'ol/transform';
// import { GeoJSON } from 'ol/format';
// import * as jsts from 'jsts/dist/jsts.min.js';
// import { fromExtent } from 'ol/geom/Polygon';
import { useUserStore } from '../../stores/userData';
import Overlay from 'ol/Overlay';
import { hexToRgbaString, rgbToHexString } from '../../services/themeChanger';
import { fitMapToContainer, setShapeToRectangle, toggleLayerVisibility, simplifyPolygon } from './mapUtils';
import { all } from 'axios';
// import Icon from 'ol/style/Icon';

// const parser = new jsts.io.OL3Parser();
// parser.inject(
//     Polygon,
//     Point, LineString, LinearRing, MultiPoint, MultiLineString, MultiPolygon,
//     GeometryCollection
// );
// const reader = new jsts.io.GeoJSONReader();
// const geoJson = new GeoJSON();

const userData = useUserStore();

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    mode: {
        type: String,
        default: 'view',
    },
    enableSnap: {
        type: Boolean,
        default: true,
    },
    enableSimplifyGeometry: {
        type: Boolean,
        default: true,
    },
    layers: {
        type: Array,
        default: () => []
    },
    visibleLayers: {
        type: Array,
        default: () => []
    },
    editLayer: {
        type: Object,
        default: 'physical'
    },
    selected: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:mode', 'update:enableSnap', 'update:enableSimplifyGeometry', 'update:visibleLayers', 'update:selected']);

defineExpose({
    setSelectedShapeToRectangle,
    deleteSelectedShape,
});

const currentMode = computed({
    get: () => props.mode,
    set: (value) => {
        emit('update:mode', value);
    }
});
const enableSnap = computed({
    get: () => props.enableSnap,
    set: (value) => {
        emit('update:enableSnap', value);
    }
});
const enableSimplifyGeometry = computed({
    get: () => props.enableSimplifyGeometry,
    set: (value) => {
        emit('update:enableSimplifyGeometry', value);
    }
});
const localVisibleLayers = computed({
    get: () => props.visibleLayers,
    set: (value) => {
        emit('update:visibleLayers', value);
    }
})
const selected = computed({
    get: () => props.selected,
    set: (value) => {
        emit('update:selected', value);
    }
})


const mapContainer = ref(null);
let map;
let allLayers = [];
let layerMap = new Map();

//interactions
let drawInteraction;
let modifyInteraction;
let selectInteraction
let snapInteraction, snapToBoundary;
let transformInteraction;

//interaction helpers
const snapTolerance = 10;
let originalGeom = null;
let lastPointerCoord = null;



// const sectorSource = new VectorSource();
// const sectorLayer = new VectorLayer({
//     source: sectorSource,
//     style: new Style({
//         stroke: new Stroke({ color: getComputedStyle(document.documentElement).getPropertyValue('--color-primary'), width: 3 }),
//         fill: new Fill({ color: 'rgba(0, 255, 0, 0.2)' }),
//     }),
//     renderBuffer: 1000,
// });

// const backgroundSource = new VectorSource();
// const backgroundLayer = new VectorLayer({
//     source: backgroundSource,
//     style: new Style({
//         stroke: new Stroke({ color: 'red', width: 3 }),
//         fill: new Fill({ color: 'rgba(100, 100, 100, 1)' }),
//     }),
//     renderBuffer: 1000,
// })

// const zoneSource = new VectorSource();
// const zoneLayer = new VectorLayer({
//     source: zoneSource,
//     style: new Style({
//         stroke: new Stroke({ color: 'orange', width: 3 }),
//         fill: new Fill({ color: 'rgba(100, 100, 100, 0.1)' }),
//     }),
//     renderBuffer: 1000,
//     zIndex: 100
// })


// layerMap.set('physical', sectorLayer);
// layerMap.set('zones', zoneLayer);


onMounted(() => {
    const primaryHex = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();

    const mainStyle = new Style({
        stroke: new Stroke({
            color: primaryHex,
            width: 2,
        }),
        fill: new Fill({
            color: hexToRgbaString(primaryHex, 0.1),
        }),
        text: new Text({
            font: '14px Calibri,sans-serif',
            fill: new Fill({ color: userData.personalSettings.darkMode ? '#fff' : '#000' }),
            overflow: false,
        }),
    });
    // const backgroundStyle = new Style({
    //     stroke: new Stroke({
    //         color: getComputedStyle(document.documentElement).getPropertyValue('--color-primary'),
    //         width: 2,
    //     }),
    //     fill: new Fill({
    //         color: 'rgba(100, 100, 100, 0.1)',
    //     }),
    //     text: new Text({
    //         text: props.name,
    //         font: '18px Calibri,sans-serif',
    //         fill: new Fill({ color: userData.personalSettings.darkMode ? '#fff' : '#000' }),
    //         overflow: true,
    //     }),
    // });

    function LODcontrol(map, sourceStyle, options = {}) {
        if (options.minZoom === undefined) options.minZoom = 0;
        if (options.maxZoom === undefined) options.maxZoom = 10;
        if (options.color === undefined) options.color = '#ffffff';
        if (options.fillColor === undefined) options.fillColor = null;
        if (options.font === undefined) options.font = '14px Calibri,sans-serif';

        const localStyle = sourceStyle.clone();

        // changes applied once
        localStyle.getStroke().setColor(options.color);
        if (options.fillColor) localStyle.getFill().setColor(options.fillColor);
        else localStyle.getFill().setColor(hexToRgbaString(options.color, 0.1));

        localStyle.getText().setFont(options.font);

        // dynamic changes
        return (feature, resolution) => {
            const zoom = map.getView().getZoomForResolution(resolution);

            const style = localStyle.clone();

            if (zoom >= options.minZoom && zoom <= options.maxZoom) {
                style.getText().setText(feature.name || '');
            }

            return style;
        }
    };

    let tempColors = ['#00ff00', '#ff0000', '#0000ff'];

    function generateLayers(map, layers) {
        const backgroundSource = new VectorSource();
        const backgroundLayer = new VectorLayer({
            source: backgroundSource,
            style: LODcontrol(map, mainStyle, { minZoom: 0, maxZoom: 4, color: primaryHex, fillColor: 'rgba(100, 100, 100, 0.1)', font: '18px Calibri,sans-serif' }),
            renderBuffer: 1000,
        });
        allLayers.push(backgroundLayer);
        map.addLayer(backgroundLayer);

        layers.forEach((layer, i) => {
            const newSource = new VectorSource();
            const newLayer = new VectorLayer({
                source: newSource,
                style: LODcontrol(map, mainStyle, { minZoom: 0.5, maxZoom: 7, color: tempColors[i] }),
                renderBuffer: 1000,
            });
            layerMap.set(layer.value, newLayer);
            allLayers.push(newLayer);
            map.addLayer(newLayer);
        })

        const alertSource = new VectorSource();
        const alertLayer = new VectorLayer({
            source: alertSource,
            style: (feature) => {
                return new Style({
                    image: new Icon({
                        src: './src/assets/vue.svg',
                        scale: 1,
                    }),
                });
            },
        });
        allLayers.push(alertLayer);
        map.addLayer(alertLayer);
    }

    function updateAlertPoints(alertedIds) {
        allLayers[allLayers.length - 1].getSource().clear();

        allLayers[1].getSource().getFeatures().forEach((feature) => {
            const id = feature.id;
            if (!alertedIds.includes(id)) return;

            const extent = feature.getGeometry().getExtent();
            const topCenter = [(extent[0] + extent[2]) / 2, extent[3]];

            const alertFeature = new Feature({
                geometry: new Point(topCenter),
            });
            console.log("🚀 ~ updateAlertPoints ~ alertFeature:", alertFeature)

            allLayers[allLayers.length - 1].getSource().addFeature(alertFeature);
        });
    }

    function generateResolutions(samples = 10, shift = 0, samplesStep = 1, mixinStaticResolutions = []) {
        let resolutions = [];
        for (let i = samples; i > 0; i -= samplesStep) {
            resolutions.push(Math.pow(2, i - samples / 2 + shift));
        }

        resolutions.push(...mixinStaticResolutions);
        resolutions = resolutions.sort((a, b) => b - a);

        return resolutions;
    }

    // const mapContainerRect = mapContainer.value.getBoundingClientRect();
    let width = 1920;//mapContainerRect.width;
    let height = 1080;//mapContainerRect.height;
    let mapExtent = [0, 0, width, height];

    map = new olMap({
        target: mapContainer.value,
        layers: [],
        // interactions: defaultInteractions({ dragPan: false }),
        view: new View({
            // center: [0, 0],
            // minZoom: 0,
            // maxZoom: 8,
            // zoom: 0,
            // extent: [0, 0, width, height],
            // resolutions: [6, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625],
            resolutions: generateResolutions(10, -2, 1, [6]),
            center: [width / 2, height / 2],
            // zoom: 1,
            constrainOnlyCenter: true,
            extent: mapExtent,
            constrainResolution: false,
        }),
    });
    // map.on('postrender', function (event) {
    //     const context = event.context;
    //     console.log("🚀 ~ context:", context)

    //     if (context && !context._patched && context.canvas) {
    //         const canvas = context.canvas;

    //         const newCtx = canvas.getContext('2d', { willReadFrequently: true });
    //         console.log("🚀 ~ newCtx:", newCtx)
    //         if (newCtx) {
    //             event.context = newCtx;
    //             newCtx._patched = true;
    //         }
    //     }
    // });
    // map.addLayer(zoneLayer);

    generateLayers(map, props.layers);
    console.log("🚀 ~ allLayers:", allLayers)
    console.log("🚀 ~ layerMap:", layerMap)

    ///******** overlay for pure html - doesn't scale */
    // const sectorIconElement = document.getElementById('sector-icon');
    // let sectorIconElementRect = sectorIconElement.getBoundingClientRect();
    // console.log("🚀 ~ sectorIconElement.getBoundingClientRect():", sectorIconElement.getBoundingClientRect())

    // const sectorOverlay = new Overlay({
    //     element: sectorIconElement,
    //     positioning: 'center-center',
    //     stopEvent: false,
    // });

    // map.addOverlay(sectorOverlay);

    // function updateSectorIconPosition(feature) {
    //     const extent = feature.getGeometry().getExtent();
    //     // const sectorIconElementRect = sectorIconElement.getBoundingClientRect();

    //     const sectorOverlayWidth = sectorIconElementRect.width;
    //     const topRight = [extent[2] - sectorOverlayWidth, extent[3]];

    //     sectorOverlay.setPosition(topRight);
    // }




    // const labelStyle = new Style({
    //     stroke: new Stroke({
    //         color: 'blue',
    //         width: 2,
    //     }),
    //     fill: new Fill({
    //         color: 'rgba(0, 0, 255, 0.1)',
    //     }),
    //     text: new Text({
    //         text: 'Your Label',
    //         font: '14px Calibri,sans-serif',
    //         fill: new Fill({ color: '#000' }),
    //         stroke: new Stroke({ color: '#fff', width: 3 }),
    //         overflow: true,
    //     }),
    // });






    // const sectorStyle = new Style({
    //     stroke: new Stroke({
    //         color: primaryHex,
    //         width: 2,
    //     }),
    //     fill: new Fill({
    //         color: rgbToHexString(primaryHex, 0.1),
    //     }),
    //     text: new Text({
    //         font: '14px Calibri,sans-serif',
    //         fill: new Fill({ color: userData.personalSettings.darkMode ? '#fff' : '#000' }),
    //         overflow: false,
    //         // textAlign: 'right',
    //         // textBaseline: 'top',
    //     }),
    // });

    // const dynamicStyleFunction = (feature) => {
    //     const style = sectorStyle.clone();
    //     style.getText().setText(feature.name || '');
    //     return style;
    // };

    // const backgroundStyle = new Style({
    //     stroke: new Stroke({
    //         color: getComputedStyle(document.documentElement).getPropertyValue('--color-primary'),
    //         width: 2,
    //     }),
    //     fill: new Fill({
    //         color: 'rgba(100, 100, 100, 0.1)',
    //     }),
    //     text: new Text({
    //         text: props.name,
    //         font: '18px Calibri,sans-serif',
    //         fill: new Fill({ color: userData.personalSettings.darkMode ? '#fff' : '#000' }),
    //         overflow: true,
    //     }),
    // });
    // console.log("🚀 ~ document.documentElement:", userData.personalSettings.darkMode)

    let size = 250;
    const corners = [
        [0, 0],
        [width - size, 0],
        [width - size, height - size],
        [0, height - size],
    ];
    let a = 0;
    const rectangles = corners.map(([x, y]) => {
        let f = new Feature(
            new Polygon([[
                [x, y],
                [x + size, y],
                [x + size, y + size],
                [x, y + size],
                [x, y],
            ]])
        )
        f.id = a;
        f.name = 'A' + a++;

        // console.log("🚀 ~ f:", f)
        return f;
    }
    );
    rectangles.push(new Feature(
        new Polygon([[
            [width / 2, height / 2],
            [width / 2 - 100, height / 2],
            [width / 2 - 100, height / 2 - 100],
            [width / 2, height / 2 - 100],
            [width / 2, height / 2]
        ]])
    ));
    // rectangles[0].setStyle(sectorStyle);
    // updateSectorIconPosition(rectangles[0]);
    allLayers[1].getSource().addFeatures(rectangles);
    // sectorLayer.setStyle(dynamicStyleFunction);

    const backgroundRectangle = new Feature(
        new Polygon([[
            [0, 0],
            [width, 0],
            [width, height],
            [0, height],
            [0, 0],
        ]])
    )
    backgroundRectangle.name = props.name;
    allLayers[0].getSource().addFeature(backgroundRectangle);
    // backgroundSource.addFeature(backgroundRectangle);
    // backgroundRectangle.setStyle(backgroundStyle);

    const zone1 = new Feature(
        new Polygon([[
            [200, 200],
            [width - 500, 200],
            [width - 500, height - 500],
            [200, height - 500],
            [200, 200],
        ]])
    )
    // zoneSource.addFeature(zone1);
    allLayers[2].getSource().addFeature(zone1);

    updateAlertPoints([0]);

    selectInteraction = new Select({
        layers: [allLayers[1]],
    });

    drawInteraction = new Draw({
        source: allLayers[1].getSource(),
        type: 'Circle',
        geometryFunction: (coordinates, geometry) => {
            const boxGeom = createBox()(coordinates, geometry);
            const boxExtent = boxGeom.getExtent();

            const clippedExtent = [
                Math.min(Math.max(boxExtent[0], mapExtent[0] + 1), mapExtent[2]),
                Math.min(Math.max(boxExtent[1], mapExtent[1] + 1), mapExtent[3]),
                Math.max(Math.min(boxExtent[2], mapExtent[2] + 1), mapExtent[0]),
                Math.max(Math.min(boxExtent[3], mapExtent[3] + 1), mapExtent[1])
            ];

            // console.log("🚀 ~ mapExtent:", mapExtent)
            const clippedCoords = [
                [
                    [clippedExtent[0], clippedExtent[1]],
                    [clippedExtent[2], clippedExtent[1]],
                    [clippedExtent[2], clippedExtent[3]],
                    [clippedExtent[0], clippedExtent[3]],
                    [clippedExtent[0], clippedExtent[1]],
                ],
            ];

            if (!geometry) {
                geometry = new Polygon(clippedCoords);
            } else {
                geometry.setCoordinates(clippedCoords);
            }

            return geometry;

        }
    });

    drawInteraction.on('drawend', (e) => {
        selectInteraction.getFeatures().clear();
        selectInteraction.getFeatures().push(e.feature);
    });


    modifyInteraction = new Modify({
        features: selectInteraction.getFeatures(),
    });
    modifyInteraction.on('modifystart', (e) => {
        const feature = e.features.item(0);
        originalGeom = feature.getGeometry().clone();
    });
    modifyInteraction.on('modifyend', (e) => {
        e.features.forEach((feature) => {
            const geometry = feature.getGeometry();
            const extent = geometry.getExtent();

            const isInside =
                extent[0] >= mapExtent[0] &&
                extent[1] >= mapExtent[1] &&
                extent[2] <= mapExtent[2] &&
                extent[3] <= mapExtent[3];

            if (!isInside && originalGeom) {
                feature.setGeometry(originalGeom.clone());
            }

            if (enableSimplifyGeometry.value) {
                const geom = feature.getGeometry();
                simplifyPolygon(geom, 3);
            }
        });
        originalGeom = null;
    });

    transformInteraction = new Transform({
        rotate: true,
        translateFeature: true,
        translate: true,
        scale: true,
        stretch: true,
        keepAspectRatio: false,
        filter: (feature, layer) => {
            return layer === layerMap.get(props.editLayer.value);
        },
    });

    snapInteraction = new Snap({
        source: allLayers[1].getSource(),
    })
    snapToBoundary = new Snap({
        source: allLayers[0].getSource(),
    });

    transformInteraction.on('select', (e) => {
        selected.value = e.features.item(0);
        originalGeom = e.features.item(0)?.getGeometry().clone();
    })
    transformInteraction.on('selectend', (e) => {
        selected.value = null;
        originalGeom = null;
    })

    transformInteraction.on('translating', (e) => {
        const featuresToSnap = allLayers[1].getSource().getFeatures();

        const currentPointerCoord = map.getCoordinateFromPixel(e.pixel);

        const outsideTop = currentPointerCoord[1] > mapExtent[3];
        const outsideBottom = currentPointerCoord[1] < mapExtent[1];
        const outsideLeft = currentPointerCoord[0] < mapExtent[0];
        const outsideRight = currentPointerCoord[0] > mapExtent[2];

        const pointerDelta = [
            currentPointerCoord[0] - (lastPointerCoord?.[0] ?? currentPointerCoord[0]),
            currentPointerCoord[1] - (lastPointerCoord?.[1] ?? currentPointerCoord[1]),
        ];
        lastPointerCoord = currentPointerCoord;


        e.features.forEach((feature) => {
            const geometry = feature.getGeometry();
            const extent = geometry.getExtent();

            let dx = 0;
            let dy = 0;

            let snapDx = 0;
            let snapDy = 0;
            let snapFound = false;

            if (enableSnap.value) {
                featuresToSnap.forEach((otherFeature) => {
                    if (otherFeature.ol_uid === feature.ol_uid) return;

                    const otherGeom = otherFeature.getGeometry();
                    const otherExtent = otherGeom.getExtent();

                    const closestOnOther = otherGeom.getClosestPoint(geometry.getFirstCoordinate());
                    const closestOnSelf = geometry.getClosestPoint(closestOnOther);

                    const dxReal = closestOnOther[0] - closestOnSelf[0];
                    const dyReal = closestOnOther[1] - closestOnSelf[1];
                    const realDist = Math.hypot(dxReal, dyReal);

                    if (realDist > snapTolerance) {
                        return;
                    }

                    const snapVector = [
                        closestOnOther[0] - closestOnSelf[0],
                        closestOnOther[1] - closestOnSelf[1],
                    ];

                    const dot = snapVector[0] * pointerDelta[0] + snapVector[1] * pointerDelta[1];

                    if (dot < 0) {
                        return;
                    }

                    const distLeftRight = Math.abs(extent[0] - otherExtent[2]);
                    const distRightLeft = Math.abs(extent[2] - otherExtent[0]);
                    const distTopBottom = Math.abs(extent[3] - otherExtent[1]);
                    const distBottomTop = Math.abs(extent[1] - otherExtent[3]);

                    if (distLeftRight < snapTolerance) {
                        snapDx = otherExtent[2] - extent[0];
                        snapFound = true;
                    } else if (distRightLeft < snapTolerance) {
                        snapDx = otherExtent[0] - extent[2];
                        snapFound = true;
                    }

                    if (distTopBottom < snapTolerance) {
                        snapDy = otherExtent[1] - extent[3];
                        snapFound = true;
                    } else if (distBottomTop < snapTolerance) {
                        snapDy = otherExtent[3] - extent[1];
                        snapFound = true;
                    }
                });

                if (snapFound) {
                    dx = snapDx;
                    dy = snapDy;
                }
            }


            //confy to map bounds
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

    transformInteraction.on('rotating', (e) => {
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
    transformInteraction.on('scaling', (e) => {
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

    // dragPanInteraction.setActive(false);
    drawInteraction.setActive(false);
    modifyInteraction.setActive(false);
    selectInteraction.setActive(false);
    // translate.setActive(false);
    transformInteraction.setActive(false);
    snapInteraction.setActive(false);
    snapToBoundary.setActive(false);

    // map.addInteraction(dragPanInteraction);
    map.addInteraction(drawInteraction);
    map.addInteraction(selectInteraction);
    map.addInteraction(modifyInteraction);
    // map.addInteraction(translate);
    map.addInteraction(transformInteraction);
    map.addInteraction(snapInteraction);
    map.addInteraction(snapToBoundary);

    fitMapToContainer(map);

});

watch(currentMode, (mode) => {
    // dragPanInteraction.setActive(false);
    drawInteraction.setActive(false);
    modifyInteraction.setActive(false);
    selectInteraction.setActive(false);
    selectInteraction.getFeatures().clear();
    // translate.setActive(false);
    transformInteraction.setActive(false);
    snapInteraction.setActive(false);
    snapToBoundary.setActive(false);


    if (mode === 'draw') {
        // dragPanInteraction.setActive(true);
        drawInteraction.setActive(true);
        if (enableSnap.value) {
            snapInteraction.setActive(true);
            snapToBoundary.setActive(true);
        }
    } else if (mode === 'modifyPolygon') {
        selectInteraction.setActive(true);
        modifyInteraction.setActive(true);
        // translate.setActive(true);
        if (enableSnap.value) {
            snapInteraction.setActive(true);
            snapToBoundary.setActive(true);
        }
    } else if (mode === 'modify') {
        // selectInteraction.setActive(true);
        // snapInteraction.setActive(true);
        transformInteraction.setActive(true);

    } else if (mode === 'select') {
        selectInteraction.setActive(true);
    } else {
        // dragPanInteraction.setActive(true);
    }

    if (selectInteraction)
        selectInteraction.on('select', (e) => {
            selected.value = e.selected[0];
        });
});

watch(enableSnap, (value) => {
    if (currentMode.value === 'modifyPolygon') {
        snapInteraction.setActive(value);
        snapToBoundary.setActive(value);
    }
});

watch(localVisibleLayers, (visible) => {
    props.layers.forEach((layer) => {
        let l = layerMap.get(layer.value);

        if (!l) return;

        if (visible.some((visl) => visl.value === layer.value)) toggleLayerVisibility(l, true);
        else toggleLayerVisibility(l, false);
    })
})

function createSolidColorTile(color, tileSize = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = tileSize;
    canvas.height = tileSize;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, tileSize, tileSize);
    return canvas;
}

function setSelectedShapeToRectangle() {
    let f = selectInteraction.getFeatures().getArray()[0];
    if (f) setShapeToRectangle(f);
}

function deleteSelectedShape() {
    allLayers.forEach((layer) => {
        layer.getSource().removeFeature(selected.value);
    })
}


</script>