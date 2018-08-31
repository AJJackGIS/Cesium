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