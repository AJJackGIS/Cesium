var viewer = null;
var scene = null;
var shadowQuery = null;

/**
 * 通视分析
 * @param Cesium
 */
function onload(Cesium) {
    viewer = new Cesium.Viewer('cesiumContainer', {
        shadows: true, // 显示阴影
        timeline: true,
        animation: true,
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
            url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
        })
    });
    scene = viewer.scene;
    var widget = viewer.cesiumWidget;

    //创建阴影分析类
    shadowQuery = new Cesium.ShadowQueryPoints(scene);

    //设置鼠标左键单击回调事件获取坐标
    // var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    // handler.setInputAction(function (e) {
    //     var position = scene.pickPosition(e.position);
    //     var cartographic = Cesium.Cartographic.fromCartesian(position);
    //     var longitude = Cesium.Math.toDegrees(cartographic.longitude);
    //     var latitude = Cesium.Math.toDegrees(cartographic.latitude);
    //     var height = cartographic.height;
    //     if (height < 0) {
    //         height = 0;
    //     }
    //     console.log(longitude + "," + latitude + "," + height);
    // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(function (e) {
        var position1 = scene.pickPosition(e.position);
        var cartographic = Cesium.Cartographic.fromCartesian(position1);
        var shadowRadio = shadowQuery.getShadowRadio(cartographic);
        var longitude = Cesium.Math.toDegrees(cartographic.longitude);
        var latitude = Cesium.Math.toDegrees(cartographic.latitude);
        var height = cartographic.height;

        if (shadowRadio != -1) {
            console.log(longitude + "," + latitude + "," + height + ",阴影率" + shadowRadio);
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


    try {
        /**
         * 阴影分析
         */
        var promise = scene.addS3MTilesLayerByScp("http://172.29.1.151:8090/iserver/services/3D-fzl3dmax/rest/realspace/datas/model@36R/config", {name: 'model'});

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
            shadowQuery.build();
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

    var startTime = new Date();
    var startJulianDate = Cesium.JulianDate.fromDate(startTime);
    // 获取或设置分析的开始时间
    shadowQuery.startTime = startJulianDate;
    // 获取或设置分析的结束时间
    var endJulianDate = Cesium.JulianDate.addDays(startJulianDate, 1, new Cesium.JulianDate());
    shadowQuery.endTime = endJulianDate;

    // 把当前时间设置成时间范围的截至时间，这样才能出结果
    viewer.clock.currentTime = endJulianDate;
    // viewer.clock.multiplier = 1;
    // viewer.clock.shouldAnimate = true;

    // 获取或设置阴影率点的间距
    shadowQuery.spacing = 10;
    // 获取或设置时间间隔
    shadowQuery.timeInterval = 60;

    // 分析范围 经纬度数组
    var points = [];
    points.push(114.43696260452272);
    points.push(30.44427098338082);
    points.push(114.44101810455324);
    points.push(30.44457621871381);
    points.push(114.44189786911012);
    points.push(30.44159782099436);
    points.push(114.43784236907962);
    points.push(30.44142207418663);

    shadowQuery.qureyRegion({
        position: points,
        bottom: 0.5, // 距离底部距离
        extend: 20 // 拉伸高度
    });
}