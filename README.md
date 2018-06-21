# Cesium
本项目是Cesium的学习项目。Cesium是国外一个基于JavaScript编写的使用WebGL的地图引擎。Cesium支持3D,2D,2.5D形式的地图展示，可以自行绘制图形，高亮区域，并提供良好的触摸支持，且支持绝大多数的浏览器和mobile

> 20171227_01 搭建服务器环境，配置WebStorm对于Cesium的提示
* 场景切换： viewer.scene.camera.flyTo()
* 坐标点：Cartesian3 三维坐标标识 通过fromDegrees()静态方法转换
* 普通点：Math.toRadians()静态方法转换
___
      ### Viewer对象的属性解析
      
      animation: false, //是否创建动画小器件，左下角仪表
      baseLayerPicker: false,//是否显示图层选择器,右上角按钮
      fullscreenButton: false,//是否显示全屏按钮,右下角按钮
      geocoder: false,//是否显示geocoder小器件，右上角查询按钮
      homeButton: true,//是否显示Home按钮,右上角按钮
      infoBox : false,//是否显示信息框
      sceneModePicker: false,//是否显示3D/2D选择器 ,右上角按钮
      selectionIndicator : false,//是否显示选取指示器组件，绿色选中框
      timeline: false,//是否显示时间轴，底部
      navigationHelpButton: false,//是否显示帮助按钮，右上角按钮
      imageryProvider:.... //底图数据提供
      
> 20171227_02 3D模型的添加

3d模型的添加，主要是Entity对象的添加，Viewer容器里面有一个entities属性专门来存储，使用Viewer的trackedEntity属性，追踪定位到某一模型

关于方位的解释：position、heading、pitch、roll
* position : 目标所在位置，使用Cartesian3对象表示
* heading: 朝向，保持头部水平方向不动，左右摆动，模拟船舵、车的方向盘
* pitch: 俯角，保持头部垂直方向不动，上下摆动，模拟点头、抬头
* roll: 旋转，保持头部整体不动，身体摇晃，模拟飞机的机身摆动
___
    var position = Cesium.Cartesian3.fromDegrees(114.44024026393892, 30.44377150531985, 0); // 位置
    var heading = Cesium.Math.toRadians(0); // 朝向
    var pitch = Cesium.Math.toRadians(0); // 俯角
    var roll = Cesium.Math.toRadians(0); // 旋绕
    var hpr = new Cesium.HeadingPitchRoll(heading,pitch,roll);
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr); // 方位
 
 3d模型使用Entity对象来封装，具体的模型对象使用ModelGraphics，Entity对象不仅可以用来封装model，也可以用来封装点、线、面等其他要素
 
    var entity = new Cesium.Entity({
        name: name,
        position: position,
        orientation: orientation, // 这个地方的orientation不能使用object类型
        model: new Cesium.ModelGraphics({
            uri:"../models/" + value + ".glb" // glb格式的三维数据
        })
    });

> 20171228_01 3D模型的渲染

3D模型(ModelGraphics)的渲染分为 模型体 的渲染模式、颜色、透明度，模型轮廓的 颜色、透明度、轮廓粗细

* 模式(mode,对应colorBlendMode属性)：分为高亮(ColorBlendMode.HIGHLIGHT)、替换(ColorBlendMode.REPLACE)、混合(ColorBlendMode.MIX) 三种模式,
其中，混合模式下延伸出一个特殊的属性 混合程度(对应colorBlendAmount属性，0-1，0是完全混合，只显示颜色，1只显示模型)
* 颜色(color,对应color属性)：Color对象表示
* 透明度(alpha,对应color对象中的alpha属性)：颜色由 R G B A 四个值代表，A就是alpha
* 轮廓颜色(color,对应silhouetteColor属性)：同上
* 轮廓透明度(alpha)：同上
* 轮廓粗细(size,对应silhouetteSize属性)：轮廓线的粗细大小

> 20171228_02 3D模型的选择，场景与鼠标的交互

3d场景必不可少的需要提供与用于的交互，需要处理鼠标操作事件，Cesium提供了丰富的鼠标操作事件，所有的事件在ScreenSpaceEventType中有列举，注册处理事件的接口是Viewer对象的screenSpaceEventHandler属性

* 设置场景范围：Viewer.scene.camera.setView() 方法
* 注册鼠标事件：Viewer.screenSpaceEventHandler.setInputAction(function,type) 其中function中带有鼠标事件发生的位置(x,y)屏幕坐标
* 选择模型：Viewer.scene.pick(position) 其中position是Cartesian2对象，返回的feature对象中color属性可以用来改变颜色，getPropertyNames方法获取模型的属性名称，getProperty方法获取属性值
* pick和selectEntity的区别：pick用于选择模型，选择到的模型可以单独处理，更改颜色达到可视化效果、获取模型属性值等等；而selectEntity的作用不是用来场景选择模型的，而是只是当前场景的infoBox=true时用来显示信息框的作用，当infoBox=false时，selectEntity不起作用。
___
    // 注册屏幕空间事件
    viewer.screenSpaceEventHandler.setInputAction(function (clickEvent) {
        var feature = viewer.scene.pick(clickEvent.position); 
            // 显示该feature
            feature.color = Cesium.Color.LIME; // 更改feature的颜色
            // 获取该feature的属性信息
            var propertyNames = feature.getPropertyNames(); // 得到所有的属性名称
            var length = propertyNames.length;
            var propertyHtml = "";
            for (var i = 0; i < length; ++i) {
                var propertyName = propertyNames[i];
                propertyHtml += "<tr><td>" + propertyName + "</td><td>" + 
                    feature.getProperty(propertyName) + "</td></tr>";
            }
            var selelctEntity = new Cesium.Entity();
            selelctEntity.name = feature.getProperty("name");
            selelctEntity.description = "<table class='cesium-infoBox-defaultTable'><tbody> " + 
                propertyHtml + " </tbody></table>";
            viewer.selectedEntity = selelctEntity;
        }
    },Cesium.ScreenSpaceEventType.LEFT_CLICK); // 左击

> 20180102_01 3D模型的属性分级渲染、显示影藏

这部分内容主要是针对于Cesium3DTileset对象的style属性，采用的是[3D Tiles Styling Languague(3d瓦片样式语言)](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/Styling),其中主要是针对于style属性的defines、color、show、meta四个key来展开

___
### defines

常用的表达式可以存储在一个defines对象中。如果一个变量引用一个定义，它将得到定义的被计算表达式的结果。如下：Height属性是模型存储的属性字段，通过defines表达式，定义了一个NewHeight新的属性，并可以在color、show、meta中的使用该属性，总结defines的作用就是提前预定义变量，把复杂的表达式通过预定义转换为简单的变量使用。

    {
        "defines" : {
            "NewHeight" : "clamp((${Height} - 0.5) / 2.0, 1.0, 255.0)",
            "HeightColor" : "rgb(${Height}, ${Height}, ${Height})"
        },
        "color" : {
            "conditions" : [
                ["(${NewHeight} >= 100.0)", "color('#0000FF') * ${HeightColor}"],
                ["(${NewHeight} >= 50.0)", "color('#00FF00') * ${HeightColor}"],
                ["(${NewHeight} >= 1.0)", "color('#FF0000') * ${HeightColor}"]
            ]
        },
        "show" : "${NewHeight} < 200.0"
    }

___
### color

color是颜色的表示，有如下几种构造方式：

* color() : Color
* color(keyword : String, [alpha : Number]) : Color
* color(6-digit-hex : String, [alpha : Number]) : Color
* color(3-digit-hex : String, [alpha : Number]) : Color
* rgb(red : Number, green : Number, blue : number) : Color
* rgba(red : Number, green : Number, blue : number, alpha : Number) : Color
* hsl(hue : Number, saturation : Number, lightness : Number) : Color
* hsla(hue : Number, saturation : Number, lightness : Number, alpha : Number) : Color

color() 相当于 color('#FFFFFF')， 是相等的，示例：

* color('cyan')
* color('#00FFFF')
* color('#0FF')
* color('cyan', 0.5)
* rgb(100, 255, 190)
* hsl(1.0, 0.6, 0.7)
* rgba(100, 255, 190, 0.25)
* hsla(1.0, 0.6, 0.7, 0.75)

___
### show

show是用来显示隐藏模型的，可以使用普通的表达式，也可以使用稍微复杂的表达式。

    "show" : "true", // 显示所有对象
    "show" : "${ZipCode} === '19341'" // 显示ZipCode为19341的对象
    "show" : "(regExp('^Chest').test(${County})) && (${YearBuilt} >= 1970)" // 显示County属性以Chest字符开头，并且YearBuilt为1970的对象
    
>RegExp
RegExp的构造方式：

* regExp() : RegExp
* regExp(pattern : String, [flags : String]) : RegExp

regExp() 等价于 regExp('(?:)')，flags 参数有如下几种：

* g - global match 全局匹配
* i - ignore case 忽略大小写
* m - multiline 
* u - unicode
* y - sticky

正则表达式支持如下几种方法： support these functions:

* test(string : String) : Boolean - 检测是否匹配
* exec(string : String) : String - 如果匹配成功，返回第一个匹配的值，否则返回null

___
### meta

meta是用来定义非可视化属性的，这个使用的情况少。例如：

    {
        "meta" : {
            "description" : "'Hello, ${featureName}.'"
        }
    }
    {
        "meta" : {
            "featureColor" : "rgb(${red}, ${green}, ${blue})",
            "featureVolume" : "${height} * ${width} * ${depth}"
        }
    }

> 20180103_01.html 自定义terrain

自定义DEM使用的是viewer对象的terrainProvider属性设置，这个属性有 EllipsoidTerrainProvider、CesiumTerrainProvider、VRTheWorldTerrainProvider、GoogleEarthEnterpriseTerrainProvider四种实现方式，例子中采用的CesiumTerrainProvider，常用的参数说明如下：

| 参数        | 类型           | 含义  |
| ------------|-------------| -----|
| url         | String | The URL of the Cesium terrain server |
| requestVertexNormals | Boolean |   Flag that indicates if the client should request additional lighting information from the server, in the form of per vertex normals if available. |
| requestWaterMask | Boolean |    Flag that indicates if the client should request per tile water masks from the server, if available. |

> 20180104_01.html  环境要素

环境要素的模拟主要是通过viewer.scene对象的skyAtmosphere属性,分为hueShift(色调)、saturationShift(饱和度)、brightnessShift(亮度)，参数值的范围为-1到1，默认为0.

同时，还可以模拟阳光的照射情况以及雾的效果，阳光主要是viewer.globle.enableLighting属性，雾是viewer.scene.fog.enabled属性，设置true或false即可。默认是不加载阳光效果，加载雾的效果。

> demo_1.html 各种entity的添加

盒子(box) 圈和椭圆(ellipse) 走廊(corridor) 气缸和锥体(cylinder) 多边形(polygon)
挖洞的多边形(polygon-holes) 折线(polyline) 折线卷(polylineVolume) 矩形(rectangle)
球体和椭球体(ellipsoid) 墙壁(wall) 点(points)  广告牌(Billboards)

> demo_2.html ImageryProvider

    // Google
    imageryProvider: new Cesium.UrlTemplateImageryProvider({
        url: 'http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}'
    })
    // ArcGIS
    imageryProvider : new Cesium.ArcGisMapServerImageryProvider({
        // url : 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
        url : 'http://server.arcgisonline.com/ArcGIS/rest/services/ESRI_Imagery_World_2D/MapServer'
    }),
    // BingMaps
    imageryProvider: new Cesium.BingMapsImageryProvider({
        url: 'https://dev.virtualearth.net',
        key: 'Ao42l-0u7fJXMmQSGY0_5zW6kfuHPeTtanya4rs8bItYH982UV42_xNccLDq70lY',
        mapStyle: Cesium.BingMapsStyle.AERIAL
    })
    // OSM
    imageryProvider: Cesium.createOpenStreetMapImageryProvider({
        url : 'https://a.tile.openstreetmap.org/'
    })
    // 天地图影像
    imageryProvider: new Cesium.WebMapTileServiceImageryProvider({
        url: "http://t0.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles",
        layer: "tdtBasicLayer",
        style: "default",
        format: "image/jpeg",
        tileMatrixSetID: "GoogleMapsCompatible",
        show: false
    })
    // 天地图注记
    imageryProvider: new Cesium.WebMapTileServiceImageryProvider({
        url: "http://t0.tianditu.com/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default.jpg",
        layer: "tdtAnnoLayer",
        style: "default",
        format: "image/jpeg",
        tileMatrixSetID: "GoogleMapsCompatible",
        show: false
    })

如有影像叠加的情况，可以设置透明度，显示多个

    //50%透明度
    blackMarble.alpha  = 0.8;
    //两倍亮度
    blackMarble.brightness = 2.0;

单张图片，适合雷达卫星图，视频贴图
    
    viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
        url : 'Cesium_Logo_Color_Overlay.png',
        rectangle : Cesium.Rectangle.fromDegrees(-75.0, 28.0, -67.0, 29.75)
    }));

地形：
    
    var terrainProvider = new Cesium.CesiumTerrainProvider({
        url : 'https://assets02.agi.com/stk-terrain/v1/tilesets/world/tiles',
        //请求水波纹效果
        requestWaterMask: true,
        //请求照明
        requestVertexNormals: true
    });
    viewer.terrainProvider = terrainProvider;
    
> demo_3.html 实体模型的两种加载方式

entity的方式

    //通过entity的方式加载3d模型
    var entity = viewer.entities.add({
        position : Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706),
        model : {
            uri : 'Cesium_Ground.gltf',
            //模型颜色，透明度
            color : Cesium.Color.fromAlpha(Cesium.Color.RED, parseFloat(0.5)),
            //轮廓线
            silhouetteColor : Cesium.Color.fromAlpha(Cesium.Color.GREEN, parseFloat(0.5)),
            //模型样式 ['Highlight', 'Replace', 'Mix']
            colorBlendMode : Cesium.ColorBlendMode.MIX,
            //colorBlendAmount需要选择mix后将colorBlendAmountEnabled设置为true才能使用
            colorBlendAmountEnabled : true,
            colorBlendAmount : parseFloat(0.8)
        }
    });
    
通过primitives的方式加载
    
    var origin = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, 0);
    var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
    var model = viewer.scene.primitives.add(Cesium.Model.fromGltf({
        url: 'Cesium_Ground.gltf',
        modelMatrix: modelMatrix,
        minimumPixelsSize: 512,
        maximumScale: 200000
    }));
    // 当模型准备渲染时，以半速度播放所有动画
    Cesium.when(model.readyPromise).then(function (model) {
        model.activeAnimations.addAll({
            //这个半速是相对于Cesium的clock来说的
            speedup: 0.5,
            //永久重复
            loop: Cesium.ModelAnimationLoop.REPEAT,
            // reverse : true // Play in reverse
        });
    }).otherwise(function (error) {
        window.alert(error);
    });
    
> demo_4.html entity和primitives的比较

    // 用entity创建多个geometry
    var entity = viewer.entities.add({
        rectangle: {
            coordinates: Cesium.Rectangle.fromDegrees(-100.0, 20.0, -90.0, 30.0),
            material: new Cesium.StripeMaterialProperty({
                evenColor: Cesium.Color.WHITE,
                oddColor: Cesium.Color.BLUE,
                repeat: 5 // 重复5条
            })
        }
    });
    for (var lon = -180.0; lon < 180.0; lon += 5.0) {
        for (var lat = -85.0; lat < 85.0; lat += 5.0) {
            viewer.entities.add({
                rectangle: new Cesium.RectangleGraphics({
                    coordinates: Cesium.Rectangle.fromDegrees(lon, lat, lon + 5.0, lat + 5.0),
                    material: new Cesium.ColorMaterialProperty(Cesium.Color.fromRandom({alpha: 0.5})),
                    outline: true,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1.5
                })
    
            })
        }
    }
    
    // 用primitives创建多个geomerty
    var instances = [];
    //循环创建随机颜色的矩形
    for (var lon = -180.0; lon < 180.0; lon += 5.0) {
        for (var lat = -85.0; lat < 85.0; lat += 5.0) {
            instances.push(new Cesium.GeometryInstance({
                id: Cesium.Math.nextRandomNumber(),
                geometry: new Cesium.RectangleGeometry({
                    rectangle: Cesium.Rectangle.fromDegrees(lon, lat, lon + 5.0, lat + 5.0),
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
                }),
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromRandom({alpha: 0.5}))
                }
            }));
        }
    }

    scene.primitives.add(new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance() //使用PerInstanceColorAppearance不同颜色来遮蔽每个实例
    }));
   
这样的写法自然是有优点也有缺点的(摘抄)

* 优点：

性能 - 当绘制大量静态图元时，直接使用几何形状可以将它们组合成单个几何体，以减少CPU开销并更好地利用GPU。并且组合是在网络上完成的，可以保持UI的响应。
灵活性 - 基元组合几何和外观。通过解耦，我们可以独立地修改。我们可以添加与许多不同外观兼容的新几何体，反之亦然。
低级访问 - 外观提供了接近于渲染器的访问，可以直接使用渲染器的所有细节(Appearances provide close-to-the-metal access to rendering without having to worry about all the details of using the Renderer directly)。外观使其易于：
编写完整的GLSL顶点和片段着色器。
使用自定义渲染状态。

* 缺点：

代码量增大，并且需要使用者对这方面有更深入的理解。
组合几何可以使用静态数据，不一定是动态数据。
primitives 的抽象级别适合于映射应用程序;几何图形和外观的抽象层次接近传统的3D引擎(Primitives are at the level of abstraction appropriate for mapping apps; geometries and appearances have a level of abstraction closer to a traditional 3D engine)（感觉翻译的不太好的地方都给上了原文）

> demo_5.html 粒子系统

粒子系统的起步从官网的Interpolation例子开始

* 设置animation和timeline
* 设置timeline的时间范围，循环方式，频率
* 计算时间段内每个时间，模型所在的位置
* 添加模型
* 设置曲线插值方式

根据这几部就能让模型动起来，接下来撸 Particle System 真正的粒子例子

    // 粒子系统
    var particleSystem = viewer.scene.primitives.add(new Cesium.ParticleSystem({
        image: 'fire.png', // 粒子资源，用于广告牌的URI，HTMLImageElement或HTMLCanvasElement。
        startColor: Cesium.Color.RED.withAlpha(0.7), //粒子出生时的颜色
        endColor: Cesium.Color.YELLOW.withAlpha(0.3), //当粒子死亡时的颜色
        startScale: 1, //粒子出生时的比例，相对于原始大小
        endScale: 4, //粒子在死亡时的比例
        life: 1, //以秒为单位设置粒子的最小和最大寿命
        // minimumLife: 1, //以秒为单位设置粒子的最短寿命
        // maximumLife: 1, //以秒为单位设置粒子的最大寿命
        speed: 5,//设置以米/秒为单位的最小和最大速度
        // minimumSpeed: 5, //设置以米/秒为单位的最小速度
        // maximumSpeed: 5, //设置以米/秒为单位的最大速度
        width: 20,  // 设置以像素为单位的粒子的最小和最大宽度
        // minimumWidth: viewModel.particleSize, //设置粒子的最小宽度（以像素为单位）。
        // maximumWidth: viewModel.particleSize, //设置粒子的最大宽度（以像素为单位）。
        height: 20, //设置粒子的最小和最大高度（以像素为单位）。
        // minimumHeight: viewModel.particleSize, //设置粒子的最小高度（以像素为单位）。
        // maximumHeight: viewModel.particleSize, //设置粒子的最大高度（以像素为单位）。
        rate: 10, //每秒发射的粒子数量
        // bursts: [
        //     // time：在粒子系统生命周期开始之后的几秒钟内将发生突发事件。
        //     // minimum：突发中发射的最小粒子数量
        //     // maximum：突发中发射的最大粒子数量
        //     // new Cesium.ParticleBurst({time: 5.0, minimum: 1, maximum: 10}),   // 当在5秒时，发射的数量为50-100
        //     // new Cesium.ParticleBurst({time: 10.0, minimum: 1, maximum: 10}), // 当在10秒时，发射的数量为200-300
        //     // new Cesium.ParticleBurst({time: 15.0, minimum: 1, maximum: 10})  // 当在15秒时，发射的数量为500-800
        //     new Cesium.ParticleBurst({time: 5.0, minimum: 50, maximum: 100}),   // 当在5秒时，发射的数量为50-100
        //     new Cesium.ParticleBurst({time: 10.0, minimum: 100, maximum: 200}), // 当在10秒时，发射的数量为200-300
        //     new Cesium.ParticleBurst({time: 15.0, minimum: 200, maximum: 300})  // 当在15秒时，发射的数量为500-800
        // ], //数组ParticleBurst，周期性地发射粒子脉冲串
        lifeTime: 16, //多长时间的粒子系统将以秒为单位发射粒子
        loop: true, //是否粒子系统应该在完成时循环它的爆发
        // new Cesium.CircleEmitter(0.5)
        // new Cesium.BoxEmitter(new Cesium.Cartesian3(0.1, 0.1, 0.1))
        // new Cesium.ConeEmitter(Cesium.Math.toRadians(30.0))
        emitter: new Cesium.CircleEmitter(0.5), //此系统的粒子发射器  共有 BoxEmitter,CircleEmitter,ConeEmitter,SphereEmitter 几类
        emitterModelMatrix: computeEmitterModelMatrix(), // 4x4转换矩阵，用于在粒子系统本地坐标系中转换粒子系统发射器
        modelMatrix: computeModelMatrix(entity, Cesium.JulianDate.now()), // 4x4转换矩阵，可将粒子系统从模型转换为世界坐标
        forces: [applyGravity] // 强制回调函数--例子：这是添加重力效果
    }));
    
    // 计算模型位置
    function computeModelMatrix(entity, time) {
        var position = Cesium.Property.getValueOrUndefined(entity.position, time, new Cesium.Cartesian3());
        if (!Cesium.defined(position)) {
            return undefined;
        }
        var orientation = Cesium.Property.getValueOrUndefined(entity.orientation, time, new Cesium.Quaternion());
        var modelMatrix = null;
        if (!Cesium.defined(orientation)) {
            modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position, undefined, new Cesium.Matrix4());
        } else {
            modelMatrix = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromQuaternion(orientation, new Cesium.Matrix3()), position, modelMatrix);
        }
        return modelMatrix;
    }
    
    // 计算粒子发射系统的模型位置
    function computeEmitterModelMatrix() {
        var hpr = Cesium.HeadingPitchRoll.fromDegrees(0, 0, 0, new Cesium.HeadingPitchRoll());
        var trs = new Cesium.TranslationRotationScale();
        trs.translation = Cesium.Cartesian3.fromElements(2.5, 4.0, 1.0, new Cesium.Cartesian3()); // 设置粒子系统相对于模型坐标的偏移
        trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(hpr, new Cesium.Quaternion());
        return Cesium.Matrix4.fromTranslationRotationScale(trs, new Cesium.Matrix4());
    }
    
    /**
     * 用于在每个时间步上对粒子施加力的函数
     * @param particle 要施加力的粒子
     * @param dt 自上次更新以来的时间
     */
    function applyGravity(particle, dt) {
        var position = particle.position;
        var gravityVector = Cesium.Cartesian3.normalize(position, new Cesium.Cartesian3());
        Cesium.Cartesian3.multiplyByScalar(gravityVector, 0 * dt, gravityVector); // 设置重力效果大小 -20时效果比较明显
        particle.velocity = Cesium.Cartesian3.add(particle.velocity, gravityVector, particle.velocity);
    }
    
    // 当场景运动起来时，粒子系统要实时计算位置，静止的场景可以省略这个
    viewer.scene.preRender.addEventListener(function (scene, time) {
        particleSystem.modelMatrix = computeModelMatrix(entity, time);
        particleSystem.emitterModelMatrix = computeEmitterModelMatrix();
    });
    
> demo_6.html 制作雨天效果

为了加深对例子系统的理解，做了一个雨天效果

1、随机在设定好的下雨的范围生成n个雨点

     // 随机的entity
    var entities = [];
    for (var lon = 114.0; lon < 114.1; lon += 0.01) {
        for (var lat = 30.0; lat < 30.1; lat += 0.01) {
            entities.push(viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees((lon + lon + 0.01) / 2, (lat + lat + 0.01) / 2, 10000),
                point: {
                    pixelSize: 5,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    show: false
                }
            }));
        }
    }
    
2、每个雨点加载一个粒子系统

    for (var i = 0; i < entities.length; i++) {
        viewer.scene.primitives.add(new Cesium.ParticleSystem({
            image: 'rainy.png', // 雨点图片
            startColor: Cesium.Color.GHOSTWHITE,
            endColor: Cesium.Color.GHOSTWHITE,
            startScale: 1,
            endScale: 1,
            life: 20,
            speed: Math.floor(Math.random() * 20 + 1),//随机速度
            width: 10,  // 设置以像素为单位的粒子的最小和最大宽度
            height: 10, //设置粒子的最小和最大高度（以像素为单位）。
            rate: 1, //每秒发射的粒子数量
            lifeTime: 16, //多长时间的粒子系统将以秒为单位发射粒子
            loop: true, //是否粒子系统应该在完成时循环它的爆发
            emitter: new Cesium.CircleEmitter(0.5), 
            emitterModelMatrix: computeEmitterModelMatrix(), 
            modelMatrix: computeModelMatrix(entities[i], Cesium.JulianDate.now()), 
            forces: [applyGravity]
        }))
    }
    
> demo_6_1.html 雨天粒子效果2

demo_6中通过添加entity的方式，给每个entity添加一个粒子系统，在6_1中,只添加了一个entity,
然后每个粒子通过位置偏移来定位，减少entity的消耗

1、制定模型位置

    var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.0, 30.0));

2、定义偏移范围

    var minX = -1000.0;
    var maxX = 1000.0;
    var minY = -800.0;
    var maxY = 1000.0;
    var minZ = -500.0;
    var maxZ = 500.0;
    
3、计算偏移

    var x = Cesium.Math.randomBetween(minX, maxX);
    var y = Cesium.Math.randomBetween(minY, maxY);
    var z = Cesium.Math.randomBetween(minZ, maxZ);
    var height = Cesium.Math.randomBetween(800, 1000);
    var offset = new Cesium.Cartesian3(x, y, z);
    
4、计算粒子系统位置

    var position = Cesium.Cartesian3.add(new Cesium.Cartesian3(0.0, 0.0, height), offset, new Cesium.Cartesian3());
    var emitterMatrix = Cesium.Matrix4.fromTranslation(position, new Cesium.Matrix4());
    
> demo_7.html 官网烟花粒子系统

> demo_8.html entity叠加视频

这个例子可以模拟广场大屏放电影的效果，视频叠加到模型上。

> build.html 模拟无人机在巡航时，能够照射的范围

两个entity的叠加