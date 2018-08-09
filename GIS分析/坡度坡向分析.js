var viewer = null;
var scene = null;

function onload(Cesium) {
    viewer = new Cesium.Viewer('cesiumContainer', {
        // imageryProvider: new Cesium.UrlTemplateImageryProvider({
        //     url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
        // }),
        terrainProvider: new Cesium.CesiumTerrainProvider({
            url: 'http://www.supermapol.com/realspace/services/3D-ZF_normal/rest/realspace/datas/srtm_54_07@zhufeng',
            // url : 'https://assets02.agi.com/stk-terrain/v1/tilesets/world/tiles',
            isSct: true,//地形服务源自SuperMap iServer发布时需设置isSct为true
            //请求水波纹效果
            // requestWaterMask: true,
            //请求照明
            requestVertexNormals: true
        })
    });
    scene = viewer.scene;

    //设置相机视角
    scene.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(87.1, 27.8, 8000.0),
        orientation: {
            heading: 6.10547067016156,
            pitch: -0.8475077031996778,
            roll: 6.2831853016686185
        }
    });

    $('#loadingbar').remove();

    // 坡度设置对象
    var slope = new Cesium.SlopeSetting();
    // Cesium.SlopeSettingEnum.ARROW : 显示坡向箭头
    // Cesium.SlopeSettingEnum.FACE : 显示填充颜色
    // Cesium.SlopeSettingEnum.FACE_AND_ARROW : 显示填充颜色和坡向箭头
    // Cesium.SlopeSettingEnum.NONE : 不使用显示模式
    slope.DisplayMode = Cesium.SlopeSettingEnum.DisplayMode.FACE_AND_ARROW; // 获取或设置呈现模式
    slope.MaxVisibleValue = 78; // 获取或设置坡度最大可见值
    slope.MinVisibleValue = 0; // 获取或设置坡度最小可见值
    var colorTable = new Cesium.ColorTable();
    // colorTable.insert(0, Cesium.Color.RED.withAlpha(0.8));
    // colorTable.insert(80, Cesium.Color.RED);
    colorTable.insert(0, new Cesium.Color(255 / 255, 0 / 255, 0 / 255));
    colorTable.insert(20, new Cesium.Color(221 / 255, 224 / 255, 7 / 255));
    colorTable.insert(30, new Cesium.Color(20 / 255, 187 / 255, 18 / 255));
    colorTable.insert(50, new Cesium.Color(0, 161 / 255, 1));
    colorTable.insert(80, new Cesium.Color(9 / 255, 9 / 255, 255 / 255));
    slope.ColorTable = colorTable; // 获取或设置颜色表（ColorTable）
    slope.Opacity = 0.5; // 获取或设置透明度。（[0.0,1.0]，0.0完全透明，1.0完全不透明）

    var handlerPolygon = new Cesium.DrawHandler(viewer, Cesium.DrawMode.Polygon, 0);
    handlerPolygon.drawEvt.addEventListener(function (result) {

        handlerPolygon.polygon.show = false;
        handlerPolygon.polyline.show = false;

        var array = [].concat(result.object.positions);
        var positions = [];
        for (var i = 0, len = array.length; i < len; i++) {
            var cartographic = Cesium.Cartographic.fromCartesian(array[i]);
            var longitude = Cesium.Math.toDegrees(cartographic.longitude);
            var latitude = Cesium.Math.toDegrees(cartographic.latitude);
            var h = cartographic.height;
            if (positions.indexOf(longitude) == -1 && positions.indexOf(latitude) == -1) {
                positions.push(longitude);
                positions.push(latitude);
                positions.push(h);
            }
        }

        slope.CoverageArea = positions;
        viewer.scene.globe.SlopeSetting = {
            slopeSetting: slope,
            // Cesium.HypsometricSettingEnum.AnalysisRegionMode.ARM_REGION; // 指定多边形区域
            // Cesium.HypsometricSettingEnum.AnalysisRegionMode.ARM_ALL; // 全部区域参与分析
            // Cesium.HypsometricSettingEnum.AnalysisRegionMode.ARM_NONE; // 全部区域不参与分析
            analysisMode: Cesium.HypsometricSettingEnum.AnalysisRegionMode.ARM_REGION // 局部
        };
        handlerPolygon.deactivate();
        handlerPolygon.activate();
    });
    handlerPolygon.activate();

}