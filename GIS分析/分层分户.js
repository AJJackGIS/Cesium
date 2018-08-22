// function onload(Cesium) {
    var viewer = new Cesium.Viewer('cesiumContainer', {
        infoBox: true,
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
            url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
        })
    });
    var scene = viewer.scene;
    $('#loadingbar').remove();
    var promise = scene.open("http://172.29.1.151:8090/iserver/services/3D-FOZHULING/rest/realspace");
    Cesium.when(promise, function (layers) {
        console.log(layers);
        if (!scene.pickPositionSupported) {
            alert('不支持深度拾取,属性查询功能无法使用！');
        }
        var mx = scene.layers.find("QXMX@dom");

        mx.selectEnabled = true;
        mx.cullEnabled = false; //双面渲染  关键
        mx.hasLight = false; //关闭光照  关键
        mx.style3D._fillForeColor.alpha = 0; //半透
        mx.selectColorType = 1.0;
        mx.selectedColor = Cesium.Color.RED;
        mx.selectedColor.alpha = 0.2;

        //设置相机视角
        scene.camera.setView({
            destination: new Cesium.Cartesian3.fromDegrees(114.44206211550622, 30.443255137917298, 66.95554732116818),
            orientation: {
                heading: 4.542065333060519,
                pitch: -0.24412114065229407,
                roll: 6.283185307169116
            }
        });

        //设置属性查询参数
        mx.setQueryParameter({
            url: 'http://172.29.1.151:8090/iserver/services/data-FOZHULING/rest/data', //查询分层信息矢量面数据服务
            dataSourceName: 'dom',
            dataSetName: 'QXMX'
        });
    });

    var selectEntity = new Cesium.Entity();
    //注册鼠标点击事件
    viewer.pickEvent.addEventListener(function (feature) {
        var propertyHtml = "";
        for (var key in feature) {
            propertyHtml += "<tr><td>" + key + "</td><td>" +
                feature[key] + "</td></tr>";
        }
        selectEntity.name = feature["NAME"];
        selectEntity.description = "<table class='cesium-infoBox-defaultTable'><tbody> " +
            propertyHtml + " </tbody></table>";
        viewer.selectedEntity = selectEntity;
    });
// }