// 动态单体化
// 原理：根据鼠标点选位置经纬度动态查询二维服务，获取鼠标位置的二维平面，获取要素的坐标，一种直接面贴对象即可，另一种根据鼠标高度动态绘制立方体

var viewer = new Cesium.Viewer('cesiumContainer', {
    infoBox: true,
    imageryProvider: new Cesium.UrlTemplateImageryProvider({
        url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
    })
});
var scene = viewer.scene;
$('#loadingbar').remove();
var promise = scene.addS3MTilesLayerByScp("http://172.29.1.151:8090/iserver/services/3D-FOZHULING/rest/realspace/datas/ABC/config", {name: 'abc'});
Cesium.when(promise, function (layer) {
    if (!scene.pickPositionSupported) {
        alert('不支持深度拾取,属性查询功能无法使用！');
    }
    layer.selectEnabled = false;

    //设置相机视角
    scene.camera.setView({
        destination: new Cesium.Cartesian3.fromDegrees(114.44206211550622, 30.443255137917298, 66.95554732116818),
        orientation: {
            heading: 4.542065333060519,
            pitch: -0.24412114065229407,
            roll: 6.283185307169116
        }
    });
});

var dataServiceUrl = 'http://172.29.1.151:8090/iserver/services/data-FOZHULING/rest/data/featureResults.rjson?returnContent=true'; // 数据服务URL
var dataSourceName = 'dom'; // 数据源名称
var dataSetName = 'FCFH'; // 数据集名称

viewer.screenSpaceEventHandler.setInputAction(function (event) {
    var cartes = scene.pickPosition(event.position);
    var carto = scene.globe.ellipsoid.cartesianToCartographic(cartes);
    var lon = Cesium.Math.toDegrees(carto.longitude);
    var lat = Cesium.Math.toDegrees(carto.latitude);
    var height = carto.height;

    var queryPoint = { // 查询点对象
        x: lon,
        y: lat
    };

    var queryObj = {
        "getFeatureMode": "SPATIAL",
        "spatialQueryMode": "INTERSECT",
        "datasetNames": [dataSourceName + ":" + dataSetName],
        "geometry": {
            id: 0,
            parts: [1],
            points: [queryPoint],
            type: "POINT"
        }
    };

    var queryObjJSON = JSON.stringify(queryObj); // 转化为JSON字符串作为查询参数

    $.ajax({
        type: "post",
        url: dataServiceUrl,
        data: queryObjJSON,
        success: function (result) {
            var resultObj = JSON.parse(result);
            if (resultObj.featureCount > 0) {
                var lonLatArr = getLonLatArray(resultObj.features[0].geometry.points);
                // 首先移除之前添加标识实体
                viewer.entities.removeById('identify-area');

                // 直接贴模型
                // viewer.entities.add({
                //     id: 'identify-area',
                //     name: '单体化标识面',
                //     polygon: {
                //         hierarchy: Cesium.Cartesian3.fromDegreesArray(lonLatArr),
                //         material: new Cesium.Color(1.0, 0.0, 0.0, 0.3)
                //     },
                //     clampToS3M: true // 贴在S3M模型表面
                // });

                // 逻辑高度
                var baseHeight = 3 * (Math.floor((height - 11.5) / 3) + 1) + 11.5;
                viewer.entities.add({
                    id: 'identify-area',
                    name: '单体化标识面',
                    polygon: {
                        hierarchy: Cesium.Cartesian3.fromDegreesArray(lonLatArr),
                        material: new Cesium.Color(1.0, 0.0, 0.0, 0.3),
                        extrudedHeight: baseHeight - 3,
                        height: baseHeight
                    }
                });

            }
        },
        error: function (msg) {
            console.log(msg);
        }
    });

    function getLonLatArray(points) {
        var point3D = [];
        points.forEach(function (point) {
            point3D.push(point.x);
            point3D.push(point.y);
        });
        return point3D;
    }

}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
