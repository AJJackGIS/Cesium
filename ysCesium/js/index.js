$(function () {
    // //a标签
    // $(".download").click(function () {
    //     ajaxData('post', 'https://www.yueyanshaosun.cn/ClodyNoteV2/cors/updateSiteclicker',{"name":"总下载量"}, function (res) {});
    // });
    // ajaxData('post', 'https://www.yueyanshaosun.cn/ClodyNoteV2/cors/updateSiteclicker',{"name":"ysCesium"}, function (res) {});
    // //封装ajax
    function ajaxData(sendType, urlPath, sendData, callback){//get/post,地址，发送数据，回调函数
        $.ajax({
            async: false, //默认为true，为异步执行；必要时需要改为同步执行
            type: sendType,
            url: urlPath,
            data: sendData,
            success: function(res){    //res后台取到的数据.
                callback(res);
            }
        });
    }

    $(".label .btn").click(function () {
        $(".label").fadeOut(200);
        $(".left").stop().animate({
            left: 0
        }, 300);

    });
    setTimeout(function () {
        $(".label").fadeIn(300);
    }, 2000);
    $(document).mousemove(function (e) {
        if (e.pageX < 100) {
            $(".left").stop().animate({
                left: 0
            }, 300)
        }
    });
    $(".left").mouseleave(function () {
        $(".left").stop().animate({
            left: -300
        }, 200)
    });

    //cesium
    //地图
    var viewer = ysc.createNormalCesium("map", {
        //添加修改属性。
        globeLight: true//全球随时间变化的光照
        , globalImagery: "谷歌"//
        , globalImageryBrightness: 0.8 //影像的亮度
        // , globalLabel: "天地图"//天地图标注
        // , globalLabelBrightness: 0.8//影像的亮度
        , defaultKey: "19b72f6cde5c8b49cf21ea2bb4c5b21e"//天地图的key; 当用天地图时，默认是这个
    });
    //点击确定 添加一些entity和视频
    $(".label .btn").click(function () {
        $(".label").fadeOut(200);
        $(".left").stop().animate({
            left: 0
        }, 300);

        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(117.21579, 31.80749, 1500.0),
            orientation: {
                heading: Cesium.Math.toRadians(20.0),//左右摆
                pitch: Cesium.Math.toRadians(-35.0), //正俯视
                roll: 0.0
            },
            complete: function () {
                setTimeout(function () {
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(117.22179, 31.80949, 1500.0),
                        orientation: {
                            heading: Cesium.Math.toRadians(0),
                            pitch: Cesium.Math.toRadians(-45),
                            roll: 0.0
                        },
                        // easingFunction : Cesium.EasingFunction.LINEAR_NONE
                    });
                    var lon = 117.22159, lat = 31.82348;
                    ysc.addCircleRipple(viewer, { //默认只绘制两个圆圈叠加 如遇绘制多个，请自行源码内添加。
                        id: "111",
                        lon: lon,
                        lat: lat,
                        height: 0,
                        maxR: 500,
                        minR: 0,//最好为0
                        deviationR: 5,//差值 差值也大 速度越快
                        eachInterval: 1000,//两个圈的时间间隔
                        imageUrl: "../plugins/ysc/images/redCircle2.png"
                    });
                    viewer.entities.add({
                        name: "",
                        polyline: {
                            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                                lon, lat, 0,
                                lon, lat, 500,]
                            ),
                            width: 4,
                            material: new Cesium.PolylineGlowMaterialProperty({ //发光线
                                glowPower: 0.1,
                                color: Cesium.Color.RED
                            })
                        }
                    });
                    //添加视频
                    if (parseInt($(".container").css("width")) > 800) {
                        $(".container").append("  <div class='video-box'>\n" +
                            "        <!--video在手机端大部分浏览器不能自动播放-->\n" +
                            "        <video id='video' muted='' autoplay='' loop='' crossorigin='' controls=''>\n" +
                            "            <source src='../images/1.webm' type='video/webm'>\n" +
                            "            <source src='../images/2.mp4' type='video/mp4'>\n" +
                            "            <source src='../images/3.mov' type='video/quicktime'>\n" +
                            "            Your browser does not support the <code>video</code> element.\n" +
                            "        </video>\n" +
                            "    </div>");
                        //添加视频
                        var videoElement = document.getElementById("video");
                        //添加正方形（面）
                        var h = 0;
                        var box2 = viewer.entities.add({
                            name: "this is my box",
                            position: new Cesium.CallbackProperty(function () {
                                h = h + 5;
                                if (h >= 400) {
                                    h = 400;
                                }
                                return Cesium.Cartesian3.fromDegrees(117.22159, 31.82548, h / 2)
                            }, false),
                            box: {
                                dimensions: new Cesium.CallbackProperty(function () {
                                    return new Cesium.Cartesian3(600.0, 1, h);
                                }), //规模大小
                                material: videoElement
                            }
                        });
                    }
                    /** main */
                    var data = {
                        lon: lon,
                        lat: lat - 0.001,
                        element: $("#one"),
                        addEntity: false,//默认为false,如果为false的话就不添加实体，后面的实体属性就不需要了
                        boxHeightMax: 100,//中间立方体的高度 没有立方体就代表 弹窗地理高度
                    };
                    ysc.showDynamicLayer(viewer, data, function () { //回调函数 改变弹窗的内容;
                        $("#one").find(".main").html("经度:117.22159;纬度:31.82248<br/>你可以点击地球任意位置");
                    });
                    /** main */
                }, 500);
            }
        }, 3000);
    });
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (e) {
        var cartesian = viewer.camera.pickEllipsoid(e.position, viewer.scene.globe.ellipsoid);
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(5);//四舍五入 小数点后保留五位
        var lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(5);//四舍五入  小数点后保留五位
        // var height = Math.ceil(viewer.camera.positionCartographic.height);   //获取相机高度
        if (cartesian) {
            /** main */
            var data = {
                layerId: "layer1",//弹窗的唯一id，英文，且唯一,内部entity会用得到
                lon: lon,
                lat: lat,
                element: $("#one"),
                addEntity: true,//默认为false,如果为false的话就不添加实体，后面的实体属性就不需要了
                boxHeight: 150,//中间立方体的高度
                boxHeightDif: 5,//中间立方体的高度增长差值，越大增长越快
                boxHeightMax: 300,//中间立方体的最大高度
                boxSide: 40,//立方体的边长
                boxMaterial: Cesium.Color.DEEPSKYBLUE.withAlpha(0.5),
                circleSize: 200,//大圆的大小，小圆的大小默认为一半
            };
            ysc.showDynamicLayer(viewer, data, function () { //回调函数 改变弹窗的内容;
                // $("#one").find(".main").html("经度:"+lon+"<br/>纬度:"+lat);
                $("#one").find(".main").html(" <div class=\"charts\" id=\"chart-1\"></div>");
                ajaxData('post', 'https://www.yueyanshaosun.cn/ClodyNoteV2/cors/getSiteclicker', {"name": "首页"}, function (res) {
                    var sc = res.siteclicker;
                    setChart1(sc);
                });
            });
            /** main */
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    function setChart1(siteclicker) {
        var data1 = [];
        var data2 = [];
        for (var i = 0; i < siteclicker.length; i++) { //这里我们去掉一个
            if (i != 4 && i != 6) {
                data1.push(siteclicker[i].name);
                data2.push({
                    value: siteclicker[i].number,
                    name: siteclicker[i].name,
                    symbol: 'image://../images/bar.png'
                })
            }
        }
        var myChart1 = echarts.init(document.getElementById('chart-1'));
        var option1 = {
            grid: {
                left: '0', //grid 组件离容器左侧的距离。
                top: '20px',
                right: '15px', //grid 组件离容器右侧的距离。
                bottom: '20px', //grid 组件离容器下侧的距离。
                containLabel: true //grid 区域是否包含坐标轴的刻度标签[ default: false ]
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    crossStyle: {
                        color: '#999'
                    }
                }
            },
            xAxis: [{
                type: 'category',
                boundaryGap: true, //坐标轴两边留白策略，类目轴和非类目轴的设置和表现不一样
                axisLine: {
                    lineStyle: {
                        color: '#858585' //坐标轴线线的颜色。
                    }
                },
                axisLabel: {
                    show: false
                },
                data: data1
            }],
            yAxis: [{
                type: 'value', //坐标轴类型。'value' 数值轴，适用于连续数据;'category' 类目轴，适用于离散的类目数据，为该类型时必须通过 data 设置类目数据;'time' 时间轴;'log' 对数轴.
                name: '点击量', //坐标轴名称。
                axisTick: {
                    show: false //是否显示坐标轴刻度
                },
                axisLine: {
                    lineStyle: {
                        color: '#858585'  //坐标轴线线的颜色
                    }
                },
                axisLabel: {
                    margin: 10, //刻度标签与轴线之间的距离
                    textStyle: {
                        fontSize: 10, //文字的字体大小
                        color: '#fdfdfd'
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(255,255,255,0.1)' //分隔线颜色设置
                    }
                }
            }],
            series: [
                {
                    name: '点击量',
                    type: 'pictorialBar',
                    symbolSize: ['19', '90%'],  //设置图片background-size
                    symbolPosition: 'start',   //设置图形起使位置
                    z: 10,
                    data: data2
                }
            ]
        };
        myChart1.setOption(option1);
        $(window).resize(function () {
            $(myChart1).resize();
        });
        //渲染完毕后resize一下
        myChart1.on('finished', function () {
            $(myChart1).resize();
        });
    }
});