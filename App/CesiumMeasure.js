/**
 * 测量线段
 */
function MeasureTools(viewer) {

    var entityCollection = [];

    this.getCollection = function () {
        return entityCollection;
    };

    this.destroy = function () {
        for (var i = 0; i < entityCollection.length; i++) {
            viewer.entities.remove(entityCollection[i]);
        }
        entityCollection = [];
    };

    this.measurePolyLine = function () {

        var positions = [];
        var labelEntity = null; // 标签实体

        // 注册鼠标左击事件
        viewer.screenSpaceEventHandler.setInputAction(function (clickEvent) {
            var cartesian = viewer.scene.pickPosition(clickEvent.position); // 坐标

            // 存储第一个点
            if (positions.length == 0) {
                positions.push(cartesian.clone());

                addPoint(cartesian);

                // 注册鼠标移动事件
                viewer.screenSpaceEventHandler.setInputAction(function (moveEvent) {
                    var movePosition = viewer.scene.pickPosition(moveEvent.endPosition); // 鼠标移动的点
                    if (positions.length == 2) {
                        positions.pop();
                        positions.push(movePosition);

                        // 绘制label
                        if (labelEntity) {
                            viewer.entities.remove(labelEntity);
                            entityCollection.splice(entityCollection.indexOf(labelEntity), 1);
                        }

                        labelEntity = addLabel(positions);
                        entityCollection.push(labelEntity);

                    } else {
                        positions.push(movePosition);

                        // 绘制线
                        addLine(positions);
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            } else {
                // 存储第二个点
                positions.pop();
                positions.push(cartesian);
                addPoint(cartesian);
                viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
                viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


        /**
         * 添加点
         * @param position
         */
        var addPoint = function (position) {
            entityCollection.push(viewer.entities.add(new Cesium.Entity({
                position: position,
                point: {
                    color: Cesium.Color.GREEN,
                    pixelSize: 10,
                    scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 2000, 0.0),
                    translucencyByDistance: new Cesium.NearFarScalar(500, 1.0, 2000, 0.0)
                }
            })));
        };

        /**
         * 添加线
         * @param positions
         */
        var addLine = function (positions) {
            var dynamicPositions = new Cesium.CallbackProperty(function () {
                return positions;
            }, false);
            entityCollection.push(viewer.entities.add(new Cesium.Entity({
                polyline: {
                    positions: dynamicPositions,
                    width: 4,
                    material: Cesium.Color.RED
                }
            })));
        };

        /**
         * 添加标签
         * @param position
         * @param text
         */
        var addLabel = function (positions) {

            // 计算中点
            var centerPoint = Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3());
            // 计算距离
            var lengthText = getLengthText(positions[0], positions[1]);

            return viewer.entities.add(new Cesium.Entity({
                position: centerPoint,
                label: {
                    text: lengthText,
                    showBackground: true,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    font: '8px sans-serif'
                }
            }));
        };

        /**
         * 计算两点距离
         * @param firstPoint
         * @param secondPoint
         */
        var getLengthText = function (firstPoint, secondPoint) {
            // 计算距离
            var length = Cesium.Cartesian3.distance(firstPoint, secondPoint);
            if (length > 1000) {
                length = (length / 1000).toFixed(2) + " km";
            } else {
                length = length.toFixed(2) + " m";
            }
            return length;
        };
    }
}

