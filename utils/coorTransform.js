/**
 * 坐标转换工具类
 */
function CoordinateTransform() {

    //定义一些常量
    var p = 3.14159265358979324 * 3000.0 / 180.0;
    var m = 3.1415926535897932384626;
    var a = 6378245.0;
    var e = 0.00669342162296594323;

    /**
     * 百度坐标系 (BD-09) 与 火星坐标系 (GCJ-02)的转换
     * 即 百度 转 谷歌、高德
     * @param lon
     * @param lat
     * @returns {*[]}
     */
    this.bd09togcj02 = function (lon, lat) {
        var lon = +lon;
        var lat = +lat;
        var x = lon - 0.0065;
        var y = lat - 0.006;
        var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * p);
        var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * p);
        var gg_lng = z * Math.cos(theta);
        var gg_lat = z * Math.sin(theta);
        return [gg_lng, gg_lat]
    };

    /**
     * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换
     * 即谷歌、高德 转 百度
     * @param lng
     * @param lat
     * @returns {*[]}
     */
    this.gcj02tobd09 = function (lng, lat) {
        var lat = +lat;
        var lng = +lng;
        var z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * p);
        var theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * p);
        var lng = z * Math.cos(theta) + 0.0065;
        var lat = z * Math.sin(theta) + 0.006;
        return [lng, lat]
    };

    /**
     * WGS84转GCj02
     * @param lng
     * @param lat
     * @returns {*[]}
     */
    this.wgs84togcj02 = function (lng, lat) {
        var lat = +lat;
        var lng = +lng;
        if (this.out_of_china(lng, lat)) {
            return [lng, lat]
        } else {
            var dlat = this.transformlat(lng - 105.0, lat - 35.0);
            var dlng = this.transformlng(lng - 105.0, lat - 35.0);
            var radlat = lat / 180.0 * m;
            var magic = Math.sin(radlat);
            magic = 1 - e * magic * magic;
            var sqrtmagic = Math.sqrt(magic);
            dlat = (dlat * 180.0) / ((a * (1 - e)) / (magic * sqrtmagic) * m);
            dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * m);
            var mglat = lat + dlat;
            var mglng = lng + dlng;
            return [mglng, mglat]
        }
    };

    /**
     * GCJ02 转换为 WGS84
     * @param lng
     * @param lat
     * @returns {*[]}
     */
    this.gcj02towgs84 = function (lng, lat) {
        var lat = +lat;
        var lng = +lng;
        if (this.out_of_china(lng, lat)) {
            return [lng, lat]
        } else {
            var dlat = this.transformlat(lng - 105.0, lat - 35.0);
            var dlng = this.transformlng(lng - 105.0, lat - 35.0);
            var radlat = lat / 180.0 * m;
            var magic = Math.sin(radlat);
            magic = 1 - e * magic * magic;
            var sqrtmagic = Math.sqrt(magic);
            dlat = (dlat * 180.0) / ((a * (1 - e)) / (magic * sqrtmagic) * m);
            dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * m);
            var mglat = lat + dlat;
            var mglng = lng + dlng;
            return [lng * 2 - mglng, lat * 2 - mglat]
        }
    };

    this.transformlat = function (lng, lat) {
        var lat = +lat;
        var lng = +lng;
        var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * m) + 20.0 * Math.sin(2.0 * lng * m)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat * m) + 40.0 * Math.sin(lat / 3.0 * m)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lat / 12.0 * m) + 320 * Math.sin(lat * m / 30.0)) * 2.0 / 3.0;
        return ret
    };

    this.transformlng = function (lng, lat) {
        var lat = +lat;
        var lng = +lng;
        var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * m) + 20.0 * Math.sin(2.0 * lng * m)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng * m) + 40.0 * Math.sin(lng / 3.0 * m)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lng / 12.0 * m) + 300.0 * Math.sin(lng / 30.0 * m)) * 2.0 / 3.0;
        return ret
    };

    /**
     * 判断是否在国内，不在国内则不做偏移
     * @param lng
     * @param lat
     * @returns {boolean}
     */
    this.out_of_china = function (lng, lat) {
        var lat = +lat;
        var lng = +lng;
        // 纬度3.86~53.55,经度73.66~135.05
        return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
    }
}

var coordinateTransform = new CoordinateTransform();