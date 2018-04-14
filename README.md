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