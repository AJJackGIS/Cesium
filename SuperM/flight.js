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
    // scene.globe.show = false; // 是否显示地球
    scene.screenSpaceCameraController.minimumZoomDistance = 20000;

    Cesium.loadJson('./flight2.json').then(function (jsonData) {
        console.log(jsonData.length);
        jsonData.forEach(function (flight, index) {
            console.log(index);
            var start = makePoint(flight[0]);
            var end = makePoint(flight[1]);
            if (start != undefined && end != undefined) {
                var positions = earthMath.getBezierPoints(start, end, 7, 300);
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