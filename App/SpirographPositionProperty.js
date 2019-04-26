/**
 * Created by G.Cordes on 01.06.16.
 */

(function (Cesium) {
    /**
     * A position property that simulates a spirograph 万花尺 https://en.wikipedia.org/wiki/Spirograph
     * @constructor
     *
     * @param {Cesium.Cartographic} center The center of the spirograph
     * @param {Number} radiusMedian The radius of the median circle
     * @param {Number} radiusSubCircle the maximum distance to the median circle
     * @param {Number} durationMedianCircle The duration in milliseconds to orbit the median circle
     * @param {Number} durationSubCircle The duration in milliseconds to orbit the sub circle
     * @param {Cesium.Ellipsoid} [ellipsoid=Cesium.Ellipsoid.WGS84] The ellipsoid to convert cartographic to cartesian
     */
    var SpirographPositionProperty = function (center, radiusMedian, radiusSubCircle, durationMedianCircle, durationSubCircle, ellipsoid) {
        this._center = center;
        this._radiusMedian = radiusMedian;
        this._radiusSubCircle = radiusSubCircle;

        this._durationMedianCircle = durationMedianCircle;
        this._durationSubCircle = durationSubCircle;

        if (!Cesium.defined(ellipsoid)) {
            ellipsoid = Cesium.Ellipsoid.WGS84;
        }
        this._ellipsoid = ellipsoid;

        this._definitionChanged = new Cesium.Event();
    };

    Cesium.defineProperties(SpirographPositionProperty.prototype, {
        /**
         * Gets a value indicating if this property is constant.  A property is considered
         * constant if getValue always returns the same result for the current definition.
         * @memberof PositionProperty.prototype
         *
         * @type {Boolean}
         * @readonly
         */
        isConstant: {
            get: function () {
                return this._radiusMedian == 0 && this._radiusSubCircle == 0;
            }
        },
        /**
         * Gets the event that is raised whenever the definition of this property changes.
         * The definition is considered to have changed if a call to getValue would return
         * a different result for the same time.
         * @memberof PositionProperty.prototype
         *
         * @type {Event}
         * @readonly
         */
        definitionChanged: {
            get: function () {
                return this._definitionChanged;
            }
        },
        /**
         * Gets the reference frame that the position is defined in.
         * @memberof PositionProperty.prototype
         * @type {ReferenceFrame}
         */
        referenceFrame: {
            get: function () {
                return Cesium.ReferenceFrame.FIXED;
            }
        }
    });

    /**
     * Gets the value of the property at the provided time in the fixed frame.
     * @function
     *
     * @param {JulianDate} time The time for which to retrieve the value.
     * @param {Cartesian3} [result] The object to store the value into, if omitted, a new instance is created and returned.
     * @returns {Cartesian3} The modified result parameter or a new instance if the result parameter was not supplied.
     */
    SpirographPositionProperty.prototype.getValue = function (time, result) {
        return this.getValueInReferenceFrame(time, Cesium.ReferenceFrame.FIXED, result);
    };

    var cartographicScratch = new Cesium.Cartographic();

    /**
     * Gets the value of the property at the provided time and in the provided reference frame.
     * @function
     *
     * @param {JulianDate} time The time for which to retrieve the value.
     * @param {ReferenceFrame} referenceFrame The desired referenceFrame of the result.
     * @param {Cartesian3} [result] The object to store the value into, if omitted, a new instance is created and returned.
     * @returns {Cartesian3} The modified result parameter or a new instance if the result parameter was not supplied.
     */
    SpirographPositionProperty.prototype.getValueInReferenceFrame = function (time, referenceFrame, result) {
        var milliseconds = Cesium.JulianDate.toDate(time).getTime();

        var radius = this._radiusMedian + this._radiusSubCircle * Math.sin(2 * Math.PI * (milliseconds / this._durationSubCircle));

        cartographicScratch.latitude = this._center.latitude + radius * Math.cos(2 * Math.PI * (milliseconds / this._durationMedianCircle));
        cartographicScratch.longitude = this._center.longitude + radius * Math.sin(2 * Math.PI * (milliseconds / this._durationMedianCircle));
        cartographicScratch.height = this._center.height;

        result = this._ellipsoid.cartographicToCartesian(cartographicScratch, result);

        cesiumViewer.entities.add({
            position: result,
            point: {
                color:Cesium.Color.RED,
                pixelSize: 10
            }
        });


        if (referenceFrame == Cesium.ReferenceFrame.FIXED) {
            return result;
        }

        return Cesium.PositionProperty.convertToReferenceFrame(time, result, Cesium.ReferenceFrame.FIXED, referenceFrame, result);
    };

    /**
     * Compares this property to the provided property and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @function
     *
     * @param {Property} [other] The other property.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    SpirographPositionProperty.prototype.equals = function (other) {
        return other instanceof SpirographPositionProperty
            && this._center.equals(other._center)
            && this._radiusMedian == other._radiusMedian
            && this._radiusSubCircle == other._radiusSubCircle
            && this._durationMedianCircle == other._durationMedianCircle
            && this._durationSubCircle == other._durationSubCircle
            && this._ellipsoid.equals(other._ellipsoid);
    };

    Cesium.SpirographPositionProperty = SpirographPositionProperty;

})(Cesium);