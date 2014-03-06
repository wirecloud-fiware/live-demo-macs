/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the simple-history-module2-linear-graph operator.
 *
 *     simple-history-module2-linear-graph is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     simple-history-module2-linear-graph is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with simple-history-module2-linear-graph. If not, see <http://www.gnu.org/licenses/>.
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

/*global exampleAMMSdata, exampleNODEdata, exampleRGdata, MashupPlatform*/

(function () {

    "use strict";

    var changeSensor = function changeSensor(sensorPOI, test) {
        var sensorId, from, to, sensorParsed, numberOfDays, today;

        // get the sensorId
        if (sensorPOI != 'testMode') {
            sensorParsed = JSON.parse(sensorPOI);
            sensorId = sensorParsed.poi.data.id;
        } else {
            // only for test
            var ids = ['OUTSMART.RG_LAS_LLAMAS_01', 'OUTSMART.NODE_3509', 'OUTSMART.AMMS_06E1E5B2100009549'];
            sensorId = ids[test];
        }

        // Change to the new Sensor
        var requestParams = {
            "method": "GET",
            "supportsAccessControl": true,
            "onSuccess": processHistoricData.bind(this, sensorId),
            "onFailure": onFailure.bind(this, sensorId)
        };

        // Send loading msg by OutputStatus endpoint
        var loadMsg = 'loading ' + sensorId;
        MashupPlatform.wiring.pushEvent("OutputStatus", JSON.stringify(loadMsg));

        numberOfDays = parseInt(MashupPlatform.prefs.get("number_of_days"), 10);
        if (typeof numberOfDays != 'number') {
            numberOfDays = 10;
        }
        today = new Date();
        from = today.getTime() - (numberOfDays /* days */ * 24 /* hours */ * 60 /* mins */ * 60 /* segs */ * 1000 /* miliseconds */);
        to = today.getTime();

        var url = MashupPlatform.prefs.get('historymod_server');
        if (sensorId.match(/^OUTSMART.NODE_/)) {
            MashupPlatform.http.makeRequest(url + "/lamps/between/" + sensorId + '/' + from + '/' + to, requestParams);
        } else if (sensorId.match(/^OUTSMART.AMMS_/)) {
            MashupPlatform.http.makeRequest(url + "/amms/between/" + sensorId + '/' + from + '/' + to, requestParams);
        } else if (sensorId.match(/^OUTSMART.RG_/)) {
            MashupPlatform.http.makeRequest(url + "/regulators/between/" + sensorId + '/' + from + '/' + to, requestParams);
        }
    };

    var onFailure = function onFailure(sensorId) {
        // Use demo data if the request fails

        var parsedResponse = {
            'responseText': null
        };

        if (sensorId.match(/^OUTSMART.NODE_/)) {
            parsedResponse.responseText = exampleNODEdata;
        } else if (sensorId.match(/^OUTSMART.AMMS_/)) {
            parsedResponse.responseText = exampleAMMSdata;
        } else if (sensorId.match(/^OUTSMART.RG_/)) {
            parsedResponse.responseText = exampleRGdata;
        }
        processHistoricData(sensorId, parsedResponse);
    };

    var processHistoricData = function processHistoricData(sensorId, response) {
        var i, parsedResponse, data, id, lampObservationId, config;

        // First element is the older.
        if (typeof response.responseText != 'object') {
            parsedResponse = JSON.parse(response.responseText);
        } else {
            parsedResponse = response.responseText;
        }

        id = 69;

        // Lamps (Nodes)
        if (sensorId.match(/^OUTSMART.NODE_/)) {
            // Axis config
            config = {
                'axisConfig': [
                    {
                        axisId: 0,
                        label: 'Battery %',
                        color: '#00A8F0',
                        max: 100,
                        min: -15,
                        ticks: [[-15, "Nobody"], [-5, "Somebody"], 0, 10, 20, 40, 60, 80, 100]
                    },
                    {
                        axisId: 1,
                        label: 'Lux',
                        color: '#93a600',
                        max: 350,
                        min: -52.5,
                        ticks: [[-52.5, "    "], [-17.5, "-----------"], 0, 50, 100, 150, 200, 250, 300, 350]
                    }
                ],
                'title': sensorId,
                'leyend': {
                    position: 'ne'
                }
            };
            MashupPlatform.wiring.pushEvent("OutputStatus", JSON.stringify(config));

            data = [];
            for (i = parsedResponse.length - 1; i > 0; i -= 1) {
                // History-Mod internal id
                lampObservationId = parsedResponse[i].id;
                data.push({
                    'id': 0,
                    'value': [parsedResponse[i].timeInstant, parsedResponse[i].batteryCharge],
                    'label': 'battery level',
                    'axis': 1
                });
                data.push({
                    'id': 1,
                    'value': [parsedResponse[i].timeInstant, parsedResponse[i].illuminance],
                    'label': 'illuminance',
                    'axis': 2
                });
                // special data from presence sensor od the lamp
                data.push({
                    'id': 2,
                    'value': [parsedResponse[i].timeInstant, (parsedResponse[i].presence * 10) - 15],
                    'label': 'presence',
                    'axis': 1
                });
            }
        // AMMS
        } else if (sensorId.match(/^OUTSMART.AMMS_/)) {
            // Axis config
            config = {
                'axisConfig': [
                    {
                        axisId: 0,
                        label: 'Watt Per Hour',
                        color: '#00A8F0',
                        max: 5000,
                        min: 0,
                        ticks: null
                    },
                    {
                        axisId: 1,
                        label: 'Volt Ampere Reactive Per Hour',
                        color: '#93a600',
                        max: 3000,
                        min: 0,
                        ticks: [[0, "-----------"], 500, 1000, 1500, 2000, 2500, 3000]
                    }
                ],
                'title': sensorId
            };
            MashupPlatform.wiring.pushEvent("OutputStatus", JSON.stringify(config));

            data = [];
            for (i = parsedResponse.length - 1; i > 0; i -= 1) {
                // History-Mod internal id
                lampObservationId = parsedResponse[i].id;
                data.push({
                    'id': 0,
                    'value': [parsedResponse[i].timeInstant, parsedResponse[i].activePower],
                    'label': 'Active Power',
                    'axis': 1
                });
                data.push({
                    'id': 1,
                    'value': [parsedResponse[i].timeInstant, parsedResponse[i].reactivePower],
                    'label': 'Reactive Power',
                    'axis': 2
                });
            }

        // Regulators
        } else if (sensorId.match(/^OUTSMART.RG_/)) {

            // Axis config
            config = {
                'axisConfig': [
                    {
                        axisId: 0, // will be 1 in data reference
                        label: 'Volt',
                        color: '#00A8F0',
                        max: 300,
                        min: -10,
                        ticks: null
                    },
                    {
                        axisId: 1,
                        label: 'MilliAmpere',
                        color: '#93a600',
                        max: 30000,
                        min: 0,
                        ticks: null
                    },
                    {
                        axisId: 2,
                        label: 'Watt Per Hour',
                        color: '#CB4B4B',
                        max: 15000,
                        min: 0,
                        ticks: null
                    },
                    {
                        axisId: 3,
                        label: 'Volt Ampere Reactive Per Hour',
                        color: '#4DA74D',
                        max: 15000,
                        min: 0,
                        ticks: null
                    }
                ],
                'title': sensorId,
                'oneData' : true
            };
            MashupPlatform.wiring.pushEvent("OutputStatus", JSON.stringify(config));

            data = [];
            for (i = parsedResponse.length - 1; i > 0; i -= 1) {
                // History-Mod internal id
                lampObservationId = parsedResponse[i].id;
                data.push({
                    'id': 0,
                    'value': [parsedResponse[i].timeInstant, parsedResponse[i].electricPotential],
                    'label': 'Electric Potential',
                    'axis': 1 // really is a 0 in the 'axisConfig' 0=1, 1=2, 2=3, etc
                });
                data.push({
                    'id': 1,
                    'value': [parsedResponse[i].timeInstant, parsedResponse[i].electricCurrent],
                    'label': 'Electric Current',
                    'axis': 2
                });
                data.push({
                    'id': 2,
                    'value': [parsedResponse[i].timeInstant, parsedResponse[i].activePower],
                    'label': 'Active Power',
                    'axis': 3
                });
                data.push({
                    'id': 3,
                    'value': [parsedResponse[i].timeInstant, parsedResponse[i].reactivePower],
                    'label': 'Reactive Power',
                    'axis': 4
                });
            }
        }
        
        MashupPlatform.wiring.pushEvent("OutputStatus", JSON.stringify(data));
        MashupPlatform.wiring.pushEvent("OutputStatus", JSON.stringify('END'));
    };

    // input callback
    var handlerSensorIdInput = function handlerSensorIdInput(sensorId, test) {
        if (sensorId) {
            changeSensor.call(this, sensorId, test);
        }
    };
    MashupPlatform.wiring.registerCallback("SensorIdInput", handlerSensorIdInput.bind(this));

    handlerSensorIdInput('testMode', 1);

})();
