/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the technician-list widget.
 *
 *     technician-list is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     technician-list is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with technician-list. If not, see <http://www.gnu.org/licenses/>.
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

/*global MashupPlatform, Vcard, StyledElements*/

(function () {
 
    "use strict";

    var TechnicianList = function TechnicianList() {

        /* Slots */
        MashupPlatform.wiring.registerCallback("inputInsertProfile", handlerInputProfile.bind(this));
        MashupPlatform.wiring.registerCallback("inputSelectProfile", handlerInputSelectProfile.bind(this));

        /* Context */
        MashupPlatform.widget.context.registerCallback(function (new_values) {
            if ('heightInPixels' in new_values) {
                this.table.repaint();
            }
        }.bind(this));

        /* Others */
        this.table = null;
        this.technicians = null;
        this.technicianList = null;
        this.vCardTechnician = null;
    };
 
    TechnicianList.prototype.init = function init() {
        this.technicians = {
            cachedTechnicians: {},
            listTechnicians: null
        };
        createTable.call(this);
        displayInitialMessage.call(this);
    };

/***********************************************************************************/
/******************************** AUXILIAR *****************************************/
/***********************************************************************************/

    TechnicianList.prototype.createContainer = function createContainer(containerType, idName) {
        var container = document.createElement(containerType);
        container.setAttribute("id", idName);
        return container;
    };
    
    var displayInitialMessage = function displayInitialMessage() {
        var messageContainer = document.createElement("div");
        var title = document.createElement("h4");
        var textContainer = document.createElement("p");
        var text = document.createElement("span");

        messageContainer.setAttribute("id", "messageContainer");
        messageContainer.setAttribute("class", "alert alert-block");
        title.textContent = "This widget needs to be wired.";
        textContainer.setAttribute("class", "p1InfoBox");
        text.textContent = "This widget shows a list of technicians and triggers an event that sends vCard information when a row is selected. Wiring must be set both for getting the list of technicians and sending the event.";
        document.body.appendChild(messageContainer);
        messageContainer.appendChild(title);
        messageContainer.appendChild(textContainer);
        textContainer.appendChild(text);
    };

    var createTable = function createTable() {
        var columns = [
            {field: "id", label: "#", width: "20px", sortable: true},
            {field: "name", label: "Name", sortable: true}
        ];
        this.table = new StyledElements.ModelTable(columns, {'id': 'name'});
        this.table.insertInto(document.body);
        this.table.addEventListener("click", handlerClickRow.bind(this), false);
        updateTable.call(this);
    };

    var updateTable = function updateTable() {
        this.table.source.changeElements(this.technicians.listTechnicians);
        this.table.repaint();
    };

    var updateRow = function updateRow(technician) {
        var vCardTechnician = new Vcard();
        vCardTechnician.parser(technician);
        var technicianName = vCardTechnician.getValue('FN', 0);
        // Add Technician
        if (!this.technicians.cachedTechnicians[technicianName]) {
            var idList = this.technicians.listTechnicians.length + 1;
            this.technicians.cachedTechnicians[technicianName] = {
                id: idList,
                vCard: technician
            };
            this.technicians.listTechnicians.push({
                id: idList.toString(),
                name: technicianName
            });
        // Update Technician
        } else {
            
        }
        updateTable.call(this);
    };
    
/***********************************************************************************/
/******************************** HANDLERS *****************************************/
/***********************************************************************************/

    var handlerInputProfile = function handlerInputProfile(technician) {
        var initialMessageContainer = document.getElementById("messageContainer");
        
        if (initialMessageContainer) {
            document.body.removeChild(initialMessageContainer);
        }

        if (!this.technicians.listTechnicians) {
            this.technicians = {
                cachedTechnicians: {},
                listTechnicians: []
            };
        }
        
        updateRow.call(this, technician);
    };

    var handlerInputSelectProfile = function handlerInputSelectProfile(technician) {
        var vCardTechnician = new Vcard();
        vCardTechnician.parser(technician);
        var technicianName = vCardTechnician.getValue('FN', 0);
        this.table.select(technicianName);
    };

    var handlerClickRow = function handlerClickRow(row) {
        var vCard = this.technicians.cachedTechnicians[row.name].vCard;
        this.table.select(row.name);
        MashupPlatform.wiring.pushEvent("outputProfile", vCard);
    };

    var technicianList = new TechnicianList();

    window.addEventListener("DOMContentLoaded", technicianList.init.bind(technicianList), false);

})();
