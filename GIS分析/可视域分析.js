var viewer = null;
var scene = null;
var viewshed3D = null; // 可视域类

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
    viewshed3D = new Cesium.ViewShed3D(scene);

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

    viewshed3D.direction = 270;
    viewshed3D.pitch = -30;
    viewshed3D.distance = 100.0;
    viewshed3D.verticalFov = 40.0;
    viewshed3D.horizontalFov = 30.0;
    viewshed3D.visibleAreaColor = Cesium.Color.BLUE.withAlpha(0.2);
    viewshed3D.invisibleAreaColor = Cesium.Color.RED.withAlpha(0.2);
    viewshed3D.viewPosition = [114.4404783231725, 30.44292330894362, 42.03265891285062];

    viewshed3D.build();

    //通过该点设置可视域分析对象的距离及方向
    // viewshed3D.setDistDirByPoint([114.43996680120112, 30.44317088100413, 10]);
}

function changeDirection() {
    $("#direction").next().val($("#direction").val());
    viewshed3D.direction = parseFloat($("#direction").val());
}

function changePitch() {
    $("#pitch").next().val($("#pitch").val());
    viewshed3D.pitch = parseFloat($("#pitch").val());
}

function changeDistance() {
    $("#distance").next().val($("#distance").val());
    viewshed3D.distance = parseFloat($("#distance").val());
}

function changeHorizonalFov() {
    $("#horizonalFov").next().val($("#horizonalFov").val());
    viewshed3D.verticalFov = parseFloat($("#horizonalFov").val());
}

function changeVerticalFov() {
    $("#verticalFov").next().val($("#verticalFov").val());
    viewshed3D.horizontalFov = parseFloat($("#verticalFov").val());
}