var viewer = null;
var scene = null;
var projectionImage = null; // 视频投放类

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

    projectionImage = new Cesium.ProjectionImage(scene);

    try {
        /**
         * 通视分析
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
                destination: new Cesium.Cartesian3(-2275097.1563382465,5006108.215011696,3231668.4131061733),
                orientation: {
                    heading: 1.5457096424174246,
                    pitch: 0.026705485287491282,
                    roll: 6.51137810336877e-10
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
}

function start() {

    projectionImage.direction = 93; // 获取或设置视频投放时投影仪的方位角，即顺时针与正北方向的夹角，取值范围：0度~360度
    projectionImage.pitch = 4; // 获取或设置视频投放时投影仪的俯仰角，该角指相机方向和水面方向的夹角，取向上为正，单位：度
    projectionImage.distance = 50.0; // 获取或设置观察点到投影仪的距离
    projectionImage.verticalFov = 7.0; // 获取或设置视频投放时投影仪的垂直视角范围，单位：度
    projectionImage.horizontalFov = 11.0; // 获取或设置视频投放时投影仪的水平视角范围，单位：度
    projectionImage.hintLineColor  = Cesium.Color.BLUE.withAlpha(0.2); // 获取或设置视频投放时提示线的颜色
    projectionImage.hintLineVisible  = true; // 获取或设置视频投放时提示线的可见性
    projectionImage.viewPosition = [114.44009811629928, 30.44277764772906, 18.475014240365343]; // 获取或设置视频投放观察者的位置。位置由经度、纬度和高程组成的数组表示

    var videoElement = document.getElementById('trailer');
    projectionImage.setImage({video : videoElement}); // 设置用于投放的图片或视频对象

    // url	    Array	指定图片资源的地址。
    // video	Object	指定视频的地址，目前仅支持*.webm格式的视频，目前只支持.webm。

    projectionImage.build();
}

function changeDirection() {
    $("#direction").next().val($("#direction").val());
    projectionImage.direction = parseFloat($("#direction").val());
}

function changePitch() {
    $("#pitch").next().val($("#pitch").val());
    projectionImage.pitch = parseFloat($("#pitch").val());
}

function changeDistance() {
    $("#distance").next().val($("#distance").val());
    projectionImage.distance = parseFloat($("#distance").val());
}

function changeHorizonalFov() {
    $("#horizonalFov").next().val($("#horizonalFov").val());
    projectionImage.verticalFov = parseFloat($("#horizonalFov").val());
}

function changeVerticalFov() {
    $("#verticalFov").next().val($("#verticalFov").val());
    projectionImage.horizontalFov = parseFloat($("#verticalFov").val());
}