/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the linear-graph widget.
 *
 *     linear-graph is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     linear-graph is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with linear-graph. If not, see <http://www.gnu.org/licenses/>.
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

/*global Flotr, MashupPlatform*/

/*
 * Data format: [{id: <id>, value: <value>, label: <label>}, ... ]
 *  - id: line id
 *  - value: value to add
 *  - label: (optional) label to use in the legend
 */
(function () {

    "use strict";

    var graph, options;
    var yAxis, graphTitle, dataInfoById;
    var config = {};
    var data = [];
    var graphData;
    var defaultColors = ['#00A8F0', '#93a600', '#CB4B4B', '#4DA74D', '#9440ED'];
    var userColors;
    var theLeyend = [];
    var leyendStatus = {};
    var lastData;
    var showLeyend, graphContainer;
    var oneData;
    var lastTimestamp;
    var verticalAxisLeft;
    var verticalAxisRight;
    var loadLayer;
    var theArea;
    var buttons = {
        'all': null,
        'week': null,
        'day': null,
        'hour': null
    };
    var activateButton = null;

    var toggle_points_lines = function toggle_points_lines(id) {
        loadLayer.classList.add('on');
        setTimeout(function () {
            changeLeyendStatusPoints(id);
            loadLayer.classList.remove('on');
        }, 300);
    };

    var toggle_leyend_line = function toggle_leyend_line(id) {
        loadLayer.classList.add('on');
        setTimeout(function () {
            changeLeyendStatus(id);
            loadLayer.classList.remove('on');
        }, 300);
    };

    var drawGraph = function drawGraph(new_data) {

        // preferences
        showLeyend = MashupPlatform.prefs.get("legend").toLowerCase() === "true";
        graphContainer = document.getElementById('linearGraphContainer');

        var info, x, i, j, id, value, theFill, theLabel, mainLeyendLine, lineLeyendDiv,
            labelDiv, colorPrev, pointsSelect, backLayer, myYaxis, realAxisIndex, opts,
            correctAxis, config_aux;

        if (!loadLayer) {
            loadLayer = document.getElementById('loadLayer');
        }
        if (new_data != null) {
            // parse event info
            info = JSON.parse(new_data);
            if (typeof info == 'string') {
                // Loading msg
                if (info == 'END') {
                    // exit loading mode
                    loadLayer.classList.remove('on');
                    return;
                } else {
                    // init loading mode
                    loadLayer.classList.add('on');
                    return;
                }
            // remote config for new graph
            } else if (info.hasOwnProperty('axisConfig')) {
                // reset globals
                config = {};
                dataInfoById = [];
                yAxis = [];
                data = [];
                leyendStatus = {};
                oneData = false;
                realAxisIndex = {'left': null, 'right': null};
                lastTimestamp = 0;

                // Basic leyenc
                if (!isEmpty(theLeyend)) {
                    graphContainer.removeChild(theLeyend);
                }
                theLeyend = document.createElement('div');
                theLeyend.classList.add('leyendBox');
                backLayer = document.createElement('div');
                backLayer.classList.add('backLayer');
                theLeyend.appendChild(backLayer);

                // Essential axisConfig TODO make optional
                for (i = 0; i < info.axisConfig.length; i += 1) {
                    yAxis[info.axisConfig[i].axisId] = {
                        label: info.axisConfig[i].label,
                        color: info.axisConfig[i].color,
                        max: info.axisConfig[i].max,
                        min: info.axisConfig[i].min,
                        ticks: info.axisConfig[i].ticks
                    };
                }

                // Special graph with only 1 visible data Line
                if (info.hasOwnProperty('oneData')) {
                    oneData = info.oneData;
                }
                
                // Optional leyend config
                if (info.hasOwnProperty('leyend')) {
                    // Position
                    if (info.leyend.hasOwnProperty('position')) {
                        theLeyend.classList.add(info.leyend.position); // ne, no, se, so
                    } else {
                        theLeyend.classList.add('ne');
                    }
                    if (info.leyend.hasOwnProperty('background')) {
                        theLeyend.style.backgroundColor = info.leyend.background;
                    } else {
                        backLayer.style.backgroundColor = '#C9C9C9';
                    }
                } else {
                    // default leyend
                    theLeyend.classList.add('ne');
                    backLayer.style.backgroundColor = '#C9C9C9';
                }

                // Optional Title
                graphTitle = '';
                if (info.hasOwnProperty('title')) {
                    graphTitle = info.title;
                }

                // Optional Color configuration [colorForDataLine 0, colorForDataLine 1, colorForDataLine 2,...]
                if (info.hasOwnProperty('colors')) {
                    userColors = info.colors;
                } else {
                    userColors = defaultColors;
                }
            } else {
                realAxisIndex = {'left': 0, 'right': 1};
                loadLayer.classList.add('on');
                if (lastData == new_data) {
                    // something has change in leyend control
                    dataInfoById = [];
                    data = [];
                    i = 0;
                    while (theLeyend.childNodes.length > 1) {
                        // backlayer is the first child
                        if (!theLeyend.firstChild.nextSibling.classList.contains('backLayer')) {
                            theLeyend.removeChild(theLeyend.firstChild.nextSibling);
                        }
                    }
                } else {
                    lastData = new_data;
                }
                // info[x] ---> {data line id (int 0...n), value, [label], axis, [fill]}
                for (x = info.length - 1; x >= 0; x -= 1) {

                    id = info[x].id;

                    // leyend data control init
                    if (!leyendStatus.hasOwnProperty(id)) {
                        if (oneData) {
                            if (id === 0) {
                                // all false for oneData mode except leyendStatus[0]
                                leyendStatus[id] = {
                                    'show': true,
                                    'points': false
                                };
                            } else {
                                leyendStatus[id] = {
                                    'show': false,
                                    'points': false
                                };
                            }
                        } else {
                            leyendStatus[id] = {
                                'show': true,
                                'points': false
                            };
                        }
                    }

                    value = info[x].value;

                    // axis and fill for each data line (by id)
                    // the id must be an incremental integer, consecutive starting with 0, (array index)
                    if (dataInfoById[id] == null) {
                        // config for the new data line
                        if (info[x].hasOwnProperty('fill')) {
                            theFill = info[x].fill;
                        } else {
                            theFill = false;
                        }
                        if (info[x].hasOwnProperty('label')) {
                            theLabel = info[x].label;
                        } else {
                            theLabel = null;
                        }
                        if (info[x].hasOwnProperty('color')) {
                            userColors[id] = info[x].color;
                        }
                        // leyend config
                        mainLeyendLine = document.createElement('div');
                        mainLeyendLine.classList.add('mainLeyendLine');
                        lineLeyendDiv = document.createElement('div');
                        lineLeyendDiv.classList.add('lineLeyend');
                        if (leyendStatus[id].show === false) {
                            lineLeyendDiv.classList.add('off');
                        }
                        labelDiv = document.createElement('span');
                        labelDiv.classList.add('leyendLabel');
                        labelDiv.textContent = theLabel;
                        colorPrev = document.createElement('div');
                        colorPrev.classList.add('colorBox');
                        colorPrev.style.backgroundColor = userColors[id];
                        pointsSelect = document.createElement('div');
                        pointsSelect.classList.add('pointsSelect');
                        pointsSelect.classList.add('icon-bar-chart');
                        pointsSelect.setAttribute('title', "Change betwen points and lines");
                        pointsSelect.addEventListener('click', toggle_points_lines.bind(this, id), false);
                        if (leyendStatus[id].points === false) {
                            pointsSelect.classList.add('off');
                        }
                        lineLeyendDiv.addEventListener('click', toggle_leyend_line.bind(this, id), false);
                        lineLeyendDiv.appendChild(colorPrev);
                        lineLeyendDiv.appendChild(labelDiv);
                        mainLeyendLine.appendChild(lineLeyendDiv);
                        mainLeyendLine.appendChild(pointsSelect);
                        theLeyend.insertBefore(mainLeyendLine, theLeyend.firstChild.nextSibling);

                        dataInfoById[id] = [];
                        dataInfoById[id] = {
                            yaxis: info[x].axis,
                            fill: theFill,
                            label: info[x].label
                        };
                    } // end config new data line

                    // New id
                    if (data[id] == null) {
                        data[id] = [];
                    }

                    // add data
                    data[id].push(value);
                }

                // graph data format
                graphData = [];
                i = 0;
                lastTimestamp = 0;
                for (j = 0; j < data.length; j += 1) {
                    if (leyendStatus[j].show) {
                        if (lastTimestamp < data[j][data[j].length - 1][0]) {
                            lastTimestamp = data[j][data[j].length - 1][0];
                        }
                        // multiaxis control
                        if (!oneData) {
                            if (dataInfoById[j].yaxis % 2 === 1) {
                                // Odd
                                myYaxis = 1;
                                // left axis
                                realAxisIndex.left = dataInfoById[j].yaxis - 1;
                            } else {
                                // Pair
                                myYaxis = 2;
                                // right axis
                                realAxisIndex.right = dataInfoById[j].yaxis - 1;
                            }
                        } else {
                            myYaxis = 1;
                            realAxisIndex.left = dataInfoById[j].yaxis - 1;
                        }
                        // graph data
                        graphData[j] = {
                            data: data[j],
                            lines: {
                                fill: dataInfoById[j].fill,
                                show: !leyendStatus[j].points
                            },
                            points : {
                                show : leyendStatus[j].points,
                                radius: 1,
                            },
                            yaxis: myYaxis
                        };
                    } else  {
                        if (!oneData) {
                            if (dataInfoById[j].yaxis % 2 === 1) {
                                // left axis
                                correctAxis = 1;
                            } else {
                                // right axis
                                correctAxis = 2;
                            }
                            graphData[j] = {
                                // only the first point to prevent the lost of the axis references
                                data: [data[j][0]],
                                yaxis: correctAxis
                            };
                        } else {
                            graphData[j] = {
                                data: [data[j][0]],
                                yaxis: 1
                            };
                        }
                    }
                    // optional label
                    if (dataInfoById[j].label != null) {
                        graphData[j].label = dataInfoById[j].label;
                    }
                    i += 1;
                }

                // axis pre-config
                verticalAxisLeft = {
                    color : yAxis[realAxisIndex.left].color,
                    max: yAxis[realAxisIndex.left].max,
                    min: yAxis[realAxisIndex.left].min,
                    title: yAxis[realAxisIndex.left].label,
                    ticks: yAxis[realAxisIndex.left].ticks,
                    titleAngle: 90
                };
                if (!oneData) {
                    verticalAxisRight = {
                        color : yAxis[realAxisIndex.right].color,
                        max: yAxis[realAxisIndex.right].max,
                        min: yAxis[realAxisIndex.right].min,
                        title: yAxis[realAxisIndex.right].label,
                        ticks: yAxis[realAxisIndex.right].ticks,
                        titleAngle: 270,
                    };
                } else {
                    verticalAxisRight = {};
                }

                // normal config
                config = {
                    xaxis: {
                        mode: 'time',
                        labelsAngle : 45,
                        showMinorLabels: true,
                        minorTickFreq: 4
                    },
                    selection : {
                        mode : 'x'
                    },
                    yaxis: verticalAxisLeft,
                    y2axis: verticalAxisRight,
                    HtmlText: false,
                    title: graphTitle,
                    colors: userColors,
                    grid: {
                        horizontalLines: true
                    }
                };
                // Remove auto leyend
                config.legend = false;
            }
        }

        // Zone Paint
        if (theArea != null) {
            opts = {xaxis : { min : theArea.x1, max : theArea.x2, mode : 'time', labelsAngle : 45}};
            config_aux = Flotr._.extend(Flotr._.clone(config), opts || {});
            //Draw the graph
            graph = Flotr.draw(graphContainer, graphData, config_aux);
        } else {
            //Draw all the graph
            graph = Flotr.draw(graphContainer, graphData, config);
            
        }

        // Ad hoc leyend
        if (!isEmpty(theLeyend)) {
            if (showLeyend) {
                graphContainer.appendChild(theLeyend);
            }
        }
        //loadLayer.classList.remove('on');
    };

    /**
     * @Private
     * is empty object?
     */
    var isEmpty = function isEmpty(obj) {
        var key;

        for (key in obj) {
            return false;
        }
        return true;
    };

    var changeLeyendStatus = function changeLeyendStatus(id) {
        var key;
        // one Data option activated
        if (oneData && leyendStatus[id].show === false) {
            for (key in leyendStatus) {
                leyendStatus[key].show = false;
            }
            leyendStatus[id].show = true;
        } else {
            leyendStatus[id].show = !leyendStatus[id].show;
        }
        drawGraph(lastData);
    };

    var changeLeyendStatusPoints = function changeLeyendStatusPoints(id) {
        leyendStatus[id].points = !leyendStatus[id].points;
        drawGraph(lastData);
    };

    // method for select and zoom with mouse
    // Draw graph with default options, overwriting with passed options
    var drawGraphZone = function drawGraphZone(opts) {
        var gr;

        // Clone the options, so the 'options' variable always keeps intact.
        options = Flotr._.extend(Flotr._.clone(config), opts || {});

        // Return a new graph.
        gr = Flotr.draw(
            document.getElementById('linearGraphContainer'),
            graphData,
            options
        );
        // Ad hoc leyend
        if (!isEmpty(theLeyend)) {
            if (showLeyend) {
                graphContainer.appendChild(theLeyend);
            }
        }
        return gr;
    };

    MashupPlatform.widget.context.registerCallback(function (new_values) {
        var hasChanged;

        if ('heightInPixels' in new_values) {
            if (document.getElementById('linearGraphContainer').style.height === '') {
                document.getElementById('linearGraphContainer').style.height = (new_values.heightInPixels - document.getElementById('controlBar').getBoundingClientRect().height) + 'px';
            } else {
                if (Math.abs(parseInt(document.getElementById('linearGraphContainer').style.height, 10) + document.getElementById('controlBar').getBoundingClientRect().height - new_values.heightInPixels) > 7) {
                    document.getElementById('linearGraphContainer').style.height = (new_values.heightInPixels - document.getElementById('controlBar').getBoundingClientRect().height) + 'px';
                    hasChanged = true;
                }
            }
        }

        if ('widthInPixels' in new_values) {
            if (document.getElementById('linearGraphContainer').style.width === '') {
                document.getElementById('linearGraphContainer').style.width = (new_values.widthInPixels - 4) + 'px';
            } else {
                if (Math.abs(parseInt(document.getElementById('linearGraphContainer').style.width, 10) - new_values.widthInPixels) > 12) {
                    document.getElementById('linearGraphContainer').style.width = (new_values.widthInPixels - 4) + 'px';
                    hasChanged = true;
                }
            }
        }
        if (hasChanged) {
            drawGraph(null);
        }
    });

    // Preference change handler
    MashupPlatform.prefs.registerCallback(function () {
        drawGraph(lastData);
    });

    window.addEventListener('load', function () {
        // Resize the linearGraphContainer
        document.getElementById('linearGraphContainer').style.height = (MashupPlatform.widget.context.get('heightInPixels')) - document.getElementById('controlBar').getBoundingClientRect().height + 'px';
        document.getElementById('linearGraphContainer').style.width = (MashupPlatform.widget.context.get('widthInPixels')) + 'px';
        drawGraph();

        // Zoom handler
        Flotr.EventAdapter.observe(document.getElementById('linearGraphContainer'), 'flotr:select', function (area) {
            theArea = area;
            // Draw selected area
            graph = drawGraphZone({
                xaxis : { min : area.x1, max : area.x2, mode : 'time', labelsAngle : 45}
            });
            if (activateButton != null) {
                activateButton.classList.remove('on');
            }
            activateButton = null;
        });

        // When graph is clicked, draw the graph with default area.
        Flotr.EventAdapter.observe(document.getElementById('linearGraphContainer'), 'flotr:click',
            function () {
                theArea = null;
                graph = drawGraphZone();
                if (activateButton != null) {
                    activateButton.classList.remove('on');
                }
                activateButton = buttons.all;
                buttons.all.classList.add('on');
            }
        );

        // buttons init
        buttons = {'all': document.getElementById('controlBar').getElementsByClassName('button all')[0],
                'week': document.getElementById('controlBar').getElementsByClassName('button week')[0],
                'day': document.getElementById('controlBar').getElementsByClassName('button day')[0],
                'hour': document.getElementById('controlBar').getElementsByClassName('button hour')[0]
        };
        activateButton = buttons.all;
        activateButton.classList.add('on');

        // add button handlers
        buttons.all.addEventListener('click', buttonHandler.bind(this, 'all'), false);
        buttons.week.addEventListener('click', buttonHandler.bind(this, 'week'), false);
        buttons.day.addEventListener('click', buttonHandler.bind(this, 'day'), false);
        buttons.hour.addEventListener('click', buttonHandler.bind(this, 'hour'), false);

        loadLayer = document.getElementById('loadLayer');
    }, true);

    // Input handler
    MashupPlatform.wiring.registerCallback('input', drawGraph);

    // button handler
    var buttonHandler = function buttonHandler(type) {
        var area = {'x1': null, 'x2': null};

        if (activateButton != null) {
            activateButton.classList.remove('on');
        }

        if (type == 'all') {
            graph = drawGraphZone();
            activateButton = buttons.all;
        } else if (type == 'week') {
            area.x1 = lastTimestamp - (7 /* days */ * 24 /* hours */ * 60 /* mins */ * 60 /* segs */ * 1000 /* miliseconds */);
            area.x2 = lastTimestamp;
            graph = drawGraphZone({
                xaxis : { min : area.x1, max : area.x2, mode : 'time', labelsAngle : 45}
            });
            activateButton = buttons.week;
        } else if (type == 'day') {
            area.x1 = lastTimestamp - (1 /* days */ * 24 /* hours */ * 60 /* mins */ * 60 /* segs */ * 1000 /* miliseconds */);
            area.x2 = lastTimestamp;
            graph = drawGraphZone({
                xaxis : { min : area.x1, max : area.x2, mode : 'time', labelsAngle : 45}
            });
            activateButton = buttons.day;
        } else if (type == 'hour') {
            area.x1 = lastTimestamp - (1 /* hours */ * 60 /* mins */ * 60 /* segs */ * 1000 /* miliseconds */);
            area.x2 = lastTimestamp;
            graph = drawGraphZone({
                xaxis : { min : area.x1, max : area.x2, mode : 'time', labelsAngle : 45}
            });
            activateButton = buttons.hour;
        }
        activateButton.classList.add('on');
        theArea = area;
    };

})();
