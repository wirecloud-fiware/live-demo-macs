/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the issue2poi operator.
 *
 *     issue2poi is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     issue2poi is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with issue2poi. If not, see <http://www.gnu.org/licenses/>.
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

/*global MashupPlatform */

(function () {

    "use strict";

    MashupPlatform.wiring.registerCallback("inputIssue", function (issueString) {
        var poi = {};
        var icon = "";
        var issue = JSON.parse(issueString);

        poi.id = issue.affectedId;
        if (issue.coordinates) {
            var coordinates = issue.coordinates.split(",");

            var lat = parseFloat(coordinates[0].trim());
            var lng = parseFloat(coordinates[1].trim());

            poi.currentLocation = {};
            poi.currentLocation.system = "WGS84";
            poi.currentLocation.lat = parseFloat(lat);
            poi.currentLocation.lng = parseFloat(lng);
        }
        poi.tooltip = issue.description;
        poi.data = issue;

        poi.infoWindow = setInfoWindow.call(this, issue);

        switch (issue.severity.toLowerCase()) {
        case "high":
            icon = "images/lampHigh.png";
            break;
        case "warning":
            icon = "images/lampWarning.png";
            break;
        default:
            icon = "images/lampOK.png";
        }

        poi.icon = ownUrl.call(this, icon);

        MashupPlatform.wiring.pushEvent("outputPoi", JSON.stringify(poi));
    });

    var ownUrl = function ownUrl(data) {
        var url = document.createElement("a");
        url.href = data;
        return url.href;
    };

    var setInfoWindow = function setInfoWindow(issue) {
        var infoWindow = "<div>";

        infoWindow += "<span><b>Issue Id:</b> " + issue.id + "</span>";
        infoWindow += "<br />";
        infoWindow += "<span><b>Lamp Id:</b> " + issue.lampId + "</span>";
        infoWindow += "<br />";
        infoWindow += "<span><b>Description:</b> " + issue.description + "</span>";
        if (issue.imageFile) {
            infoWindow += "<br />";
            infoWindow += '<img src="' + issue.imageFile + '"></img>';
        }
        infoWindow += "</div>";

        return infoWindow;
    };

})();
