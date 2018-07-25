function onload(Cesium) {
    try {
        var viewer = new Cesium.Viewer('cesiumContainer', {
            animation: true, //是否创建动画小器件，左下角仪表
            timeline: true,//是否显示时间轴，底部
            imageryProvider: new Cesium.UrlTemplateImageryProvider({
                url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
            })
        });
        var scene = viewer.scene;
        var widget = viewer.cesiumWidget;
        $('#loadingbar').remove();

        // 1、加载scp
        var promise = scene.addS3MTilesLayerByScp("http://172.29.1.151:8090/iserver/services/3D-fzl3dmax/rest/realspace/datas/model@36R/config", {
            name: "model",
            cullEnabled: false
        });
        promise.then(function (layer) {
            layer.selectEnabled = false;
            //设置相机视角
            scene.camera.setView({
                destination: new Cesium.Cartesian3.fromDegrees(114.44030777467133, 30.44306726117544, 100),
                orientation: {
                    heading: 0,
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0
                }
            });
        });

        // 3辆车
        var models = [
            './car/Cesium_Ground.gltf',
            './car/CesiumMilkTruck.gltf'
        ];
        var scenesCar = [];
        var multi = 5;
        var timeLength = 360;

        // 3、设置时间轴
        var start = Cesium.JulianDate.fromDate(new Date(2018, 6, 5, 8));
        var stop = Cesium.JulianDate.addSeconds(start, timeLength, new Cesium.JulianDate()); // 设置总时长360秒

        viewer.clock.startTime = start.clone();
        viewer.clock.stopTime = stop.clone();
        viewer.clock.currentTime = start.clone();
        viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
        viewer.clock.multiplier = 10; // 10倍速率播放

        viewer.timeline.zoomTo(start, stop);

        // var roads = []; // 所有路线点集
        // // 2、规划路径
        // Cesium.loadJson('./road_car.json').then(function (jsonData) {
        //     var features = jsonData.features[0];
        //     for (var i = 0; i < features.length; i++) {
        //         var coor = features.geometry.coordinates;
        //         for (var i = 0; i < coor.length; i++) {
        //             roads.push(Cesium.Cartesian3.fromDegrees(coor[i][0], coor[i][1], 0.5));
        //         }
        //     }
        //
        //     // 路线条数
        //     // 给每个车设置路径 每个车所拥有的点数
        //     var count = Math.floor(roads.length / (models.length * multi));
        //     for (var j = 0, t = models.length * multi; j < t; j++) {
        //         var url = models[j % 2];
        //         scenesCar.push({url: url, points: roads.slice(j * count, (j + 1) * count)});
        //     }
        //
        //     // 4、动起来
        //     var preTimeLength = timeLength / count;
        //     for (var s = 0; s < scenesCar.length; s++) {
        //         var points = scenesCar[s].points;
        //         var property = new Cesium.SampledPositionProperty();
        //         for (var k = 0; k < points.length; k++) {
        //             var time = Cesium.JulianDate.addSeconds(start, k * preTimeLength, new Cesium.JulianDate()); //设置中间点
        //             var position = points[k];
        //             property.addSample(time, position);
        //         }
        //         viewer.entities.add({
        //             availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
        //                 start: start,
        //                 stop: stop
        //             })]),
        //             position: property, // 点集
        //             orientation: new Cesium.VelocityOrientationProperty(property),
        //             model: {
        //                 uri: scenesCar[s].url,
        //                 scale: 0.5
        //             }
        //         });
        //     }
        // }).otherwise(function (error) {
        //     widget.showErrorPanel('数据获取错误', undefined, error);
        // });


        // 2、规划路径
        Cesium.loadJson('./road_car.json').then(function (jsonData) {
            var roads = []; // 所有路线点集
            var features = jsonData.features;
            for (var i = 0; i < features.length; i++) {
                var coor = features[i].geometry.coordinates;
                var positions = [];
                for (var ii = 0; ii < coor.length; ii++) {
                    positions.push(Cesium.Cartesian3.fromDegrees(coor[ii][0], coor[ii][1], 0.5));
                }
                roads.push(positions);
            }

            for (var i = 0; i < roads.length; i++) {
                var positions = roads[i];
                var property = new Cesium.SampledPositionProperty();
                var preTimeLength = timeLength / positions.length;
                for (var k = 0; k < positions.length; k++) {
                    var time = Cesium.JulianDate.addSeconds(start, k * preTimeLength, new Cesium.JulianDate()); //设置中间点
                    var position = positions[k];
                    property.addSample(time, position);
                }
                viewer.entities.add({
                    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                        start: start,
                        stop: stop
                    })]),
                    position: property, // 点集
                    orientation: new Cesium.VelocityOrientationProperty(property),
                    model: {
                        uri: models[Math.floor(Math.random() * 10) % 2],
                        scale: 0.5
                    }
                });
            }
        }).otherwise(function (error) {
            widget.showErrorPanel('数据获取错误', undefined, error);
        });

        // 2、规划路径
        Cesium.loadJson('./road_person.json').then(function (jsonData) {
            var pace = [];
            var features = jsonData.features;
            for (var i = 0; i < features.length; i++) {
                var coor = features[i].geometry.coordinates;
                var positions = [];
                for (var ii = 0; ii < coor.length; ii++) {
                    positions.push(Cesium.Cartesian3.fromDegrees(coor[ii][0], coor[ii][1], 0.5));
                }
                pace.push(positions);
            }

            for (var i = 0; i < pace.length; i++) {
                var positions = pace[i];
                var property = new Cesium.SampledPositionProperty();
                var preTimeLength = timeLength / positions.length;
                for (var k = 0; k < positions.length; k++) {
                    var time = Cesium.JulianDate.addSeconds(start, k * preTimeLength, new Cesium.JulianDate()); //设置中间点
                    var position = positions[k];
                    property.addSample(time, position);
                }
                viewer.entities.add({
                    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                        start: start,
                        stop: stop
                    })]),
                    position: property, // 点集
                    orientation: new Cesium.VelocityOrientationProperty(property),
                    model: {
                        uri: './car/Cesium_Man.gltf',
                        scale: 0.5
                    }
                });
            }


        }).otherwise(function (error) {
            // an error occurred
        });


    } catch
        (e) {
        if (widget._showRenderLoopErrors) {
            var title = '哦噢,出错了';
            widget.showErrorPanel(title, undefined, e);
        }
    }

}