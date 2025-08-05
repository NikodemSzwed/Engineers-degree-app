function fitMapToContainer(map) {
    if (!map) {
        console.error('Map is not defined');
        return;
    }

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

function setShapeToRectangle(feature) {
    const extent = feature.getGeometry().getExtent();

    const coords = [
        [extent[0], extent[1]],
        [extent[2], extent[1]],
        [extent[2], extent[3]],
        [extent[0], extent[3]],
        [extent[0], extent[1]],
    ];

    const geometry = feature.getGeometry();
    if (geometry.getType() === 'Polygon') {
        geometry.setCoordinates([coords]);
    }
}

function setShapePointsToClosestExtentBorder(feature) {
    const geometry = feature.getGeometry();
    if (geometry.getType() !== 'Polygon') return;

    const extent = geometry.getExtent();
    const ring = geometry.getCoordinates()[0];
    const updatedRing = [];

    for (const [x, y] of ring) {
        const distances = {
            left: Math.abs(x - extent[0]),
            right: Math.abs(x - extent[2]),
            bottom: Math.abs(y - extent[1]),
            top: Math.abs(y - extent[3]),
        };

        let minSide = 'left';
        Object.entries(distances).forEach(([side, distance]) => {
            if (distance < distances[minSide]) {
                minSide = side;
            }
        });

        let newX = x;
        let newY = y;

        switch (minSide) {
            case 'left':
                newX = extent[0];
                break;
            case 'right':
                newX = extent[2];
                break;
            case 'bottom':
                newY = extent[1];
                break;
            case 'top':
                newY = extent[3];
                break;
        }

        updatedRing.push([newX, newY]);
    }

    if (
        updatedRing.length > 0 &&
        (updatedRing[0][0] !== updatedRing[updatedRing.length - 1][0] ||
            updatedRing[0][1] !== updatedRing[updatedRing.length - 1][1])
    ) {
        updatedRing.push(updatedRing[0]);
    }

    geometry.setCoordinates([updatedRing]);
    simplifyPolygon(geometry, 3);
}

function removeNearlyColinearPoints(coords, tolerance = 1e-6) {
    let changed = false;
    let simplified = [];

    if (coords.length < 4) {
        return coords;
    }

    for (let i = 0; i < 2 && simplified.length < 3; i++) {
        do {
            changed = false;
            simplified = [coords[0]];
            for (let i = 1; i < coords.length - 1; i++) {
                const [x1, y1] = coords[i - 1];
                const [x2, y2] = coords[i];
                const [x3, y3] = coords[i + 1];

                const dx = x3 - x1;
                const dy = y3 - y1;
                const lenSq = dx * dx + dy * dy;

                const dist = Math.abs(dy * x2 - dx * y2 + x3 * y1 - y3 * x1) / Math.sqrt(lenSq);

                if (dist > tolerance) {
                    simplified.push(coords[i]);
                } else {
                    simplified.push(...coords.slice(i + 1));
                    changed = true;
                    break;
                }
            }

            if (!changed) {
                simplified.push(coords[coords.length - 1]);
            }

            coords = simplified;
        } while (changed && simplified.length > 3);

        coords.pop();
        let newFirstPoint = coords[coords.length - 1];
        coords.unshift(newFirstPoint);
    }

    return simplified;
}

function simplifyPolygon(polygonGeometry, tolerance = 1e-6) {
    const rings = polygonGeometry.getCoordinates().map(ring => {
        const isClosed =
            ring.length >= 4 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
        const simplified = removeNearlyColinearPoints(ring, tolerance);

        // Ensure closed ring
        if (
            isClosed &&
            (simplified[0][0] !== simplified[simplified.length - 1][0] ||
                simplified[0][1] !== simplified[simplified.length - 1][1])
        ) {
            simplified.push(simplified[0]);
        }

        return simplified;
    });

    polygonGeometry.setCoordinates(rings);
}

function toggleLayerVisibility(layer, value = null) {
    if (value === null) value = !layer.getVisible();
    layer.setVisible(value);
}

const getPointerDeltaFunction = (samples = 10) => {
    const lastPointerCoord = Array(samples).fill([]);

    return function (map, event) {
        const currentPointerCoord = map.getCoordinateFromPixel(event.pixel);

        const pointerDelta = [
            currentPointerCoord[0] - (lastPointerCoord[samples - 1]?.[0] ?? currentPointerCoord[0]),
            currentPointerCoord[1] - (lastPointerCoord[samples - 1]?.[1] ?? currentPointerCoord[1]),
        ];
        lastPointerCoord.unshift(currentPointerCoord);
        lastPointerCoord.pop();

        return pointerDelta;
    };
};

function snapFeature(feature, snapToFeature, pointerDelta, snapTolerance = 10) {
    let snapDx = 0;
    let snapDy = 0;
    let snapFound = false;

    if (snapToFeature.ol_uid === feature.ol_uid) return { snapFound, snapDx, snapDy };

    const geometry = feature.getGeometry();
    const extent = geometry.getExtent();

    const otherGeom = snapToFeature.getGeometry();
    const otherExtent = otherGeom.getExtent();

    const closestOnOtherToFirst = otherGeom.getClosestPoint(geometry.getFirstCoordinate());
    const closestOnSelf = geometry.getClosestPoint(closestOnOtherToFirst);
    const closestOnOther = otherGeom.getClosestPoint(closestOnSelf);

    const dxReal = closestOnOther[0] - closestOnSelf[0];
    const dyReal = closestOnOther[1] - closestOnSelf[1];
    const realDist = Math.hypot(dxReal, dyReal);

    if (realDist > snapTolerance) {
        return { snapFound, snapDx, snapDy };
    }

    const snapVector = [closestOnOther[0] - closestOnSelf[0], closestOnOther[1] - closestOnSelf[1]];

    const dot = snapVector[0] * pointerDelta[0] + snapVector[1] * pointerDelta[1];

    if (dot < 0) {
        return { snapFound, snapDx, snapDy };
    }

    const distLeftLeft = Math.abs(extent[0] - otherExtent[0]);
    const distRightRight = Math.abs(extent[2] - otherExtent[2]);
    const distTopTop = Math.abs(extent[3] - otherExtent[3]);
    const distBottomBottom = Math.abs(extent[1] - otherExtent[1]);

    const distLeftRight = Math.abs(extent[0] - otherExtent[2]);
    const distRightLeft = Math.abs(extent[2] - otherExtent[0]);
    const distTopBottom = Math.abs(extent[3] - otherExtent[1]);
    const distBottomTop = Math.abs(extent[1] - otherExtent[3]);

    if (distLeftLeft < snapTolerance) {
        snapDx = otherExtent[0] - extent[0];
        snapFound = true;
    } else if (distRightRight < snapTolerance) {
        snapDx = otherExtent[2] - extent[2];
        snapFound = true;
    } else if (distLeftRight < snapTolerance) {
        snapDx = otherExtent[2] - extent[0];
        snapFound = true;
    } else if (distRightLeft < snapTolerance) {
        snapDx = otherExtent[0] - extent[2];
        snapFound = true;
    }

    if (distTopTop < snapTolerance) {
        snapDy = otherExtent[3] - extent[3];
        snapFound = true;
    } else if (distBottomBottom < snapTolerance) {
        snapDy = otherExtent[1] - extent[1];
        snapFound = true;
    } else if (distTopBottom < snapTolerance) {
        snapDy = otherExtent[1] - extent[3];
        snapFound = true;
    } else if (distBottomTop < snapTolerance) {
        snapDy = otherExtent[3] - extent[1];
        snapFound = true;
    }

    return { snapFound, snapDx, snapDy };
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

export {
    setShapeToRectangle,
    simplifyPolygon,
    setShapePointsToClosestExtentBorder,
    snapFeature,
    getPointerDeltaFunction,
};
export { toggleLayerVisibility };
export { fitMapToContainer, generateResolutions };
