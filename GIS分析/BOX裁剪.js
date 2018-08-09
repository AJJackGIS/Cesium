var viewer = null;
var scene = null;

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
    var boxEntity = null;

    try {
        var promise = scene.open("http://172.29.1.151:8090/iserver/services/3D-HongXinYuanQu/rest/realspace"); // BIM
        // var promise = scene.addS3MTilesLayerByScp("http://172.29.1.151:8090/iserver/services/3D-FOZHULING/rest/realspace/datas/ABC/config", {name: 'model'});

        Cesium.when(promise, function (layers) {
            if (!scene.pickPositionSupported) {
                alert('不支持深度拾取,属性查询功能无法使用！');
            }

            //设置相机视角
            scene.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(115.50142405008323, 30.50063049630867, 35.48096279815383),
                orientation: {
                    heading: 4.695710252393422,
                    pitch: -0.4789857731977838,
                    roll: 6.283185307104354
                }
            });
            // scene.camera.setView({
            //     destination: new Cesium.Cartesian3(-2275016.0125600523, 5006389.077577955, 3231452.353782344),
            //     orientation: {
            //         heading: 0.2492143491752623,
            //         pitch: -0.23191530281508088,
            //         roll: 1.509903313490213e-14
            //     }
            // });

            setAllLayersClipColor();

            // 鼠标点击事件
            var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
            handler.setInputAction(function (event) {

                clearAllLayersClip();
                if (boxEntity){
                    viewer.entities.remove(boxEntity);
                }


                //获取鼠标点击的笛卡尔坐标
                var cartesian = scene.pickPosition(event.position);

                // 添加一个entity
                boxEntity = viewer.entities.add({
                    box: {
                        dimensions: new Cesium.Cartesian3(10, 10, 10),
                        material: Cesium.Color.fromRandom({alpha: 0.1})
                    },
                    position: cartesian
                });

                // <option value="clip_behind_all_plane">裁剪包围盒内</option>
                // <option value="clip_behind_any_plane">裁剪包围盒外</option>
                // <option value="only_keep_line">只保留线</option>
                var boxOption = {
                    dimensions: new Cesium.Cartesian3(10, 10, 10),
                    position: cartesian,
                    clipMode: "clip_behind_all_plane"
                };

                setAllLayersClipOptions(boxOption);
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            function setAllLayersClipColor() {
                for (var i = 0, j = layers.length; i < j; i++) {
                    // 获取或设置对S3M图层进行BOX裁剪时裁剪线的颜色
                    layers[i].clipLineColor = new Cesium.Color(1, 1, 1, 0);
                }
                // layers.clipLineColor = new Cesium.Color(1, 1, 1, 0);
            }

            function setAllLayersClipOptions(boxOptions) {
                for (var i = 0, j = layers.length; i < j; i++) {
                    layers[i].setCustomClipBox(boxOptions);
                }
                // layers.setCustomClipBox(boxOptions);
            }

            function clearAllLayersClip() {
                for (var i = 0, j = layers.length; i < j; i++) {
                    layers[i].clearCustomClipBox();
                }
                // layers.clearCustomClipBox();
            }

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