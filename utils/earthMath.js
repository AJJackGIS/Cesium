/**
 * 地球工具类
 * @type {{}}
 */
var earthMath = {

    EARTH_RADIUS: 6378137.0,    //地球周长(单位M)

    /**
     * 角度转弧度
     * @param d
     * @returns {number}
     */
    getRad: function (d) {
        return d * Math.PI / 180.0;
    },


    /**
     * 计算地球任意两点间的大圆距离
     * @param lat1 第一个点纬度
     * @param lng1 第一个点经度
     * @param lat2 第二个点纬度
     * @param lng2 第二个点经度
     * @returns {number}
     */
    getGreatCircleDistance: function (lat1, lng1, lat2, lng2) {
        var radLat1 = getRad(lat1);
        var radLat2 = getRad(lat2);

        var a = radLat1 - radLat2;
        var b = getRad(lng1) - getRad(lng2);

        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
        s = s * EARTH_RADIUS;
        s = Math.round(s * 10000) / 10000.0;
        return s;
    }
}