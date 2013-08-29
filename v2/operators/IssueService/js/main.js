/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the issue-service operator.
 *
 *     issue-service is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     issue-service is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with issue-service. If not, see <http://www.gnu.org/licenses/>.
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

/*global MashupPlatform, NGSI, ObjectStorageAPI*/

(function () {

    "use strict";

    var ngsi_cond_values = ['technician', 'imageFile', 'severity', 'description', 'affectedId', 'issueType', 'coordinates', 'closingDate', 'creationDate'];
    var ngsi_subscriptionId = null;
    var ngsi_refresh_interval;
    var ngsi_server;
    var ngsi_proxy;
    var connection = null;

    var images = {};
    var os_connection = null;

    var create_objectstorage_connection = function create_objectstorage_connection() {
        os_connection = new ObjectStorageAPI(MashupPlatform.prefs.get('objectstorage_server'));
    };

    var notify_image_update = function notify_image_update(issue, image) {
        var url = URL.createObjectURL(image);
        issue.imageURL = url;
        images[issue.imageFile] = url;
        MashupPlatform.wiring.pushEvent('outputIssue', JSON.stringify(issue));
    };

    var sendIssue = function sendIssue(data) {
        var issueList = data.elements;
        for (var issueId in issueList) {
            var issue2send = issueList[issueId];

            if (issue2send.severity == null || issue2send.severity === '') {
                continue;
            } else if (issue2send.severity !== 'Critical') {
                issue2send.severity = 'Warning';
            }

            if (issue2send.imageFile != null && issue2send.imageFile !== '') {
                if (issue2send.imageFile in images) {
                    issue2send.imageURL = images[issue2send.imageFile];
                } else {

                    var ObjectStorageAuth = {
                        PROJECT: MashupPlatform.prefs.get('objectstorage_project'),
                        USER: MashupPlatform.prefs.get('objectstorage_user'),
                        PASS: MashupPlatform.prefs.get('objectstorage_pass'),
                        TENANT_ID: MashupPlatform.prefs.get('objectstorage_tenant_id'),
                        TOKEN_REQUEST_URL: MashupPlatform.prefs.get('objectstorage_token_url')
                    };

                    os_connection.getAuthToken(ObjectStorageAuth, {
                        onSuccess: function (issue, token) {
                            os_connection.getFile(MashupPlatform.prefs.get('objectstorage_container'), issue.imageFile, token, {
                                onSuccess: notify_image_update.bind(null, issue)
                            });
                        }.bind(null, issue2send)
                    });
                }
            }
            MashupPlatform.wiring.pushEvent('outputIssue', JSON.stringify(issue2send));
        }
    };

    var doInitialSubscription = function doInitialSubscription() {

        ngsi_server = MashupPlatform.prefs.get('ngsi_server');
        ngsi_proxy = MashupPlatform.prefs.get('ngsi_proxy');
        connection = new NGSI.Connection(ngsi_server, {
            ngsi_proxy_url: ngsi_proxy
        });

        var entityIdList = [{
            type: 'Issue',
            id: '.*',
            isPattern: true
        }];
        var attributeList = null;
        var duration = 'PT3H';
        var throttling = null;
        var notifyConditions = [{
            type: 'ONCHANGE',
            condValues: ngsi_cond_values
        }];
        var options = {
            flat: true,
            onNotify: sendIssue,
            onSuccess: function (data) {
                ngsi_subscriptionId = data.subscriptionId;
                ngsi_refresh_interval = setInterval(refreshNGSISubscription, 1000 * 60 * 60 * 2);  // each 2 hours
            }
        };
        connection.createSubscription(entityIdList, attributeList, duration, throttling, notifyConditions, options);
    };

    var refreshNGSISubscription = function refreshNGSISubscription() {
        if (ngsi_subscriptionId) {
            var duration = 'PT3H';
            var throttling = null;
            var notifyConditions = [{
                'type': 'ONCHANGE',
                'condValues': ngsi_cond_values
            }];
            var options = {};
            connection.updateSubscription(ngsi_subscriptionId, duration, throttling, notifyConditions, options);
        }
    };

    MashupPlatform.prefs.registerCallback(function (new_values) {
        if ('ngsi_server' in new_values || 'ngsi_proxy' in new_values) {
            if (ngsi_refresh_interval) {
                clearInterval(ngsi_refresh_interval);
                ngsi_refresh_interval = null;
            }

            if (ngsi_subscriptionId != null) {
                connection.cancelSubscription(ngsi_subscriptionId, {
                    onComplete: doInitialSubscription
                });
                ngsi_subscriptionId = null;
            } else {
                doInitialSubscription();
            }
        }

        if ('objectstorage_server' in new_values) {
            create_objectstorage_connection();
        }
    });

    window.addEventListener("beforeunload", function () {
        if (ngsi_subscriptionId != null) {
            connection.cancelSubscription(ngsi_subscriptionId);
        }
    });

    create_objectstorage_connection();
    doInitialSubscription();

})();
