   function onload(Cesium) {
        var viewer = new Cesium.Viewer('cesiumContainer');
        var scene = viewer.scene;
        var widget = viewer.cesiumWidget;
        var index = [];
        $('#loadingbar').remove();
        
        try{
            var promise = scene.open('http://support.supermap.com.cn:8090/iserver/services/3D-CBD/rest/realspace');
            Cesium.when(promise,function(layer){
                //设置相机位置、视角，便于观察场景
                scene.camera.setView({
                    destination : new Cesium.Cartesian3(-2178725.6430165893,4380702.400924192,4091883.8564182515),
                    orientation : {
                        heading : 1.5269481203936772,
                        pitch : -0.360835493231549,
                        roll : 6.283185307179563
                    }
                });
            },function(){
                var title = '加载SCP失败，请检查网络连接状态或者url地址是否正确？';
                widget.showErrorPanel(title, undefined, e);
            });
        }
        catch(e){
            if (widget._showRenderLoopErrors) {
                var title = '渲染时发生错误，已停止渲染。';
                widget.showErrorPanel(title, undefined, e);
            }
        }
        var urls = [
            './car/qiche1.s3m',
            './car/qiche2.s3m',
            './car/qiche3.s3m',
            './car/qiche4.s3m',
            './car/qiche5.s3m',
            './car/qiche6.s3m',
            './car/qiche7.s3m',
            './car/qiche8.s3m',
            './car/qiche9.s3m',
            './car/qiche10.s3m',
            './car/qiche11.s3m',
            './car/qiche12.s3m',
            './car/qiche13.s3m',
            './car/qiche14.s3m',
            './car/qiche15.s3m',
            './car/qiche16.s3m',
            './car/qiche17.s3m',
            './car/qiche18.s3m',
        ];
        var Factor = urls.length;
        var keymap = {};
        for(var i = 0;i < Factor;i++){
            var url = urls[i];
            keymap[url] = [];
        }
        var layer = new Cesium.DynamicLayer3D(scene.context,urls);
        scene.primitives.add(layer);
        doSqlQuery();
        function onQueryComplete(queryEventArgs){
            var airRoute = queryEventArgs.originResult.features;
            var startLines = createCarLines(airRoute);
            var count = startLines.length;
            var objects = [];
            for(var i = 0;i < count;i++){
                //每条线上有18辆车
                for(var j = 0;j < Factor;j++){
                    var url = urls[j];
                    var pts = startLines[i];
                    var len = pts.length;
                    var index = Math.floor(Math.random()*(len - 1));
                    var half = len / 2;
                    var dir = true;
                    if(j == 0){
                        index = 0;
                        dir = true;
                    }
                    var point = pts[index];
                    if(!point){
                        continue;
                    }

                    var state = new Cesium.DynamicObjectState({
                        longitude : point.x,
                        latitude : point.y,
                        altitude : point.z,
                        scale : new Cesium.Cartesian3(1,1,1)
                    });
                    objects.push({
                        state : state,
                        dir : dir,
                        index : index,
                        origin : index
                    });
                    keymap[url].push(state);
                } 
            }
            $("#loadingOverlay").remove();
            setInterval(function() {
                var m = 0;
                for(var i = 0;i < count;i++){
                    var pts = startLines[i];
                    if(pts.length == 0){
                        m++;
                        continue;
                    }
                    for(j = 0;j < Factor;j++){
                        var url = urls[j];
                        var obj = objects[(i-m)*Factor+j];
                        var state = obj.state;
                        var dir = obj.dir;
                        var point;
                        if(dir){
                            obj.index += 1;
                            point = pts[obj.index];
                            if(!point){
                                layer.clear(url,i);
                                obj.index = obj.origin;
                                point = pts[obj.index];
                            }
                        }
                        state.longitude = point.x;
                        state.latitude = point.y;
                        state.altitude = point.z;
                    }
                }
                for(var key in keymap){
                    layer.updateObjectWithModel(key,keymap[key]);
                }
            }, 200);
           
        }

        function createCarLines(routes){
            var count = routes.length;                             
            var startLines = [];
            var otherLines = [];
            var startLine,otherLine;
            var startPoints=[];
            for (var i = 0; i < count; i++){
                var line = routes[i];
                var point3ds = line.geometry.points;
                var isStart = line.fieldValues[12];
                if(isStart == 'true'){
                    startPoints.push(point3ds[0]);
                    startline = [].concat(point3ds);
                    startLines.push(startline);;
                }
                else{
                    otherLine = [].concat(point3ds);
                    otherLines.push(otherLine);
                }
            }
            var startPoint,endPoint;
            var allLines = [];
            while(otherLines.length > 147){
                for(var i = 0;i < startLines.length;i++){
                    startline = startLines[i];
                    var len = startline.length;
                    endPoint = startline[len - 1];
                    var sliceIndices = [];
                    var flag = false;
                    for(var j = 0;j < otherLines.length;j++){
                        otherLine = otherLines[j];
                        startPoint = otherLine[0];
                        if(Cesium.Math.equalsEpsilon(startPoint.x,endPoint.x,Cesium.Math.EPSILON5)&& Cesium.Math.equalsEpsilon(startPoint.y,endPoint.y,Cesium.Math.EPSILON5) && Cesium.Math.equalsEpsilon(startPoint.z,endPoint.z,Cesium.Math.EPSILON5)){
                            flag = true;
                            line = [].concat(startline).concat(otherLine.slice(1));
                            allLines.push(line);
                            sliceIndices.push(j);
                        }
                    }
                    if(!flag){
                        allLines.push([].concat(startline));
                    }
                    for(var m = 0;m < sliceIndices.length;m++){
                        var index = sliceIndices[m];
                        otherLines.splice(index,1);
                    }
                }
                startLines = [].concat(allLines);
                allLines.length = 0;
            }
            return startLines;

        }
        function doSqlQuery(){
            var getFeatureParam, getFeatureBySQLService, getFeatureBySQLParams;

            getFeatureParam = new SuperMap.REST.FilterParameter({
                attributeFilter: "SMID>0"
            });
            getFeatureBySQLParams = new SuperMap.REST.GetFeaturesBySQLParameters({
                queryParameter: getFeatureParam,
                toIndex:426,
                datasetNames: ["CBD车道:" + "车道三维"]
            });
            var url = 'http://www.supermapol.com/realspace/services/data-road/rest/data';
            getFeatureBySQLService = new SuperMap.REST.GetFeaturesBySQLService(url, {
                eventListeners: {"processCompleted": onQueryComplete, "processFailed": processFailed}});
            getFeatureBySQLService.processAsync(getFeatureBySQLParams);
        }

        function processFailed(queryEventArgs){
        }

        scene.postRender.addEventListener(function(){
            var lonR = viewer.camera.positionCartographic.longitude;
            var latR = viewer.camera.positionCartographic.latitude;
            var height = viewer.camera.positionCartographic.height;
            var lonD = Cesium.Math.toDegrees(lonR).toFixed(4);
            var latD = Cesium.Math.toDegrees(latR).toFixed(4);
            var heading = viewer.camera.heading.toFixed(4);
            var pitch = viewer.camera.pitch.toFixed(4);
            var i = 0;
        });

   }