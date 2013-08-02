/*
 *     (C) Copyright 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the vending-machine-status widget.
 *
 *     vending-machine-status is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     vending-machine-status is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with vending-machine-status. If not, see <http://www.gnu.org/licenses/>.
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

(function () {

    "use strict";

    var ZPA_SERVICE_URL = 'http://130.206.81.70:8080/zpa/SetTarget';
    // current ids
    // 30DE860000200006
    // 30DE8600002000C5

    var VendingMachineStatus = function VendingMachineStatus() {

        MashupPlatform.wiring.registerCallback('vendingMachine', this.handlerSlotVendingMachine.bind(this));
        MashupPlatform.widget.context.registerCallback(this.onWidgetContextChange.bind(this));
        
        /* Atributes */
        this.tabs = {};
        this.mainTab = {};
        this.commandsTab = {};
        this.vendingMachine = {};
        this.infoContainer = {};
        this.commandsContainer = {};
        this.buttonsContainer = {};
        this.extraInfoCommandsContainer = {};
        this.powerButton = null;
        this.setVMStatusButton = null;
    };
 
    VendingMachineStatus.prototype.init = function init() {
        this.tabs = new StyledElements.StyledNotebook();
        this.tabs.insertInto(document.body);
        this.mainTab = this.tabs.createTab({name: "Main Info", closable: false});
        this.commandsTab = this.tabs.createTab({name: "Comands", closable: false});

        this.infoContainer = this.createContainer("div", "vendingMachinesContainer");
        this.commandsContainer = this.createContainer("div", "commandsContainer");
        this.buttonsContainer = this.createContainer("div", "buttonsContainer");
        this.extraInfoCommandsContainer = this.createContainer("div", "extraInfoContainer"); 
        
        this.mainTab.appendChild(this.infoContainer);
        this.commandsTab.appendChild(this.commandsContainer);
        this.commandsContainer.appendChild(this.buttonsContainer);
        this.commandsContainer.appendChild(this.extraInfoCommandsContainer);
    };

    VendingMachineStatus.prototype.createContainer = function (containerType, idName){
        var container = document.createElement(containerType);
        container.setAttribute("id", idName);
        return container;
    };

    VendingMachineStatus.prototype.createInfoItem = function createInfoItem (parentNode, fieldName, displayTitle, fieldValue) {
        var title, field;
        var element = document.getElementById(fieldName + "Title");
        if (!element){
            title = this.createContainer("div", fieldName + "Title");
            field = this.createContainer("div", fieldName);
        }
        else{
            title = document.getElementById(fieldName + "Title");
            field = document.getElementById(fieldName);
        }
        title.textContent = displayTitle;
        field.textContent = fieldValue;

        title.setAttribute("class", "vendingMachineInfoTitle");
        field.setAttribute("class", "vendingMachineInfo");

        parentNode.appendChild(title);
        title.appendChild(field);
    };
    
    VendingMachineStatus.prototype.createOnOffButton = function createOnOffButton() {
        
        var button = new StyledElements.StyledButton({
            id: "setOnOffButton",
            text: "Set Power OFF",
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

    VendingMachineStatus.prototype.createSetVMStatusButton = function createSetVMStatusButton () {
        
        var button = new StyledElements.StyledButton({
            id: "setStatusButton",
            text: "Set status as OK",
        });

        button.addEventListener("click", this.handlerSetStatusButton.bind(this));
        button.insertInto(this.buttonsContainer);
        this.setVMStatusButton = button;
    };


    VendingMachineStatus.prototype.handlerSlotVendingMachine = function handlerSlotVendingMachine(vendingMachineString) {
        this.vendingMachine = JSON.parse(vendingMachineString);
        this.fillVendingMachineInformation.call(this, this.vendingMachine);
    };

    VendingMachineStatus.prototype.onWidgetContextChange = function onWidgetContextChange(new_values) {
        if ('heightInPixels' in new_values) {
            this.tabs.repaint();
        }
    };

    VendingMachineStatus.prototype.handlerOnOffButton = function handlerOnOffButton() {

        this.powerButton.disable();
        this.powerButton.addClassName('waiting-response');

        switch (this.vendingMachine.powerStatus) {
            case "ON":
                MashupPlatform.http.makeRequest(ZPA_SERVICE_URL, {
                    method: "GET",
                    parameters: {
                        id: this.vendingMachine.zpaId,
                        prop: 1
                    },
                    onSuccess: function () {
                        this.vendingMachine.powerStatus = "OFF";
                        this.updatePowerStatus();
                    }.bind(this),
                    onComplete: function () {
                        this.powerButton.removeClassName('waiting-response');
                        this.powerButton.enable();
                    }.bind(this)
                });
                break;
            case "OFF":
                MashupPlatform.http.makeRequest(ZPA_SERVICE_URL, {
                    method: "GET",
                    parameters: {
                        id: this.vendingMachine.zpaId,
                        prop: 0
                    },
                    onSuccess: function () {
                        this.vendingMachine.powerStatus = "ON";
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

    VendingMachineStatus.prototype.updatePowerStatus = function updatePowerStatus() {
        var commandStatus = document.getElementById("powerStatusCommands");
        commandStatus.textContent = this.vendingMachine.powerStatus;

        if (this.vendingMachine.zpaId == null || this.vendingMachine.zpaId === '') {
            this.powerButton.disable();
        } else {
            this.powerButton.enable();
        }

        if (this.vendingMachine.powerStatus === 'ON') {
            this.powerButton.setLabel("Set Power OFF");
            this.powerButton.addClassName('btn-success');
        } else {
            this.powerButton.setLabel("Set Power ON");
            this.powerButton.removeClassName('btn-success');
        }
    };


    VendingMachineStatus.prototype.handlerSetStatusButton = function handlerSetStatusButton(){
        //this.setVMStatusButton.disable();
        //setTimeout(this.setVMStatus.enable, 1000); 
        this.vendingMachine.status = "OK";
        this.vendingMachine.statusDescription = "OK";
        var commandStatus =document.getElementById("machineStatusCommands");
        commandStatus.textContent = "OK";
    }

    VendingMachineStatus.prototype.fillVendingMachineInformation = function fillVendingMachineInformation(){
        this.createInfoItem.call(this, this.infoContainer, "vendingMachineId", "Vending Machine ID", this.vendingMachine.vmId);
        this.createInfoItem.call(this, this.infoContainer, "vendingMachineLocation", "Location", this.vendingMachine.location);
        this.createInfoItem.call(this, this.infoContainer, "vendingMachineStatus", "Status", this.vendingMachine.statusDescription);
        this.createInfoItem.call(this, this.infoContainer, "vendingMachineCoffeLevel", "Coffe Level", this.vendingMachine.coffeLevel);
        this.createInfoItem.call(this, this.infoContainer, "vendingMachineMilkLevel", "Milk Level", this.vendingMachine.milkLevel);
        this.createInfoItem.call(this, this.infoContainer, "vendingMachineCash", "Cash Available", this.vendingMachine.cashAvailable);
        if ((! this.powerButton) || (! this.setVMStatusButton)){
            this.createOnOffButton.call(this);
            this.createSetVMStatusButton.call(this);
        }
        this.createInfoItem.call(this, this.extraInfoCommandsContainer, "vendingMachineCommands", "Vending Machine ID", this.vendingMachine.vmId);
        this.createInfoItem.call(this, this.extraInfoCommandsContainer, "machineStatusCommands", "Current Status", this.vendingMachine.status);
        this.createInfoItem.call(this, this.extraInfoCommandsContainer, "powerStatusCommands", "Power Status", this.vendingMachine.powerStatus);
        this.updatePowerStatus();
    };

    window.VendingMachineStatus = VendingMachineStatus;

 })();

var vendingMachineStatus = new VendingMachineStatus();

window.addEventListener("DOMContentLoaded", vendingMachineStatus.init.bind(vendingMachineStatus), false);
