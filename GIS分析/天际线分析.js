var viewer = null;
var scene = null;
var skyline = null;
var polygonHandler = null;

function onload(Cesium) {
    viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
            url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
        })
    });
    scene = viewer.scene;
    var widget = viewer.cesiumWidget;

    //创建天际线分析对象
    skyline = new Cesium.Skyline(scene);

    // 绘制对象
    polygonHandler = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Polygon, Cesium.ClampMode.Ground);

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
                destination: new Cesium.Cartesian3(-2274844.5950309476, 5006331.6560536325, 3231519.5952173057),
                orientation: {
                    heading: 0.9576160986325881,
                    pitch: -0.036933850845031646,
                    roll: 7.977174476536675e-11
                }
            });
        }, function (e) {
            if (widget._showRenderLoopErrors) {
                var title = '渲染时发生错误，已停止渲染。';
                widget.showErrorPanel(title, undefined, e);
            }
        });
    }
    catch (e) {
        if (widget._showRenderLoopErrors) {
            var title = '渲染时发生错误，已停止渲染。';
            widget.showErrorPanel(title, undefined, e);
        }
    }

    $('#loadingbar').remove();

    // 三维提取天际线
    $("#chooseView").on("click", function () {

        // 当前窗口camera
        var cartographic = scene.camera.positionCartographic;
        var longitude = Cesium.Math.toDegrees(cartographic.longitude);
        var latitude = Cesium.Math.toDegrees(cartographic.latitude);
        var height = cartographic.height;

        //天际线分析的视口位置设置成当前相机位置
        skyline.viewPosition = [longitude, latitude, height];

        //设置俯仰和方向
        skyline.pitch = Cesium.Math.toDegrees(scene.camera.pitch);
        skyline.direction = Cesium.Math.toDegrees(scene.camera.heading);
        skyline.build();
    });

    // 二维天际线
    $("#getSkyline2D").on("click", function () {
        var object = skyline.getSkyline2D();

        //用echarts绘制二维天际线
        var myChart = echarts.init(document.getElementById("map"));

        var option = {
            backgroundColor: "#333333",
            title: {
                text: "二维天际线"
            },
            tooltip: {
                trigger: "axis"
            },
            calculable: true,
            xAxis: {
                type: "category",
                boundaryGap: false,
                data: object.x,
                show: true
            },
            yAxis: {
                type: "value",
                min: 0,
                max: 1
            },
            series: [{
                name: "",
                type: "line",
                data: object.y
            }]
        };

        myChart.setOption(option);
        // $("#map").show();
    });

    $("#setLimitBody").on("click", function () {
        skyline.removeLimitbody("limitBody");
        if (polygonHandler.active) {
            return;
        }
        polygonHandler.activate();
    });

    polygonHandler.drawEvt.addEventListener(function (polygon) {
        console.log(polygon);

        polygonHandler.polygon.show = false;

        //遍历多边形，取出所有点
        var positions = [];
        for (var i = 0, len = polygon.object.positions.length; i < len; i++) {
            //转化为经纬度，并加入至临时数组
            var cartographic = Cesium.Cartographic.fromCartesian(polygon.object.positions[i]);
            var longitude = Cesium.Math.toDegrees(cartographic.longitude);
            var latitude = Cesium.Math.toDegrees(cartographic.latitude);
            positions.push(longitude);
            positions.push(latitude);
        }

        //添加限高体对象
        skyline.addLimitbody({
            position: positions,
            name: "limitBody"
        });
    });

    $('#clear').click(function () {
        viewer.entities.removeAll();
        skyline.clear();
    });

    $('#getSkylineArea').click(function () {
        var cartographic = scene.camera.positionCartographic;
        var longitude = Cesium.Math.toDegrees(cartographic.longitude);
        var latitude = Cesium.Math.toDegrees(cartographic.latitude);
        var height = cartographic.height;

        var points = skyline.getSkyline3D();
        var pointArr = new Array();
        var cameraPoint = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
        pointArr.push(cameraPoint);
        for (var i = 0; i < points.x.length; i++) {
            var point = Cesium.Cartesian3.fromDegrees(points.x[i], points.y[i], points.z[i]);
            pointArr.push(point);
        }

        viewer.entities.add({
            polygon: {
                // extrudedHeight: 30,
                hierarchy: pointArr,
                perPositionHeight: true,
                material: Cesium.Color.ORANGE.withAlpha(1.0)

            }
        })
    });

    $("#show").on("click", function () {
        var limitPoints = skyline._limitBodys._array[0]._vertexArray;
        var points = [];
        for (var i = 0; i < limitPoints.length / 3; i++) {
            points.push(new Cesium.Cartesian3(limitPoints[i * 3], limitPoints[i * 3 + 1], limitPoints[i * 3 + 2]));
        }
        viewer.entities.add({
            polyline: {
                positions: points,
                width: 5,
                material: Cesium.Color.RED.withAlpha(1.0)

            }
        })
    })
}