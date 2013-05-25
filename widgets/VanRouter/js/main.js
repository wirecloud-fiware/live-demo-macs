/*
 *     (C) Copyright 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the van-router widget.
 *
 *     van-router is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     van-router is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with van-router. If not, see <http://www.gnu.org/licenses/>.
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

/*jshint browser:true*/

/*global MashupPlatform StyledElements NGSI*/

(function () {
 
    "use strict";

    var layout, playButton, route, interval = null, currentStep;

        var ngsi_server = 'http://130.206.80.195:1026';
        var ngsi_proxy = 'http://wirecloud.conwet.fi.upm.es:3000/';
        var ngsi = new NGSI.Connection(ngsi_server, {
            ngsi_proxy_url: ngsi_proxy,
            requestFunction: MashupPlatform.http.makeRequest
        });
/******************************************************************************/
/********************************* PUBLIC *************************************/
/******************************************************************************/

/******************************************************************************/
/******************************** PRIVATE *************************************/
/******************************************************************************/

    var loadRoute = function loadRoute(form, data) {
        var reader = new FileReader();
        reader.onload = function () {
            currentStep = 0;
            route = reader.result.split('\n');
            playButton.enable();
        };
        reader.readAsText(data.file);
    };

    var init = function init() {
        layout = new StyledElements.BorderLayout();

        var fields = {
            "file" : {
                label: 'Route file:',
                type: 'file',
                required: true
            }
        };

        var options = {};
        var form = new StyledElements.Form(fields, options);
        form.addEventListener("submit", loadRoute);
        layout.getCenterContainer().appendChild(form);

        playButton = new StyledElements.StyledButton({
            plain: true,
            'class': 'icon-play'
        });
        playButton.disable();
        playButton.addEventListener('click', function () {
            if (interval != null) {
                clearInterval(interval);
                interval = null;
            } else {
                interval = setInterval(function () {
                    var currentCoords = route[currentStep++];

                    if (currentStep >= route.length) {
                        clearInterval(interval);
                        interval = null;
                    }

                    ngsi.updateAttributes([{
                        entity: {
                            id: 'van1',
                            type: 'Van'
                        },
                        attributes:[{
                            name: 'current_position',
                            contextValue: currentCoords
                        }]
                    }], {
                        onFailure: function () {
                            // show error
                        }
                    });
                      
                }, 1000);
            }
        });
        layout.getNorthContainer().appendChild(playButton);

        layout.insertInto(document.body);
        layout.repaint();
    };

    MashupPlatform.widget.context.registerCallback(function (newValues) {
        if (layout && "heightInPixels" in newValues) {
             layout.repaint();
        }
    }.bind(this));

    window.addEventListener("DOMContentLoaded", init, false);

})();
