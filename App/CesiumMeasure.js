/**
 * 测量线段
 */
function MeasureTools(viewer) {

    var entityCollection = [];

    this.getCollection = function () {
        return entityCollection;
    };

    /**
     * 清除
     */
    this.destroy = function () {
        for (var i = 0; i < entityCollection.length; i++) {
            viewer.entities.remove(entityCollection[i]);
        }
        entityCollection = [];
    };

    /**
     * 测距
     */
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

                        // 计算中点
                        var centerPoint = Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3());
                        // 计算距离
                        var lengthText = "距离：" + getLengthText(positions[0], positions[1]);

                        labelEntity = addLabel(centerPoint, lengthText);
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
    };

    /**
     * 测面积
     */
    this.measurePolygon = function () {

        var positions = [];
        var clickStatus = false;
        var labelEntity = null;

        viewer.screenSpaceEventHandler.setInputAction(function (clickEvent) {

            clickStatus = true;
            // var cartesian = viewer.scene.pickPosition(clickEvent.position);
            var cartesian = viewer.scene.globe.pick(viewer.camera.getPickRay(clickEvent.position), viewer.scene);
            if (positions.length == 0) {
                positions.push(cartesian.clone()); //鼠标左击 添加第1个点
                addPoint(cartesian);

                viewer.screenSpaceEventHandler.setInputAction(function (moveEvent) {
                    // var movePosition = viewer.scene.pickPosition(moveEvent.endPosition);
                    var movePosition = viewer.scene.globe.pick(viewer.camera.getPickRay(moveEvent.endPosition), viewer.scene);

                    if (positions.length == 1) {
                        positions.push(movePosition);
                        addLine(positions);
                    } else {
                        if (clickStatus) {
                            positions.push(movePosition);
                        } else {
                            positions.pop();
                            positions.push(movePosition);
                        }
                    }

                    if (positions.length >= 3) {
                        // 绘制label
                        if (labelEntity) {
                            viewer.entities.remove(labelEntity);
                            entityCollection.splice(entityCollection.indexOf(labelEntity), 1);
                        }

                        var text = "面积：" + getArea(positions);
                        var centerPoint = getCenterOfGravityPoint(positions);
                        labelEntity = addLabel(centerPoint, text);

                        entityCollection.push(labelEntity);
                    }


                    clickStatus = false;
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


            } else if (positions.length == 2) {
                positions.pop();
                positions.push(cartesian.clone()); // 鼠标左击 添加第2个点

                addPoint(cartesian);

                addPolyGon(positions);

                // 右击结束
                viewer.screenSpaceEventHandler.setInputAction(function (clickEvent) {

                    // var clickPosition = viewer.scene.pickPosition(clickEvent.position);
                    var clickPosition = viewer.scene.globe.pick(viewer.camera.getPickRay(clickEvent.position), viewer.scene);

                    positions.pop();
                    positions.push(clickPosition);
                    positions.push(positions[0]); // 闭合
                    addPoint(clickPosition);

                    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
                    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);

                }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);


            } else if (positions.length >= 3) {
                positions.pop();
                positions.push(cartesian.clone()); // 鼠标左击 添加第3个点
                addPoint(cartesian);
            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    };

    /**
     * 测高
     */
    this.measureHeight = function () {
        var positions = [];
        var labelEntity_1 = null; // 标签实体
        var labelEntity_2 = null; // 标签实体
        var labelEntity_3 = null; // 标签实体

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
                    if (positions.length >= 2) {
                        positions.pop();
                        positions.pop();
                        positions.pop();

                        var cartographic = Cesium.Cartographic.fromCartesian(movePosition);
                        var height = Cesium.Cartographic.fromCartesian(positions[0]).height;

                        var verticalPoint = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude), height);
                        positions.push(verticalPoint);
                        positions.push(movePosition);
                        positions.push(positions[0]);

                        // 绘制label
                        if (labelEntity_1) {
                            viewer.entities.remove(labelEntity_1);
                            entityCollection.splice(entityCollection.indexOf(labelEntity_1), 1);
                            viewer.entities.remove(labelEntity_2);
                            entityCollection.splice(entityCollection.indexOf(labelEntity_2), 1);
                            viewer.entities.remove(labelEntity_3);
                            entityCollection.splice(entityCollection.indexOf(labelEntity_3), 1);
                        }

                        // 计算中点
                        var centerPoint_1 = Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3());
                        // 计算距离
                        var lengthText_1 = "水平距离：" + getLengthText(positions[0], positions[1]);

                        labelEntity_1 = addLabel(centerPoint_1, lengthText_1);
                        entityCollection.push(labelEntity_1);

                        // 计算中点
                        var centerPoint_2 = Cesium.Cartesian3.midpoint(positions[1], positions[2], new Cesium.Cartesian3());
                        // 计算距离
                        var lengthText_2 = "垂直距离：" + getLengthText(positions[1], positions[2]);

                        labelEntity_2 = addLabel(centerPoint_2, lengthText_2);
                        entityCollection.push(labelEntity_2);

                        // 计算中点
                        var centerPoint_3 = Cesium.Cartesian3.midpoint(positions[2], positions[3], new Cesium.Cartesian3());
                        // 计算距离
                        var lengthText_3 = "直线距离：" + getLengthText(positions[2], positions[3]);

                        labelEntity_3 = addLabel(centerPoint_3, lengthText_3);
                        entityCollection.push(labelEntity_3);

                    } else {
                        var verticalPoint = new Cesium.Cartesian3(movePosition.x, movePosition.y, positions[0].z);
                        positions.push(verticalPoint);
                        positions.push(movePosition);
                        positions.push(positions[0]);
                        // 绘制线
                        addLine(positions);
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            } else {
                // 存储第二个点
                positions.pop();
                positions.pop();
                positions.pop();
                var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                var height = Cesium.Cartographic.fromCartesian(positions[0]).height;

                var verticalPoint = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude), height);
                positions.push(verticalPoint);
                positions.push(cartesian);
                positions.push(positions[0]);
                addPoint(cartesian);
                viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
                viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    };

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
     * 添加面
     * @param positions
     */
    var addPolyGon = function (positions) {
        var dynamicPositions = new Cesium.CallbackProperty(function () {
            return positions;
        }, false);
        entityCollection.push(viewer.entities.add(new Cesium.Entity({
            polygon: {
                hierarchy: dynamicPositions,
                material: Cesium.Color.RED.withAlpha(0.6),
                classificationType: Cesium.ClassificationType.BOTH // 贴地表和贴模型,如果设置了，这不能使用挤出高度
            }
        })));
    };

    /**
     * 添加标签
     * @param position
     * @param text
     */
    var addLabel = function (centerPoint, text) {
        return viewer.entities.add(new Cesium.Entity({
            position: centerPoint,
            label: {
                text: text,
                font: '12pt sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE, //FILL  FILL_AND_OUTLINE OUTLINE
                fillColor: Cesium.Color.YELLOW,
                showBackground: true,//指定标签后面背景的可见性
                backgroundColor: new Cesium.Color(0.165, 0.165, 0.165, 0.8), // 背景颜色
                backgroundPadding: new Cesium.Cartesian2(6, 6),//指定以像素为单位的水平和垂直背景填充padding
                pixelOffset: new Cesium.Cartesian2(0, -25)
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
            length = (length / 1000).toFixed(2) + " 公里";
        } else {
            length = length.toFixed(2) + " 米";
        }
        return length;
    };

    //计算多边形面积
    var getArea = function (points) {

        var radiansPerDegree = Math.PI / 180.0;//角度转化为弧度(rad)
        var degreesPerRadian = 180.0 / Math.PI;//弧度转化为角度

        /*角度*/
        function Angle(p1, p2, p3) {
            var bearing21 = Bearing(p2, p1);
            var bearing23 = Bearing(p2, p3);
            var angle = bearing21 - bearing23;
            if (angle < 0) {
                angle += 360;
            }
            return angle;
        }

        /*方向*/
        function Bearing(from, to) {
            from = Cesium.Cartographic.fromCartesian(from);
            to = Cesium.Cartographic.fromCartesian(to);

            var lat1 = from.latitude;
            var lon1 = from.longitude;
            var lat2 = to.latitude;
            var lon2 = to.longitude;
            var angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2));
            if (angle < 0) {
                angle += Math.PI * 2.0;
            }
            angle = angle * degreesPerRadian;//角度
            return angle;
        }

        function distance(point1, point2) {
            var point1cartographic = Cesium.Cartographic.fromCartesian(point1);
            var point2cartographic = Cesium.Cartographic.fromCartesian(point2);
            /**根据经纬度计算出距离**/
            var geodesic = new Cesium.EllipsoidGeodesic();
            geodesic.setEndPoints(point1cartographic, point2cartographic);
            var s = geodesic.surfaceDistance;
            //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
            //返回两点之间的距离
            s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
            return s;
        }

        var res = 0;
        //拆分三角曲面

        for (var i = 0; i < points.length - 2; i++) {
            var j = (i + 1) % points.length;
            var k = (i + 2) % points.length;
            var totalAngle = Angle(points[i], points[j], points[k]);


            var dis_temp1 = distance(points[j], points[0]);
            var dis_temp2 = distance(points[k], points[0]);
            res += dis_temp1 * dis_temp2 * Math.sin(totalAngle) / 2;
            // console.log(res);
        }

        if (res < 1000000) {
            res = Math.abs(res).toFixed(4) + " 平方米";
        } else {
            res = Math.abs((res / 1000000.0).toFixed(4)) + " 平方公里";
        }

        return res;

    };

    /**
     * 计算多边形的中心（简单的处理）
     * @param mPoints
     * @returns {*[]}
     */
    var getCenterOfGravityPoint = function (mPoints) {
        var centerPoint = mPoints[0];
        for (var i = 1; i < mPoints.length; i++) {
            centerPoint = Cesium.Cartesian3.midpoint(centerPoint, mPoints[i], new Cesium.Cartesian3());
        }
        return centerPoint;
    }

}

