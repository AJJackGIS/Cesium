/**
 * 地球工具类
 * @type {{}}
 */
function EarthMath() {

    var EARTH_RADIUS = 6378137.0;    //地球周长(单位M)

    /**
     * 角度转弧度
     * @param d
     * @returns {number}
     */
    this.getRad = function(d) {
        return d * Math.PI / 180.0;
    };


    /**
     * 计算地球任意两点间的大圆距离
     * @param lat1 第一个点纬度
     * @param lng1 第一个点经度
     * @param lat2 第二个点纬度
     * @param lng2 第二个点经度
     * @returns {number}
     */
    this.getGreatCircleDistance = function(lat1, lng1, lat2, lng2) {
        var radLat1 = this.getRad(lat1);
        var radLat2 = this.getRad(lat2);

        var a = radLat1 - radLat2;
        var b = this.getRad(lng1) - this.getRad(lng2);

        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
        s = s * EARTH_RADIUS;
        s = Math.round(s * 10000) / 10000.0;
        return s;
    };

    /**
     * 根据控制点获取CatmullRomSpline样条点
     * @param pointA 第一个点[x,y]
     * @param pointB 第二个点[x,y]
     * @param heightR 距离比例
     * @param num 返回多少个点
     * @returns {Array}
     */
    this.getBezierPoints = function(pointA, pointB, heightR, num) {

        var origin = [parseFloat(pointA[0]), parseFloat(pointA[1])]; // 第一个点
        var destination = [parseFloat(pointB[0]), parseFloat(pointB[1])]; // 第二个点
        // 大圆弧距离
        var dis = this.getGreatCircleDistance(origin[1], origin[0], destination[1], destination[0]);
        var earth = Cesium.Ellipsoid.WGS84; // 椭球体
        // 经纬度 -> 弧度 -> 大地坐标
        var startPoint = earth.cartographicToCartesian(Cesium.Cartographic.fromDegrees(parseFloat(pointA[0]), parseFloat(pointA[1]), 0.0));
        var endPoint = earth.cartographicToCartesian(Cesium.Cartographic.fromDegrees(parseFloat(pointB[0]), parseFloat(pointB[1]), 0.0));
        // 计算坐标中点
        var addCartesian = startPoint.clone(); // 占位
        Cesium.Cartesian3.add(startPoint, endPoint, addCartesian); // 坐标和
        var midpointCartesian = addCartesian.clone(); // 占位
        Cesium.Cartesian3.divideByScalar(addCartesian, 2, midpointCartesian); // 除以2
        // 拉到贴到地球表面
        earth.scaleToGeodeticSurface(midpointCartesian, midpointCartesian);
        // 大地 转 弧度 -- 添加高程
        var midpointCartographic = earth.cartesianToCartographic(midpointCartesian);
        // 设置高程
        midpointCartographic.height = dis / heightR;
        // 弧度 转 大地
        midpointCartesian = earth.cartographicToCartesian(midpointCartographic);
        // 样条插值
        var spline = new Cesium.CatmullRomSpline({
            times: [0.0, 0.5, 1.0],
            points: [
                startPoint,
                midpointCartesian,
                endPoint
            ]
        });
        // 点集集合
        var polyLinePoints = []; // 大地坐标集合
        for (var i = 0; i < num; i++) {
            var evaPoint = spline.evaluate(i / num); // 估算
            polyLinePoints.push(evaPoint);
        }
        return polyLinePoints;
    }
}

var earthMath = new EarthMath();