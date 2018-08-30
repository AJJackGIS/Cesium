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

    // 测距
    $("#distance").on("click", function () {

        // 使用API
        var handler = new Cesium.MeasureHandler(viewer, Cesium.MeasureMode.Distance);
        handler.measureEvt.addEventListener(function (result) {
            // var distance = result.distance;
            // handler.disLabel.text = distance;
            // console.log(distance);

            var dis = Number(result.distance);
            var distance = dis > 1000 ? (dis / 1000).toFixed(2) + 'km' : dis.toFixed(2) + 'm';
            handler.disLabel.text = '距离:' + distance;
        });
        // 监听当前事件以获取处理器的状态
        // handler.activate()后，事件返回true,当结束后返回false
        handler.activeEvt.addEventListener(function (isActive) {
            console.log(isActive);
            if (isActive) {
                $(".cesium-viewer").addClass("pointCss");
            } else {
                $(".cesium-viewer").removeClass("pointCss");
            }
        });
        handler.activate();

        // 自己实现

        // var positions = []; // 所有坐标集合
        // var entityCollection = []; // 所有的点entity
        // var primitiveCollection = []; // 所有的线primitive
        // var distance = 0;
        //
        // // left click
        // viewer.screenSpaceEventHandler.setInputAction(function (event) {
        //     var position = viewer.scene.pickPosition(event.position);
        //     positions.push(position);
        //     var pointEntity = new Cesium.Entity({
        //         position: position,
        //         point: {
        //             color: new Cesium.Color(1, 0.8980392156862745, 0, 1),
        //             pixelSize: 4,
        //             outlineColor: Cesium.Color.WHITE,
        //             outlineWidth: 1
        //         }
        //     });
        //     entityCollection.push(pointEntity);
        //     viewer.entities.add(pointEntity);
        //
        //     // if more than 2 point , draw polylin
        //     if (positions.length > 1) {
        //         viewer.entities.removeById("line");
        //         viewer.entities.add({
        //             id: "line",
        //             polyline: {
        //                 positions: positions,
        //                 material: new Cesium.Color(1, 0.8980392156862745, 0, 1),
        //                 width: 2
        //             }
        //         });
        //     }
        //
        // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        //
        // // mouse move
        // viewer.screenSpaceEventHandler.setInputAction(function (event) {
        //
        //     if (positions.length > 0) {
        //         // active
        //
        //         var position = viewer.scene.pickPosition(event.endPosition);
        //
        //         // dynamic polyline
        //         var polylinePrimitive = new Cesium.Primitive({
        //             geometryInstances: new Cesium.GeometryInstance({
        //                 geometry: new Cesium.PolylineGeometry({
        //                     positions: [positions[positions.length - 1], position],
        //                     width: 2.0,
        //                     vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT
        //                 }),
        //                 attributes: {
        //                     color: Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 0.8980392156862745, 0, 1.0))
        //                 }
        //             }),
        //             appearance: new Cesium.PolylineColorAppearance({
        //                 translucent: false
        //             })
        //         });
        //         if (primitiveCollection.length > 0) {
        //             primitiveCollection.pop();
        //             viewer.scene.primitives.remove(viewer.scene.primitives.get(viewer.scene.primitives.length - 1));
        //
        //         }
        //         primitiveCollection.push(polylinePrimitive);
        //         viewer.scene.primitives.add(polylinePrimitive);
        //     }
        //
        //
        // }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        //
        // // right click
        // viewer.screenSpaceEventHandler.setInputAction(function (event) {
        //     var position = viewer.scene.pickPosition(event.position);
        //     positions.push(position);
        //     var pointEntity = new Cesium.Entity({
        //         position: position,
        //         point: {
        //             color: new Cesium.Color(1, 0.8980392156862745, 0, 1),
        //             pixelSize: 4,
        //             outlineColor: Cesium.Color.WHITE,
        //             outlineWidth: 1
        //         }
        //     });
        //     entityCollection.push(pointEntity);
        //     viewer.entities.add(pointEntity);
        //
        //     viewer.entities.removeById("line");
        //     viewer.entities.add({
        //         id: "line",
        //         polyline: {
        //             positions: positions,
        //             material: new Cesium.Color(1, 0.8980392156862745, 0, 1),
        //             width: 2
        //         }
        //     });
        //
        //     // sum distance
        //     for (var i = 0; i < positions.length - 1; i++) {
        //         distance += Cesium.Cartesian3.distance(positions[i], positions[i + 1]);
        //     }
        //
        //     console.log(distance);
        //
        //     // cancel eventHandler
        //     viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        //     viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        //     viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        // }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    });

    // 测面
    $("#area").on("click", function () {
        var handler = new Cesium.MeasureHandler(viewer, Cesium.MeasureMode.Area);
        handler.measureEvt.addEventListener(function (result) {
            var mj = Number(result.area);
            var area = mj > 1000000 ? (mj / 1000000).toFixed(2) + 'km²' : mj.toFixed(2) + '㎡';
            handler.areaLabel.text = '面积:' + area;
            console.log(result.positions);
        });
        handler.activeEvt.addEventListener(function (isActive) {
            console.log(isActive);
            if (isActive) {
                $(".cesium-viewer").addClass("pointCss");
            } else {
                $(".cesium-viewer").removeClass("pointCss");
            }
        });
        handler.activate();
    });

    // 测高
    $("#height").on("click", function () {
        var handler = new Cesium.MeasureHandler(viewer, Cesium.MeasureMode.DVH);
        handler.measureEvt.addEventListener(function (result) {
            var distance = result.distance > 1000 ? (result.distance / 1000).toFixed(2) + 'km' : result.distance + 'm';
            var vHeight = result.verticalHeight > 1000 ? (result.verticalHeight / 1000).toFixed(2) + 'km' : result.verticalHeight + 'm';
            var hDistance = result.horizontalDistance > 1000 ? (result.horizontalDistance / 1000).toFixed(2) + 'km' : result.horizontalDistance + 'm';
            handler.disLabel.text = '空间距离:' + distance;
            handler.vLabel.text = '垂直高度:' + vHeight;
            handler.hLabel.text = '水平距离:' + hDistance;
        });
        handler.activeEvt.addEventListener(function (isActive) {
            console.log(isActive);
            if (isActive) {
                $(".cesium-viewer").addClass("pointCss");
            } else {
                $(".cesium-viewer").removeClass("pointCss");
            }
        });
        handler.activate();
    })
}
catch (e) {
    if (widget._showRenderLoopErrors) {
        var title = '渲染时发生错误，已停止渲染。';
        widget.showErrorPanel(title, undefined, e);
    }
}