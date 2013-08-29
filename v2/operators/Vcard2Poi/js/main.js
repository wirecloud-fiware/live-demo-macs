/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the vcard2poi operator.
 *
 *     vcard2poi is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     vcard2poi is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with vcard2poi. If not, see <http://www.gnu.org/licenses/>.
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

/*global MashupPlatform, Vcard */

(function () {

    "use strict";

    MashupPlatform.wiring.registerCallback("inputVcard", function (vCardString) {
        var poi = {};
        var coordinates = null;
        var profile = new Vcard();
        profile.parser(vCardString);
        poi.id = profile.getValue('FN', 0);
        poi.icon = internalURL.call(this, "images/van.png");
        poi.tooltip = profile.getValue('FN', 0);
        poi.data = vCardString;

        poi.infoWindow = setInfoWindow.call(this, profile);

        coordinates = profile.getValue('GEO', 0).split(":")[1].split(",");
        poi.currentLocation = {};
        poi.currentLocation.system = "WGS84";
        poi.currentLocation.lat = parseFloat(coordinates[0].trim());
        poi.currentLocation.lng = parseFloat(coordinates[1].trim());

        MashupPlatform.wiring.pushEvent("outputPoi", JSON.stringify(poi));
    });

    var internalURL = function internalURL(data) {
        var url = document.createElement("a");
        url.href = data;
        return url.href;
    };

    var setInfoWindow = function setInfoWindow(vCard) {
        var infoWindow = '<div style="font-size:12px;"><ul style="list-style:none;">';
        infoWindow += "<li><span><b>Name:</b> " + vCard.getValue('FN', 0) + "</span></li>";
        infoWindow += "<li><span><b>Mobile Phone:</b> " + vCard.getValue('TEL', 0) + "</span></li>";
        infoWindow += "</ul></div>";
        return infoWindow;
    };

})();
