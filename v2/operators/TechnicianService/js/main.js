/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the technician-service operator.
 *
 *     technician-service is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     technician-service is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with technician-service. If not, see <http://www.gnu.org/licenses/>.
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

/*global MashupPlatform, NGSI */

(function () {

    "use strict";

    var technicians = {};
    var vans = {};
    var vans_by_technician = {};
    var technician_by_van = {};
    var issueList = {};

    /* NGSI var */
    var ngsi_cond_values = ['name', 'working_area', 'function', 'mobile_phone', 'twitter', 'van', 'email', 'current_position'];
    var ngsi_subscriptionId = null;
    var ngsi_refresh_interval;
    var ngsi_server;
    var ngsi_proxy;
    var connection = null;

    MashupPlatform.wiring.registerCallback("issueInput", function (issueString) {
        var issue = JSON.parse(issueString);

        if (!issueList[issue.technician]) {
            issueList[issue.technician] = {};
        }
        issueList[issue.technician][issue.id] = issue;

        // Technician exists?
        var techId = issue.technician;
        if (techId in technicians) {
            var tech = technicians[techId];

            // Add issue to technician
            tech.issues = filterIssues(issueList[issue.affectedId]);

            // Send technician
            var vanId = vans_by_technician[techId];
            sendVcard(techId, vanId);
        }
    });

    var filterIssues = function filterIssues(issues) {
        var filtered_issues, issue_id;

        filtered_issues = {};
        for (issue_id in issues) {
            if (issues[issue_id].closingDate == null || issues[issue_id].closingDate === '') {
                filtered_issues[issue_id] = issues[issue_id];
            }
        }

        return filtered_issues;
    };

    var process_entities = function process_entities(data) {
        var entity;
        var entities = data.elements;

        for (var key in entities) {
            entity = entities[key];

            switch (entity.type) {
            case 'Van':
                vans[entity.id] = entity.current_position;
                if (entity.id in technician_by_van) {
                    var techId = technician_by_van[entity.id].id;
                    vans_by_technician[techId] = entity.id;
                    sendVcard(techId, entity.id);
                }
                break;
            case 'Technician':
                technicians[entity.id] = entity;
                technician_by_van[entity.van] = entity;
                if (entity.van in vans) {
                    sendVcard(entity.id, entity.van);
                }
                break;
            }
        }
    };

    var sendVcard = function sendVcard(techId, vanId) {
        var endLine = "\r\n";

        var tech = technicians[techId];
        var van = vans[vanId];
        var issues = issueList[techId];
        
        if (tech && van) {
            var technician = "BEGIN:VCARD" + endLine +
                "VERSION:3.0" + endLine +
                "FN:" + tech.name + endLine +
                "GEO;TYPE=work:geo:" + vans[tech.van] + endLine +
                "TITLE:" + tech.func + endLine +
                "TEL;TYPE=WORK,VOICE:" + tech.mobile_phone + endLine +
                "ADR;TYPE=WORK:" + tech.working_area + endLine +
                "EMAIL;TYPE=PREF,INTERNET:" + tech.email + endLine +
                "PHOTO:" + setPhoto(tech.name) + endLine +
                "IMPP:twitter:" + tech.twitter + endLine +
                "X-NGSI-ID:" + techId + endLine;
            if (issues) {
                technician += "X-ISSUE-LIST:" + JSON.stringify(issueList[techId]) + endLine;
            }
            technician += "END:VCARD";
            MashupPlatform.wiring.pushEvent('outputTechnician', technician);
        }
    };

    var setPhoto = function setPhoto(name) {
        var techs = {
            "Marcos Lorenzo Fernandez" : internalURL("images/Tech1.jpg"),
            "Milan De Vos" : internalURL("images/Tech2.jpg"),
            "Hubert Willems" : internalURL("images/Tech3.jpg"),
            "Maria Perez Perea" : internalURL("images/Tech3.jpg"),
            "Jacinto Salas Torres" : internalURL("images/Tech4.jpg")
        };

        return techs[name];
    };

    var internalURL = function internalURL(data) {
        var url = document.createElement("a");
        url.setAttribute('href', data);
        return url.href;
    };

    var doInitialSubscription = function doInitialSubscription() {

        ngsi_server = MashupPlatform.prefs.get('ngsi_server');
        ngsi_proxy = MashupPlatform.prefs.get('ngsi_proxy');
        connection = new NGSI.Connection(ngsi_server, {
            ngsi_proxy_url: ngsi_proxy
        });

        var entityIdList = [
            {type: 'Van', id: '.*', isPattern: true},
            {type: 'Technician', id: '.*', isPattern: true}
        ];
        var attributeList = null;
        var duration = 'PT3H';
        var throttling = null;
        var notifyConditions = [{
            type: 'ONCHANGE',
            condValues: ngsi_cond_values
        }];
        var options = {
            flat: true,
            onNotify: process_entities,
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

    MashupPlatform.prefs.registerCallback(function () {
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
    });

    window.addEventListener("beforeunload", function () {
        if (ngsi_subscriptionId != null) {
            connection.cancelSubscription(ngsi_subscriptionId);
        }
    });

    doInitialSubscription();

})();
