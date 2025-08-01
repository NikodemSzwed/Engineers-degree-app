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

function removeNearlyColinearPoints(coords, tolerance = 1e-6) {
    let changed = false;
    let simplified = [];

    if (coords.length < 4) {
        return coords;
    }

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
    if (!value) value = !layer.getVisible();
    layer.setVisible(value);
}

export { setShapeToRectangle, simplifyPolygon };
export { toggleLayerVisibility };
export { fitMapToContainer };
