/*
 *  How to add HeatmapImageryProvider to Cesium:
 *
 *  1. Add the class (define - return HeatmapImageryProvider) to Cesium.js after the definition of define and before the definition of Cesium.
 *  2. Add './Scene/HeatmapImageryProvider' as the first value in the second parameter of the definition call of Cesium (on the line starting with "define('Cesium',[").
 *  3. Add 'Scene_HeatmapImageryProvider' as the first value in the third parameter of the definition call of Cesium (on the line starting with "define('Cesium',[").
 *  4. Add 'Cesium['HeatmapImageryProvider'] = Scene_HeatmapImageryProvider;' to the body of the definition call of Cesium (after the line starting with "var Cesium = {").
 *  5. Make sure heatmap.js in included and available before using HeatmapImageryProvider.
 *
 */

/*global define*/
define('Scene/HeatmapImageryProvider',[
    '../Core/Credit',
    '../Core/defaultValue',
    '../Core/defined',
    '../Core/defineProperties',
    '../Core/DeveloperError',
    '../Core/Event',
    '../Core/GeographicTilingScheme',
    '../Core/Rectangle',
    '../Core/TileProviderError'
], function(
    Credit,
    defaultValue,
    defined,
    defineProperties,
    DeveloperError,
    Event,
    GeographicTilingScheme,
    Rectangle,
    TileProviderError) {
    "use strict";

    /**
     * Provides a single, top-level imagery tile.  The single image is assumed to use a
     * {@link GeographicTilingScheme}.

     *
     * @alias HeatmapImageryProvider
     * @constructor
     *
     * @param {Object} options Object with the following properties:
     * @param {Object} [options.heatmapoptions] Optional heatmap.js options to be used (see http://www.patrick-wied.at/static/heatmapjs/docs.html#h337-create).
     * @param {Object} [options.bounds] The bounding box for the heatmap in WGS84 coordinates.
     * @param {Number} [options.bounds.north] The northernmost point of the heatmap.
     * @param {Number} [options.bounds.south] The southernmost point of the heatmap.
     * @param {Number} [options.bounds.west] The westernmost point of the heatmap.
     * @param {Number} [options.bounds.east] The easternmost point of the heatmap.
     * @param {Object} [options.data] Data to be used for the heatmap.
     * @param {Object} [options.data.min] Minimum allowed point value.
     * @param {Object} [options.data.max] Maximum allowed point value.
     * @param {Array} [options.data.points] The data points for the heatmap containing x=lon, y=lat and value=number.
     *
     * @see HeatmapImageryProvider
     * @see ArcGisMapServerImageryProvider
     * @see BingMapsImageryProvider
     * @see GoogleEarthImageryProvider
     * @see OpenStreetMapImageryProvider
     * @see TileMapServiceImageryProvider
     * @see WebMapServiceImageryProvider
     */
    var HeatmapImageryProvider = function(options) {
        options = defaultValue(options, {});
        var bounds = options.bounds;
        var data = options.data;

        if (!defined(bounds)) {
            throw new DeveloperError('options.bounds is required.');
        } else if (!defined(bounds.north) || !defined(bounds.south) || !defined(bounds.east) || !defined(bounds.west)) {
            throw new DeveloperError('options.bounds.north, options.bounds.south, options.bounds.east and options.bounds.west are required.');
        }

        if (!defined(data)) {
            throw new DeveloperError('data is required.');
        } else if (!defined(data.min) || !defined(data.max) || !defined(data.points)) {
            throw new DeveloperError('options.bounds.north, bounds.south, bounds.east and bounds.west are required.');
        }

        this._wmp = new Cesium.WebMercatorProjection();
        this._mbounds = this.wgs84ToMercatorBB(bounds);
        this._options = defaultValue(options.heatmapoptions, {});
        this._options.gradient = defaultValue(this._options.gradient, { 0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"});

        this._setWidthAndHeight(this._mbounds);
        this._options.radius = Math.round(defaultValue(this._options.radius, ((this.width > this.height) ? this.width / 60 : this.height / 60)));

        this._spacing = this._options.radius * 1.5;
        this._xoffset = this._mbounds.west;
        this._yoffset = this._mbounds.south;

        this.width = Math.round(this.width + this._spacing * 2);
        this.height = Math.round(this.height + this._spacing * 2);

        this._mbounds.west -= this._spacing * this._factor;
        this._mbounds.east += this._spacing * this._factor;
        this._mbounds.south -= this._spacing * this._factor;
        this._mbounds.north += this._spacing * this._factor;

        this.bounds = this.mercatorToWgs84BB(this._mbounds);

        this._container = this._getContainer(this.width, this.height);
        this._options.container = this._container;
        this._heatmap = h337.create(this._options);
        this._canvas = this._container.children[0];

        this._tilingScheme = new Cesium.WebMercatorTilingScheme({
            rectangleSouthwestInMeters: new Cesium.Cartesian2(this._mbounds.west, this._mbounds.south),
            rectangleNortheastInMeters: new Cesium.Cartesian2(this._mbounds.east, this._mbounds.north)
        });

        this._image = this._canvas;
        this._texture = undefined;
        this._tileWidth = this.width;
        this._tileHeight = this.height;
        this._ready = false;

        if (options.data) {
            this._ready = this.setWGS84Data(options.data.min, options.data.max, options.data.points);
        }
    };

    defineProperties(HeatmapImageryProvider.prototype, {
        /**
         * Gets the URL of the single, top-level imagery tile.
         * @memberof HeatmapImageryProvider.prototype
         * @type {String}
         * @readonly
         */
        url : {
            get : function() {
                return this._url;
            }
        },

        /**
         * Gets the width of each tile, in pixels. This function should
         * not be called before {@link HeatmapImageryProvider#ready} returns true.
         * @memberof HeatmapImageryProvider.prototype
         * @type {Number}
         * @readonly
         */
        tileWidth : {
            get : function() {
                if (!this._ready) {
                    throw new DeveloperError('tileWidth must not be called before the imagery provider is ready.');
                }

                return this._tileWidth;
            }
        },

        /**
         * Gets the height of each tile, in pixels.  This function should
         * not be called before {@link HeatmapImageryProvider#ready} returns true.
         * @memberof HeatmapImageryProvider.prototype
         * @type {Number}
         * @readonly
         */
        tileHeight: {
            get : function() {
                if (!this._ready) {
                    throw new DeveloperError('tileHeight must not be called before the imagery provider is ready.');
                }

                return this._tileHeight;
            }
        },

        /**
         * Gets the maximum level-of-detail that can be requested.  This function should
         * not be called before {@link HeatmapImageryProvider#ready} returns true.
         * @memberof HeatmapImageryProvider.prototype
         * @type {Number}
         * @readonly
         */
        maximumLevel : {
            get : function() {
                if (!this._ready) {
                    throw new DeveloperError('maximumLevel must not be called before the imagery provider is ready.');
                }

                return 0;
            }
        },

        /**
         * Gets the minimum level-of-detail that can be requested.  This function should
         * not be called before {@link HeatmapImageryProvider#ready} returns true.
         * @memberof HeatmapImageryProvider.prototype
         * @type {Number}
         * @readonly
         */
        minimumLevel : {
            get : function() {
                if (!this._ready) {
                    throw new DeveloperError('minimumLevel must not be called before the imagery provider is ready.');
                }

                return 0;
            }
        },

        /**
         * Gets the tiling scheme used by this provider.  This function should
         * not be called before {@link HeatmapImageryProvider#ready} returns true.
         * @memberof HeatmapImageryProvider.prototype
         * @type {TilingScheme}
         * @readonly
         */
        tilingScheme : {
            get : function() {
                if (!this._ready) {
                    throw new DeveloperError('tilingScheme must not be called before the imagery provider is ready.');
                }

                return this._tilingScheme;
            }
        },

        /**
         * Gets the rectangle, in radians, of the imagery provided by this instance.  This function should
         * not be called before {@link HeatmapImageryProvider#ready} returns true.
         * @memberof HeatmapImageryProvider.prototype
         * @type {Rectangle}
         * @readonly
         */
        rectangle : {
            get : function() {
                return this._tilingScheme.rectangle;//TODO: change to custom rectangle?
            }
        },

        /**
         * Gets the tile discard policy.  If not undefined, the discard policy is responsible
         * for filtering out "missing" tiles via its shouldDiscardImage function.  If this function
         * returns undefined, no tiles are filtered.  This function should
         * not be called before {@link HeatmapImageryProvider#ready} returns true.
         * @memberof HeatmapImageryProvider.prototype
         * @type {TileDiscardPolicy}
         * @readonly
         */
        tileDiscardPolicy : {
            get : function() {
                if (!this._ready) {
                    throw new DeveloperError('tileDiscardPolicy must not be called before the imagery provider is ready.');
                }

                return undefined;
            }
        },

        /**
         * Gets an event that is raised when the imagery provider encounters an asynchronous error.  By subscribing
         * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
         * are passed an instance of {@link TileProviderError}.
         * @memberof HeatmapImageryProvider.prototype
         * @type {Event}
         * @readonly
         */
        errorEvent : {
            get : function() {
                return this._errorEvent;
            }
        },

        /**
         * Gets a value indicating whether or not the provider is ready for use.
         * @memberof HeatmapImageryProvider.prototype
         * @type {Boolean}
         * @readonly
         */
        ready : {
            get : function() {
                return this._ready;
            }
        },

        /**
         * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
         * the source of the imagery.  This function should not be called before {@link HeatmapImageryProvider#ready} returns true.
         * @memberof HeatmapImageryProvider.prototype
         * @type {Credit}
         * @readonly
         */
        credit : {
            get : function() {
                return this._credit;
            }
        },

        /**
         * Gets a value indicating whether or not the images provided by this imagery provider
         * include an alpha channel.  If this property is false, an alpha channel, if present, will
         * be ignored.  If this property is true, any images without an alpha channel will be treated
         * as if their alpha is 1.0 everywhere.  When this property is false, memory usage
         * and texture upload time are reduced.
         * @memberof HeatmapImageryProvider.prototype
         * @type {Boolean}
         * @readonly
         */
        hasAlphaChannel : {
            get : function() {
                return true;
            }
        }
    });

    HeatmapImageryProvider.prototype._setWidthAndHeight = function(mbb) {
        var maxCanvasSize = 2000;
        var minCanvasSize = 700;
        this.width = ((mbb.east > 0 && mbb.west < 0) ? mbb.east + Math.abs(mbb.west) : Math.abs(mbb.east - mbb.west));
        this.height = ((mbb.north > 0 && mbb.south < 0) ? mbb.north + Math.abs(mbb.south) : Math.abs(mbb.north - mbb.south));
        this._factor = 1;

        if (this.width > this.height && this.width > maxCanvasSize) {
            this._factor = this.width / maxCanvasSize;

            if (this.height / this._factor < minCanvasSize) {
                this._factor = this.height / minCanvasSize;
            }
        } else if (this.height > this.width && this.height > maxCanvasSize) {
            this._factor = this.height / maxCanvasSize;

            if (this.width / this._factor < minCanvasSize) {
                this._factor = this.width / minCanvasSize;
            }
        } else if (this.width < this.height && this.width < minCanvasSize) {
            this._factor = this.width / minCanvasSize;

            if (this.height / this._factor > maxCanvasSize) {
                this._factor = this.height / maxCanvasSize;
            }
        } else if (this.height < this.width && this.height < minCanvasSize) {
            this._factor = this.height / minCanvasSize;

            if (this.width / this._factor > maxCanvasSize) {
                this._factor = this.width / maxCanvasSize;
            }
        }

        this.width = this.width / this._factor;
        this.height = this.height / this._factor;
    };

    HeatmapImageryProvider.prototype._getContainer = function(width, height, id) {
        var c = document.createElement("div");
        if (id) { c.setAttribute("id", id); }
        c.setAttribute("style", "width: " + width + "px; height: " + height + "px; margin: 0px; display: none;");
        document.body.appendChild(c);
        return c;
    };

    /**
     * Convert a WGS84 location into a Mercator location.
     *
     * @param {Object} point The WGS84 location.
     * @param {Number} [point.x] The longitude of the location.
     * @param {Number} [point.y] The latitude of the location.
     * @returns {Cesium.Cartesian3} The Mercator location.
     */
    HeatmapImageryProvider.prototype.wgs84ToMercator = function(point) {
        return this._wmp.project(Cesium.Cartographic.fromDegrees(point.x, point.y));
    };

    /**
     * Convert a WGS84 bounding box into a Mercator bounding box.
     *
     * @param {Object} bounds The WGS84 bounding box.
     * @param {Number} [bounds.north] The northernmost position.
     * @param {Number} [bounds.south] The southrnmost position.
     * @param {Number} [bounds.east] The easternmost position.
     * @param {Number} [bounds.west] The westernmost position.
     * @returns {Object} The Mercator bounding box containing north, south, east and west properties.
     */
    HeatmapImageryProvider.prototype.wgs84ToMercatorBB = function(bounds) {
        var ne = this._wmp.project(Cesium.Cartographic.fromDegrees(bounds.east, bounds.north));
        var sw = this._wmp.project(Cesium.Cartographic.fromDegrees(bounds.west, bounds.south));
        return {
            north: ne.y,
            south: sw.y,
            east: ne.x,
            west: sw.x
        };
    };

    /**
     * Convert a mercator location into a WGS84 location.
     *
     * @param {Object} point The Mercator lcation.
     * @param {Number} [point.x] The x of the location.
     * @param {Number} [point.y] The y of the location.
     * @returns {Object} The WGS84 location.
     */
    HeatmapImageryProvider.prototype.mercatorToWgs84 = function(p) {
        var wp = this._wmp.unproject(new Cesium.Cartesian3(p.x, p.y));
        return {
            x: wp.longitude,
            y: wp.latitude
        };
    };

    /**
     * Convert a Mercator bounding box into a WGS84 bounding box.
     *
     * @param {Object} bounds The Mercator bounding box.
     * @param {Number} [bounds.north] The northernmost position.
     * @param {Number} [bounds.south] The southrnmost position.
     * @param {Number} [bounds.east] The easternmost position.
     * @param {Number} [bounds.west] The westernmost position.
     * @returns {Object} The WGS84 bounding box containing north, south, east and west properties.
     */
    HeatmapImageryProvider.prototype.mercatorToWgs84BB = function(bounds) {
        var sw = this._wmp.unproject(new Cesium.Cartesian3(bounds.west, bounds.south));
        var ne = this._wmp.unproject(new Cesium.Cartesian3(bounds.east, bounds.north));
        return {
            north: this.rad2deg(ne.latitude),
            east: this.rad2deg(ne.longitude),
            south: this.rad2deg(sw.latitude),
            west: this.rad2deg(sw.longitude)
        };
    };

    /**
     * Convert degrees into radians.
     *
     * @param {Number} degrees The degrees to be converted to radians.
     * @returns {Number} The converted radians.
     */
    HeatmapImageryProvider.prototype.deg2rad = function(degrees) {
        return (degrees * (Math.PI / 180.0));
    };

    /**
     * Convert radians into degrees.
     *
     * @param {Number} radians The radians to be converted to degrees.
     * @returns {Number} The converted degrees.
     */
    HeatmapImageryProvider.prototype.rad2deg = function(radians) {
        return (radians / (Math.PI / 180.0));
    };

    /**
     * Convert a WGS84 location to the corresponding heatmap location.
     *
     * @param {Object} point The WGS84 location.
     * @param {Number} [point.x] The longitude of the location.
     * @param {Number} [point.y] The latitude of the location.
     * @returns {Object} The corresponding heatmap location.
     */
    HeatmapImageryProvider.prototype.wgs84PointToHeatmapPoint = function(point) {
        return this.mercatorPointToHeatmapPoint(this.wgs84ToMercator(point));
    };

    /**
     * Convert a mercator location to the corresponding heatmap location.
     *
     * @param {Object} point The Mercator lcation.
     * @param {Number} [point.x] The x of the location.
     * @param {Number} [point.y] The y of the location.
     * @returns {Object} The corresponding heatmap location.
     */
    HeatmapImageryProvider.prototype.mercatorPointToHeatmapPoint = function(point) {
        var pn = {};

        pn.x = Math.round((point.x - this._xoffset) / this._factor + this._spacing);
        pn.y = Math.round((point.y - this._yoffset) / this._factor + this._spacing);
        pn.y = this.height - pn.y;

        return pn;
    };

    /**
     * Set an array of heatmap locations.
     *
     * @param {Number} min The minimum allowed value for the data points.
     * @param {Number} max The maximum allowed value for the data points.
     * @param {Array} data An array of data points with heatmap coordinates(x, y) and value
     * @returns {Boolean} Wheter or not the data was successfully added or failed.
     */
    HeatmapImageryProvider.prototype.setData = function(min, max, data) {
        if (data && data.length > 0 && min !== null && min !== false && max !== null && max !== false) {
            this._heatmap.setData({
                min: min,
                max: max,
                data: data
            });

            return true;
        }

        return false;
    };

    /**
     * Set an array of WGS84 locations.
     *
     * @param {Number} min The minimum allowed value for the data points.
     * @param {Number} max The maximum allowed value for the data points.
     * @param {Array} data An array of data points with WGS84 coordinates(x=lon, y=lat) and value
     * @returns {Boolean} Wheter or not the data was successfully added or failed.
     */
    HeatmapImageryProvider.prototype.setWGS84Data = function(min, max, data) {
        if (data && data.length > 0 && min !== null && min !== false && max !== null && max !== false) {
            var convdata = [];

            for (var i = 0; i < data.length; i++) {
                var gp = data[i];

                var hp = this.wgs84PointToHeatmapPoint(gp);
                if (gp.value || gp.value === 0) { hp.value = gp.value; }

                convdata.push(hp);
            }

            return this.setData(min, max, convdata);
        }

        return false;
    };

    /**
     * Gets the credits to be displayed when a given tile is displayed.
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level;
     * @returns {Credit[]} The credits to be displayed when the tile is displayed.
     *
     * @exception {DeveloperError} <code>getTileCredits</code> must not be called before the imagery provider is ready.
     */
    HeatmapImageryProvider.prototype.getTileCredits = function(x, y, level) {
        return undefined;
    };

    /**
     * Requests the image for a given tile.  This function should
     * not be called before {@link HeatmapImageryProvider#ready} returns true.
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level.
     * @returns {Promise} A promise for the image that will resolve when the image is available, or
     *          undefined if there are too many active requests to the server, and the request
     *          should be retried later.  The resolved image may be either an
     *          Image or a Canvas DOM object.
     *
     * @exception {DeveloperError} <code>requestImage</code> must not be called before the imagery provider is ready.
     */
    HeatmapImageryProvider.prototype.requestImage = function(x, y, level) {
        if (!this._ready) {
            throw new DeveloperError('requestImage must not be called before the imagery provider is ready.');
        }

        return this._image;
    };

    /**
     * Picking features is not currently supported by this imagery provider, so this function simply returns
     * undefined.
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level.
     * @param {Number} longitude The longitude at which to pick features.
     * @param {Number} latitude  The latitude at which to pick features.
     * @return {Promise} A promise for the picked features that will resolve when the asynchronous
     *                   picking completes.  The resolved value is an array of {@link ImageryLayerFeatureInfo}
     *                   instances.  The array may be empty if no features are found at the given location.
     *                   It may also be undefined if picking is not supported.
     */
    HeatmapImageryProvider.prototype.pickFeatures = function() {
        return undefined;
    };

    return HeatmapImageryProvider;
});

/*  DON'T TOUCH:
 *
 *  heatmap.js v2.0.0 | JavaScript Heatmap Library: http://www.patrick-wied.at/static/heatmapjs/
 *
 *  Copyright 2008-2014 Patrick Wied <heatmapjs@patrick-wied.at> - All rights reserved.
 *  Dual licensed under MIT and Beerware license
 *
 *  :: 2014-10-31 21:16
 */
(function(a,b,c){if(typeof module!=="undefined"&&module.exports){module.exports=c()}else if(typeof define==="function"&&define.amd){define(c)}else{b[a]=c()}})("h337",this,function(){var a={defaultRadius:40,defaultRenderer:"canvas2d",defaultGradient:{.25:"rgb(0,0,255)",.55:"rgb(0,255,0)",.85:"yellow",1:"rgb(255,0,0)"},defaultMaxOpacity:1,defaultMinOpacity:0,defaultBlur:.85,defaultXField:"x",defaultYField:"y",defaultValueField:"value",plugins:{}};var b=function h(){var b=function d(a){this._coordinator={};this._data=[];this._radi=[];this._min=0;this._max=1;this._xField=a["xField"]||a.defaultXField;this._yField=a["yField"]||a.defaultYField;this._valueField=a["valueField"]||a.defaultValueField;if(a["radius"]){this._cfgRadius=a["radius"]}};var c=a.defaultRadius;b.prototype={_organiseData:function(a,b){var d=a[this._xField];var e=a[this._yField];var f=this._radi;var g=this._data;var h=this._max;var i=this._min;var j=a[this._valueField]||1;var k=a.radius||this._cfgRadius||c;if(!g[d]){g[d]=[];f[d]=[]}if(!g[d][e]){g[d][e]=j;f[d][e]=k}else{g[d][e]+=j}if(g[d][e]>h){if(!b){this._max=g[d][e]}else{this.setDataMax(g[d][e])}return false}else{return{x:d,y:e,value:j,radius:k,min:i,max:h}}},_unOrganizeData:function(){var a=[];var b=this._data;var c=this._radi;for(var d in b){for(var e in b[d]){a.push({x:d,y:e,radius:c[d][e],value:b[d][e]})}}return{min:this._min,max:this._max,data:a}},_onExtremaChange:function(){this._coordinator.emit("extremachange",{min:this._min,max:this._max})},addData:function(){if(arguments[0].length>0){var a=arguments[0];var b=a.length;while(b--){this.addData.call(this,a[b])}}else{var c=this._organiseData(arguments[0],true);if(c){this._coordinator.emit("renderpartial",{min:this._min,max:this._max,data:[c]})}}return this},setData:function(a){var b=a.data;var c=b.length;this._data=[];this._radi=[];for(var d=0;d<c;d++){this._organiseData(b[d],false)}this._max=a.max;this._min=a.min||0;this._onExtremaChange();this._coordinator.emit("renderall",this._getInternalData());return this},removeData:function(){},setDataMax:function(a){this._max=a;this._onExtremaChange();this._coordinator.emit("renderall",this._getInternalData());return this},setDataMin:function(a){this._min=a;this._onExtremaChange();this._coordinator.emit("renderall",this._getInternalData());return this},setCoordinator:function(a){this._coordinator=a},_getInternalData:function(){return{max:this._max,min:this._min,data:this._data,radi:this._radi}},getData:function(){return this._unOrganizeData()}};return b}();var c=function i(){var a=function(a){var b=a.gradient||a.defaultGradient;var c=document.createElement("canvas");var d=c.getContext("2d");c.width=256;c.height=1;var e=d.createLinearGradient(0,0,256,1);for(var f in b){e.addColorStop(f,b[f])}d.fillStyle=e;d.fillRect(0,0,256,1);return d.getImageData(0,0,256,1).data};var b=function(a,b){var c=document.createElement("canvas");var d=c.getContext("2d");var e=a;var f=a;c.width=c.height=a*2;if(b==1){d.beginPath();d.arc(e,f,a,0,2*Math.PI,false);d.fillStyle="rgba(0,0,0,1)";d.fill()}else{var g=d.createRadialGradient(e,f,a*b,e,f,a);g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(1,"rgba(0,0,0,0)");d.fillStyle=g;d.fillRect(0,0,2*a,2*a)}return c};var c=function(a){var b=[];var c=a.min;var d=a.max;var e=a.radi;var a=a.data;var f=Object.keys(a);var g=f.length;while(g--){var h=f[g];var i=Object.keys(a[h]);var j=i.length;while(j--){var k=i[j];var l=a[h][k];var m=e[h][k];b.push({x:h,y:k,value:l,radius:m})}}return{min:c,max:d,data:b}};function d(b){var c=b.container;var d=this.shadowCanvas=document.createElement("canvas");var e=this.canvas=b.canvas||document.createElement("canvas");var f=this._renderBoundaries=[1e4,1e4,0,0];var g=getComputedStyle(b.container)||{};e.className="heatmap-canvas";this._width=e.width=d.width=+g.width.replace(/px/,"");this._height=e.height=d.height=+g.height.replace(/px/,"");this.shadowCtx=d.getContext("2d");this.ctx=e.getContext("2d");e.style.cssText=d.style.cssText="position:absolute;left:0;top:0;";c.style.position="relative";c.appendChild(e);this._palette=a(b);this._templates={};this._setStyles(b)}d.prototype={renderPartial:function(a){this._drawAlpha(a);this._colorize()},renderAll:function(a){this._clear();this._drawAlpha(c(a));this._colorize()},_updateGradient:function(b){this._palette=a(b)},updateConfig:function(a){if(a["gradient"]){this._updateGradient(a)}this._setStyles(a)},setDimensions:function(a,b){this._width=a;this._height=b;this.canvas.width=this.shadowCanvas.width=a;this.canvas.height=this.shadowCanvas.height=b},_clear:function(){this.shadowCtx.clearRect(0,0,this._width,this._height);this.ctx.clearRect(0,0,this._width,this._height)},_setStyles:function(a){this._blur=a.blur==0?0:a.blur||a.defaultBlur;if(a.backgroundColor){this.canvas.style.backgroundColor=a.backgroundColor}this._opacity=(a.opacity||0)*255;this._maxOpacity=(a.maxOpacity||a.defaultMaxOpacity)*255;this._minOpacity=(a.minOpacity||a.defaultMinOpacity)*255;this._useGradientOpacity=!!a.useGradientOpacity},_drawAlpha:function(a){var c=this._min=a.min;var d=this._max=a.max;var a=a.data||[];var e=a.length;var f=1-this._blur;while(e--){var g=a[e];var h=g.x;var i=g.y;var j=g.radius;var k=Math.min(g.value,d);var l=h-j;var m=i-j;var n=this.shadowCtx;var o;if(!this._templates[j]){this._templates[j]=o=b(j,f)}else{o=this._templates[j]}n.globalAlpha=(k-c)/(d-c);n.drawImage(o,l,m);if(l<this._renderBoundaries[0]){this._renderBoundaries[0]=l}if(m<this._renderBoundaries[1]){this._renderBoundaries[1]=m}if(l+2*j>this._renderBoundaries[2]){this._renderBoundaries[2]=l+2*j}if(m+2*j>this._renderBoundaries[3]){this._renderBoundaries[3]=m+2*j}}},_colorize:function(){var a=this._renderBoundaries[0];var b=this._renderBoundaries[1];var c=this._renderBoundaries[2]-a;var d=this._renderBoundaries[3]-b;var e=this._width;var f=this._height;var g=this._opacity;var h=this._maxOpacity;var i=this._minOpacity;var j=this._useGradientOpacity;if(a<0){a=0}if(b<0){b=0}if(a+c>e){c=e-a}if(b+d>f){d=f-b}var k=this.shadowCtx.getImageData(a,b,c,d);var l=k.data;var m=l.length;var n=this._palette;for(var o=3;o<m;o+=4){var p=l[o];var q=p*4;if(!q){continue}var r;if(g>0){r=g}else{if(p<h){if(p<i){r=i}else{r=p}}else{r=h}}l[o-3]=n[q];l[o-2]=n[q+1];l[o-1]=n[q+2];l[o]=j?n[q+3]:r}k.data=l;this.ctx.putImageData(k,a,b);this._renderBoundaries=[1e3,1e3,0,0]},getValueAt:function(a){var b;var c=this.shadowCtx;var d=c.getImageData(a.x,a.y,1,1);var e=d.data[3];var f=this._max;var g=this._min;b=Math.abs(f-g)*(e/255)>>0;return b},getDataURL:function(){return this.canvas.toDataURL()}};return d}();var d=function j(){var b=false;if(a["defaultRenderer"]==="canvas2d"){b=c}return b}();var e={merge:function(){var a={};var b=arguments.length;for(var c=0;c<b;c++){var d=arguments[c];for(var e in d){a[e]=d[e]}}return a}};var f=function k(){var c=function h(){function a(){this.cStore={}}a.prototype={on:function(a,b,c){var d=this.cStore;if(!d[a]){d[a]=[]}d[a].push(function(a){return b.call(c,a)})},emit:function(a,b){var c=this.cStore;if(c[a]){var d=c[a].length;for(var e=0;e<d;e++){var f=c[a][e];f(b)}}}};return a}();var f=function(a){var b=a._renderer;var c=a._coordinator;var d=a._store;c.on("renderpartial",b.renderPartial,b);c.on("renderall",b.renderAll,b);c.on("extremachange",function(b){a._config.onExtremaChange&&a._config.onExtremaChange({min:b.min,max:b.max,gradient:a._config["gradient"]||a._config["defaultGradient"]})});d.setCoordinator(c)};function g(){var g=this._config=e.merge(a,arguments[0]||{});this._coordinator=new c;if(g["plugin"]){var h=g["plugin"];if(!a.plugins[h]){throw new Error("Plugin '"+h+"' not found. Maybe it was not registered.")}else{var i=a.plugins[h];this._renderer=new i.renderer(g);this._store=new i.store(g)}}else{this._renderer=new d(g);this._store=new b(g)}f(this)}g.prototype={addData:function(){this._store.addData.apply(this._store,arguments);return this},removeData:function(){this._store.removeData&&this._store.removeData.apply(this._store,arguments);return this},setData:function(){this._store.setData.apply(this._store,arguments);return this},setDataMax:function(){this._store.setDataMax.apply(this._store,arguments);return this},setDataMin:function(){this._store.setDataMin.apply(this._store,arguments);return this},configure:function(a){this._config=e.merge(this._config,a);this._renderer.updateConfig(this._config);this._coordinator.emit("renderall",this._store._getInternalData());return this},repaint:function(){this._coordinator.emit("renderall",this._store._getInternalData());return this},getData:function(){return this._store.getData()},getDataURL:function(){return this._renderer.getDataURL()},getValueAt:function(a){if(this._store.getValueAt){return this._store.getValueAt(a)}else if(this._renderer.getValueAt){return this._renderer.getValueAt(a)}else{return null}}};return g}();var g={create:function(a){return new f(a)},register:function(b,c){a.plugins[b]=c}};return g});