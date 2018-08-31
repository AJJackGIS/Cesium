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

    var clampMode = 0;
    var handlerDis = null;
    var handlerArea = null;
    var handlerHeight = null;

    // 使用API
    handlerDis = new Cesium.MeasureHandler(viewer, Cesium.MeasureMode.Distance);
    handlerDis.measureEvt.addEventListener(function (result) {
        var dis = Number(result.distance);
        var distance = dis > 1000 ? (dis / 1000).toFixed(2) + 'km' : dis.toFixed(2) + 'm';
        handlerDis.disLabel.text = '距离:' + distance;
    });
    // 监听当前事件以获取处理器的状态
    // handler.activate()后，事件返回true,当结束后返回false
    handlerDis.activeEvt.addEventListener(function (isActive) {
        console.log(isActive);
        if (isActive) {
            $(".cesium-viewer").addClass("pointCss");
        } else {
            $(".cesium-viewer").removeClass("pointCss");
        }
    });

    handlerArea = new Cesium.MeasureHandler(viewer, Cesium.MeasureMode.Area);
    handlerArea.measureEvt.addEventListener(function (result) {
        var mj = Number(result.area);
        var area = mj > 1000000 ? (mj / 1000000).toFixed(2) + 'km²' : mj.toFixed(2) + '㎡';
        handlerArea.areaLabel.text = '面积:' + area;
        console.log(result.positions);
    });
    handlerArea.activeEvt.addEventListener(function (isActive) {
        console.log(isActive);
        if (isActive) {
            $(".cesium-viewer").addClass("pointCss");
        } else {
            $(".cesium-viewer").removeClass("pointCss");
        }
    });

    handlerHeight = new Cesium.MeasureHandler(viewer, Cesium.MeasureMode.DVH);
    handlerHeight.measureEvt.addEventListener(function (result) {
        var distance = result.distance > 1000 ? (result.distance / 1000).toFixed(2) + 'km' : result.distance + 'm';
        var vHeight = result.verticalHeight > 1000 ? (result.verticalHeight / 1000).toFixed(2) + 'km' : result.verticalHeight + 'm';
        var hDistance = result.horizontalDistance > 1000 ? (result.horizontalDistance / 1000).toFixed(2) + 'km' : result.horizontalDistance + 'm';
        handlerHeight.disLabel.text = '空间距离:' + distance;
        handlerHeight.vLabel.text = '垂直高度:' + vHeight;
        handlerHeight.hLabel.text = '水平距离:' + hDistance;
    });
    handlerHeight.activeEvt.addEventListener(function (isActive) {
        console.log(isActive);
        if (isActive) {
            $(".cesium-viewer").addClass("pointCss");
        } else {
            $(".cesium-viewer").removeClass("pointCss");
        }
    });

    $('#selOpt').change(function() {
        var value = $(this).val();
        if(value == '1'){
            clampMode = 0;
            handlerArea.clampMode = 0;
            handlerDis.clampMode = 0;
        }
        else{
            clampMode = 1;
            handlerArea.clampMode = 1;
            handlerDis.clampMode = 1;
        }
    });

    // 测距
    $("#distance").on("click", function () {
        handlerDis.activate();
    });

    // 测面
    $("#area").on("click", function () {
        handlerArea.activate();
    });

    // 测高
    $("#height").on("click", function () {
        handlerHeight.activate();
    });

}
catch (e) {
    if (widget._showRenderLoopErrors) {
        var title = '渲染时发生错误，已停止渲染。';
        widget.showErrorPanel(title, undefined, e);
    }
}