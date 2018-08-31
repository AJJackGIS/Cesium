/**
 * 百度墨卡托转经纬度
 */
function BaiduTransform() {

    var sp = [1.289059486E7, 8362377.87, 5591021, 3481989.83, 1678043.12, 0];
    var pi = 3.1415926535897932384626;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;

    /**
     * Bd09mc To Bd09（精度高）
     * @param lng
     * @param lat
     * @returns {Array}
     * @constructor
     */
    this.Mercator2BD09 = function(lng, lat) {
        var lnglat = [];
        var c = [];
        var d0 = [];
        var d0str = [1.410526172116255E-8, 8.98305509648872E-6, -1.9939833816331, 200.9824383106796, -187.2403703815547, 91.6087516669843,
            -23.38765649603339, 2.57121317296198, -0.03801003308653, 1.73379812E7];
        for (var i = 0; i < d0str.length; i++) {
            d0.push(d0str[i]);
        }

        var d1 = [];
        var d1str = [-7.435856389565537E-9, 8.983055097726239E-6, -0.78625201886289, 96.32687599759846, -1.85204757529826, -59.36935905485877,
            47.40033549296737, -16.50741931063887, 2.28786674699375, 1.026014486E7];
        for (var i = 0; i < d1str.length; i++) {
            d1.push(d1str[i]);
        }

        var d2 = [];
        var d2str = [-3.030883460898826E-8, 8.98305509983578E-6, 0.30071316287616, 59.74293618442277, 7.357984074871,
            -25.38371002664745, 13.45380521110908, -3.29883767235584, 0.32710905363475, 6856817.37];
        for (var i = 0; i < d2str.length; i++) {
            d2.push(d2str[i]);
        }

        var d3 = [];
        var d3str = [-1.981981304930552E-8, 8.983055099779535E-6, 0.03278182852591, 40.31678527705744, 0.65659298677277, -4.44255534477492,
            0.85341911805263, 0.12923347998204, -0.04625736007561, 4482777.06];
        for (var i = 0; i < d3str.length; i++) {
            d3.push(d3str[i]);
        }

        var d4 = [];
        var d4str = [3.09191371068437E-9, 8.983055096812155E-6, 6.995724062E-5, 23.10934304144901, -2.3663490511E-4, -0.6321817810242,
            -0.00663494467273, 0.03430082397953, -0.00466043876332, 2555164.4];
        for (var i = 0; i < d4str.length; i++) {
            d4.push(d4str[i]);
        }

        var d5 = [];
        var d5str = [2.890871144776878E-9, 8.983055095805407E-6, -3.068298E-8, 7.47137025468032, -3.53937994E-6, -0.02145144861037,
            -1.234426596E-5, 1.0322952773E-4, -3.23890364E-6, 826088.5];
        for (var i = 0; i < d5str.length; i++) {
            d5.push(d5str[i]);
        }

        lnglat[0] = Math.abs(lng);
        lnglat[1] = Math.abs(lat);

        for (var d = 0; d < 6; d++) {
            if (lnglat[1] >= sp[d]) {
                if (d == 0) {
                    c = d0;
                }

                if (d == 1) {
                    c = d1;
                }

                if (d == 2) {
                    c = d2;
                }

                if (d == 3) {
                    c = d3;
                }

                if (d == 4) {
                    c = d4;
                }

                if (d == 5) {
                    c = d5;
                }

                break;
            }
        }
        lnglat = this.Yr(lnglat, c);
        return lnglat;
    };

    this.Yr = function(lnglat, b) {
        if (b != null) {
            var c = parseFloat(b[0]) + parseFloat(b[1]) * Math.abs(lnglat[0]);
            var d = Math.abs(lnglat[1]) / parseFloat(b[9]);
            d = parseFloat(b[2]) + parseFloat(b[3]) * d + parseFloat(b[4]) * d * d + parseFloat(b[5]) * d * d * d + parseFloat(b[6])
                * d * d * d * d + parseFloat(b[7]) * d * d * d * d * d + parseFloat(b[8]) * d * d * d * d * d * d;
            var bd;
            if (0 > lnglat[0]) {
                bd = -1 * c;
            }
            else {
                bd = c;
            }
            lnglat[0] = bd;

            var bd2;
            if (0 > lnglat[1]) {
                bd2 = -1 * d;
            }
            else {
                bd2 = d;
            }
            lnglat[1] = bd2;
            return lnglat;
        }
        return null;
    }
}

var baiduTransform = new BaiduTransform();