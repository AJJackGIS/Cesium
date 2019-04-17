/**
 * 全局对象
 * @type {null}
 */
var viewer = null;
var scene = null;

function onload(Cesium) {

    //初始化viewer部件
    viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
            url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
        })
    });

    // selectedEntity = new Cesium.Entity(); // infoBox需要的Entity
    scene = viewer.scene;
    var widget = viewer.cesiumWidget;
    $('#loadingbar').remove();
    try {

        var abc = scene.addS3MTilesLayerByScp("http://172.29.1.151:8090/iserver/services/3D-fozuling3dmax/rest/realspace/datas/test1@dom/config", {name: 'abc'});

        abc.then(function (layer) {
            layer.selectEnabled = false;
            layer.hasLight = true; //关闭光照
            //layer.style3D._fillForeColor.alpha = 1;
            layer.cullEnabled = false; // 双面渲染
        });

        Cesium.when(abc, function (layer) {
            if (!scene.pickPositionSupported) {
                alert('不支持深度拾取,属性查询功能无法使用！');
            }

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

        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(0.0, 0.0, 0.5),
            point: {
                color: Cesium.Color.RED,
                pixelSize: 5,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 1
            }
        });

        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(114.4369, 30.4443, 0.5),
            point: {
                color: Cesium.Color.RED,
                pixelSize: 10,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 1
            }
        });

        setTimeout(function () {
            fly();
        }, 3000);

    } catch (e) {
        if (widget._showRenderLoopErrors) {
            var title = '渲染时发生错误，已停止渲染。';
            widget.showErrorPanel(title, undefined, e);
        }
    }
}

function fly() {
    // 飞行路线集合对象
    var routes = new Cesium.RouteCollection();
    //添加fpf飞行文件，fpf由SuperMap iDesktop生成
    var fpfUrl = 'flyRoute.fpf';
    routes.fromFile(fpfUrl);
    //初始化飞行管理,控制飞行的开始、暂停、停止以及站点事件等
    flyManager = new Cesium.FlyManager({
        scene: scene,
        routes: routes
    });
    flyManager.playRate = 0.2; //获取或者设置飞行路线的飞行速率，大于1.0加速，小于1.0减速
    //注册站点到达事件
    flyManager.stopArrived.addEventListener(function (routeStop) {
        var stopName = routeStop.stopName; // 获取站点的名称
        // var entity = new Cesium.Entity({
        //     description: '到达站点 : ' + stopName,
        //     name: stopName
        // });
        // viewer.selectedEntity = entity;
        // setTimeout(function () {
        //     viewer.selectedEntity = undefined;
        // }, 1000);
        if (stopName == "Stop16" || stopName == "Stop22") {
            $(".tip").fadeIn();
            $(".tip").html("打开了xxx号摄像头");
            routeStop.waitTime = 3; //在本站点停留的时间
            setTimeout(function () {
                $(".tip").fadeOut();
            }, 2800);
        }
    });
    if (flyManager.readyPromise) {
        //生成飞行文件中的所有站点列表
        Cesium.when(flyManager.readyPromise, function () {
            flyManager.play();
        });
    }
}

/**
 * 获取当前视角
 */
function getCamera() {
    var heading = scene.camera.heading;
    var pitch = scene.camera.pitch;
    var roll = scene.camera.roll;
    var position = scene.camera.position;
    var ellipsoid = scene.globe.ellipsoid;
    var cartographic = ellipsoid.cartesianToCartographic(position);
    var lat = Cesium.Math.toDegrees(cartographic.latitude);
    var lon = Cesium.Math.toDegrees(cartographic.longitude);
    var height = cartographic.height;
    console.log(heading);
    console.log(pitch);
    console.log(roll);
    console.log(lon);
    console.log(lat);
    console.log(height);
}