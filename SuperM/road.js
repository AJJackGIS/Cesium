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

        viewer.animation.container.style.display = "none";
        viewer.timeline.container.style.display = "none";

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

        // 5辆车 1个人
        var urls = [
            './car/qiche1.s3m',
            './car/qiche2.s3m',
            './car/qiche3.s3m',
            './car/qiche4.s3m',
            './car/qiche5.s3m',
        ];

        var layer = new Cesium.DynamicLayer3D(scene.context, urls);
        scene.primitives.add(layer); // 添加车的模型

        // 2、规划路径
        Cesium.loadJson('./road_car.json').then(function (jsonData) {
            var statesAll = []; // 所有路线集合
            var features = jsonData.features;
            for (var i = 0; i < features.length; i++) {
                var coor = features[i].geometry.coordinates;
                var positions = [];
                for (var ii = 0; ii < coor.length; ii++) {
                    positions.push(Cesium.Cartesian3.fromDegrees(coor[ii][0], coor[ii][1]));
                }
                // 完整的states
                var states = [];
                for (var k = 0; k < positions.length; k++) {
                    var earth = viewer.scene.globe.ellipsoid;
                    var carto = earth.cartesianToCartographic(positions[k]);
                    var lon = Cesium.Math.toDegrees(carto.longitude);
                    var lat = Cesium.Math.toDegrees(carto.latitude);
                    var heading = 0;
                    if (k == positions.length - 1) {
                        // 最后一个点, 取上一个点的heading
                        heading = states[k - 1].heading;
                    } else {
                        var carto2 = earth.cartesianToCartographic(positions[k + 1]);
                        var lon2 = Cesium.Math.toDegrees(carto2.longitude);
                        var lat2 = Cesium.Math.toDegrees(carto2.latitude);
                        heading = (lon2 - lon) / (lat2 - lat);
                        heading = Math.atan(heading);
                    }
                    states.push(new Cesium.DynamicObjectState({
                        id: k,
                        longitude: lon,
                        latitude: lat,
                        altitude: 0.5,
                        heading: heading,
                        scale: new Cesium.Cartesian3(0.8, 0.8, 0.8)
                    }));
                }
                statesAll.push(states);
            }

            // 每个路线上有5辆车
            var m = 0;
            setInterval(function () {
                // 5辆车
                if (m > 0) {
                    layer.clearAll();
                }
                for (var x = 0; x < urls.length; x++) {
                    //更新model.s3m类型实例的状态信息
                    layer.updateObjectWithModel(urls[x], getState(x, m));
                }
                m++;
            }, 200);

            /**
             *
             * @param x 车序号
             * @param m 点序号
             * @returns {*[]}
             */
            function getState(x, m) {
                var states = [];
                // 计算每辆车的位置， 从每条路线上寻找
                for (var i = 0; i < statesAll.length; i++) {
                    var points = statesAll[i]; // 第i条线上共有多少个点
                    var length = Math.floor(points.length / urls.length); // 每个车占用的范围
                    var point = points[x * length + m % length];
                    states.push(point);
                }
                return states;
            }

        }).otherwise(function (error) {
            widget.showErrorPanel('数据获取错误', undefined, error);
        });


        // var layer2 = new Cesium.DynamicLayer3D(scene.context, ['./car/man.s3m']);
        // scene.primitives.add(layer2); // 添加车的模型
        // // 2、规划路径
        // Cesium.loadJson('./road_person.json').then(function (jsonData) {
        //     var pace = [];
        //     var features = jsonData.features;
        //     for (var i = 0; i < features.length; i++) {
        //         var coor = features[i].geometry.coordinates;
        //         var positions = [];
        //         for (var ii = 0; ii < coor.length; ii++) {
        //             positions.push(Cesium.Cartesian3.fromDegrees(coor[ii][0], coor[ii][1], 0.5));
        //         }
        //         // 完整的states
        //         var states = [];
        //         for (var k = 0; k < positions.length; k++) {
        //             var earth = viewer.scene.globe.ellipsoid;
        //             var carto = earth.cartesianToCartographic(positions[k]);
        //             var lon = Cesium.Math.toDegrees(carto.longitude);
        //             var lat = Cesium.Math.toDegrees(carto.latitude);
        //             var heading = 0;
        //             if (k == positions.length - 1) {
        //                 // 最后一个点, 取上一个点的heading
        //                 heading = states[k - 1].heading;
        //             } else {
        //                 var carto2 = earth.cartesianToCartographic(positions[k + 1]);
        //                 var lon2 = Cesium.Math.toDegrees(carto2.longitude);
        //                 var lat2 = Cesium.Math.toDegrees(carto2.latitude);
        //                 heading = (lon2 - lon) / (lat2 - lat);
        //                 heading = Math.atan(heading);
        //                 heading += Math.PI / 2;
        //             }
        //             states.push(new Cesium.DynamicObjectState({
        //                 id: k,
        //                 longitude: lon,
        //                 latitude: lat,
        //                 altitude: 0.5,
        //                 heading: heading,
        //                 scale: new Cesium.Cartesian3(1, 1, 1)
        //             }));
        //         }
        //         pace.push(states);
        //     }
        //
        //     var n = 0;
        //     setInterval(function () {
        //         for (var i = 0; i < pace.length; i++) {
        //             if (n > 0) {
        //                 layer2.clear('./car/man.s3m', (n - 1) % pace[i].length);
        //             }
        //             //更新model.s3m类型实例的状态信息
        //             layer2.updateObjectWithModel('./car/man.s3m', getState2(n));
        //         }
        //         n++;
        //     }, 200);
        //
        //     function getState2(n) {
        //         var states = [];
        //         for (var i = 0; i < pace.length; i++) {
        //             states.push(pace[i][n % pace[i].length]);
        //         }
        //         return states;
        //     }
        //
        //
        // }).otherwise(function (error) {
        //     // an error occurred
        // });

        // 3、设置时间轴
        var timeLength = 360;
        var start = Cesium.JulianDate.fromDate(new Date(2018, 6, 5, 8));
        var stop = Cesium.JulianDate.addSeconds(start, timeLength, new Cesium.JulianDate()); // 设置总时长360秒

        viewer.clock.startTime = start.clone();
        viewer.clock.stopTime = stop.clone();
        viewer.clock.currentTime = start.clone();
        viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
        viewer.clock.multiplier = 2; // 10倍速率播放

        viewer.timeline.zoomTo(start, stop);

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

        // 4、动起来
    } catch (e) {
        if (widget._showRenderLoopErrors) {
            var title = '哦噢,出错了';
            widget.showErrorPanel(title, undefined, e);
        }
    }
}