function onload(Cesium) {
    var viewer = new Cesium.Viewer("cesiumContainer", {
        // animation: true, //创建动画部件
        // imageryProvider: Cesium.createOpenStreetMapImageryProvider({
        //     url: 'https://a.tile.openstreetmap.org/'
        // })
        // imageryProvider: new Cesium.UrlTemplateImageryProvider({
        //     url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        //     subdomains: ['a', 'b', 'c', 'd']
        // })
    });

    var scene = viewer.scene;
    scene.imageryLayers.removeAll(true);
    scene.globe.baseColor = new Cesium.Color(0.0, 0.0, 0.0, 1.0); // 没有影像时地球的基础颜色，默认为蓝色
    scene.globe.show = false; // 是否显示地球
    scene.screenSpaceCameraController.minimumZoomDistance = 20000;

    Cesium.loadJson('./flight2.json').then(function (jsonData) {
        console.log(jsonData.length);
        jsonData.forEach(function (flight, index) {
            console.log(index);
            var start = makePoint(flight[0]);
            var end = makePoint(flight[1]);
            if (start != undefined && end != undefined) {
                var positions = addBezier(start, end);
                viewer.entities.add({ // 用于打底的线
                    polyline: {
                        positions: positions,
                        width: 2, // 线的宽度，像素为单位
                        material: Cesium.Color.fromCssColorString("rgba(118, 233, 241, 0.1)")
                    }
                });

                viewer.entities.add({ // 尾迹线
                    polyline: {
                        positions: positions,
                        width: 2, // 线的宽度，像素为单位
                        material: new Cesium.PolylineTrailMaterialProperty({ // 尾迹线材质
                            color: Cesium.Color.fromCssColorString("rgba(118, 233, 241, 1.0)"),
                            trailLength: 0.2,// 尾迹线占所在线段的长度比例（0.0-1.0）
                            period: 5.0// 轨迹从起点到终点运行一次的时间，单位秒
                        })
                    }
                });
            }
        });

        for (var key in geoCoordMap) { // 绘制表示每一个机场的点
            viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(parseFloat(geoCoordMap[key][0]), parseFloat(geoCoordMap[key][1])),
                point: {
                    color: Cesium.Color.YELLOW_GREEN,
                    pixelSize: 2
                }
            });
        }
        ;
    });

    $('#loadingbar').remove();
}

function makePoint(name) {
    var pos = geoCoordMap[name];
    if (pos === undefined) return undefined;
    return [parseFloat(pos[0]), parseFloat(pos[1])];
}

var EARTH_RADIUS = 6378137.0;    //单位M
var PI = Math.PI;

function getRad(d) {
    return d * PI / 180.0;
}

function getGreatCircleDistance(lat1, lng1, lat2, lng2) {
    var radLat1 = getRad(lat1);
    var radLat2 = getRad(lat2);

    var a = radLat1 - radLat2;
    var b = getRad(lng1) - getRad(lng2);

    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000.0;
    return s;
}

function addBezier(pointA, pointB) {

    var origin = [parseFloat(pointA[0]), parseFloat(pointA[1])]; // 第一个点
    var destination = [parseFloat(pointB[0]), parseFloat(pointB[1])]; // 第二个点
    var dis = getGreatCircleDistance(origin[1], origin[0], destination[1], destination[0]); // 大圆弧距离
    var earth = Cesium.Ellipsoid.WGS84; // 椭球体
    var startPoint = earth.cartographicToCartesian(Cesium.Cartographic.fromDegrees(parseFloat(pointA[0]), parseFloat(pointA[1]), 0.0)); // 经纬度 -> 弧度 -> 大地坐标
    var endPoint = earth.cartographicToCartesian(Cesium.Cartographic.fromDegrees(parseFloat(pointB[0]), parseFloat(pointB[1]), 0.0));
    // determine the midpoint (point will be inside the earth)
    var addCartesian = startPoint.clone();
    Cesium.Cartesian3.add(startPoint, endPoint, addCartesian); // 坐标和
    var midpointCartesian = addCartesian.clone();
    Cesium.Cartesian3.divideByScalar(addCartesian, 2, midpointCartesian); // 除以2  ==========> 求坐标平均值 ===> 中点
    // move the midpoint to the surface of the earth
    earth.scaleToGeodeticSurface(midpointCartesian); // 贴到地球表面
    // add some altitude if you want (1000 km in this case)
    var midpointCartographic = earth.cartesianToCartographic(midpointCartesian); // 大地 转 弧度
    midpointCartographic.height = dis / 7;
    midpointCartesian = earth.cartographicToCartesian(midpointCartographic); // 弧度 转 大地
    var spline = new Cesium.CatmullRomSpline({
        times: [0.0, 0.5, 1.0],
        points: [
            startPoint,
            midpointCartesian,
            endPoint
        ]
    });
    var polylinePoints = [];
    for (var ii = 0; ii < 30; ++ii) {
        var evaPoint = spline.evaluate(ii / 30);
        var cartographic = earth.cartesianToCartographic(evaPoint);
        // polylinePoints.push([Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)]);
        polylinePoints.push(Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)));
    }
    // console.log(polylinePoints);
    return polylinePoints;
}