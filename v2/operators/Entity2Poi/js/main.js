/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the observation2poi operator.
 *
 *     observation2poi is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     observation2poi is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with observation2poi. If not, see <http://www.gnu.org/licenses/>.
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

/*global MashupPlatform*/

(function () {

    "use strict";

    MashupPlatform.wiring.registerCallback("entityInput", function (entityString) {
        var entity = JSON.parse(entityString);

        if (entity.Longitud && entity.Latitud) {
            var poi = entity2poi(entity);

            var outputData = JSON.stringify(poi);

            MashupPlatform.wiring.pushEvent("poiOutput", outputData);
        }
    });

    var entity2poi = function entity2poi(entity) {
        var poi = {
            id: entity.id,
            icon: setIcon(entity),
            tooltip: entity.id,
            data: entity,
            infoWindow: setInfoWindow.call(this, entity),
            currentLocation: {
                system: "WGS84",
                lat: parseFloat(entity.Latitud),
                lng: parseFloat(entity.Longitud)
            }
        };

        return poi;
    };

    var setIcon = function setIcon(entity) {
        var imageType, imagePath, issueSeverity;
        imagePath = "images/";

        issueSeverity = setIssueSeverity.call(this, entity);

        imageType = entity.type;

        var icon = imagePath + issueSeverity + imageType + ".png";
        
        return ownUrl.call(this, icon);
    };

    var setIssueSeverity = function setIssueSeverity(entity) {
        var issue, severity = '';

        if ('issues' in entity) {
            for (var issue_key in entity.issues) {
                issue = entity.issues[issue_key];
                severity = issue.severity;
                if (severity === 'Critical') {
                    break;
                }
            }
        }
        return severity;
    };
    var ownUrl = function ownUrl(data) {
        var url = document.createElement("a");
        url.setAttribute('href', data);
        return url.href;
    };

    var setInfoWindow = function setInfoWindow(entity) {
        var attributes = {
            'id': {
                'tag': 'Id',
                'func': toHumanString
            },
            'presence': {
                'tag':  'Presence',
                'func': toHumanString
            },
            'batteryCharge': {
                'tag':  'Battery charge',
                'func': toHumanString
            },
            'illuminance': {
                'tag':  'Illuminance',
                'func': toHumanString
            },
            'ActivePower': {
                'tag':  'Active power',
                'func': toHumanString
            },
            'ReactivePower': {
                'tag':  'Reactive power',
                'func': toHumanString
            },
            'electricPotential': {
                'tag':  'Electric potential',
                'func': toHumanString
            },
            'electricCurrent': {
                'tag':  'Electric current',
                'func': toHumanString
            }
        };

        var infoWindow = "<div>";
        for (var attr in entity) {
            if (attr in attributes) {
                infoWindow += '<span style="font-size:12px;"><b>' + attributes[attr].tag + ": </b> " + attributes[attr].func(entity[attr]) +  "</span><br />";
            }
        }
        infoWindow += "</div>";

        return infoWindow;
    };

    var toHumanString = function toHumanString(attr) {
        return attr;
    };

})();
