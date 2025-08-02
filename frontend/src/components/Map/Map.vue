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
// import DragPan from 'ol/interaction/DragPan';
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
// import Overlay from 'ol/Overlay';
import { hexToRgbaString, rgbToHexString, blendColors } from '../../services/themeChanger';
import { fitMapToContainer, setShapeToRectangle, toggleLayerVisibility, simplifyPolygon, setShapePointsToClosestExtentBorder, snapFeature, getPointerDeltaFunction, generateResolutions } from './mapUtils';
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
    setSelectedShapePointsToClosestExtentBorder
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

const getPointerDelta = getPointerDeltaFunction();
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
        let textDefaultColor = userData.personalSettings.darkMode ? '#ffffff' : '#000000';
        let blendWeight = userData.personalSettings.darkMode ? 0.65 : 0.40;
        let textColor = blendColors(options.color, textDefaultColor, blendWeight)
        localStyle.getText().setFill(new Fill({ color: textColor }));

        // dynamic changes
        return (feature, resolution) => {
            const zoom = map.getView().getZoomForResolution(resolution);

            const style = localStyle.clone();

            if (zoom >= options.minZoom && zoom <= options.maxZoom) {
                style.getText().setText(feature.customData?.name || '');
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
            const id = feature?.customData?.id;
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



    let width = 1920;
    let height = 1080;
    let mapExtent = [0, 0, width, height];

    map = new olMap({
        target: mapContainer.value,
        layers: [],
        view: new View({
            // minZoom: 0,
            // maxZoom: 8,
            // zoom: 1,
            resolutions: generateResolutions(10, -2, 1, [6]),
            // center: [width / 2, height / 2],
            constrainOnlyCenter: true,
            extent: mapExtent,
            constrainResolution: false,
        }),
    });

    generateLayers(map, props.layers);
    // console.log("🚀 ~ allLayers:", allLayers)
    // console.log("🚀 ~ layerMap:", layerMap)

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
        f.customData = {
            name: 'A' + a,
            id: a
        }
        a++;

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
    rectangles[rectangles.length - 1].customData = {
        name: 'B',
        id: a++
    }
    // updateSectorIconPosition(rectangles[0]);
    allLayers[1].getSource().addFeatures(rectangles);

    const backgroundRectangle = new Feature(
        new Polygon([[
            [0, 0],
            [width, 0],
            [width, height],
            [0, height],
            [0, 0],
        ]])
    )
    backgroundRectangle.customData = {
        name: props.name
    }
    allLayers[0].getSource().addFeature(backgroundRectangle);

    const zone1 = new Feature(
        new Polygon([[
            [200, 200],
            [width - 500, 200],
            [width - 500, height - 500],
            [200, height - 500],
            [200, 200],
        ]])
    )
    allLayers[2].getSource().addFeature(zone1);

    updateAlertPoints([0]);

    selectInteraction = new Select({
        layers: [allLayers[1]],
    });
    selectInteraction.on('select', (e) => {
        selected.value = e.selected[0];
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
        e.feature.customData = {
            name: ''
        }
        selected.value = e.feature;
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
        console.log("🚀 ~ e.features.item(0):", e.features.item(0))
        originalGeom = e.features.item(0)?.getGeometry().clone();
    })
    transformInteraction.on('selectend', (e) => {
        e.features.item(0).changed();
        console.log("🚀 ~ e.features.item(0):", typeof e.features.item(0).changed())
        selected.value = null;
        console.log("🚀 ~ selected.value:", selected.value)
        originalGeom = null;
    })

    transformInteraction.on('translating', (e) => {
        const featuresToSnap = allLayers[1].getSource().getFeatures();

        e.features.forEach((feature) => {
            const geometry = feature.getGeometry();
            const extent = geometry.getExtent();

            let dx = 0;
            let dy = 0;

            if (enableSnap.value) {
                featuresToSnap.forEach((otherFeature) => {

                    let { snapFound, snapDx, snapDy } = snapFeature(feature, otherFeature, getPointerDelta(map, e), snapTolerance);

                    if (snapFound) {
                        if (snapDx !== 0) dx = snapDx;
                        if (snapDy !== 0) dy = snapDy;
                    }
                });
            }

            if (dx !== 0 || dy !== 0) {
                geometry.translate(dx, dy);
            }

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
        });
    });

    transformInteraction.on('rotating', (e) => {
        const feature = e.feature;
        const geometry = feature.getGeometry();
        const extent = geometry.getExtent();

        const raw = e.angle;
        const stepRad = (5 * Math.PI) / 180;
        const snapped = Math.round(raw / stepRad) * stepRad;

        function getCenterOfGeometry() {
            return [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        }

        const center = transformInteraction.getCenter() || getCenterOfGeometry();

        if (center) {
            geometry.rotate(snapped - raw, center);
            e.angle = snapped;
        }

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
        // const featuresToSnap = allLayers[1].getSource().getFeatures();
        const feature = e.feature;
        const geometry = feature.getGeometry();
        const extent = geometry.getExtent();

        //**** snap while scaling */
        // const [scaleX, scaleY] = e.scale;
        // console.log("🚀 ~ scaleY:", scaleY)

        // let dx = 0;
        // let dy = 0;

        // if (enableSnap.value) {
        //     featuresToSnap.forEach((otherFeature) => {
        //         let { snapFound, snapDx, snapDy } = snapFeature(feature, otherFeature, getPointerDelta(map, e), snapTolerance);

        //         if (snapFound) {
        //             if (snapDx !== 0) dx = snapDx;
        //             if (snapDy !== 0) dy = snapDy;
        //         }
        //     });
        // }
        // if (dx !== 0 || dy !== 0) {
        //     geometry.translate(dx, dy);
        // }

        //TO DO 
        //transform dx,dy into change in scale 
        //modify scale and aplly it

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


    drawInteraction.setActive(false);
    modifyInteraction.setActive(false);
    selectInteraction.setActive(false);
    transformInteraction.setActive(false);
    snapInteraction.setActive(false);
    snapToBoundary.setActive(false);

    map.addInteraction(drawInteraction);
    map.addInteraction(selectInteraction);
    map.addInteraction(modifyInteraction);
    map.addInteraction(transformInteraction);
    map.addInteraction(snapInteraction);
    map.addInteraction(snapToBoundary);

    fitMapToContainer(map);
});

watch(currentMode, (mode) => {
    drawInteraction.setActive(false);
    modifyInteraction.setActive(false);
    selectInteraction.setActive(false);
    selectInteraction.getFeatures().clear();
    transformInteraction.setActive(false);
    snapInteraction.setActive(false);
    snapToBoundary.setActive(false);


    if (mode === 'draw') {
        drawInteraction.setActive(true);
        if (enableSnap.value) {
            snapInteraction.setActive(true);
            snapToBoundary.setActive(true);
        }
    } else if (mode === 'modifyPolygon') {
        selectInteraction.setActive(true);
        modifyInteraction.setActive(true);
        if (enableSnap.value) {
            snapInteraction.setActive(true);
            snapToBoundary.setActive(true);
        }
    } else if (mode === 'modify') {
        transformInteraction.setActive(true);

    }
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

function setSelectedShapeToRectangle() {
    let f = selectInteraction.getFeatures().getArray()[0];
    if (f) setShapeToRectangle(f);
}

function setSelectedShapePointsToClosestExtentBorder() {
    let f = selectInteraction.getFeatures().getArray()[0];
    if (f) setShapePointsToClosestExtentBorder(f);
}

function deleteSelectedShape() {
    allLayers.forEach((layer) => {
        layer.getSource().removeFeature(selected.value);
    })
}


</script>