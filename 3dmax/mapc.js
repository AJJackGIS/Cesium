/**
 * 全局对象
 * @type {null}
 */
var viewer = new Cesium.Viewer("cesiumContainer", {
  imageryProvider: new Cesium.UrlTemplateImageryProvider({
    url: "http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}"
  })
});
//
// var tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
//   url: 'http://172.29.1.151:8080/3d/b3dm/tileset.json'
// }));
//
// tileset.readyPromise.then(function (a, b) {
//   //设置相机视角
//   viewer.scene.camera.setView({
//     destination: new Cesium.Cartesian3(-2277150.489621455, 5010451.017239104, 3212835.949768118),
//     orientation: {
//       heading: 3.021307638573828,
//       pitch: -0.4420928007217757,
//       roll: 0.00038835650846902325
//     }
//   });
// });

// 多边形 entity.polygon
for (var i = 0; i < 5; i++) {
  viewer.entities.add({
    name: (i + 1) + 'F',
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        114.3908909387819, 30.52064685954725, 114.3908375948418, 30.52064424547997, 114.3907822814575, 30.52064470361419, 114.3907149229882, 30.52064426214804, 114.3905112085899, 30.52064454386565, 114.3905058684132, 30.52064454539761, 114.3904170069884, 30.52064398488642, 114.3904176545224, 30.52067387127642, 114.3904174273904, 30.52088595775850, 114.3904174797662, 30.52105549569813, 114.3904176004398, 30.52118806707732, 114.3904209104852, 30.52120152152676, 114.3904221304213, 30.52120647166254, 114.3904253819050, 30.52120922013970, 114.3904378775828, 30.52121312432714, 114.3904455401968, 30.52121570106224, 114.3904513963056, 30.52121630106931, 114.3908568309561, 30.52121620403192, 114.3908589700375, 30.52121610593590, 114.3908648231814, 30.52121560117402, 114.3908682376187, 30.52121470068833, 114.3908749031904, 30.52121218448681, 114.3908791045270, 30.52120977927087, 114.3908826939608, 30.52120699852368, 114.3908889589853, 30.52120039935348, 114.390889894760, 30.52119801535843, 114.3908913883332, 30.52119487920644, 114.3908927069604, 30.52119067395655, 114.3908933078203, 30.52118604215657, 114.3908934765328, 30.52117804828895, 114.3908935158397, 30.52117259546802, 114.3908940059870, 30.52072428838781, 114.3908933394509, 30.52070457359534, 114.3908909387819, 30.52064685954725]
      ),
      height: i * 4,
      extrudedHeight: (i + 1) * 4.0, // 拉伸高度
      closeTop: true, // 多面体顶部是否封闭
      closeBottom: true, // 多面体底部是否封闭
      material: Cesium.Color.fromRandom().withAlpha(0.01)
    }
  });
}

viewer.scene.camera.setView({
  destination: new Cesium.Cartesian3(-2270838.500474798, 5008448.615351031, 3220282.706213597),
  orientation: {
    heading: 1.4914926231248442,
    pitch: -0.5689416539359433,
    roll: 0.003471890958754109
  }
});

var preFeature = null;
viewer.screenSpaceEventHandler.setInputAction(function onMouseMove(movement) {
  if (Cesium.defined(preFeature)){
    preFeature.id.polygon.material = Cesium.Color.fromRandom().withAlpha(0.01);
  }
  var pickedFeature = viewer.scene.pick(movement.endPosition);
  if (Cesium.defined(pickedFeature)) {
    pickedFeature.id.polygon.material = Cesium.Color.fromRandom().withAlpha(0.5);
  }
  preFeature = pickedFeature;
  console.log(pickedFeature);
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
