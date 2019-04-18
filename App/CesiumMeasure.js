/**
 * 测量线段
 */
function measurePolyLine(viewer) {

    var firstPoint = null; // 鼠标单击量测的第一个点
    var firstEntity = null;
    var movePoint = null; // 鼠标移动时不断改变的点
    var lineEntity = null; // 鼠标移动时不断改变的线
    var lastPoint = null; // 鼠标单击量测的第二个点
    var lastEntity = null;
    var labelEntity = null; // 量测时不断改变的文字信息
    var centerPoint = null; // 量测时不断改变的中心点

    // 注册鼠标左击事件
    viewer.screenSpaceEventHandler.setInputAction(function (clickEvent) {
        var cartesian = viewer.scene.pickPosition(clickEvent.position); // 坐标

        // 存储第一个点
        if (firstEntity == null) {
            firstPoint = cartesian;
            firstEntity = viewer.entities.add(new Cesium.Entity({
                position: firstPoint,
                point: {
                    color: Cesium.Color.GREEN,
                    pixelSize: 10,
                    scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 2000, 0.0),
                    translucencyByDistance: new Cesium.NearFarScalar(500, 1.0, 2000, 0.0)
                }
            }));

            // 注册鼠标移动事件
            viewer.screenSpaceEventHandler.setInputAction(function (moveEvent) {
                movePoint = viewer.scene.pickPosition(moveEvent.endPosition); // 鼠标移动的点

                // 绘制线
                if (lineEntity) {
                    viewer.entities.remove(lineEntity);
                }
                lineEntity = viewer.entities.add(new Cesium.Entity({
                    polyline: {
                        positions: [firstPoint, movePoint],
                        width: 4,
                        material: Cesium.Color.RED
                    }
                }));

                // 绘制label
                if (labelEntity) {
                    viewer.entities.remove(labelEntity);
                }
                // 计算中点
                centerPoint = Cesium.Cartesian3.midpoint(firstPoint, movePoint, new Cesium.Cartesian3());
                // 计算距离
                var length = Cesium.Cartesian3.distance(firstPoint, movePoint);
                if (length > 1000) {
                    length = (length / 1000).toFixed(2) + " km";
                } else {
                    length = length.toFixed(2) + " m";
                }
                labelEntity = viewer.entities.add(new Cesium.Entity({
                    position: centerPoint,
                    label: {
                        text: "长度：" + length,
                        showBackground: true,
                        pixelOffset: new Cesium.Cartesian2(0, -20),
                        font: '8px sans-serif'
                    }
                }));

            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        } else {
            // 存储第二个点
            lastPoint = cartesian;
            lastEntity = viewer.entities.add(new Cesium.Entity({
                position: lastPoint,
                point: {
                    color: Cesium.Color.GREEN,
                    pixelSize: 10,
                    scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 2000, 0.0),
                    translucencyByDistance: new Cesium.NearFarScalar(500, 1.0, 2000, 0.0)
                }
            }));

            // 绘制线
            viewer.entities.remove(lineEntity);
            lineEntity = viewer.entities.add(new Cesium.Entity({
                polyline: {
                    positions: [firstPoint, lastPoint],
                    width: 4,
                    material: Cesium.Color.RED
                }
            }));
            // 绘制label
            viewer.entities.remove(labelEntity);
            // 计算中点
            centerPoint = Cesium.Cartesian3.midpoint(firstPoint, lastPoint, new Cesium.Cartesian3());
            // 计算距离
            var length = Cesium.Cartesian3.distance(firstPoint, lastPoint);

            if (length > 1000) {
                length = (length / 1000).toFixed(2) + " km";
            } else {
                length = length.toFixed(2) + " m";
            }

            labelEntity = viewer.entities.add(new Cesium.Entity({
                position: centerPoint,
                label: {
                    text: "长度：" + length,
                    showBackground: true,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    font: '8px sans-serif'
                }
            }));

            viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }


    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}