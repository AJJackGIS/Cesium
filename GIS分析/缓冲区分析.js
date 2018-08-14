var viewer = null;
var scene = null;
var bufferEntitys = [];

function onload(Cesium) {
    viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
            url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
        })
    });
    scene = viewer.scene;
    var widget = viewer.cesiumWidget;

    //设置相机视角
    scene.camera.setView({
        destination: new Cesium.Cartesian3(-2263380.078177295, 5019188.160818346, 3221060.8091996885),
        orientation: {
            heading: 0.33707892178179844,
            pitch: -0.351382914255425,
            roll: 6.283185307179524
        }
    });

    $('#loadingbar').remove();

    var handlerPoint = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Point); // 绘制点
    var handlerLine = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Line); // 绘制线
    var handlerPolygon = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Polygon); // 绘制面

    handlerPoint.drawEvt.addEventListener(function (result) {
        var resultObject = result.object;
        var sourceGeometry = CesiumToSuperMap.convertPoint(Cesium, SuperMap, resultObject.position);
        createBuffer(sourceGeometry);
    });
    handlerLine.drawEvt.addEventListener(function (result) {
        var resultObject = result.object;
        var sourceGeometry = CesiumToSuperMap.convertPolyline(Cesium, SuperMap, resultObject);
        createBuffer(sourceGeometry);
    });
    handlerPolygon.drawEvt.addEventListener(function (result) {
        var resultObject = result.object;
        var sourceGeometry = CesiumToSuperMap.convertPolygon(Cesium, SuperMap, resultObject);
        createBuffer(sourceGeometry);
    });

    document.getElementById("point").onclick = function () {
        deactiveAll();
        handlerPoint.activate();
    };
    document.getElementById("polyline").onclick = function () {
        deactiveAll();
        handlerLine.activate();
    };
    document.getElementById("polygon").onclick = function () {
        deactiveAll();
        handlerPolygon.activate();
    };
    document.getElementById("clear").onclick = function () {
        deactiveAll();
        for (var o in bufferEntitys){
            viewer.entities.remove(bufferEntitys[o]);
        }
        handlerPoint.clear();
        handlerLine.clear();
        handlerPolygon.clear();
    };


    function deactiveAll() {
        handlerPoint.deactivate();
        handlerLine.deactivate();
        handlerPolygon.deactivate();
    }
}

function createBuffer(sourceGeometry) {
    var analyzeUrl = "http://172.29.1.151:8090/iserver/services/spatialAnalysis-dx/restjsr/spatialanalyst";
    var bufferServiceByGeometry = new SuperMap.REST.BufferAnalystService(analyzeUrl);
    var bufferDistance = new SuperMap.REST.BufferDistance({
        value: 0.01//单位是度（默认为地图投影的单位）
    });
    var bufferSetting = new SuperMap.REST.BufferSetting({
        endType: SuperMap.REST.BufferEndType.ROUND,
        leftDistance: bufferDistance,
        rightDistance: bufferDistance,
        semicircleLineSegment: 10
    });
    var geoBufferAnalystParam = new SuperMap.REST.GeometryBufferAnalystParameters({
        sourceGeometry: sourceGeometry,
        bufferSetting: bufferSetting
    });

    bufferServiceByGeometry.events.on({"processCompleted": bufferAnalystCompleted});
    bufferServiceByGeometry.processAsync(geoBufferAnalystParam);
}

function bufferAnalystCompleted(BufferAnalystEventArgs) {
    if (BufferAnalystEventArgs) {
        var bufferResultGeometry = BufferAnalystEventArgs.result.resultGeometry;
        var entitys = SuperMapToCesium.geometryToEntity(Cesium, SuperMap, bufferResultGeometry);
        if (entitys) {
            for (var o in entitys) {
                viewer.entities.add(entitys[o]);
                bufferEntitys.push(entitys[o]);
            }
        }

    }
}