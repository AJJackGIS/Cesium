/*示范代码说明：
 *场景后期渲染特效
 *
 *主要涉及接口：
 * colorCorrection
 * bloomEffect
 * scanEffect
 * style3D
 * PolylineDynamicMaterialProperty
 *
 * 示范代码：
 */
var viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider: new Cesium.UrlTemplateImageryProvider({
        url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
    })
});
var scene = viewer.scene;

viewer.screenSpaceEventHandler.setInputAction(function (e) {
    var position = scene.pickPosition(e.position, new Cesium.Cartesian3());
    var cartographic = scene.globe.ellipsoid.cartesianToCartographic(position);
    var lon = Cesium.Math.toDegrees(cartographic.longitude);
    var lat = Cesium.Math.toDegrees(cartographic.latitude);
    var height = cartographic.height;
    console.log(lon + "," + lat + "," + height);
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

//设置环境
// scene.fxaa = true;
// scene.skyAtmosphere.show = false;
//
// //打开数据
var promise = scene.addS3MTilesLayerByScp("http://172.29.1.151:8090/iserver/services/3D-fzl3dmax/rest/realspace/datas/model@36R/config", {name: 'model'});
Cesium.when(promise, function (layers) {
    scene.camera.setView({
        destination: new Cesium.Cartesian3(-2275016.0125600523, 5006389.077577955, 3231452.353782344),
        orientation: {
            heading: 0.2492143491752623,
            pitch: -0.23191530281508088,
            roll: 1.509903313490213e-14
        }
    });
});

/**
 * 开启颜色矫正
 */
function openColorCorrection() {
    viewer.scene.colorCorrection.show = true; // default = false
    viewer.scene.colorCorrection.saturation = 1.2; //饱和度 min="-10" max="30" value="1.2" default = 1
    viewer.scene.colorCorrection.brightness = -0.09; //亮度 min="-1" max="1" value="-0.09" default = 0
    viewer.scene.colorCorrection.contrast = 0.7; //对比度 min="-10" max="10" value="0.7" default = 1
    viewer.scene.colorCorrection.hue = 0.0; //色调 min="0" max="3" value="0.0" default = 0
}

/**
 * 关闭颜色矫正
 */
function closeColorCorrection() {
    viewer.scene.colorCorrection.show = false;
}

/**
 * 开启泛光
 */
function openBloom() {
    viewer.scene.bloomEffect.show = true; // default = false
    viewer.scene.bloomEffect.threshold = 0.6; // 亮度阈值 min="0" max="1" value="0.6"  default = 0.15
    viewer.scene.bloomEffect.bloomIntensity = 1; // 泛光强度 min="0" max="10" value="1" default = 0.8
}

/**
 * 关闭泛光
 */
function closeBloom() {
    viewer.scene.bloomEffect.show = false;
}

/**
 * 居中闪现
 */
function flashPolyLine() {
    var pos = Cesium.Cartesian3.fromDegrees(114.43948602271699, 30.442769347143674, 0.5);
    var startLongitude = 114.43948602271699;
    var startLatitude = 30.442769347143674;
    var startHeight = 0;
    var endHeight = 30;
    var startTime = Cesium.JulianDate.now();
    viewer.entities.add({
        polyline: {
            positions: new Cesium.CallbackProperty(function (time, result) {//属性变更回调
                if (endHeight > startHeight) {
                    endHeight = endHeight - 30 * Cesium.JulianDate.secondsDifference(time, startTime);
                }
                return Cesium.Cartesian3.fromDegreesArrayHeights([startLongitude, startLatitude, startHeight, startLongitude, startLatitude, endHeight], scene.globe.ellipsoid, result);
            }, false),
            width: 4,
            material: new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.9,
                color: Cesium.Color.YELLOW
            })
        }
    });
}

/**
 * 开启扫描
 */
function openScan() {
    var pos = Cesium.Cartesian3.fromDegrees(114.43948602271699, 30.442769347143674, 0.5);

    // 环状扫描
    // viewer.scene.scanEffect.show = true;//开启扫描效果
    // viewer.scene.scanEffect.mode = Cesium.ScanEffectMode.CIRCLE;//利用圆环扫描效果
    // viewer.scene.scanEffect.centerPostion = pos; // 获取或设置扫描线的中心点位置
    // viewer.scene.scanEffect.period = 2; // 获取或设置扫描线的运行周期
    // viewer.scene.scanEffect.speed = 100; // 获取或设置扫描线的运行速度
    // viewer.scene.scanEffect.color = Cesium.Color.WHITE; //获取或设置扫描线的颜色


    // 线性扫描
    viewer.scene.scanEffect.show = true;
    viewer.scene.scanEffect.mode = Cesium.ScanEffectMode.LINE;//改用线状扫描效果
    viewer.scene.scanEffect.centerPostion = pos;
    viewer.scene.scanEffect.speed = 100;
    viewer.scene.scanEffect.lineWidth = 200;
    viewer.scene.scanEffect.period = 2;
    viewer.scene.scanEffect.color = Cesium.Color.WHITE;
}

/**
 * 关闭扫描
 */
function closeScan() {
    viewer.scene.scanEffect.show = false;
}

/**
 * 绕点旋转
 */
function flyCircle() {
    var pos = Cesium.Cartesian3.fromDegrees(114.43948602271699, 30.442769347143674, 0.5);
    viewer.camera.flyCircle(pos);
    viewer.camera.flyCircleLoop = true;
}

/**
 * 关闭旋转
 */
function closeCircle() {
    viewer.camera.stopFlyCircle();
    viewer.camera.flyCircleLoop = false;
}

/**
 * 动态线
 */
function dynamicLine() {
    var property = new Cesium.PolylineTrailMaterialProperty({
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.GREEN,
        outlineWidth: 5
    });
    property.constantSpeed = 1;
    property.trailLength = 0.4;


    viewer.entities.add({
        name: 'RED dynamic line',
        polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([114.43707113732542, 30.444197479077673, 1, 114.43803604000242, 30.441414798574566, 1]),
            width: 10,
            material: property
            // material: new Cesium.PolylineDynamicMaterialProperty({
            //     color: Cesium.Color.RED,
            //     outlineWidth: 0,
            //     outlineColor: Cesium.Color.BLACK
            // })
        }
    });
}