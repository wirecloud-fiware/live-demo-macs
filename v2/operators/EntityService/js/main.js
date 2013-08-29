/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the entity-service operator.
 *
 *     entity-service is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     entity-service is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with entity-service. If not, see <http://www.gnu.org/licenses/>.
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

/******************************************************************************/
/********************************* PUBLIC *************************************/
/******************************************************************************/

    var condValues = ['Latitud', 'Longitud', 'presence', 'batteryCharge', 'illuminance',
             'ActivePower', 'ReactivePower', 'electricPotential', 'electricalCurrent'];

    var EntityService = function EntityService() {
        this.entityList = {};   // Entity list.
        /*  entityList = {
         *      entityId : {
         *          issues: {
         *              issueId: issue,
         *          }
         *      }
         *  }
         * */
        this.issueList = {};   // Entity list.
        /*  issueList = {
         *      entityId : {
         *          issueId: issue,
         *      }
         *  }
         * */
        this.connection = null; // The connection to NGSI.
        this.refresh_interval = null;
    };

    EntityService.prototype.init = function init() {
        // Set input callbacks:
        MashupPlatform.wiring.registerCallback("issueInput", handlerIssueInput.bind(this));

        // Set preference callbacks:
        MashupPlatform.prefs.registerCallback(handlerPreferences.bind(this));

        // Create NGSI conection:
        doInitialSubscription.call(this);
    };

/******************************************************************************/
/********************************* PRIVATE ************************************/
/******************************************************************************/

    var doInitialSubscription = function doInitialSubscription() {

        this.subscriptionId = null;

        this.ngsi_server = MashupPlatform.prefs.get('ngsi_server');
        this.ngsi_proxy = MashupPlatform.prefs.get('ngsi_proxy');
        this.connection = new NGSI.Connection(this.ngsi_server, {
            ngsi_proxy_url: this.ngsi_proxy
        });

        var types = ['Node', 'AMMS', 'Regulator'];
        var entityIdList = [];
        var entityId;
        for (var i = 0; i < types.length; i++) {
            entityId = {
                id: '.*',
                type: types[i],
                isPattern: true
            };
            entityIdList.push(entityId);
        }
        var attributeList = null;
        var duration = 'PT3H';
        var throttling = null;
        var notifyConditions = [{
            'type': 'ONCHANGE',
            'condValues': condValues
        }];
        var options = {
            flat: true,
            onNotify: handlerReceiveEntity.bind(this),
            onSuccess: function (data) {
                this.subscriptionId = data.subscriptionId;
                this.refresh_interval = setInterval(refreshNGSISubscription.bind(this), 1000 * 60 * 60 * 2);  // each 2 hours
                window.addEventListener("beforeunload", function () {
                    this.connection.cancelSubscription(this.subscriptionId);
                }.bind(this));
            }.bind(this)
        };
        this.connection.createSubscription(entityIdList, attributeList, duration, throttling, notifyConditions, options);
    };

    var refreshNGSISubscription = function refreshNGSISubscription() {
        if (this.subscriptionId) {
            var duration = 'PT3H';
            var throttling = null;
            var notifyConditions = [{
                'type': 'ONCHANGE',
                'condValues': condValues
            }];
            var options = {};
            this.connection.updateSubscription(this.subscriptionId, duration, throttling, notifyConditions, options);
        }
    };

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

/******************************** HANDLERS ************************************/

    var handlerReceiveEntity = function handlerReceiveEntity(data) {
        var entityDataList = data.elements;
        for (var entityId in entityDataList) {
            var entity = entityDataList[entityId];

            // Add issues to entity if any issue exists
            if (entityId in this.issueList) {
                entity.issues = filterIssues(this.issueList[entityId]);
            }

            // Add entity to issueList
            this.entityList[entityId] = entity;

            // Send entity;
            var outputData = JSON.stringify(entity);
            MashupPlatform.wiring.pushEvent("entityOutput", outputData);
        }
    };

    var handlerIssueInput = function handlerIssueInput(issueString) {
        var issue = JSON.parse(issueString);

        if (!this.issueList[issue.affectedId]) {
            this.issueList[issue.affectedId] = {};
        }
        this.issueList[issue.affectedId][issue.id] = issue;

        // Entity exists?
        var entityId = issue.affectedId;
        if (entityId in this.entityList) {
            var entity = this.entityList[entityId];

            // Add issue to entity
            entity.issues = filterIssues(this.issueList[issue.affectedId]);

            // Send entity
            var entityString = JSON.stringify(entity);
            MashupPlatform.wiring.pushEvent("entityOutput", entityString);
        }
    };

/**************************** Preference Handler *****************************/

    var handlerPreferences = function handlerPreferences() {

        if (this.refresh_interval) {
            clearInterval(this.refresh_interval);
            this.refresh_interval = null;
        }

        if (this.subscriptionId != null) {
            this.connection.cancelSubscription(this.subscriptionId, {
                onComplete: doInitialSubscription.bind(this)
            });
        } else {
            doInitialSubscription.call(this);
        }
    };

    var entityService = new EntityService();
    window.addEventListener("DOMContentLoaded", entityService.init.bind(entityService), false);

})();
