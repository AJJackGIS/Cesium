var viewer = null;
var scene = null;

function onload(Cesium) {
    viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
            url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
        }),
        terrainProvider: new Cesium.CesiumTerrainProvider({
            url: 'http://172.29.1.151:8090/iserver/services/3D-dx/rest/realspace/datas/纸坊镇地形@dx',
            isSct: true//地形服务源自SuperMap iServer发布时需设置isSct为true
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

    var handerSourceGeomerty = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Polygon); // 源对象
    var handerTargetGeomerty = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Polygon); // 目标对象

    var sourceGeomerty = null;
    var targetGeomerty = null;

    handerSourceGeomerty.drawEvt.addEventListener(function (result) {
        var resultObject = result.object;
        sourceGeomerty = CesiumToSuperMap.convertPolygon(Cesium, SuperMap, resultObject);
    });
    handerTargetGeomerty.drawEvt.addEventListener(function (result) {
        var resultObject = result.object;
        targetGeomerty = CesiumToSuperMap.convertPolygon(Cesium, SuperMap, resultObject);
    });

    document.getElementById("source").onclick = function () {
        deactiveAll();
        handerSourceGeomerty.activate();
    };
    document.getElementById("target").onclick = function () {
        deactiveAll();
        handerTargetGeomerty.activate();
    };
    document.getElementById("clear").onclick = function () {
        deactiveAll();
        viewer.entities.removeAll();
        handerSourceGeomerty.clear();
        handerTargetGeomerty.clear();
    };
    document.getElementById("overlay").onclick = function () {
        deactiveAll();
        createOverlayAnalyst();
    };

    function deactiveAll() {
        handerSourceGeomerty.deactivate();
        handerTargetGeomerty.deactivate();
    }

    var operType = SuperMap.REST.OverlayOperationType.UNION; // 默认操作符
    $('#overlayAnalyze').change(function () {
        var value = $(this).val();
        if (value == "union") {
            operType = SuperMap.REST.OverlayOperationType.UNION;
        } else if (value == "intersect") {
            operType = SuperMap.REST.OverlayOperationType.INTERSECT;
        } else if (value == "clip") {
            operType = SuperMap.REST.OverlayOperationType.CLIP;
        } else if (value == "erase") {
            operType = SuperMap.REST.OverlayOperationType.ERASE;
        }
    });

    function createOverlayAnalyst() {
        var analyzeUrl = "http://172.29.1.151:8090/iserver/services/spatialAnalysis-dx/restjsr/spatialanalyst";
        var overlayServiceByDatasets = new SuperMap.REST.OverlayAnalystService(analyzeUrl);
        var dsOverlayAnalystParameters = new SuperMap.REST.GeometryOverlayAnalystParameters({
            sourceGeometry: sourceGeomerty,
            operateGeometry: targetGeomerty,
            tolerance: 0,
            operation: operType
        });
        overlayServiceByDatasets.events.on({
            "processCompleted": overlayAnalystCompleted,
            "processFailed": overlayAnalystFailed
        });
        overlayServiceByDatasets.processAsync(dsOverlayAnalystParameters);
    }

    function overlayAnalystCompleted(overlayAnalystEventArgs) {
        viewer.entities.removeAll();
        handerSourceGeomerty && handerSourceGeomerty.clear();
        handerTargetGeomerty && handerTargetGeomerty.clear();
        var resultGeometry = overlayAnalystEventArgs.result.resultGeometry;
        if (resultGeometry) {
            var entities = SuperMapToCesium.geometryToEntity(Cesium, SuperMap, resultGeometry);
            if (entities) {
                for (var o in entities) {
                    viewer.entities.add(entities[o]);
                }
            }
        }
    }

    function overlayAnalystFailed(args) {
        alert(args.error.errorMsg);
    }
}