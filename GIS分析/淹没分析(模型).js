var viewer = null;
var scene = null;

function onload(Cesium) {
    viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
            url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
        })
    });
    scene = viewer.scene;
    var widget = viewer.cesiumWidget;
    $('#loadingbar').remove();

    try {
        /**
         * 淹没分析使用S3M图层的hypsometricSetting属性来模拟，注：经过测试，只能倾斜摄影的数据可以模拟，人工3D建模的不起作用
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
                destination: new Cesium.Cartesian3(-2275016.0125600523,5006389.077577955,3231452.353782344),
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
    }
    catch (e) {
        if (widget._showRenderLoopErrors) {
            var title = '渲染时发生错误，已停止渲染。';
            widget.showErrorPanel(title, undefined, e);
        }
    }
}

var currentHeight = 0;
var maxValue = 100;
var minValue = 0;
var int = 0;

function start() {
    console.log("start...");
    int = setInterval(function () {
        if (currentHeight > maxValue) {
            clearInterval(int);
            return;
        }
        currentHeight += 1.0 / 10; // 每秒1米
        console.log(minValue + " -- " + maxValue + " -- " + currentHeight);

        var layer = scene.layers.find("model");

        // 具体逻辑就是分层分色
        var hyp = new Cesium.HypsometricSetting();

        //创建分层设色对象 设置最大/最小可见高度 颜色表 显示模式 透明度及线宽
        var colorTable = new Cesium.ColorTable();
        setColorTable(colorTable, "1");

        hyp.MaxVisibleValue = currentHeight;
        hyp.MinVisibleValue = minValue;

        //设置分层设色颜色表的最大/最小key值,表示在此高度范围内显示颜色表
        hyp.ColorTableMinKey = 0;
        hyp.ColorTableMaxKey = 40;

        hyp.ColorTable = colorTable;
        hyp.DisplayMode = Cesium.HypsometricSettingEnum.DisplayMode.FACE;
        hyp.Opacity = 0.5;
        hyp.LineInterval = 1;

        //设置图层分层设色属性
        layer.hypsometricSetting = {
            hypsometricSetting: hyp,
            analysisMode: Cesium.HypsometricSettingEnum.AnalysisRegionMode.ARM_ALL
        };
    }, 100);
    console.log("end...");
}

function clear11() {
    //清除分析结果
    clearInterval(int);
    var layer = scene.layers.find("model");
    var hyp = new Cesium.HypsometricSetting();
    hyp.MaxVisibleValue = 0;

    layer.hypsometricSetting = {
        hypsometricSetting: hyp,
        analysisMode: Cesium.HypsometricSettingEnum.AnalysisRegionMode.ARM_ALL
    }
}

function setColorTable(colorTable, key) {
    switch (key) {
        case "1":
            colorTable.insert(40, new Cesium.Color(0, 39 / 255, 148 / 255));
            colorTable.insert(0, new Cesium.Color(149 / 255, 232 / 255, 249 / 255));
            break;
        case "2":
            colorTable.insert(40, new Cesium.Color(162 / 255, 251 / 255, 194 / 255));
            colorTable.insert(0, new Cesium.Color(1, 103 / 255, 103 / 255));
            break;
        case "3":
            colorTable.insert(40, new Cesium.Color(230 / 255, 198 / 255, 1));
            colorTable.insert(0, new Cesium.Color(157 / 255, 0, 1));
            break;
        case "4":
            colorTable.insert(40, new Cesium.Color(210 / 255, 15 / 255, 15 / 255));
            colorTable.insert(25, new Cesium.Color(221 / 255, 224 / 255, 7 / 255));
            colorTable.insert(18, new Cesium.Color(20 / 255, 187 / 255, 18 / 255));
            colorTable.insert(6, new Cesium.Color(0, 161 / 255, 1));
            colorTable.insert(0, new Cesium.Color(9 / 255, 9 / 255, 212 / 255));
            break;
        case "5":
            colorTable.insert(40, new Cesium.Color(186 / 255, 1, 229 / 255));
            colorTable.insert(0, new Cesium.Color(26 / 255, 185 / 255, 156 / 255));
            break;
        default:
            break;
    }
}