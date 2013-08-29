/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the lamp-post-status widget.
 *
 *     lamp-post-status is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     lamp-post-status is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with lamp-post-status. If not, see <http://www.gnu.org/licenses/>.
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

/*global MashupPlatform, NGSI, StyledElements*/

(function () {

    "use strict";

    var ZPA_SERVICE_URL = 'http://130.206.81.70:8080/zpa/SetTarget';
    // current ids
    // 30DE860000200006
    // 30DE8600002000C5
    var zpaId = '30DE860000200006';
    var powerStatus = 'OFF';

    var create_ngsi_connection = function create_ngsi_connection() {
        this.ngsi = new NGSI.Connection(MashupPlatform.prefs.get('ngsi_server'));
    };

    var LampPostStatus = function LampPostStatus() {

        /* Wiring */
        MashupPlatform.wiring.registerCallback('lamppost', this.onLampPost.bind(this));

        /* Preferences */
        create_ngsi_connection.call(this);
        MashupPlatform.prefs.registerCallback(create_ngsi_connection.bind(this));

        /* Context */
        MashupPlatform.widget.context.registerCallback(this.onWidgetContextChange.bind(this));

        /* Atributes */
        this.tabs = {};
        this.mainTab = {};
        this.commandsTab = {};
        this.lampPost = null;
        this.infoContainer = {};
        this.buttonsContainer = null;
        this.extraInfoCommandsContainer = {};
        this.powerButton = null;
    };
 
    LampPostStatus.prototype.init = function init() {
        this.tabs = new StyledElements.StyledNotebook();
        this.tabs.insertInto(document.body);
        this.mainTab = this.tabs.createTab({name: "Main Info", closable: false});
        this.commandsTab = this.tabs.createTab({name: "Commands", closable: false});

        this.infoContainer = this.createContainer("div", "lampPostsContainer");
        this.buttonsContainer = this.createContainer("div", "buttonsContainer");
        this.extraInfoCommandsContainer = this.createContainer("div", "extraInfoContainer");
        
        this.mainTab.appendChild(this.infoContainer);
        this.commandsTab.appendChild(this.extraInfoCommandsContainer);
        this.commandsTab.appendChild(this.buttonsContainer);

        this.clearLampPostInformation();
    };

    LampPostStatus.prototype.createContainer = function createContainer(containerType, idName) {
        var container = document.createElement(containerType);
        container.setAttribute("id", idName);
        return container;
    };

    LampPostStatus.prototype.createInfoItem = function createInfoItem(parentNode, fieldName, displayTitle, fieldValue) {
        var title, field;

        title = document.getElementById(fieldName + "Title");
        if (!title) {
            title = this.createContainer("div", fieldName + "Title");
            field = this.createContainer("div", fieldName);
        } else {
            field = document.getElementById(fieldName);
        }
        title.textContent = displayTitle;
        field.textContent = fieldValue;

        title.setAttribute("class", "lampPostInfoTitle");
        field.setAttribute("class", "lampPostInfo");

        parentNode.appendChild(title);
        title.appendChild(field);
    };
    
    LampPostStatus.prototype.createOnOffButton = function createOnOffButton() {
        
        var button = new StyledElements.StyledButton({
            id: "setOnOffButton",
            text: "Turn OFF",
        });
        button.addEventListener("click", this.handlerOnOffButton.bind(this), false);
        button.insertInto(this.buttonsContainer);
        this.powerButton = button;

        // TODO
        this.loadingIcon = document.createElement('i');
        this.loadingIcon.className = 'icon-refresh icon-spin';
        this.powerButton.buttonElement.insertBefore(this.loadingIcon, this.powerButton.buttonElement.childNodes[0]);
        // TODO
    };

    LampPostStatus.prototype.createCloseIssueButton = function createCloseIssueButton(issue) {

        var wrapper, button;

        wrapper = document.createElement('div');
        wrapper.textContent = issue.id + ' ';

        button = new StyledElements.StyledButton({
            id: "setStatusButton",
            text: "Close Issue",
        });

        button.addEventListener("click", this.closeIssue.bind(this, issue, wrapper));
        button.insertInto(wrapper);

        return wrapper;
    };

    LampPostStatus.prototype.onLampPost = function onLampPost(lampPostString) {
        this.lampPost = JSON.parse(lampPostString);
        if (this.lampPost.type === 'Node') {
            this.fillLampPostInformation(this.lampPost);
        } else {
            this.lampPost = null;
            this.clearLampPostInformation();
        }
    };

    LampPostStatus.prototype.onWidgetContextChange = function onWidgetContextChange(new_values) {
        if ('heightInPixels' in new_values) {
            this.tabs.repaint();
        }
    };

    LampPostStatus.prototype.handlerOnOffButton = function handlerOnOffButton() {

        this.powerButton.disable();
        this.powerButton.addClassName('waiting-response');

        switch (powerStatus) {
        case "ON":
            MashupPlatform.http.makeRequest(ZPA_SERVICE_URL, {
                method: "GET",
                parameters: {
                    id: zpaId,
                    prop: 1
                },
                onSuccess: function () {
                    powerStatus = "OFF";
                    this.updatePowerStatus();
                }.bind(this),
                onComplete: function () {
                    this.powerButton.removeClassName('waiting-response');
                    this.powerButton.enable();
                }.bind(this)
            });
            break;
        default:
        case "OFF":
            MashupPlatform.http.makeRequest(ZPA_SERVICE_URL, {
                method: "GET",
                parameters: {
                    id: zpaId,
                    prop: 0
                },
                onSuccess: function () {
                    powerStatus = "ON";
                    this.updatePowerStatus();
                }.bind(this),
                onComplete: function () {
                    this.powerButton.removeClassName('waiting-response');
                    this.powerButton.enable();
                }.bind(this)
            });
            break;
        }
    };

    LampPostStatus.prototype.updatePowerStatus = function updatePowerStatus() {

        this.powerButton.enable();

        if (powerStatus === 'ON') {
            this.powerButton.setLabel("Turn OFF");
            this.powerButton.addClassName('btn-success');
        } else {
            this.powerButton.setLabel("Turn ON");
            this.powerButton.removeClassName('btn-success');
        }
    };

    LampPostStatus.prototype.closeIssue = function closeIssue(issue, wrapper, button) {
        button.disable();

        this.ngsi.updateAttributes([{
            entity: {
                id: issue.id,
                type: 'Issue'
            },
            attributes: [{
                name: 'closingDate',
                type: 'string',
                contextValue: (new Date()).toISOString()
            }]
        }], {
            onSuccess: function () {
                wrapper.parentNode.removeChild(wrapper);
            },
            onFailure: function () {
                // show error
                button.enable();
            }
        });
    };

    LampPostStatus.prototype.clearLampPostInformation = function clearLampPostInformation() {

        this.buttonsContainer.textContent = '';
        this.powerButton = null;

        this.createInfoItem.call(this, this.infoContainer, "lampPostId", "Lamp Post ID", '-------');
        this.createInfoItem.call(this, this.infoContainer, "lampPostLocation", "Location", '-------');
        this.createInfoItem.call(this, this.infoContainer, "lampPostPresence", "Presence", '-------');
        this.createInfoItem.call(this, this.infoContainer, "lampPostBatteryCharge", "Battery Charge", '-------');
        this.createInfoItem.call(this, this.infoContainer, "lampPostIlluminance", "Illuminance", '-------');
        this.createInfoItem.call(this, this.extraInfoCommandsContainer, "lampPostCommands", "Lamp Post ID", '-------');
    };

    LampPostStatus.prototype.fillLampPostInformation = function fillLampPostInformation() {
        var issue_id, button;

        this.buttonsContainer.textContent = '';

        this.createInfoItem.call(this, this.infoContainer, "lampPostId", "Lamp Post ID", this.lampPost.id);
        this.createInfoItem.call(this, this.infoContainer, "lampPostLocation", "Location", this.lampPost.Longitud + ', ' + this.lampPost.Latitud);
        this.createInfoItem.call(this, this.infoContainer, "lampPostPresence", "Presence", this.lampPost.presence);
        this.createInfoItem.call(this, this.infoContainer, "lampPostBatteryCharge", "Battery Charge", this.lampPost.batteryCharge + '%');
        this.createInfoItem.call(this, this.infoContainer, "lampPostIlluminance", "Illuminance", this.lampPost.illuminance + ' lux');
        this.createInfoItem.call(this, this.extraInfoCommandsContainer, "lampPostCommands", "Lamp Post ID", this.lampPost.id);

        this.createOnOffButton(this);
        if ('issues' in this.lampPost) {
            for (issue_id in this.lampPost.issues) {
                button = this.createCloseIssueButton(this.lampPost.issues[issue_id]);
                this.buttonsContainer.appendChild(button);
            }
        }
        this.updatePowerStatus();
    };

    var lampPostStatus = new LampPostStatus();

    window.addEventListener("DOMContentLoaded", lampPostStatus.init.bind(lampPostStatus), false);

})();
