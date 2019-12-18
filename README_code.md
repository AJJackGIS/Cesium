# Cesium 局部代码

> 初始显示的是中国
    
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(73.0, 3.0, 135.0, 53.0);
    viewer.camera.flyHome(5);

> 相机进入地下问题
    
    ***scene下的ScreenSpaceCameraController代码
    
    function pickGlobe(controller, mousePosition, result) {
        var scene = controller._scene;
        var globe = controller._globe;
        var camera = scene.camera;
    
        if (!defined(globe)) {
            return undefined;
        }
    
        var depthIntersection;
        if (scene.pickPositionSupported) {
            depthIntersection = scene.pickPositionWorldCoordinates(mousePosition, scratchDepthIntersection);
        }
    
        var ray = camera.getPickRay(mousePosition, pickGlobeScratchRay);
        var rayIntersection = globe.pick(ray, scene, scratchRayIntersection);
    
        var pickDistance = defined(depthIntersection) ? 
                Cartesian3.distance(depthIntersection, camera.positionWC) : Number.POSITIVE_INFINITY;
        
        var rayDistance = defined(rayIntersection) ? 
                Cartesian3.distance(rayIntersection, camera.positionWC) : Number.POSITIVE_INFINITY;
    
        if (pickDistance < rayDistance) {
            return Cartesian3.clone(depthIntersection, result);
        }
    
        return Cartesian3.clone(rayIntersection, result);
    }       
    
> 调整3DTiles的整体高度
    
    function(height) {
        height = Number(height);
        if (isNaN(height)) {
            return;
        }
    
        var cartographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center);
        var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
        var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height);
        var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
    } 
    
> 根据坐标获取3D Tiles的高度

    Scene.clampToHeight(cartesian, objectsToExclude, width, result) → Cartesian3
    Scene.clampToHeightMostDetailed(cartesians, objectsToExclude, width) → Promise.<Array.<Cartesian3>>
    
    *** objectsToExclude ----> A list of primitives, entities, or 3D Tiles features to not clamp to.       

> entity贴对象

    var route = viewer.entities.add({
        polyline : {
            positions : [.....]
            clampToGround : true,
            classificationType: Cesium.ClassificationType.CESIUM_3D_TILE
        }
    });         
    
> 获取起点和终点之间的表面距离,表面插值

    var geodesic = new Cesium.EllipsoidGeodesic(start, end, ellipsoid);
    geodesic.setEndPoints(startCartographic, endCartographic);
    geodesic.interpolateUsingFraction(fraction, result) → Cartographic
    geodesic.interpolateUsingSurfaceDistance(distance, result) → Cartographic
    
> 模型建组（图层集合）

    var spheres = entities.add(new Cesium.Entity()); // 图层
    entities.add({
        parent : boxes, // 父容器
        position : Cesium.Cartesian3.fromDegrees(-106.0, 45.0, height),
        box : {
            dimensions : new Cesium.Cartesian3(90000.0, 90000.0, 90000.0),
            material : Cesium.Color.fromRandom({alpha : 1.0})
        }
    });
    spheres.show = !spheres.show; // 显示/隐藏
    
> 计算点距离某一个平面的距离

    Cesium.Plane.getPointDistance(plane, point) → Number
    计算点到平面的最短距离。距离决定了该点所在平面的哪一侧。如果距离为正，则该点位于法线方向的半空间中; 如果为负，则该点位于与正常相反的半空间中; 如果为零，则该点在平面上。
    
    Cesium.Plane.projectPointOntoPlane(plane, point, result) → Cartesian3
    计算点在平面上的投影点
	
> 对数深度
	
	我们封装的属性叫  earth.terrainEffect.logDepth 
	cesium对应的属性 scene.logarithmicDepthBuffer