/*
 *     (C) Copyright 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the poi2vcard widget.
 *
 *     poi2vcard is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     poi2vcard is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with poi2vcard. If not, see <http://www.gnu.org/licenses/>.
 *
 *     Linking this library statically or dynamically with other modules is
 *     making a combined work based on this library.  Thus, the terms and
 *     conditions of the GNU Affero General Public License cover the whole
 *     combination.
 *
 *     As a special exception, the copyright holders of this library give you
 *     permission to link this library with independent modules to produce an
 *     executable, regardless of the license terms of these independent
 *     modules, and to copy and distribute the resulting executable under
 *     terms of your choice, provided that you also meet, for each linked
 *     independent module, the terms and conditions of the license of that
 *     module.  An independent module is a module which is not derived from
 *     or based on this library.  If you modify this library, you may extend
 *     this exception to your version of the library, but you are not
 *     obligated to do so.  If you do not wish to do so, delete this
 *     exception statement from your version.
 *
 */

/*global Coordinates */

(function () {
 
    "use strict";

    /*****************************************************/
    /********************* PUBLIC ************************/
    /*****************************************************/

    var Poi = function Poi(poi) {
        this.poi = {
            id: "",
            currentLocation: {      // Current Location.
                system: "",         // geodetic datum system (usually WGS84, it can be UTM too)
                lat: "",            // Latitude in geodetic datum system
                lng: ""             // Longitude in geodetic datum system
            },
            icon: "",
            tooltip: "",
            infoWindow: "",
            data: {}
        };

        this.coordinates = {
            utm: {
                lat: 0,
                lng: 0
            },
            decimal: {
                lat: 0,
                lng: 0
            }
        };

        this.init(poi);
    };

    Poi.prototype.init = function init(poi) {
        var lat;
        var lng;

        this.poi = poi;

        if (poi.currentLocation.lat && poi.currentLocation.lng) {
            lat = parseFloat(poi.currentLocation.lat);
            lng = parseFloat(poi.currentLocation.lng);
            if (poi.currentLocation.system == "UTM") {
                this.coordinates.utm.lat = lat;
                this.coordinates.utm.lng = lng;
                this.coordinates.decimal = utm2decimal(lat, lng);
            } else if (poi.currentLocation.system == "WGS84" || poi.currentLocation.system === "") {
                this.coordinates.decimal.lat = lat;
                this.coordinates.decimal.lng = lng;
                this.coordinates.utm = decimal2utm(lat, lng);
            }
        }
    };

    Poi.prototype.getId = function getId() {
        return this.poi.id;
    };

    Poi.prototype.getIcon = function getIcon() {
        return this.poi.icon;
    };

    Poi.prototype.getUtmCoords = function getUtmCoords() {
        return this.coordinates.utm;
    };

    Poi.prototype.getDecimalCoords = function getDecimalCoords() {
        return this.coordinates.decimal;
    };

    Poi.prototype.getTooltip = function getTooltip() {
        return this.poi.tooltip;
    };

    Poi.prototype.getData = function getData() {
        return this.poi.data;
    };

    Poi.prototype.getInfoWindow = function getInfoWindow() {
        return this.poi.infoWindow;
    };

    /*****************************************************/
    /******************** PRIVATE ************************/
    /*****************************************************/
    
    /*  utm2decimal: Transform utm coordinates to decimal coordinates.
     *      - Parameters:
     *          - utmLat: Latitude. A number.
     *          - utmLng: Longitude. A number.
     *      - Return: decimal coordinates in latLng object. Example: {lat; 26.54, lng: 32.123}
     * */
    var utm2decimal = function utm2decimal(utmLat, utmLng) {
        var coordinates = new Coordinates();
        var decimalCoords = [];

        coordinates.utmToGeoDeg(utmLat, utmLng, false, decimalCoords);

        return {
            lat: decimalCoords[0],
            lng: decimalCoords[1]
        };
    };

    /*  decimal2utm: Transform decimal coordinates to utm coordinates.
     *      - Parameters:
     *          - decLat: Latitude. A number.
     *          - decLng: Longitude. A number.
     *      - Return: utm coordinates in latLng object. Example: {lat; 2654, lng: 32123}
     * */
    var decimal2utm = function decimal2utm(decLat, decLng) {
        var coordinates = new Coordinates();
        var utmCoords = [];

        coordinates.geoDegToUTM(decLat, decLng, false, utmCoords);

        return {
            lat: utmCoords[0],
            lng: utmCoords[1]
        };
    };

    window.Poi = Poi;

})();
