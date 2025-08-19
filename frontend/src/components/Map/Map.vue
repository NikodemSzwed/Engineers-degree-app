<template>
    <div ref="mapContainer" class="flex w-full flex-1"></div>
</template>

<script setup>
    import { ref, watch, onMounted, computed } from 'vue';
    import olMap from 'ol/Map';
    import View from 'ol/View';
    import VectorLayer from 'ol/layer/Vector';
    import VectorSource from 'ol/source/Vector';
    import { Draw, Modify, Select, Snap } from 'ol/interaction';
    import { Style, Stroke, Fill, Text, Icon } from 'ol/style';
    import { createBox } from 'ol/interaction/Draw';
    import Feature from 'ol/Feature';
    import { Polygon, Point } from 'ol/geom';
    import Transform from 'ol-ext/interaction/Transform';
    // import { GeoJSON } from 'ol/format';
    // import * as jsts from 'jsts/dist/jsts.min.js';
    import { useUserStore } from '../../stores/userData';
    import { hexToRgbaString, blendColors, generateComplementaryColors } from '../../services/themeChanger';
    import {
        fitMapToContainer,
        setShapeToRectangle,
        toggleLayerVisibility,
        simplifyPolygon,
        setShapePointsToClosestExtentBorder,
        snapFeature,
        getPointerDeltaFunction,
        generateResolutions,
    } from './mapUtils';
    import Collection from 'ol/Collection';
    import { set } from 'date-fns';

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
            default: () => [],
        },
        visibleLayers: {
            type: Array,
            default: () => [],
        },
        editLayer: {
            type: Object,
            default: 'physical',
        },
        selected: {
            type: Object,
            default: null,
        },
        search: {
            type: String,
            default: null,
        },
        data: {
            type: Object,
            default: () => ({ physical: [], zones: [], alerts: [] }),
        },
    });

    const emit = defineEmits([
        'update:mode',
        'update:enableSnap',
        'update:enableSimplifyGeometry',
        'update:visibleLayers',
        'update:selected',
        'update:search',
    ]);

    defineExpose({
        setSelectedShapeToRectangle,
        deleteSelectedShape,
        setSelectedShapePointsToClosestExtentBorder,
        getAllFeatures,
        copySelectedShape,
        clearSelect,
        fitToContainer,
        setSelect,
    });

    const currentMode = computed({
        get: () => props.mode,
        set: value => {
            emit('update:mode', value);
        },
    });
    const enableSnap = computed({
        get: () => props.enableSnap,
        set: value => {
            emit('update:enableSnap', value);
        },
    });
    const enableSimplifyGeometry = computed({
        get: () => props.enableSimplifyGeometry,
        set: value => {
            emit('update:enableSimplifyGeometry', value);
        },
    });
    const localVisibleLayers = computed({
        get: () => props.visibleLayers,
        set: value => {
            emit('update:visibleLayers', value);
        },
    });
    const selected = computed({
        get: () => props.selected,
        set: value => {
            emit('update:selected', value);
        },
    });
    const localSearchName = computed({
        get: () => props.search,
        set: value => {
            emit('update:search', value);
        },
    });
    const currentEditLayer = computed({
        get: () => props.editLayer,
        set: () => {},
    });

    const getPointerDelta = getPointerDeltaFunction();
    const mapContainer = ref(null);
    let map;
    let allLayers = new Map();
    let layerMap = new Map();

    //interaction helpers
    const snapTolerance = 10;
    let originalGeom = null;
    const deletedFeatures = [];

    const primaryHex = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    let tempColors = generateComplementaryColors(primaryHex, 20);

    const highlightStyle = new Style({
        stroke: new Stroke({
            color: tempColors[3 * 3 + 1],
            width: 2,
        }),
        fill: new Fill({
            color: hexToRgbaString(tempColors[3 * 3 + 1], 0.7), //'rgba(150, 150, 150, 0.6)',
        }),
        text: new Text({
            font: '14px Calibri,sans-serif',
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({ color: '#fff', width: 3 }),
        }),
    });

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

    onMounted(() => {
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
                constrainOnlyCenter: true,
                extent: mapExtent,
                constrainResolution: false,
            }),
        });

        generateLayers(map, props.layers);
        generateFeatures(map, props.data);

        allLayers
            .get('physical')[0]
            .getSource()
            .getFeatures()
            .forEach(feature => {
                const alerts = feature?.customData?.alerts;

                if (!alerts || alerts.length === 0) return;

                blinkFeature(feature, 500, 20);
            });

        fitMapToContainer(map);
        changeMode(currentMode.value);
    });

    watch(
        () => props.data,
        val => {
            generateFeatures(map, val);
        },
        { deep: true }
    );

    watch(currentMode, mode => {
        changeMode(mode);
    });

    watch(currentEditLayer, layer => {
        changeMode(currentMode.value);
    });

    function changeMode(mode) {
        selected.value = null;
        localSearchName.value = null;
        allLayers.forEach((layer, key) => {
            layer[1].forEach((interaction, key) => {
                if (key === 'select') interaction.getFeatures().clear();
                interaction.setActive(false);
            });
        });
        toggleLayerVisibility(allLayers.get('alerts')[0], false);

        const interactions = allLayers.get(props.editLayer.value)[1];

        if (mode === 'draw') {
            interactions.get('draw').setActive(true);
            if (enableSnap.value) {
                interactions.get('snap').setActive(true);
                allLayers.get('background')[1].get('snap').setActive(true);
            }
        } else if (mode === 'modifyPolygon') {
            interactions.get('select').setActive(true);
            interactions.get('modify').setActive(true);
            if (enableSnap.value) {
                interactions.get('snap').setActive(true);
                allLayers.get('background')[1].get('snap').setActive(true);
            }
        } else if (mode === 'modify') {
            interactions.get('transform').setActive(true);
        } else if (mode === 'view') {
            updateAlertPoints();
            toggleLayerVisibility(allLayers.get('alerts')[0], true);
            interactions.get('select').setActive(true);
        }
    }

    watch(enableSnap, value => {
        const interactions = allLayers.get(props.editLayer.value)[1];
        if (currentMode.value === 'modifyPolygon') {
            interactions.get('snap').setActive(value);
            allLayers.get('background')[1].get('snap').setActive(value);
        }
    });

    watch(localVisibleLayers, visible => {
        props.layers.forEach(layer => {
            let l = layerMap.get(layer.value);

            if (!l) return;

            if (visible.some(visl => visl.value === layer.value)) toggleLayerVisibility(l, true);
            else toggleLayerVisibility(l, false);

            if (!visible.some(visl => visl.value === 'physical')) {
                toggleLayerVisibility(allLayers.get('alerts')[0], false);
            } else {
                toggleLayerVisibility(allLayers.get('alerts')[0], true);
            }
        });
    });

    watch(localSearchName, search => {
        const lowerSearch = search?.toLowerCase();

        allLayers
            .get('physical')[0]
            .getSource()
            .getFeatures()
            .forEach(feature => {
                const name = feature.customData?.name?.toLowerCase() || '';
                let isMatch = lowerSearch && name.includes(lowerSearch);

                const orders = feature.customData?.orders;

                if (!isMatch && orders) {
                    isMatch = orders.some(order => {
                        return lowerSearch && order.name.toLowerCase().includes(lowerSearch);
                    });
                }

                if (isMatch) {
                    let style = highlightStyle.clone();
                    style.getText().setText(feature.customData?.name || '');
                    feature.setStyle(style);
                } else {
                    feature.setStyle(null);
                }
            });
    });

    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && currentMode.value === 'draw') {
            const interactions = allLayers.get(props.editLayer.value)[1];
            interactions.get('draw').abortDrawing();
            interactions.get('select').getFeatures().clear();
            selected.value = null;
        }
    });

    function setSelectedShapeToRectangle() {
        let f = allLayers.get(props.editLayer.value)[1].get('select').getFeatures().getArray()[0];
        if (f) setShapeToRectangle(f);
    }

    function setSelectedShapePointsToClosestExtentBorder() {
        let f = allLayers.get(props.editLayer.value)[1].get('select').getFeatures().getArray()[0];
        if (f) setShapePointsToClosestExtentBorder(f);
    }

    function deleteSelectedShape() {
        deletedFeatures.push(selected.value);
        allLayers.forEach(layer => {
            layer[0].getSource().removeFeature(selected.value);
            allLayers.get(props.editLayer.value)[1].get('transform').setSelection(new Collection());
        });
        selected.value = null;
    }

    function clearSelect() {
        allLayers.get(props.editLayer.value)[1].get('select').getFeatures().clear();
        selected.value = null;
    }

    function setSelect(EID) {
        let feature = allLayers
            .get(props.editLayer.value)[0]
            .getSource()
            .getFeatures()
            .find(f => f.customData.EID === EID);
        if (feature) {
            allLayers.get(props.editLayer.value)[1].get('select').getFeatures().clear();
            allLayers.get(props.editLayer.value)[1].get('select').getFeatures().push(feature);
            selected.value = feature;
        }
    }

    function fitToContainer() {
        fitMapToContainer(map);
    }

    function copySelectedShape() {
        if (selected.value) {
            const newFeature = selected.value.clone();
            newFeature.customData = {
                name: 'Kopia ' + selected.value.customData.name,
                parentEID: selected.value.customData.parentEID,
                ETID: selected.value.customData.ETID,
                EID: null,
                orders: [],
                alerts: [],
            };
            allLayers.get(props.editLayer.value)[0].getSource().addFeature(newFeature);
            newFeature.setStyle(null);

            allLayers.get(props.editLayer.value)[1].get('select').getFeatures().clear();
            if (currentMode.value === 'modifyPolygon')
                allLayers.get(props.editLayer.value)[1].get('select').getFeatures().push(newFeature);
            selected.value = newFeature;
        }
    }

    function generateFeatures(map, data) {
        const mapExtent = map.getView().get('extent');

        const backgroundRectangle = new Feature(
            new Polygon([
                [
                    [0, 0],
                    [mapExtent[2], 0],
                    [mapExtent[2], mapExtent[3]],
                    [0, mapExtent[3]],
                    [0, 0],
                ],
            ])
        );
        backgroundRectangle.customData = {
            name: props.name || '',
        };

        allLayers.get('background')[0].getSource().clear();
        allLayers.get('background')[0].getSource().addFeature(backgroundRectangle);

        const sectors = data?.physical?.map(item => {
            let dimensions =
                item?.DimensionsAndStructure_json === '{}'
                    ? [
                          [
                              [0, 0],
                              [100, 0],
                              [100, 100],
                              [0, 100],
                              [0, 0],
                          ],
                      ]
                    : JSON.parse(item.DimensionsAndStructure_json);

            let f = new Feature(new Polygon(dimensions));
            f.customData = { ...item };
            return f;
        });

        allLayers.get('physical')[0].getSource().clear();
        if (sectors) allLayers.get('physical')[0].getSource().addFeatures(sectors);

        const zones = data?.zones?.map(item => {
            let f = new Feature(new Polygon(item?.coords));
            f.customData = { ...item };
            return f;
        });
        allLayers.get('zones')[0].getSource().clear();
        if (zones) allLayers.get('zones')[0].getSource().addFeatures(zones);
        updateAlertPoints();
    }

    function newDrawInteraction(map, layer, selectInteraction) {
        const mapExtent = map.getView().get('extent');

        let newDrawInteraction = new Draw({
            source: layer.getSource(),
            type: 'Circle',
            geometryFunction: (coordinates, geometry) => {
                const boxGeom = createBox()(coordinates, geometry);
                const boxExtent = boxGeom.getExtent();

                const clippedExtent = [
                    Math.min(Math.max(boxExtent[0], mapExtent[0] + 1), mapExtent[2]),
                    Math.min(Math.max(boxExtent[1], mapExtent[1] + 1), mapExtent[3]),
                    Math.max(Math.min(boxExtent[2], mapExtent[2] + 1), mapExtent[0]),
                    Math.max(Math.min(boxExtent[3], mapExtent[3] + 1), mapExtent[1]),
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
            },
        });
        newDrawInteraction.on('drawend', e => {
            selectInteraction.getFeatures().clear();
            selectInteraction.getFeatures().push(e.feature);
            e.feature.customData = {
                EID: null,
                name: '',
                alerts: [],
                orders: [],
            };
            selected.value = e.feature;
        });
        newDrawInteraction.setActive(false);
        return newDrawInteraction;
    }

    function newSelectInteraction(map, layer) {
        let newSelectInteraction = new Select({
            layers: [layer],
        });
        newSelectInteraction.on('select', e => {
            selected.value = e.selected[0];
            const deselected = e.deselected;

            deselected.forEach(feature => feature.setStyle(null));
        });
        newSelectInteraction.setActive(false);
        return newSelectInteraction;
    }

    function newSnapInteraction(map, layer) {
        let newSnapInteraction = new Snap({
            source: layer.getSource(),
        });
        newSnapInteraction.setActive(false);
        return newSnapInteraction;
    }

    function newModifyInteraction(map, selectInteraction) {
        const mapExtent = map.getView().get('extent');

        let newModifyInteraction = new Modify({
            features: selectInteraction.getFeatures(),
        });
        newModifyInteraction.on('modifystart', e => {
            const feature = e.features.item(0);
            originalGeom = feature.getGeometry().clone();
        });
        newModifyInteraction.on('modifyend', e => {
            e.features.forEach(feature => {
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
        newModifyInteraction.setActive(false);
        return newModifyInteraction;
    }

    function newTransformInteraction(map, editLayer) {
        const mapExtent = map.getView().get('extent');

        let newTransformInteraction = new Transform({
            rotate: true,
            translateFeature: true,
            translate: true,
            scale: true,
            stretch: true,
            keepAspectRatio: false,
            filter: (feature, layer) => {
                return layer === editLayer;
            },
        });

        newTransformInteraction.on('select', e => {
            let feature = e.features.item(0);
            if (feature) {
                selected.value = e.features.item(0);
                originalGeom = e.features.item(0)?.getGeometry().clone();
            } else {
                selected.value?.changed();
                selected.value = null;
                originalGeom = null;
            }
        });

        newTransformInteraction.on('translating', e => {
            const featuresToSnap = allLayers.get(props.editLayer.value)[0].getSource().getFeatures();

            e.features.forEach(feature => {
                const geometry = feature.getGeometry();
                const extent = geometry.getExtent();

                let dx = 0;
                let dy = 0;

                if (enableSnap.value) {
                    function getBorder(point, extent) {
                        const [minX, minY, maxX, maxY] = extent;
                        const [x, y] = point;

                        const distLeft = Math.abs(x - minX);
                        const distRight = Math.abs(x - maxX);
                        const distTop = Math.abs(y - maxY);
                        const distBottom = Math.abs(y - minY);

                        const min = Math.min(distLeft, distRight, distTop, distBottom);

                        if (min === distLeft) return 'left';
                        if (min === distRight) return 'right';
                        if (min === distTop) return 'top';
                        return 'bottom';
                    }

                    const geometry = feature.getGeometry();
                    const extent = geometry.getExtent();

                    const borderClosest = {
                        top: null,
                        right: null,
                        bottom: null,
                        left: null,
                    };

                    const borderDistances = {
                        top: Infinity,
                        right: Infinity,
                        bottom: Infinity,
                        left: Infinity,
                    };

                    featuresToSnap
                        .filter(f => f !== feature)
                        .forEach(f => {
                            const otherGeom = f.getGeometry();

                            const closestOnOtherToSelf = otherGeom.getClosestPoint(geometry.getFirstCoordinate());
                            const closestOnSelf = geometry.getClosestPoint(closestOnOtherToSelf);
                            const closestOnOther = otherGeom.getClosestPoint(closestOnSelf);

                            const dx = closestOnSelf[0] - closestOnOther[0];
                            const dy = closestOnSelf[1] - closestOnOther[1];
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            const border = getBorder(closestOnSelf, extent);

                            if (distance < borderDistances[border]) {
                                borderDistances[border] = distance;
                                borderClosest[border] = f;
                            }
                        });

                    const closestPerBorder = [
                        borderClosest.top,
                        borderClosest.right,
                        borderClosest.bottom,
                        borderClosest.left,
                    ].filter(border => border !== null && border !== undefined);

                    closestPerBorder.forEach(otherFeature => {
                        let { snapFound, snapDx, snapDy } = snapFeature(
                            feature,
                            otherFeature,
                            getPointerDelta(map, e),
                            snapTolerance
                        );

                        if (snapFound) {
                            if (snapDx !== 0) dx = snapDx;
                            if (snapDy !== 0) dy = snapDy;
                        }
                    });
                }

                // reseting geometry isn't as smooth as changing dx and dy
                const currentPointerCoord = map.getCoordinateFromPixel(e.pixel);

                const outsideTop = currentPointerCoord[1] > mapExtent[3];
                const outsideBottom = currentPointerCoord[1] < mapExtent[1];
                const outsideLeft = currentPointerCoord[0] < mapExtent[0];
                const outsideRight = currentPointerCoord[0] > mapExtent[2];

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

                // const isInside =
                //     extent[0] >= mapExtent[0] &&
                //     extent[1] >= mapExtent[1] &&
                //     extent[2] <= mapExtent[2] &&
                //     extent[3] <= mapExtent[3];

                // if (!isInside && originalGeom) {
                //     feature.setGeometry(originalGeom.clone());
                // } else {
                //     originalGeom = geometry.clone();
                //     if (dx !== 0 || dy !== 0) {
                //         geometry.translate(dx, dy);
                //     }
                // }
            });
        });

        newTransformInteraction.on('rotating', e => {
            const feature = e.feature;
            const geometry = feature.getGeometry();
            const extent = geometry.getExtent();

            const raw = e.angle;
            const stepRad = (5 * Math.PI) / 180;
            const snapped = Math.round(raw / stepRad) * stepRad;

            function getCenterOfGeometry() {
                return [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
            }

            const center = newTransformInteraction.getCenter() || getCenterOfGeometry();

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
        });
        newTransformInteraction.on('scaling', e => {
            // const featuresToSnap = allLayers[1].getSource().getFeatures();
            const feature = e.feature;
            const geometry = feature.getGeometry();
            const extent = geometry.getExtent();

            //**** snap while scaling */
            // const [scaleX, scaleY] = e.scale;

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
        });
        newTransformInteraction.setActive(false);

        return newTransformInteraction;
    }

    function createColoredSvg(color) {
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="${color}" viewBox="0 0 24 24"><g id="exclamation-triangle"><g id="_Path_" data-name="&lt;Path&gt;"><path d="M20,18.75H4a.76.76,0,0,1-.65-.37.77.77,0,0,1,0-.75l8-14a.78.78,0,0,1,1.3,0l8,14a.77.77,0,0,1,0,.75A.76.76,0,0,1,20,18.75ZM5.29,17.25H18.71L12,5.51Z"/></g><path d="M12,13.25a.76.76,0,0,1-.75-.75V9a.75.75,0,0,1,1.5,0v3.5A.76.76,0,0,1,12,13.25Z"/><path d="M12,16.25a.76.76,0,0,1-.75-.75V15a.75.75,0,0,1,1.5,0v.5A.76.76,0,0,1,12,16.25Z"/></g></svg>
    `;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    function blinkFeature(feature, interval = 300, times = 6, revertStyle = true) {
        const redStyle = mainStyle.clone();
        redStyle.getStroke().setColor('#ff0000');
        redStyle.getFill().setColor('#550000');
        redStyle.getText().setStroke(
            new Stroke({
                color: '#ff0000',
                width: 3,
            })
        );
        redStyle.getText().setText(feature.customData?.name || '');

        let count = 0;
        const blinkInterval = setInterval(() => {
            const useRed = count % 2 === 0;
            feature.setStyle(useRed ? redStyle : null);
            count++;
            if (count >= times || currentMode.value !== 'view' || selected.value?.ol_uid == feature.ol_uid) {
                clearInterval(blinkInterval);
                if (revertStyle) {
                    feature.setStyle(null);
                }
            }
        }, interval);
    }

    function LODcontrol(map, sourceStyle, options = {}) {
        if (options.minZoom === undefined) options.minZoom = 0;
        if (options.maxZoom === undefined) options.maxZoom = 10;
        if (options.color === undefined) options.color = '#ffffff';
        if (options.fillColor === undefined) options.fillColor = null;
        if (options.font === undefined) options.font = '14px Calibri,sans-serif';
        if (options.offsetX === undefined) options.offsetX = 0;
        if (options.offsetY === undefined) options.offsetY = 0;
        if (options.image === undefined) options.image = null;

        const localStyle = sourceStyle.clone();

        // changes applied once
        localStyle.getStroke().setColor(options.color);
        let darkMode = userData.personalSettings.darkMode;
        let opacity = darkMode ? 0.1 : 0.2;

        if (options.fillColor) localStyle.getFill().setColor(options.fillColor);
        else localStyle.getFill().setColor(hexToRgbaString(options.color, opacity));

        localStyle.getText().setFont(options.font);
        localStyle.getText().setOffsetX(options.offsetX);
        localStyle.getText().setOffsetY(options.offsetY);
        let textDefaultColor = darkMode ? '#ffffff' : '#000000';
        let blendWeight = darkMode ? 0.65 : 0.5;
        let textColor = blendColors(options.color, textDefaultColor, blendWeight);
        localStyle.getText().setFill(new Fill({ color: options.overrideBlendColor ? options.color : textColor }));

        const iconStyle = options.image
            ? new Icon({
                  src: options.image,
                  scale: 0.5,
                  anchor: [0.75, 0.5],
                  anchorXUnits: 'fraction',
                  anchorYUnits: 'fraction',
              })
            : null;

        if (options.image) localStyle.setImage(iconStyle);

        // dynamic changes
        return (feature, resolution) => {
            const zoom = map.getView().getZoomForResolution(resolution);

            const style = localStyle.clone();

            const iconStyle = options.image
                ? new Icon({
                      src: options.image,
                      scale: zoom * 0.3 * 0.5,
                      anchor: [0.75, 0.5],
                      anchorXUnits: 'fraction',
                      anchorYUnits: 'fraction',
                  })
                : null;

            if (zoom >= options.minZoom && zoom <= options.maxZoom) {
                style.getText().setText(feature.customData?.name || '');
                style.getText().setScale(zoom * 0.3);
                style.getText().setOffsetX(style.getText().getOffsetX() * zoom * 0.3);
                style.setImage(iconStyle);
            } else {
                style.getText().setText('');
                style.setImage(null);
            }

            return style;
        };
    }

    function generateLayers(map, layers) {
        const backgroundSource = new VectorSource();
        let darkMode = userData.personalSettings.darkMode;
        let fillColor = blendColors('#646464', primaryHex, 0.7);
        const backgroundLayer = new VectorLayer({
            source: backgroundSource,
            style: LODcontrol(map, mainStyle, {
                minZoom: 0,
                maxZoom: 4,
                color: tempColors[0],
                fillColor: darkMode ? 'rgba(100, 100, 100, 0.1)' : hexToRgbaString(fillColor, 0.05),
                font: '18px Calibri,sans-serif',
            }),
            renderBuffer: 1000,
        });
        allLayers.set('background', [backgroundLayer, new Map()]);
        map.addLayer(backgroundLayer);

        layers.forEach((layer, i) => {
            const newSource = new VectorSource();
            const newLayer = new VectorLayer({
                source: newSource,
                style: LODcontrol(map, mainStyle, { minZoom: 1, maxZoom: 7, color: tempColors[(i + 1) * 4] }),
                renderBuffer: 1000,
            });
            layerMap.set(layer.value, newLayer);
            allLayers.set(layer.value, [newLayer, new Map()]);

            map.addLayer(newLayer);
        });

        const alertSource = new VectorSource();
        const alertLayer = new VectorLayer({
            source: alertSource,
            style: LODcontrol(map, mainStyle, {
                minZoom: 1.5,
                maxZoom: 7,
                color: '#ff0000',
                font: 'bold 14px sans-serif',
                image: createColoredSvg('#ff0000'),
                offsetX: 15,
                overrideBlendColor: true,
            }),
        });
        allLayers.set('alerts', [alertLayer, new Map()]);
        map.addLayer(alertLayer);

        //layers need to be declared first, so interactions can see all of them
        //- if not done features will not be able to use interactions from layers declared before their layer
        // fuck this bullshit - order of interactions can influence other interactions even thou all of them specified their source
        // to combat this issue, interactions are added to the map in a specific order - 0 - select > 1 - draw > 2 - modify > 3 - transform > 4 - snap
        const addInteractions = [];

        addInteractions.push({ order: 4, value: newSnapInteraction(map, backgroundLayer) });
        allLayers.get('background')[1].set('snap', addInteractions[addInteractions.length - 1].value);

        layers.forEach((layer, i) => {
            const newLayer = allLayers.get(layer.value)[0];
            const selectInteraction = newSelectInteraction(map, newLayer);
            addInteractions.push({ order: 0, value: selectInteraction });
            allLayers.get(layer.value)[1].set('select', selectInteraction);

            layer.interactions.forEach(interaction => {
                let newInteraction = null;
                if (interaction === 'snap') {
                    newInteraction = newSnapInteraction(map, newLayer);
                    allLayers.get(layer.value)[1].set('snap', newInteraction);
                } else if (interaction === 'transform') {
                    newInteraction = newTransformInteraction(map, newLayer);
                    allLayers.get(layer.value)[1].set('transform', newInteraction);
                } else if (interaction === 'modify') {
                    newInteraction = newModifyInteraction(map, selectInteraction);
                    allLayers.get(layer.value)[1].set('modify', newInteraction);
                } else if (interaction === 'draw') {
                    newInteraction = newDrawInteraction(map, newLayer, selectInteraction);
                    allLayers.get(layer.value)[1].set('draw', newInteraction);
                }
                newInteraction = { value: newInteraction };
                newInteraction.order =
                    interaction === 'snap'
                        ? 4
                        : interaction === 'transform'
                          ? 3
                          : interaction === 'modify'
                            ? 2
                            : interaction === 'draw'
                              ? 1
                              : 0;
                addInteractions.push(newInteraction);
            });
        });

        addInteractions.sort((a, b) => a.order - b.order);

        for (const i of addInteractions) {
            map.addInteraction(i.value);
        }
    }

    function updateAlertPoints() {
        allLayers.get('alerts')[0].getSource().clear();

        allLayers
            .get('physical')[0]
            .getSource()
            .getFeatures()
            .forEach(feature => {
                const alerts = feature?.customData?.alerts;

                if (!alerts || alerts.length === 0) return;

                const extent = feature.getGeometry().getExtent();
                const topCenter = [(extent[0] + extent[2]) / 2, extent[3] + 20];

                const alertFeature = new Feature({
                    geometry: new Point(topCenter),
                });
                alertFeature.customData = {
                    name: alerts.length > 3 ? '3+' : alerts.length,
                };

                allLayers.get('alerts')[0].getSource().addFeature(alertFeature);
            });
    }

    function getAllFeatures() {
        const features = {};
        allLayers.forEach((layer, key) => {
            features[key] = [];
            layer[0]
                .getSource()
                .getFeatures()
                .forEach(feature => {
                    features[key].push(feature);
                });
        });
        return { features, deletedFeatures };
    }

    // const parser = new jsts.io.OL3Parser();
    // parser.inject(
    //     Polygon,
    //     Point, LineString, LinearRing, MultiPoint, MultiLineString, MultiPolygon,
    //     GeometryCollection
    // );
    // const reader = new jsts.io.GeoJSONReader();
    // const geoJson = new GeoJSON();

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
</script>

<style>
    .ol-zoom-in,
    .ol-zoom-out {
        font-size: 18px;
        padding: 0.5rem;
        border-radius: 8px;
        background: var(--p-content-hover-background);
        color: var(--p-content-hover-color);
        margin-right: 0.25rem;
        cursor: pointer;
    }

    .ol-rotate button {
        font-size: 32px;

        padding: 0 0.3rem;

        @media (min-width: 1024px) {
            font-size: 18px;
            padding: 0.3rem;
        }

        margin-top: 0.25rem;
        background: var(--p-content-hover-background);
        color: var(--p-content-hover-color);
        border-radius: 8px;
        cursor: pointer;
    }

    .ol-zoom,
    .ol-rotate {
        width: fit-content;
    }
</style>
