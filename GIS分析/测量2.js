var viewer = null;
var scene = null;

viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider: new Cesium.UrlTemplateImageryProvider({
        url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
    })
});
scene = viewer.scene;
var widget = viewer.cesiumWidget;
$('#loadingbar').remove();

try {
    var promise = scene.addS3MTilesLayerByScp("http://172.29.1.151:8090/iserver/services/3D-FOZHULING/rest/realspace/datas/ABC/config", {name: 'model'});

    Cesium.when(promise, function (layer) {
        if (!scene.pickPositionSupported) {
            alert('不支持深度拾取,属性查询功能无法使用！');
        }

        layer.cullEnabled = false; //双面渲染  关键
        layer.selectEnabled = false;
        layer.hasLight = true; //关闭光照  关键

        //设置相机视角
        scene.camera.setView({
            destination: new Cesium.Cartesian3(-2275016.0125600523, 5006389.077577955, 3231452.353782344),
            orientation: {
                heading: 0.2492143491752623,
                pitch: -0.23191530281508088,
                roll: 1.509903313490213e-14
            }
        });
    }, function (e) {
        if (widget._showRenderLoopErrors) {
            var title = '渲染时发生错误，已停止渲染。';
            widget.showErrorPanel(title, undefined, e);
        }
    });

    ///************************************* 自己实现 ******************************************//

    // 测距
    $("#distance").on("click", function () {

        var positions = []; // 所有坐标集合
        var distance = 0;

        // left click
        viewer.screenSpaceEventHandler.setInputAction(function (event) {
            var position = viewer.scene.pickPosition(event.position);
            positions.push(position);
            viewer.entities.add({
                position: position,
                point: {
                    color: Cesium.Color.RED,
                    pixelSize: 4,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1
                }
            });
            // if more than 2 point , draw polylin
            if (positions.length > 1) {
                viewer.entities.removeById("line");
                viewer.entities.add({
                    id: "line",
                    polyline: {
                        positions: positions,
                        material: new Cesium.Color(1, 0.8980392156862745, 0, 1),
                        width: 6
                    }
                });
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // right click
        viewer.screenSpaceEventHandler.setInputAction(function (event) {
            var position = viewer.scene.pickPosition(event.position);
            positions.push(position);
            viewer.entities.add({
                position: position,
                point: {
                    color: Cesium.Color.RED,
                    pixelSize: 4,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1
                }
            });
            viewer.entities.removeById("line");
            viewer.entities.add({
                id: "line",
                polyline: {
                    positions: positions,
                    material: new Cesium.Color(1, 0.8980392156862745, 0, 1),
                    width: 6
                }
            });

            // sum distance
            for (var i = 0; i < positions.length - 1; i++) {
                distance += Cesium.Cartesian3.distance(positions[i], positions[i + 1]);
            }

            console.log(distance + "米");

            // cancel eventHandler
            viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    });

    // 测面
    $("#area").on("click", function () {
        var positions = []; // 所有坐标集合
        var area = 0;

        // left click
        viewer.screenSpaceEventHandler.setInputAction(function (event) {
            var position = viewer.scene.pickPosition(event.position);
            positions.push(position);
            viewer.entities.add({
                position: position,
                point: {
                    color: Cesium.Color.RED,
                    pixelSize: 4,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1
                }
            });
            // if more than 3 point , draw polygon
            if (positions.length > 1) {
                viewer.entities.removeById("area");
                viewer.entities.add({
                    id: "area",
                    polygon: {
                        hierarchy: positions,
                        perPositionHeight: true,
                        material: new Cesium.Color(1, 0.8980392156862745, 0, 1).withAlpha(0.5)
                    }
                });
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // right click
        viewer.screenSpaceEventHandler.setInputAction(function (event) {
            var position = viewer.scene.pickPosition(event.position);
            positions.push(position);
            viewer.entities.add({
                position: position,
                point: {
                    color: Cesium.Color.RED,
                    pixelSize: 4,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1
                }
            });
            viewer.entities.removeById("area");
            viewer.entities.add({
                id: "area",
                polygon: {
                    hierarchy: positions,
                    perPositionHeight: true,
                    material: new Cesium.Color(1, 0.8980392156862745, 0, 1).withAlpha(0.5)
                }
            });

            area = getArea(positions);
            console.log(area + "k㎡");
            // area = computePolygonArea(positions);
            // console.log(( area / 1000000.0).toFixed(4) + "k㎡");

            // cancel eventHandler
            viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    });

    // 测高
    $("#height").on("click", function () {
    });

    // 清楚
    $("#clear").on("click", function () {
        viewer.entities.removeAll();
    })
}
catch (e) {
    if (widget._showRenderLoopErrors) {
        var title = '渲染时发生错误，已停止渲染。';
        widget.showErrorPanel(title, undefined, e);
    }
}

var radiansPerDegree = Math.PI / 180.0;//角度转化为弧度(rad)
var degreesPerRadian = 180.0 / Math.PI;//弧度转化为角度

//计算任意多边形的面积，顶点按照顺时针或者逆时针方向排列
function computePolygonArea(points) {

    var ellipsoid = viewer.scene.globe.ellipsoid;
    var wgsProject = new Cesium.WebMercatorProjection(ellipsoid);
    // 世界坐标转投影坐标
    for(var i = 0; i < points.length; i++){
        points[i] = wgsProject.project(Cesium.Cartographic.fromCartesian(points[i]));
    }

    var point_num = points.length;
    if (point_num < 3) return 0.0;
    var s = 0;
    for (var i = 0; i < point_num; i++)
        s += points[i].x * points[(i + 1) % point_num].y - points[i].y * points[(i + 1) % point_num].x;
    return Math.abs(s / 2.0);
}

//计算多边形面积
function getArea(points) {

    var res = 0;
    //拆分三角曲面

    for (var i = 0; i < points.length; i++) {
        var j = (i + 1) % points.length;
        var k = (i + 2) % points.length;
        var totalAngle = Angle(points[i], points[j], points[k]);

        var dis_temp1 = distance(points[i], points[j]);
        // var dis_temp1 = Cesium.Cartesian3.distance(points[i], points[j]);
        var dis_temp2 = distance(points[j], points[k]);
        // var dis_temp2 = Cesium.Cartesian3.distance(points[j], points[k]);
        res += dis_temp1 * dis_temp2 * Math.abs(Math.sin(totalAngle));
        console.log(res);
    }
    return (res / 1000000.0).toFixed(4);
}

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
    // from = Cesium.Cartographic.fromCartesian(from);
    // to = Cesium.Cartographic.fromCartesian(to);
    var lat1 = from.y * radiansPerDegree;
    // var lat1 = Cesium.Math.toDegrees(from.latitude) * radiansPerDegree;
    var lon1 = from.x * radiansPerDegree;
    // var lon1 = Cesium.Math.toDegrees(from.longitude) * radiansPerDegree;
    var lat2 = to.y * radiansPerDegree;
    // var lat2 = Cesium.Math.toDegrees(to.latitude) * radiansPerDegree;
    var lon2 = to.x * radiansPerDegree;
    // var lon2 = Cesium.Math.toDegrees(to.longitude) * radiansPerDegree;


    // var lat1 = from.lat * radiansPerDegree;
    // var lon1 = from.lon * radiansPerDegree;
    // var lat2 = to.lat * radiansPerDegree;
    // var lon2 = to.lon * radiansPerDegree;
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