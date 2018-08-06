var viewer = null;
var scene = null;
var sightline = null;

/**
 * 通视分析
 * @param Cesium
 */
function onload(Cesium) {
    viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
            url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
        })
    });
    scene = viewer.scene;
    var widget = viewer.cesiumWidget;

    //创建通视分析
    sightline = new Cesium.Sightline(scene);

    //设置鼠标左键单击回调事件获取坐标
    var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(function (e) {
        var position = scene.pickPosition(e.position);
        var cartographic = Cesium.Cartographic.fromCartesian(position);
        var longitude = Cesium.Math.toDegrees(cartographic.longitude);
        var latitude = Cesium.Math.toDegrees(cartographic.latitude);
        var height = cartographic.height;
        if (height < 0) {
            height = 0;
        }
        console.log(longitude + "," + latitude + "," + height);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


    try {
        /**
         * 通视分析
         */
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
            sightline.build();
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
}

function start() {


    //设置不可见部分的颜色
    sightline.hiddenColor = Cesium.Color.BLUE.withAlpha(0.2);

    //设置可见部分颜色
    sightline.visibleColor = Cesium.Color.RED.withAlpha(0.2);

    //设置观察者的位置
    sightline.viewPosition = [114.4404783231725, 30.44292330894362, 42.03265891285062];

    //在点击位置添加对应点
    viewer.entities.add({
        point: {
            color: new Cesium.Color(1, 1, 0),
            pixelSize: 10,
            outlineColor: new Cesium.Color(0, 1, 1)
        },
        position: Cesium.Cartesian3.fromDegrees(114.4404783231725, 30.44292330894362, 42.03265891285062)
    });

    var startX = 114.43996680120112;
    var startY = 30.44317088100413;
    var endX = 114.4402723385665;
    var endY = 30.443495810683533;

    for (var i = startX; i <= endX; i += 0.00005) {
        for (var j = startY; j <= endY; j += 0.00005) {
            sightline.addTargetPoint({
                position: [i, j, 6.5],
                name: "point" + i + j
            });
        }
    }

    // for (var i = startX; i <= endX; i += 0.0001) {
    //     for (var j = startY; j <= endY; j += 0.0001) {
    //         sightline.getBarrierPoint("point" + i + j, function (e) {
    //             if (!e.isViewer) {
    //                 // 如果视点不通，得到障碍点
    //                 console.log(e.position);
    //             }
    //         })
    //     }
    // }
}